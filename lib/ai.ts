import "server-only"
import OpenAI from "openai"
import type { Platform, ClientIdentity } from "@/lib/types"
import { PLATFORM_LABEL, PLATFORM_CHAR_LIMIT } from "@/lib/platforms"

export { PLATFORM_CHAR_LIMIT }

const MODEL = process.env.OPENROUTER_CHAT_MODEL ?? "anthropic/claude-sonnet-4.6"

let _client: OpenAI | null = null
function client(): OpenAI {
  if (_client) return _client
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set (run `npx @insforge/cli ai setup`)")
  _client = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" })
  return _client
}

export interface GeneratedPost {
  platform: Platform
  content: string
}

export interface GenerateInput {
  assetName: string
  assetText: string
  /** how many posts to produce per platform */
  targets: Array<{ platform: Platform; count: number }>
  goal?: string | null
  audience?: string | null
  identity?: ClientIdentity | null
}

// Strip AI-tell formatting that Meta/IG penalize: markdown, em/en dashes, etc.
export function sanitizeCopy(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // **bold**
    .replace(/__(.*?)__/g, "$1") // __bold__
    .replace(/(^|[\s(])\*(\S.*?\S|\S)\*(?=[\s).,!?]|$)/g, "$1$2") // *italic*
    .replace(/`+/g, "") // backticks
    .replace(/^#{1,6}\s+/gm, "") // # headings
    .replace(/^\s*[-*]\s+/gm, "") // markdown bullets
    .replace(/\s*—\s*/g, ", ") // em dash
    .replace(/\s*–\s*/g, ", ") // en dash
    .replace(/\s+--+\s+/g, ", ") // double hyphen
    .replace(/\*+/g, "") // any stray asterisks
    .replace(/,\s*,/g, ",") // collapse doubled commas
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

const PLAIN_TEXT_RULE =
  "Write plain text only. No markdown whatsoever (no **, no *, no #, no backticks, no bullet markdown). " +
  "Never use em-dashes (—), en-dashes (–) or double hyphens (--); write naturally with commas and periods. " +
  "Avoid AI-cliché phrasing and over-formatting so it reads human-written."

function identityLines(identity?: ClientIdentity | null): string {
  if (!identity) return ""
  return [
    "",
    "BRAND IDENTITY — stay on-brand:",
    identity.tone ? `Tone: ${identity.tone}` : "",
    identity.voice ? `Voice: ${identity.voice}` : "",
    identity.audience ? `Audience: ${identity.audience}` : "",
    identity.keywords?.length ? `Keywords to weave in: ${identity.keywords.join(", ")}` : "",
    identity.services?.length ? `Services: ${identity.services.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

/** Turn one asset into a batch of platform-tailored post drafts. */
export async function generatePosts(input: GenerateInput): Promise<GeneratedPost[]> {
  const source = input.assetText.slice(0, 6000)
  const total = input.targets.reduce((n, t) => n + t.count, 0)
  if (total === 0) return []

  const targetLines = input.targets
    .map((t) => `- ${PLATFORM_LABEL[t.platform]} (${t.platform}): ${t.count} posts, max ${PLATFORM_CHAR_LIMIT[t.platform]} chars each`)
    .join("\n")

  const system = [
    "You are a senior social media copywriter.",
    "Write platform-native posts from the provided source material.",
    "Each post must be distinct in angle/hook — no repetition across posts.",
    "Match each platform's tone (LinkedIn professional, Instagram visual/casual, X punchy, etc.).",
    "Use natural language; tasteful emoji and hashtags where the platform expects them.",
    PLAIN_TEXT_RULE,
    "Never exceed a platform's character limit.",
    "Return ONLY JSON.",
  ].join(" ")

  const user = [
    `SOURCE — "${input.assetName}":`,
    source,
    "",
    input.goal ? `GOAL: ${input.goal}` : "",
    input.audience ? `AUDIENCE: ${input.audience}` : "",
    identityLines(input.identity),
    "",
    "Produce posts for:",
    targetLines,
    "",
    'Respond as JSON: {"posts":[{"platform":"<ENUM>","content":"..."}]}',
    "platform must be one of: " + input.targets.map((t) => t.platform).join(", "),
  ]
    .filter(Boolean)
    .join("\n")

  const res = await client().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: Math.min(8000, 400 * total + 500),
    temperature: 0.8,
  })

  const raw = res.choices[0]?.message?.content ?? "{}"
  const parsed = safeParse(raw)
  const valid = new Set(input.targets.map((t) => t.platform))

  return (parsed.posts ?? [])
    .filter((p): p is GeneratedPost => !!p && valid.has(p.platform as Platform) && typeof p.content === "string")
    .map((p) => ({
      platform: p.platform as Platform,
      content: sanitizeCopy(p.content).slice(0, PLATFORM_CHAR_LIMIT[p.platform as Platform]),
    }))
}

/** Rewrite a single post's copy per an instruction, respecting the platform limit. */
export async function refineContent(
  platform: Platform,
  content: string,
  instruction: string,
): Promise<string> {
  const limit = PLATFORM_CHAR_LIMIT[platform]
  const system = [
    `You are a senior social media copywriter editing a ${PLATFORM_LABEL[platform]} post.`,
    `Apply the user's instruction. Keep it platform-native. Never exceed ${limit} characters.`,
    PLAIN_TEXT_RULE,
    "Return ONLY the rewritten post text — no quotes, no commentary, no preamble.",
  ].join(" ")

  const res = await client().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `INSTRUCTION: ${instruction}\n\nCURRENT POST:\n${content}` },
    ],
    max_completion_tokens: 1200,
    temperature: 0.7,
  })

  const out = sanitizeCopy((res.choices[0]?.message?.content ?? "").replace(/^["']|["']$/g, ""))
  return out.slice(0, limit) || content
}

type VisionPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

// Inline images as base64 data URLs — works across all OpenRouter providers
// (remote URL sources are rejected/undownloadable by some).
async function buildVisionContent(text: string, imageUrls: string[]): Promise<VisionPart[]> {
  const parts: VisionPart[] = [{ type: "text", text }]
  for (const url of imageUrls.slice(0, 4)) {
    if (!/^https?:\/\//.test(url)) continue
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > 5 * 1024 * 1024) continue // Claude image size cap
      // InsForge Storage serves "binary/octet-stream" — don't trust the header.
      // Use a real image content-type (header if it's an image, else URL extension).
      parts.push({ type: "image_url", image_url: { url: `data:${resolveImageMime(url, res)};base64,${buf.toString("base64")}` } })
    } catch {
      /* skip unfetchable images */
    }
  }
  return parts
}

function resolveImageMime(url: string, res: Response): string {
  const header = (res.headers.get("content-type") ?? "").split(";")[0]
  if (header.startsWith("image/")) return header
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase()
  return ext === "png"
    ? "image/png"
    : ext === "webp"
      ? "image/webp"
      : ext === "gif"
        ? "image/gif"
        : "image/jpeg"
}

/** Analyze a business (scraped text + images) into a structured brand identity. */
export async function buildIdentity(input: {
  name: string
  text: string
  imageUrls: string[]
}): Promise<ClientIdentity> {
  const system =
    "You are a brand strategist. Study the business (text + any images) and infer its brand identity. " +
    "For colors, name the actual dominant brand colors you see in the images (hex + a short label). Return ONLY JSON."

  const schemaHint =
    'Respond as JSON: {"summary":"1-2 sentences","tone":"3-5 adjectives","voice":"how they should write","audience":"who they serve","industry":"...","keywords":["..."],"services":["..."],"colors":[{"hex":"#RRGGBB","label":"..."}]}'

  const content = await buildVisionContent(
    `BUSINESS: ${input.name}\n\nSOURCE MATERIAL:\n${input.text.slice(0, 6000)}\n\n${schemaHint}`,
    input.imageUrls,
  )

  const res = await client().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: content as unknown as string },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1500,
    temperature: 0.4,
  })

  const raw = res.choices[0]?.message?.content ?? "{}"
  let p: Partial<ClientIdentity> = {}
  try {
    p = JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) try { p = JSON.parse(m[0]) } catch { /* ignore */ }
  }

  return {
    summary: typeof p.summary === "string" ? p.summary : "",
    tone: typeof p.tone === "string" ? p.tone : "",
    voice: typeof p.voice === "string" ? p.voice : "",
    audience: typeof p.audience === "string" ? p.audience : "",
    industry: typeof p.industry === "string" ? p.industry : "",
    keywords: Array.isArray(p.keywords) ? p.keywords.filter((x): x is string => typeof x === "string").slice(0, 12) : [],
    services: Array.isArray(p.services) ? p.services.filter((x): x is string => typeof x === "string").slice(0, 12) : [],
    colors: Array.isArray(p.colors)
      ? p.colors
          .filter((c): c is { hex: string; label: string } => !!c && typeof c.hex === "string")
          .map((c) => ({ hex: c.hex, label: typeof c.label === "string" ? c.label : "" }))
          .slice(0, 8)
      : [],
  }
}

/** Describe an uploaded image / video frame so it can seed content generation. */
export async function analyzeMedia(
  imageUrl: string,
  kind: "image" | "video",
): Promise<{ name: string; description: string }> {
  const system =
    `You are analyzing ${kind === "video" ? "a frame from a video" : "an image"} a business wants to post about. ` +
    "Identify the actual product/service shown and its selling points. " +
    "TRANSCRIBE any visible text exactly — prices, phone numbers, addresses, offers, product names, service lists. " +
    "Base everything on what is really in the image; do not invent. Return ONLY JSON."

  const content = await buildVisionContent(
    'Analyze this for social content. Respond as JSON: ' +
      '{"name":"the actual product/service name shown","description":"what is shown + selling points","visibleText":"verbatim text from the image (prices, phone, address, offers, services)"}',
    [imageUrl],
  )

  const res = await client().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: content as unknown as string },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 800,
    temperature: 0.5,
  })

  const raw = res.choices[0]?.message?.content ?? "{}"
  let p: { name?: string; description?: string; visibleText?: string } = {}
  try {
    p = JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) try { p = JSON.parse(m[0]) } catch { /* ignore */ }
  }
  const description = typeof p.description === "string" ? p.description : ""
  const visibleText = typeof p.visibleText === "string" && p.visibleText.trim() ? p.visibleText.trim() : ""
  return {
    name: typeof p.name === "string" && p.name ? p.name : kind === "video" ? "Video" : "Image",
    description: visibleText ? `${description}\n\nText in the image (use these exact details):\n${visibleText}` : description,
  }
}

function safeParse(raw: string): { posts?: Array<{ platform?: string; content?: string }> } {
  try {
    return JSON.parse(raw)
  } catch {
    // Tolerate code fences or stray prose around the JSON.
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0])
      } catch {
        /* fall through */
      }
    }
    return {}
  }
}
