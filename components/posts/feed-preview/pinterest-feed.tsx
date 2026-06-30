import { Search, Home, Bell, User } from "lucide-react"
import { BrandAvatar } from "./brand-avatar"
import type { FeedPreviewData } from "./types"
import { FeedMedia } from "./feed-media"

export function PinterestFeed({ data }: { data: FeedPreviewData }) {
  const { imageUrl, content, brandName, brandLogo } = data

  return (
    <div className="flex flex-col bg-white text-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-base font-semibold">All</span>
        <MoreDots />
      </div>

      {/* Main pin */}
      <div className="px-2">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="relative aspect-[3/4] w-full bg-muted">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <FeedMedia src={imageUrl} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          <button className="absolute right-3 top-3 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
              <ShareIcon />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
              <MoreDots small />
            </div>
          </div>
        </div>

        <div className="px-1 py-2">
          <p className="line-clamp-2 text-sm">{content}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <BrandAvatar name={brandName} logo={brandLogo} className="h-6 w-6" textClassName="text-[10px]" />
            <span className="text-xs font-medium">{brandName}</span>
          </div>
        </div>
      </div>

      {/* Masonry placeholder */}
      <div className="grid grid-cols-2 gap-2 px-2 pb-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-gray-100" style={{ height: i % 2 === 0 ? 160 : 120 }} />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-around border-t py-2">
        <Home className="h-6 w-6" fill="currentColor" />
        <Search className="h-6 w-6" />
        <Bell className="h-6 w-6" />
        <User className="h-6 w-6" />
      </div>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function MoreDots({ small }: { small?: boolean }) {
  const s = small ? 14 : 20
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}
