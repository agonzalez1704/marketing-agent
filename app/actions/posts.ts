"use server"

import { revalidatePath } from "next/cache"
import {
  dbCreatePosts,
  dbDeletePost,
  dbDuplicatePost,
  dbGetClientProfileId,
  dbGetPost,
  dbListPosts,
  dbSetPostContent,
} from "@/lib/db"
import { refineContent } from "@/lib/ai"
import { PLATFORM_CHAR_LIMIT, PLATFORMS } from "@/lib/platforms"
import type { Platform } from "@/lib/types"

const VALID_PLATFORMS = new Set(PLATFORMS.map((p) => p.key))

/**
 * Create draft posts directly (no scrape / analysis / AI) — e.g. to post a video
 * the user already has. Media can be an uploaded or pasted URL (videos publish as reels).
 */
export async function createManualPosts(
  clientId: string,
  input: { platforms: Platform[]; content: string; mediaUrls: string[] },
): Promise<{ created: number }> {
  if (!(await dbGetClientProfileId(clientId))) throw new Error("Client not found")
  const content = input.content.trim()
  const platforms = input.platforms.filter((p) => VALID_PLATFORMS.has(p))
  if (platforms.length === 0) throw new Error("Pick at least one platform")
  if (!content && input.mediaUrls.length === 0) throw new Error("Add a caption or media")

  const posts = await dbCreatePosts(
    clientId,
    null,
    platforms.map((platform) => ({ platform, content, mediaUrls: input.mediaUrls })),
  )
  revalidatePath(`/clients/${clientId}/posts`)
  revalidatePath(`/clients/${clientId}/calendar`)
  revalidatePath(`/clients/${clientId}`)
  return { created: posts.length }
}

export async function listPosts(clientId: string) {
  return dbListPosts(clientId)
}

export async function deletePost(clientId: string, postId: string): Promise<void> {
  await dbDeletePost(postId)
  revalidatePath(`/clients/${clientId}/posts`)
  revalidatePath(`/clients/${clientId}`)
}

export async function duplicatePost(clientId: string, postId: string): Promise<{ id: string }> {
  const src = await dbGetPost(postId)
  if (!src || src.clientId !== clientId) throw new Error("Post not found")
  const copy = await dbDuplicatePost(postId)
  if (!copy) throw new Error("Couldn't duplicate")
  revalidatePath(`/clients/${clientId}/posts`)
  revalidatePath(`/clients/${clientId}`)
  return { id: copy.id }
}

export async function updatePostContent(clientId: string, postId: string, content: string): Promise<void> {
  const post = await dbGetPost(postId)
  if (!post || post.clientId !== clientId) throw new Error("Post not found")
  const text = content.trim()
  if (!text) throw new Error("Content can't be empty")
  if (text.length > PLATFORM_CHAR_LIMIT[post.platform]) {
    throw new Error(`Over the ${PLATFORM_CHAR_LIMIT[post.platform]} character limit`)
  }
  await dbSetPostContent(postId, text)
  revalidatePath(`/clients/${clientId}/posts/${postId}`)
  revalidatePath(`/clients/${clientId}/posts`)
}

/** AI rewrite — returns new copy without saving (caller reviews, then saves). */
export async function refinePostContent(
  platform: Platform,
  content: string,
  instruction: string,
): Promise<{ content: string }> {
  const text = content.trim()
  if (!text) throw new Error("Nothing to rewrite")
  const refined = await refineContent(platform, text, instruction)
  return { content: refined }
}
