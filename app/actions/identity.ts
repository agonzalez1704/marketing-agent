"use server"

import { revalidatePath } from "next/cache"
import { buildIdentity } from "@/lib/ai"
import { dbGetClient, dbGetLatestAssetWithText, dbSetClientIdentity } from "@/lib/db"
import type { ClientIdentity } from "@/lib/types"

/**
 * Build (or refresh) a client's brand identity from their latest text asset
 * (a scrape, PDF, or brief) + its images and logo.
 */
export async function buildClientIdentity(clientId: string): Promise<ClientIdentity> {
  const client = await dbGetClient(clientId)
  if (!client) throw new Error("Client not found")

  const asset = await dbGetLatestAssetWithText(clientId)
  if (!asset || !asset.text) {
    throw new Error("Add content first (scrape a site, upload a PDF, or write a brief)")
  }

  const imageUrls = [
    ...(client.logoUrl ? [client.logoUrl] : []),
    ...asset.images.map((i) => i.src),
  ]

  const identity = await buildIdentity({ name: client.name, text: asset.text, imageUrls })
  await dbSetClientIdentity(clientId, identity)

  revalidatePath(`/clients/${clientId}`)
  return identity
}
