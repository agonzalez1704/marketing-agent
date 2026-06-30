import { Settings, MessageCircle, Repeat2, Heart, Share, Home, Search, Bell, Mail } from "lucide-react"
import { BrandAvatar } from "./brand-avatar"
import type { FeedPreviewData } from "./types"
import { FeedMedia } from "./feed-media"

export function XFeed({ data }: { data: FeedPreviewData }) {
  const { imageUrl, content, ctaUrl, brandName, brandLogo } = data
  const handle = brandName.toLowerCase().replace(/\s+/g, "")

  let linkDomain = ""
  try {
    if (ctaUrl) linkDomain = new URL(ctaUrl).hostname.replace("www.", "")
  } catch {
    /* ignore */
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <XLogo />
        <Settings className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <div className="flex-1 border-b-2 border-black py-3 text-center text-sm font-bold">For you</div>
        <div className="flex-1 py-3 text-center text-sm text-muted-foreground">Following</div>
      </div>

      {/* Context tweet */}
      <div className="flex gap-2 border-b px-4 py-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">Design Daily</span>
            <span className="text-xs text-muted-foreground">@designdaily &middot; 2h</span>
          </div>
        </div>
      </div>

      {/* Main tweet */}
      <div className="flex gap-2 px-4 pb-2 pt-3">
        <BrandAvatar name={brandName} logo={brandLogo} className="h-10 w-10" textClassName="text-sm" />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">{brandName}</span>
            <VerifiedBadge />
            <span className="text-xs text-muted-foreground">@{handle} &middot; Ad</span>
          </div>

          <p className="mt-1 whitespace-pre-wrap text-sm">{content}</p>

          <div className="mt-2 overflow-hidden rounded-xl border">
            <div className="relative aspect-video w-full bg-muted">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <FeedMedia src={imageUrl} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            {linkDomain && (
              <div className="border-t bg-gray-50 px-3 py-2">
                <p className="text-xs uppercase text-muted-foreground">{linkDomain}</p>
                <p className="line-clamp-1 text-sm font-medium">Learn more</p>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between pr-8 text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> <span className="text-xs">12</span>
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 className="h-4 w-4" /> <span className="text-xs">5</span>
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" /> <span className="text-xs">245</span>
            </span>
            <Share className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-auto flex items-center justify-around border-t py-4">
        <Home className="h-6 w-6" fill="currentColor" />
        <Search className="h-6 w-6" />
        <Bell className="h-6 w-6" />
        <Mail className="h-6 w-6" />
      </div>
    </div>
  )
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 22 22" className="h-4 w-4 text-[#1D9BF0]" fill="currentColor">
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.855-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.882.635.132 1.294.083 1.902-.14.272.587.702 1.087 1.24 1.44s1.167.551 1.813.568c.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.222 1.258.271 1.89.141.63-.13 1.211-.434 1.678-.878.468-.444.773-1.024.905-1.655.133-.63.088-1.286-.131-1.893.573-.27 1.06-.695 1.416-1.232s.555-1.159.574-1.8zm-9.58 3.018l-3.303-3.3L8.94 9.29l2.876 2.876 4.828-4.828 1.428 1.428-6.256 6.252z" />
    </svg>
  )
}
