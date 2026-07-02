import "server-only"
import { parseHTML } from "linkedom"
import { Readability } from "@mozilla/readability"
import { extractText, getDocumentProxy } from "unpdf"
import type { AssetImage } from "@/lib/types"

export interface ScrapeResult {
  title: string
  text: string
  images: AssetImage[]
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

/** Fetch a URL and extract readable text + candidate images. */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
  })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
  const html = await res.text()

  // linkedom is serverless-safe (jsdom's transitive ESM deps break on Vercel).
  const doc = parseHTML(html).document as unknown as Document

  const images = extractImages(doc, url)

  // Readability mutates the doc, so pull images first. Fall back to raw body text
  // if Readability can't parse this DOM.
  let article: { title?: string | null; textContent?: string | null } | null = null
  try {
    article = new Readability(doc).parse()
  } catch {
    article = null
  }

  const title =
    article?.title?.trim() ||
    doc.querySelector("title")?.textContent?.trim() ||
    new URL(url).hostname

  const text = (article?.textContent ?? doc.body?.textContent ?? "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return { title, text, images }
}

function extractImages(doc: Document, baseUrl: string): AssetImage[] {
  const out: AssetImage[] = []
  const seen = new Set<string>()

  const push = (src: string | null | undefined, alt?: string, isBg = false) => {
    if (!src) return
    let abs: string
    try {
      abs = new URL(src, baseUrl).href
    } catch {
      return
    }
    if (seen.has(abs)) return
    if (!/^https?:/.test(abs)) return
    if (/\.svg($|\?)/i.test(abs)) return // skip icons/logos
    seen.add(abs)
    out.push({ src: abs, alt: alt?.trim() || undefined, isBgImage: isBg })
  }

  // Social/meta hero images first.
  push(meta(doc, "og:image"), "", true)
  push(meta(doc, "twitter:image"), "", true)

  // Inline content images.
  doc.querySelectorAll("img").forEach((img) => {
    const el = img as HTMLImageElement
    const src = el.getAttribute("src") || el.getAttribute("data-src")
    const w = Number(el.getAttribute("width") || 0)
    const h = Number(el.getAttribute("height") || 0)
    if ((w && w < 64) || (h && h < 64)) return // skip tiny icons
    push(src, el.getAttribute("alt") || "")
  })

  return out.slice(0, 30)
}

function meta(doc: Document, prop: string): string | null {
  return (
    doc.querySelector(`meta[property="${prop}"]`)?.getAttribute("content") ||
    doc.querySelector(`meta[name="${prop}"]`)?.getAttribute("content") ||
    null
  )
}

/** Extract text from a PDF buffer. */
export async function parsePdf(buffer: ArrayBuffer, fallbackName: string): Promise<ScrapeResult> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  const body = (Array.isArray(text) ? text.join("\n") : text).trim()

  // Title = first non-empty line, else the filename.
  const firstLine = body.split("\n").map((l) => l.trim()).find(Boolean)
  const title = (firstLine && firstLine.length <= 120 ? firstLine : fallbackName).trim()

  return { title, text: body, images: [] }
}
