"use server"

import { revalidatePath } from "next/cache"
import { dbDeletePost, dbDuplicatePost, dbGetPost, dbListPosts, dbSetPostContent } from "@/lib/db"
import { refineContent } from "@/lib/ai"
import { PLATFORM_CHAR_LIMIT } from "@/lib/platforms"
import type { Platform } from "@/lib/types"

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
