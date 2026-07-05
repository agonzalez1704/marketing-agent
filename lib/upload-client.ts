import { getUploadTicket, confirmUpload } from "@/app/actions/upload"

/**
 * Upload a file straight from the browser to storage via a presigned URL.
 * The bytes go browser → S3 directly, so they never hit our Vercel function
 * (avoids the ~4.5MB FUNCTION_PAYLOAD_TOO_LARGE limit).
 */
export async function uploadFileDirect(
  clientId: string,
  bucket: "post-media" | "client-logos",
  file: File,
): Promise<{ url: string; key: string }> {
  const t = await getUploadTicket(clientId, bucket, file.name, file.type || "application/octet-stream", file.size)
  if (t.method !== "presigned") throw new Error("Storage did not return a presigned upload")

  const fd = new FormData()
  for (const [k, v] of Object.entries(t.fields)) fd.append(k, v)
  fd.append("file", file)

  const res = await fetch(t.uploadUrl, { method: "POST", body: fd })
  if (!res.ok) throw new Error(`Storage upload failed (${res.status})`)

  if (t.confirmRequired && t.confirmUrl) {
    const c = await confirmUpload(clientId, bucket, t.confirmUrl, file.size, file.type || "application/octet-stream")
    return { url: c.url || t.publicUrl, key: t.key }
  }
  return { url: t.publicUrl, key: t.key }
}
