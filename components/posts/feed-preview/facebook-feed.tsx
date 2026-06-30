import { Search, MoreHorizontal, ThumbsUp, MessageCircle } from "lucide-react"
import { FacebookCommentIcon, FacebookShareIcon } from "./preview-icons"
import { BrandAvatar } from "./brand-avatar"
import type { FeedPreviewData } from "./types"
import { FeedMedia } from "./feed-media"

export function FacebookFeed({ data }: { data: FeedPreviewData }) {
  const { imageUrl, content, brandName, brandLogo } = data

  return (
    <div className="flex flex-col bg-white text-[#050505]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xl font-bold text-[#1877F2]">facebook</span>
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Stories row */}
      <div className="flex gap-2 overflow-x-auto border-b px-4 py-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-9 w-9 shrink-0 rounded-lg ${i === 0 ? "bg-[#1877F2]" : "bg-gray-100"}`} />
        ))}
      </div>

      {/* Post header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <BrandAvatar name={brandName} logo={brandLogo} className="h-10 w-10" textClassName="text-sm" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{brandName}</span>
            <span className="text-xs text-muted-foreground">
              Sponsored &middot; <span>&#127758;</span>
            </span>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Post content */}
      <div className="px-4 pb-2">
        <p className="whitespace-pre-wrap text-sm">{content}</p>
      </div>

      {/* Post image */}
      <div className="relative aspect-square w-full bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <FeedMedia src={imageUrl} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
        )}
      </div>

      {/* Engagement bar */}
      <div className="flex items-center justify-around border-t px-4 py-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp className="h-4 w-4" />
          <span>Like</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FacebookCommentIcon />
          <span>Comment</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FacebookShareIcon className="h-4 w-4" />
          <span>Share</span>
        </div>
      </div>
    </div>
  )
}
