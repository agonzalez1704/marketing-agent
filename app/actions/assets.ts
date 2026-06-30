"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { scrapeUrl, parsePdf } from "@/lib/scrape"
import { dbCreateAsset, dbDeleteAsset, dbGetAsset, dbGetClientProfileId } from "@/lib/db"
import type { Asset } from "@/lib/types"

const urlSchema = z.string().url("Enter a valid URL")

async function assertClient(clientId: string) {
  const profileId = await dbGetClientProfileId(clientId)
  if (!profileId) throw new Error("Client not found")
}

/** Scrape a web page and store it as an asset. */
export async function createAssetFromUrl(clientId: string, rawUrl: string): Promise<Asset> {
  await assertClient(clientId)
  const url = urlSchema.parse(rawUrl.trim())

  const result = await scrapeUrl(url)
  if (!result.text || result.text.length < 20) {
    throw new Error("Couldn't extract meaningful content from that page")
  }

  const asset = await dbCreateAsset({
    clientId,
    name: result.title,
    source: url,
    origin: "WEBSITE_URL",
    text: result.text,
    images: result.images,
  })

  revalidatePath(`/clients/${clientId}/content`)
  revalidatePath(`/clients/${clientId}`)
  return asset
}

/** Parse an uploaded PDF and store it as an asset. */
export async function createAssetFromPdf(clientId: string, formData: FormData): Promise<Asset> {
  await assertClient(clientId)

  const file = formData.get("file")
  if (!(file instanceof File)) throw new Error("No file provided")
  if (file.type && file.type !== "application/pdf") throw new Error("File must be a PDF")
  if (file.size > 12 * 1024 * 1024) throw new Error("PDF is larger than 12 MB")

  const buffer = await file.arrayBuffer()
  const result = await parsePdf(buffer, file.name.replace(/\.pdf$/i, ""))
  if (!result.text || result.text.length < 20) {
    throw new Error("Couldn't extract text from that PDF (is it scanned images?)")
  }

  const asset = await dbCreateAsset({
    clientId,
    name: result.title,
    source: file.name,
    origin: "PDF_FILE",
    text: result.text,
    images: [],
  })

  revalidatePath(`/clients/${clientId}/content`)
  revalidatePath(`/clients/${clientId}`)
  return asset
}

/** Create an asset from a written brief — content from scratch, no URL or PDF. */
export async function createAssetFromBrief(
  clientId: string,
  name: string,
  brief: string,
): Promise<Asset> {
  await assertClient(clientId)
  const title = name.trim()
  const text = brief.trim()
  if (!title) throw new Error("Give it a name")
  if (text.length < 20) throw new Error("Describe the business in a bit more detail")

  const asset = await dbCreateAsset({
    clientId,
    name: title,
    source: "Written brief",
    origin: "MANUAL",
    text,
    images: [],
  })

  revalidatePath(`/clients/${clientId}/content`)
  revalidatePath(`/clients/${clientId}`)
  return asset
}

/** Full asset (text + images + videos) for the preview dialog. */
export async function getAssetDetail(clientId: string, assetId: string): Promise<Asset | null> {
  const asset = await dbGetAsset(assetId)
  if (!asset || asset.clientId !== clientId) return null
  return asset
}

export async function deleteAsset(clientId: string, assetId: string): Promise<void> {
  await dbDeleteAsset(assetId)
  revalidatePath(`/clients/${clientId}/content`)
  revalidatePath(`/clients/${clientId}`)
}
