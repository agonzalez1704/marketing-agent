import { createAdminClient } from "@insforge/sdk"

/**
 * Server-only InsForge admin client. Uses the full-access api_key, which
 * bypasses RLS — safe because this app has no auth and runs every query
 * server-side (server actions / route handlers).
 *
 * Never import this into client components.
 */
const globalForInsforge = globalThis as unknown as {
  insforge?: ReturnType<typeof createAdminClient>
}

function build() {
  const baseUrl = process.env.INSFORGE_URL
  const apiKey = process.env.INSFORGE_API_KEY
  if (!baseUrl || !apiKey) throw new Error("INSFORGE_URL / INSFORGE_API_KEY not set")
  return createAdminClient({ baseUrl, apiKey })
}

export const insforge = globalForInsforge.insforge ?? build()

if (process.env.NODE_ENV !== "production") globalForInsforge.insforge = insforge

/** Unwrap an InsForge `{ data, error }` result, throwing on error. */
export function unwrap<T>(res: { data: T; error: unknown }): T {
  if (res.error) {
    const e = res.error as { message?: string }
    throw new Error(e?.message ?? "InsForge request failed")
  }
  return res.data
}
