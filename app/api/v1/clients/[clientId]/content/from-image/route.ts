import { NextResponse } from "next/server"
import { z } from "zod"
import { unauthorizedResponse } from "@/lib/api-auth"
import { insforge, unwrap } from "@/lib/insforge"
import { analyzeMedia, generatePosts } from "@/lib/ai"
import { dbCreateAsset, dbGetClient, dbListAccounts, dbCreatePosts, dbSetSchedule } from "@/lib/db"
import { publishPostsByIds } from "@/app/actions/schedule"
import type { Platform } from "@/lib/types"

export const dynamic = "force-dynamic"

const PLATFORMS: Platform[] = [
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "TWITTER",
  "PINTEREST",
  "TIKTOK",
  "YOUTUBE",
  "GOOGLEBUSINESS",
]

const bodySchema = z
  .object({
    imageUrl: z.string().url().optional(),
    imageBase64: z.string().optional(),
    name: z.string().max(200).optional(),
    generate: z
      .object({
        platforms: z.array(z.string()).optional(),
        perPlatform: z.number().int().min(1).max(30).optional(),
      })
      .optional(),
    schedule: z
      .object({
        startAt: z.string().datetime().optional(),
        intervalHours: z.number().min(1).max(168).optional(),
        publish: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((d) => d.imageUrl || d.imageBase64, { message: "imageUrl or imageBase64 is required" })

async function resolveImageUrl(clientId: string, body: z.infer<typeof bodySchema>): Promise<string> {
  if (body.imageUrl) return body.imageUrl
  const raw = body.imageBase64!
  const m = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  const mime = m?.[1] ?? "image/png"
  const data = m?.[2] ?? raw
  const buf = Buffer.from(data, "base64")
  const ext = mime.split("/")[1]?.replace("+xml", "") ?? "png"
  const file = new File([buf], `api-${Date.now()}.${ext}`, { type: mime })
  const key = `assets/${clientId}/${Date.now()}-api.${ext}`
  const up = unwrap(await insforge.storage.from("post-media").upload(key, file)) as { url: string }
  return up.url
}

export async function POST(req: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const unauth = unauthorizedResponse(req)
  if (unauth) return unauth

  const { clientId } = await params
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid body" }, { status: 400 })
  }

  const client = await dbGetClient(clientId)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  try {
    // 1. resolve + analyze the image, store as an IMAGE asset
    const imageUrl = await resolveImageUrl(clientId, body)
    const { name, description } = await analyzeMedia(imageUrl, "image")
    const asset = await dbCreateAsset({
      clientId,
      name: body.name?.trim() || name,
      source: "API image",
      origin: "IMAGE",
      text: description,
      images: [{ src: imageUrl }],
    })

    const out: Record<string, unknown> = { assetId: asset.id, asset: { name: asset.name, imageUrl } }
    if (!body.generate) return NextResponse.json(out, { status: 201 })

    // 2. generate posts (on-brand via identity), attach the image as media
    const accounts = await dbListAccounts(clientId)
    const connected = [...new Set(accounts.map((a) => a.platform))]
    const requested = (body.generate.platforms ?? [])
      .map((p) => p.toUpperCase())
      .filter((p): p is Platform => (PLATFORMS as string[]).includes(p))
    const platforms = requested.length > 0 ? requested : connected
    if (platforms.length === 0) {
      return NextResponse.json(
        { ...out, error: "No platforms to generate for — connect accounts or pass generate.platforms" },
        { status: 400 },
      )
    }
    const perPlatform = body.generate.perPlatform ?? 1
    const generated = await generatePosts({
      assetName: asset.name,
      assetText: description,
      targets: platforms.map((platform) => ({ platform, count: perPlatform })),
      goal: client.defaultGoal,
      audience: client.defaultAudience,
      identity: client.identity,
    })
    const posts = await dbCreatePosts(
      clientId,
      asset.id,
      generated.map((g) => ({ platform: g.platform, content: g.content, mediaUrls: [imageUrl] })),
    )
    out.posts = posts.map((p) => ({ id: p.id, platform: p.platform, content: p.content }))
    if (!body.schedule) return NextResponse.json(out, { status: 201 })

    // 3. schedule: spread the posts, then optionally push to LATE
    const start = body.schedule.startAt ? new Date(body.schedule.startAt) : defaultStart()
    const stepMs = (body.schedule.intervalHours ?? 24) * 3600_000
    for (let i = 0; i < posts.length; i++) {
      await dbSetSchedule(posts[i].id, new Date(start.getTime() + i * stepMs).toISOString())
    }
    if (body.schedule.publish !== false) {
      out.schedule = await publishPostsByIds(clientId, posts.map((p) => p.id))
    } else {
      out.schedule = { planned: posts.length, publish: false }
    }
    return NextResponse.json(out, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

function defaultStart(): Date {
  const d = new Date(Date.now() + 24 * 3600_000)
  d.setUTCHours(15, 0, 0, 0) // tomorrow ~10am ET
  return d
}
