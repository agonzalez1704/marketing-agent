"use server"

import { revalidatePath } from "next/cache"
import { late, toLatePlatform } from "@/lib/late"
import { isVideoUrl } from "@/lib/media"
import {
  dbListAccounts,
  dbListPosts,
  dbMarkDraft,
  dbMarkPostFailed,
  dbMarkScheduled,
  dbSetSchedule,
} from "@/lib/db"

/** Persist planned datetimes for a batch of posts (auto-fill / drag / clear). */
export async function savePostSchedules(
  clientId: string,
  items: Array<{ postId: string; scheduledFor: string | null }>,
): Promise<void> {
  for (const it of items) {
    await dbSetSchedule(it.postId, it.scheduledFor)
  }
  revalidatePath(`/clients/${clientId}/calendar`)
}

export interface ScheduleAllResult {
  scheduled: number
  skipped: { platform: string; reason: string }[]
  failed: { postId: string; error: string }[]
}

/**
 * Push every DRAFT post that has a planned datetime to LATE.
 * Resolves each post's platform to the client's connected account.
 */
export async function scheduleAll(clientId: string): Promise<ScheduleAllResult> {
  const posts = await dbListPosts(clientId)
  const ready = posts.filter((p) => p.status === "DRAFT" && p.scheduledFor)
  return pushPostsToLate(clientId, ready)
}

/** Push specific posts (that have a scheduledFor) to LATE — used by the public API. */
export async function publishPostsByIds(clientId: string, ids: string[]): Promise<ScheduleAllResult> {
  const posts = await dbListPosts(clientId)
  const set = new Set(ids)
  const ready = posts.filter((p) => set.has(p.id) && p.status === "DRAFT" && p.scheduledFor)
  return pushPostsToLate(clientId, ready)
}

async function pushPostsToLate(
  clientId: string,
  ready: Awaited<ReturnType<typeof dbListPosts>>,
): Promise<ScheduleAllResult> {
  const accounts = await dbListAccounts(clientId)
  const accountByPlatform = new Map(accounts.map((a) => [a.platform, a.lateAccountId]))

  const result: ScheduleAllResult = { scheduled: 0, skipped: [], failed: [] }

  for (const post of ready) {
    const accountId = accountByPlatform.get(post.platform)
    if (!accountId) {
      result.skipped.push({ platform: post.platform, reason: "no connected account" })
      continue
    }
    // A video in the media => publish as a reel/video (one video, sent as video).
    const videoUrl = post.mediaUrls.find(isVideoUrl)
    const mediaUrls = videoUrl ? [videoUrl] : post.mediaUrls
    try {
      const { postId } = await late.createPost({
        platforms: [{ platform: toLatePlatform(post.platform), accountId }],
        content: post.content,
        mediaUrls,
        isVideo: !!videoUrl,
        scheduledFor: post.scheduledFor!,
        timezone: "UTC",
      })
      await dbMarkScheduled(post.id, postId)
      result.scheduled++
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error"
      await dbMarkPostFailed(post.id, msg)
      result.failed.push({ postId: post.id, error: msg })
    }
  }

  revalidatePath(`/clients/${clientId}/calendar`)
  revalidatePath(`/clients/${clientId}/posts`)
  revalidatePath(`/clients/${clientId}`)
  return result
}

/** Cancel a scheduled post on LATE and return it to a draft. */
export async function cancelScheduledPost(clientId: string, postId: string, latePostId: string | null): Promise<void> {
  if (latePostId) {
    try {
      await late.deletePost(latePostId)
    } catch {
      // LATE may refuse to delete already-published posts; ignore and clear locally.
    }
  }
  await dbMarkDraft(postId, true)
  revalidatePath(`/clients/${clientId}/calendar`)
  revalidatePath(`/clients/${clientId}/posts`)
}
