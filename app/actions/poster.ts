"use server"

import { enhanceToPoster } from "@/lib/autotoon"
import { insforge, unwrap } from "@/lib/insforge"
import { dbGetClient, dbGetPost } from "@/lib/db"

const BUCKET = "post-media"

/**
 * Send a source image to auto-toon, re-host the result in InsForge Storage
 * (so it stays reachable for LATE), and return the durable URL.
 * Caller appends it to the post's media.
 */
export async function generatePoster(
  clientId: string,
  postId: string,
  sourceUrl: string,
): Promise<{ url: string }> {
  const post = await dbGetPost(postId)
  if (!post || post.clientId !== clientId) throw new Error("Post not found")
  if (!/^https?:\/\//.test(sourceUrl)) throw new Error("Pick a valid source image first")

  const client = await dbGetClient(clientId)
  const { url: generated } = await enhanceToPoster(sourceUrl, client?.name ?? "Post")

  // Re-host in InsForge for durability.
  const res = await fetch(generated)
  if (!res.ok) throw new Error("Couldn't fetch the generated image")
  const blob = await res.blob()
  const type = blob.type || "image/png"
  const ext = type.split("/")[1]?.replace("+xml", "") ?? "png"
  const file = new File([blob], `poster.${ext}`, { type })

  const key = `${postId}/poster-${Date.now()}.${ext}`
  const uploaded = unwrap(await insforge.storage.from(BUCKET).upload(key, file)) as { url: string }
  return { url: uploaded.url }
}
