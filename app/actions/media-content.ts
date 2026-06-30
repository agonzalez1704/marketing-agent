"use server"

import { revalidatePath } from "next/cache"
import { insforge, unwrap } from "@/lib/insforge"
import { analyzeMedia } from "@/lib/ai"
import { dbCreateAsset, dbGetClientProfileId } from "@/lib/db"
import type { Asset } from "@/lib/types"

const BUCKET = "post-media"
const IMG_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

async function assertClient(clientId: string) {
  if (!(await dbGetClientProfileId(clientId))) throw new Error("Client not found")
}

async function uploadImage(clientId: string, file: File): Promise<string> {
  const safe = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
  const key = `assets/${clientId}/${Date.now()}-${safe}`
  const up = unwrap(await insforge.storage.from(BUCKET).upload(key, file)) as { url: string }
  return up.url
}

/** Upload an image, analyze it, store as an IMAGE asset (image attached). */
export async function createAssetFromImage(clientId: string, formData: FormData): Promise<Asset> {
  await assertClient(clientId)
  const file = formData.get("file")
  if (!(file instanceof File)) throw new Error("No image provided")
  if (!IMG_TYPES.includes(file.type)) throw new Error("Image must be PNG, JPG, WEBP or GIF")
  if (file.size > 12 * 1024 * 1024) throw new Error("Image must be under 12 MB")

  const url = await uploadImage(clientId, file)
  const { name, description } = await analyzeMedia(url, "image")

  const asset = await dbCreateAsset({
    clientId,
    name,
    source: file.name,
    origin: "IMAGE",
    text: description,
    images: [{ src: url }],
  })
  revalidatePath(`/clients/${clientId}/content`)
  revalidatePath(`/clients/${clientId}`)
  return asset
}

/**
 * Store a VIDEO asset from a client-extracted frame (the frame is analyzed and
 * attached as the source image). `file` = the frame image. `videoName` labels it.
 */
export async function createAssetFromVideo(clientId: string, formData: FormData): Promise<Asset> {
  await assertClient(clientId)
  const frame = formData.get("file")
  if (!(frame instanceof File)) throw new Error("No video frame provided")
  if (frame.size > 12 * 1024 * 1024) throw new Error("Frame too large")
  const videoName = (formData.get("videoName") as string) || "Uploaded video"

  const url = await uploadImage(clientId, frame)
  const { description } = await analyzeMedia(url, "video")

  // Store the actual video too (so posts from this asset can publish as reels).
  let videos: { url: string }[] = []
  const video = formData.get("video")
  if (video instanceof File && video.size > 0) {
    if (video.size > 50 * 1024 * 1024) throw new Error("Video must be under 50 MB (or paste a hosted URL on the post)")
    const safe = video.name.replace(/[^a-zA-Z0-9.]/g, "_")
    const key = `assets/${clientId}/${Date.now()}-${safe}`
    const up = unwrap(await insforge.storage.from(BUCKET).upload(key, video)) as { url: string }
    videos = [{ url: up.url }]
  }

  const asset = await dbCreateAsset({
    clientId,
    name: videoName.replace(/\.[^.]+$/, ""),
    source: videoName,
    origin: "VIDEO",
    text: description,
    images: [{ src: url }],
    videos,
  })
  revalidatePath(`/clients/${clientId}/content`)
  revalidatePath(`/clients/${clientId}`)
  return asset
}
