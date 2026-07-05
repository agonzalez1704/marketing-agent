"use server"

import { revalidatePath } from "next/cache"
import { insforge, unwrap } from "@/lib/insforge"
import { dbGetClientLogoKey, dbGetClientProfileId, dbSetClientLogo } from "@/lib/db"

const BUCKET = "client-logos"
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"]

/** Upload a client logo to InsForge Storage and point the client at it. */
export async function uploadClientLogo(clientId: string, formData: FormData): Promise<{ url: string }> {
  const profileId = await dbGetClientProfileId(clientId)
  if (!profileId) throw new Error("Client not found")

  const file = formData.get("file")
  if (!(file instanceof File)) throw new Error("No file provided")
  if (!ALLOWED.includes(file.type)) throw new Error("Logo must be PNG, JPG, WEBP, GIF, or SVG")
  if (file.size > MAX_BYTES) throw new Error("Logo must be under 2 MB")

  const key = `${clientId}/logo-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
  const uploaded = unwrap(await insforge.storage.from(BUCKET).upload(key, file)) as {
    url: string
    key: string
  }

  // Remove the previous logo object if it was a different key.
  const oldKey = await dbGetClientLogoKey(clientId)
  await dbSetClientLogo(clientId, uploaded.url, uploaded.key)
  if (oldKey && oldKey !== uploaded.key) {
    await insforge.storage.from(BUCKET).remove(oldKey).catch(() => {})
  }

  revalidatePath("/")
  revalidatePath(`/clients/${clientId}`)
  return { url: uploaded.url }
}

/** Point the client at an already-uploaded logo (browser did the direct upload). */
export async function setClientLogo(clientId: string, url: string, key: string): Promise<void> {
  const profileId = await dbGetClientProfileId(clientId)
  if (!profileId) throw new Error("Client not found")

  const oldKey = await dbGetClientLogoKey(clientId)
  await dbSetClientLogo(clientId, url, key)
  if (oldKey && oldKey !== key) {
    await insforge.storage.from(BUCKET).remove(oldKey).catch(() => {})
  }
  revalidatePath("/")
  revalidatePath(`/clients/${clientId}`)
}

export async function removeClientLogo(clientId: string): Promise<void> {
  const key = await dbGetClientLogoKey(clientId)
  await dbSetClientLogo(clientId, null, null)
  if (key) await insforge.storage.from(BUCKET).remove(key).catch(() => {})

  revalidatePath("/")
  revalidatePath(`/clients/${clientId}`)
}
