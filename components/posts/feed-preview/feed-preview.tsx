import { Signal, Wifi, BatteryFull } from "lucide-react"
import { Iphone } from "@/components/ui/iphone"
import { InstagramFeed } from "./instagram-feed"
import { FacebookFeed } from "./facebook-feed"
import { PinterestFeed } from "./pinterest-feed"
import { XFeed } from "./x-feed"
import { LinkedInFeed } from "./linkedin-feed"
import type { FeedPreviewData } from "./types"
import type { Platform } from "@/lib/types"

export interface FeedPreviewProps {
  platform: Platform
  content: string
  mediaUrls: string[]
  brandName: string
  brandLogo: string | null
}

function extractHashtags(content: string): string[] {
  return content.match(/#[a-z0-9_]+/gi) || []
}
function extractCta(content: string): string {
  return (content.match(/https?:\/\/[^\s]+/) || [])[0] || ""
}
function strip(content: string): string {
  return content.replace(/https?:\/\/[^\s]+/g, "").trim()
}

/** Renders a post inside a phone frame, styled like the real platform app. */
export function FeedPreview({ platform, content, mediaUrls, brandName, brandLogo }: FeedPreviewProps) {
  const data: FeedPreviewData = {
    imageUrl: mediaUrls[0] ?? "",
    content: strip(content),
    hashtags: extractHashtags(content),
    ctaUrl: extractCta(content),
    brandName,
    brandLogo,
  }

  const feed = (() => {
    switch (platform) {
      case "FACEBOOK":
      case "GOOGLEBUSINESS":
        return <FacebookFeed data={data} />
      case "LINKEDIN":
        return <LinkedInFeed data={data} />
      case "PINTEREST":
        return <PinterestFeed data={data} />
      case "TWITTER":
        return <XFeed data={data} />
      case "INSTAGRAM":
      default:
        // TikTok / YouTube are reel-first; fall back to the IG feed for static posts.
        return <InstagramFeed data={data} />
    }
  })()

  return (
    <Iphone className="w-[390px] max-w-full">
      <div className="flex min-h-full flex-col">
        <StatusBar />
        {feed}
      </div>
    </Iphone>
  )
}

function StatusBar() {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-7 pb-1 pt-3 text-[11px] font-semibold text-black">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <Signal className="size-3" />
        <Wifi className="size-3" />
        <BatteryFull className="size-3.5" />
      </div>
    </div>
  )
}
