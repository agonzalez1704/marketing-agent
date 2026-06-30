import "server-only"
import { NextResponse } from "next/server"

/** True if the request carries the valid external API key (x-api-key or Bearer). */
export function isAuthorized(req: Request): boolean {
  const key = process.env.MARKETING_API_KEY
  if (!key) return false
  const got =
    req.headers.get("x-api-key") ||
    (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim()
  return !!got && got === key
}

/** Returns a 401 response if unauthorized, else null. */
export function unauthorizedResponse(req: Request): NextResponse | null {
  if (isAuthorized(req)) return null
  return NextResponse.json({ error: "Unauthorized. Send a valid x-api-key header." }, { status: 401 })
}
