"use server"

import { dbGetClientProfileId } from "@/lib/db"

// Buckets the public app may upload to.
const BUCKETS = new Set(["post-media", "client-logos"])

function base(): string {
  return (process.env.INSFORGE_URL ?? "").replace(/\/$/, "")
}
function adminKey(): string {
  const k = process.env.INSFORGE_API_KEY
  if (!k) throw new Error("INSFORGE_API_KEY not set")
  return k
}

export interface UploadTicket {
  method: string
  uploadUrl: string
  fields: Record<string, string>
  key: string
  confirmRequired: boolean
  confirmUrl: string | null
  publicUrl: string
}

/**
 * Get a presigned upload ticket so the browser can PUT bytes straight to storage
 * (bypasses Vercel's ~4.5MB function-body limit). Admin-authed, server-only.
 */
export async function getUploadTicket(
  clientId: string,
  bucket: string,
  filename: string,
  contentType: string,
  size: number,
): Promise<UploadTicket> {
  if (!BUCKETS.has(bucket)) throw new Error("Unknown bucket")
  if (!(await dbGetClientProfileId(clientId))) throw new Error("Client not found")

  const safe = filename.replace(/[^a-zA-Z0-9.]/g, "_")
  const prefix = bucket === "client-logos" ? clientId : `manual/${clientId}`
  const key = `${prefix}/${Date.now()}-${safe}`

  const res = await fetch(`${base()}/api/storage/buckets/${bucket}/upload-strategy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ filename: key, contentType: contentType || "application/octet-stream", size }),
  })
  if (!res.ok) throw new Error(`upload-strategy failed: ${res.status} ${(await res.text().catch(() => "")).slice(0, 160)}`)
  const s = (await res.json()) as {
    method: string
    uploadUrl: string
    fields?: Record<string, string>
    key?: string
    confirmRequired?: boolean
    confirmUrl?: string
  }
  const finalKey = s.key ?? key
  return {
    method: s.method,
    uploadUrl: s.uploadUrl,
    fields: s.fields ?? {},
    key: finalKey,
    confirmRequired: !!s.confirmRequired,
    confirmUrl: s.confirmUrl ?? null,
    publicUrl: `${base()}/api/storage/buckets/${bucket}/objects/${encodeURIComponent(finalKey)}`,
  }
}

/** Register the uploaded object with InsForge after the browser PUT completes. */
export async function confirmUpload(
  clientId: string,
  bucket: string,
  confirmUrl: string,
  size: number,
  contentType: string,
): Promise<{ url: string }> {
  if (!BUCKETS.has(bucket)) throw new Error("Unknown bucket")
  if (!(await dbGetClientProfileId(clientId))) throw new Error("Client not found")
  // Only allow InsForge storage confirm paths for this bucket (the value round-trips via the client).
  if (!confirmUrl.startsWith(`/api/storage/buckets/${bucket}/`)) throw new Error("Invalid confirm URL")

  const res = await fetch(`${base()}${confirmUrl}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ size, contentType: contentType || "application/octet-stream" }),
  })
  if (!res.ok) throw new Error(`confirm failed: ${res.status}`)
  const j = (await res.json().catch(() => ({}))) as { url?: string }
  return { url: j.url ?? "" }
}
