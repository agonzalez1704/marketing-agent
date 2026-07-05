"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { insforge, unwrap } from "@/lib/insforge"
import { dbGetClientProfileId, dbGetPost, dbSetPostMedia } from "@/lib/db"

const BUCKET = "post-media"
const MAX_IMG_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const ALLOWED_IMG = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"]
const urlSchema = z.string().url()

async function assertPost(clientId: string, postId: string) {
  const post = await dbGetPost(postId)
  if (!post || post.clientId !== clientId) throw new Error("Post not found")
  return post
}

/** Replace a post's media list (order preserved). Max 10. */
export async function setPostMedia(
  clientId: string,
  postId: string,
  mediaUrls: string[],
): Promise<void> {
  await assertPost(clientId, postId)
  const clean = mediaUrls.filter((u) => urlSchema.safeParse(u).success).slice(0, 10)
  await dbSetPostMedia(postId, clean)
  revalidatePath(`/clients/${clientId}/posts/${postId}`)
  revalidatePath(`/clients/${clientId}/posts`)
}

/** Upload media for a not-yet-created post (image or video). Returns the public URL. */
export async function uploadMedia(clientId: string, formData: FormData): Promise<{ url: string }> {
  if (!(await dbGetClientProfileId(clientId))) throw new Error("Client not found")
  const file = formData.get("file")
  if (!(file instanceof File)) throw new Error("No file provided")

  const isVideo = file.type.startsWith("video/")
  if (isVideo) {
    if (!ALLOWED_VIDEO.includes(file.type)) throw new Error("Video must be MP4, MOV or WEBM")
    if (file.size > MAX_VIDEO_BYTES) throw new Error("Video too large — paste a hosted URL instead")
  } else {
    if (!ALLOWED_IMG.includes(file.type)) throw new Error("Image must be PNG, JPG, WEBP or GIF")
    if (file.size > MAX_IMG_BYTES) throw new Error("Image must be under 8 MB")
  }

  const key = `manual/${clientId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
  const up = unwrap(await insforge.storage.from(BUCKET).upload(key, file)) as { url: string }
  return { url: up.url }
}

/**
 * Upload an image or video to InsForge Storage and return its public URL.
 * Videos become reel media when attached to a post. Caller appends via setPostMedia.
 */
export async function uploadPostImage(
  clientId: string,
  postId: string,
  formData: FormData,
): Promise<{ url: string }> {
  await assertPost(clientId, postId)
  const file = formData.get("file")
  if (!(file instanceof File)) throw new Error("No file provided")

  const isVideo = file.type.startsWith("video/")
  if (isVideo) {
    if (!ALLOWED_VIDEO.includes(file.type)) throw new Error("Video must be MP4, MOV or WEBM")
    if (file.size > MAX_VIDEO_BYTES) throw new Error("Video must be under 50 MB (or paste a hosted URL)")
  } else {
    if (!ALLOWED_IMG.includes(file.type)) throw new Error("Image must be PNG, JPG, WEBP or GIF")
    if (file.size > MAX_IMG_BYTES) throw new Error("Image must be under 8 MB")
  }

  const key = `${postId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
  const uploaded = unwrap(await insforge.storage.from(BUCKET).upload(key, file)) as {
    url: string
    key: string
  }
  return { url: uploaded.url }
}
