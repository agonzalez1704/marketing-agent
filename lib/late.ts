/**
 * LATE / Zernio client — wraps the official @getlatedev/node SDK.
 *
 * One LATE_API_KEY powers every client. Each app Client maps 1:1 to a LATE
 * "profile" (profileId), which scopes that client's connected accounts and posts.
 *
 * Method shapes mirror the prod late.adapter.ts (verified against bluumly-backend-core).
 */
import Late from "@getlatedev/node"
import type { Platform as PrismaPlatform } from "@/lib/types"

const BASE = process.env.LATE_API_BASE ?? "https://getlate.dev/api"

// LATE SDK platform strings (note: 'twitter', not 'x').
export type LatePlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "pinterest"
  | "tiktok"
  | "youtube"
  | "googlebusiness"

/** Prisma Platform enum -> LATE platform string. */
export function toLatePlatform(p: PrismaPlatform): LatePlatform {
  return p.toLowerCase() as LatePlatform
}

/** LATE platform string -> Prisma Platform enum. */
export function toPrismaPlatform(p: string): PrismaPlatform {
  return p.toUpperCase() as PrismaPlatform
}

let _client: Late | null = null
function client(): Late {
  if (_client) return _client
  const apiKey = process.env.LATE_API_KEY
  if (!apiKey) throw new Error("LATE_API_KEY is not set")
  _client = new Late({ apiKey, baseURL: BASE, timeout: 60_000 })
  return _client
}

export interface LateAccount {
  id: string // LATE account _id — used as accountId when posting
  platform: LatePlatform
  displayName?: string
  username?: string
  isActive: boolean
}

export interface SchedulePostInput {
  /** [{ platform, accountId }] — accountId is the LATE account _id from listAccounts. */
  platforms: Array<{ platform: LatePlatform; accountId: string }>
  content: string
  mediaUrls?: string[]
  isVideo?: boolean
  /** ISO 8601. Omit to publish immediately. */
  scheduledFor?: string
  timezone?: string
}

export const late = {
  /** Create a LATE profile for a client. Returns its _id. */
  async createProfile(name: string): Promise<string> {
    const res = await client().profiles.createProfile({ body: { name } })
    const id = res.data?.profile?._id
    if (!id) throw new Error("LATE createProfile returned no _id")
    return id
  },

  async deleteProfile(profileId: string): Promise<void> {
    await client().profiles.deleteProfile({ path: { profileId } })
  },

  /** OAuth URL to connect a platform under a profile. */
  async getConnectUrl(
    platform: LatePlatform,
    profileId: string,
    redirectUrl: string,
    headless = false,
  ): Promise<string> {
    const query: Record<string, string | boolean> = { profileId, redirect_url: redirectUrl }
    if (headless) query.headless = true
    // Facebook: force the page/permission picker so all pages can be granted.
    if (platform === "facebook") query.auth_type = "rerequest"
    const res = await client().connect.getConnectUrl({
      path: { platform },
      query: query as { profileId: string; redirect_url?: string },
    })
    const authUrl = res.data?.authUrl
    if (!authUrl) throw new Error("LATE getConnectUrl returned no authUrl")
    return authUrl
  },

  /** Accounts connected under a profile. */
  async listAccounts(profileId: string): Promise<LateAccount[]> {
    const res = await client().accounts.listAccounts({ query: { profileId } })
    const raw = (res.data?.accounts ?? []) as Array<{
      _id?: string
      platform?: string
      displayName?: string
      username?: string
      isActive?: boolean
    }>
    return raw.map((a) => ({
      id: a._id ?? "",
      platform: (a.platform ?? "twitter") as LatePlatform,
      displayName: a.displayName,
      username: a.username,
      isActive: a.isActive ?? true,
    }))
  },

  async deleteAccount(accountId: string): Promise<void> {
    await client().accounts.deleteAccount({ path: { accountId } })
  },

  /** Create a post — immediate (no scheduledFor) or scheduled. Returns LATE post _id. */
  async createPost(input: SchedulePostInput): Promise<{ postId: string; status: string }> {
    const publishNow = !input.scheduledFor
    const body: Record<string, unknown> = {
      content: input.content,
      publishNow,
      platforms: input.platforms.map((p) => ({ platform: p.platform, accountId: p.accountId })),
      mediaItems: (input.mediaUrls ?? []).map((url) => ({
        url,
        ...(input.isVideo ? { type: "video" } : {}),
      })),
    }
    if (input.scheduledFor) {
      body.scheduledFor = input.scheduledFor
      body.timezone = input.timezone ?? "UTC"
    }
    const res = await client().posts.createPost({ body } as Parameters<Late["posts"]["createPost"]>[0])
    const post = res.data?.post as { _id?: string; status?: string } | undefined
    if (!post?._id) throw new Error("LATE createPost returned no post._id")
    return { postId: post._id, status: post.status ?? "scheduled" }
  },

  async reschedulePost(postId: string, scheduledForIso: string, timezone = "UTC"): Promise<void> {
    await client().posts.updatePost({
      path: { postId },
      body: { scheduledFor: scheduledForIso, timezone },
    })
  },

  async deletePost(postId: string): Promise<void> {
    await client().posts.deletePost({ path: { postId } })
  },

  async getPostStatus(postId: string): Promise<string> {
    const res = await client().posts.getPost({ path: { postId } })
    const post = res.data?.post as { status?: string } | undefined
    return post?.status ?? "draft"
  },
}
