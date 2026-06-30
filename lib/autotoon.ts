/**
 * auto-toon client — turns an existing image into an enhanced photoreal image.
 * Image-to-image (needs a source imageUrl). Server-to-server via API key.
 *
 * Backend: toon-converter at AUTOTOON_API_URL (auto-toon.com).
 * Auth: `x-api-key: toon_...` (handler calls authenticateApiKey).
 * NOTE: the backend middleware must expose /api/enhance-product as a public
 * route (it currently Clerk-protects it) for the API key to reach it.
 */
import "server-only"

const BASE = process.env.AUTOTOON_API_URL ?? "https://auto-toon.com"
const KEY = process.env.AUTOTOON_API_KEY
const MODEL = process.env.AUTOTOON_MODEL // optional; omit to let the backend pick

export interface PosterResult {
  url: string
  creditsRemaining?: number
}

/** Enhance a source image into a polished photoreal version. Returns the new image URL. */
export async function enhanceToPoster(imageUrl: string, name: string): Promise<PosterResult> {
  if (!KEY) throw new Error("AUTOTOON_API_KEY not set")

  const body: Record<string, unknown> = {
    imageUrl,
    productName: name,
    generationMode: "enhance-only",
    ...(MODEL ? { model: MODEL } : {}),
  }

  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/enhance-product`, {
    method: "POST",
    headers: { "x-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    const hint = res.status === 404 ? " (route is Clerk-protected — add /api/enhance-product to the backend middleware public list)" : ""
    throw new Error(`auto-toon ${res.status}${hint} ${t.slice(0, 160)}`)
  }
  const data = (await res.json()) as {
    heroImageUrl?: string
    vignetteImageUrl?: string
    creditsRemaining?: number
  }
  const url = data.heroImageUrl ?? data.vignetteImageUrl
  if (!url) throw new Error("auto-toon returned no image")
  return { url, creditsRemaining: data.creditsRemaining }
}
