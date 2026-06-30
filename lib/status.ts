import "server-only"
import { late } from "@/lib/late"
import { dbListPostsToSync, dbUpdatePostStatus } from "@/lib/db"
import type { PostStatus } from "@/lib/types"

/** Map a raw LATE post status to our enum. */
function mapStatus(raw: string): PostStatus {
  switch (raw?.toLowerCase()) {
    case "published":
      return "PUBLISHED"
    case "publishing":
      return "PUBLISHING"
    case "failed":
    case "partial":
      return "FAILED"
    case "draft":
      return "DRAFT"
    case "scheduled":
    default:
      return "SCHEDULED"
  }
}

/**
 * Pull current status from LATE for a client's in-flight posts and persist any
 * changes. No revalidation — callers that need it (actions) handle that.
 */
export async function runStatusSync(clientId: string): Promise<{ checked: number; updated: number }> {
  let posts
  try {
    posts = await dbListPostsToSync(clientId)
  } catch {
    return { checked: 0, updated: 0 }
  }

  let updated = 0
  await Promise.all(
    posts.map(async (p) => {
      try {
        const raw = await late.getPostStatus(p.latePostId!)
        const next = mapStatus(raw)
        if (next !== p.status) {
          await dbUpdatePostStatus(p.id, next)
          updated++
        }
      } catch {
        /* skip this post on error */
      }
    }),
  )
  return { checked: posts.length, updated }
}
