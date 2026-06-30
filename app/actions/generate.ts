"use server"

import { revalidatePath } from "next/cache"
import { generatePosts } from "@/lib/ai"
import { dbCreatePosts, dbGetAsset, dbGetClient } from "@/lib/db"
import type { Platform } from "@/lib/types"

export interface GenerateTarget {
  platform: Platform
  count: number
}

/**
 * Generate a batch of draft posts from one asset.
 * Reuses the asset's first scraped image as post media.
 */
export async function generateFromAsset(
  clientId: string,
  assetId: string,
  targets: GenerateTarget[],
): Promise<{ created: number }> {
  const clean = targets.filter((t) => t.count > 0).map((t) => ({ ...t, count: Math.min(t.count, 30) }))
  if (clean.length === 0) throw new Error("Pick at least one platform")

  const [asset, client] = await Promise.all([dbGetAsset(assetId), dbGetClient(clientId)])
  if (!asset || asset.clientId !== clientId) throw new Error("Asset not found")
  if (!client) throw new Error("Client not found")
  if (!asset.text) throw new Error("This asset has no extracted text to generate from")

  const generated = await generatePosts({
    assetName: asset.name,
    assetText: asset.text,
    targets: clean,
    goal: client.defaultGoal,
    audience: client.defaultAudience,
    identity: client.identity,
  })
  if (generated.length === 0) throw new Error("The model returned no usable posts — try again")

  // If the asset has a stored video, posts publish as reels; else use the best image.
  const videoUrl = (asset.videos[0] as { url?: string } | undefined)?.url
  const heroImage = asset.images.find((i) => !i.isBgImage)?.src ?? asset.images[0]?.src
  const media = videoUrl ? [videoUrl] : heroImage ? [heroImage] : []
  const created = await dbCreatePosts(
    clientId,
    assetId,
    generated.map((g) => ({
      platform: g.platform,
      content: g.content,
      mediaUrls: media,
    })),
  )

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}/content`)
  revalidatePath(`/clients/${clientId}/posts`)
  return { created: created.length }
}
