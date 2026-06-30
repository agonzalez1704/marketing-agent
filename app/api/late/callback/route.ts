import { NextRequest, NextResponse } from "next/server"
import { syncAccounts } from "@/app/actions/connections"

/**
 * OAuth callback. LATE redirects here after the user authorizes a platform.
 * We sync the client's connected accounts, then bounce back to the connections page.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  // LATE sometimes appends its return params with "?" instead of "&", gluing
  // them onto our values (e.g. platform=GOOGLEBUSINESS?connected=...). Strip any
  // such trailing query fragment from the params we read.
  const clean = (v: string | null) => (v ?? "").split("?")[0]
  const clientId = clean(searchParams.get("clientId"))
  const platform = clean(searchParams.get("platform"))
  const error = clean(searchParams.get("error"))

  if (!clientId) {
    return NextResponse.redirect(`${origin}/`)
  }

  const base = `${origin}/clients/${clientId}/connections`

  if (error) {
    return NextResponse.redirect(`${base}?error=${encodeURIComponent(error)}&platform=${platform}`)
  }

  try {
    await syncAccounts(clientId)
    return NextResponse.redirect(`${base}?connected=${encodeURIComponent(platform)}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync_failed"
    return NextResponse.redirect(`${base}?error=${encodeURIComponent(msg)}&platform=${platform}`)
  }
}
