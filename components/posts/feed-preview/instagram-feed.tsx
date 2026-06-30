import { Heart, MoreHorizontal, Home, Search, PlusSquare, User } from "lucide-react"
import { InstagramCommentIcon, InstagramShareIcon, InstagramBookmarkIcon } from "./preview-icons"
import { BrandAvatar } from "./brand-avatar"
import type { FeedPreviewData } from "./types"
import { FeedMedia } from "./feed-media"

const STORY_USERS = ["user_1", "user_2", "user_3", "user_4"]

export function InstagramFeed({ data }: { data: FeedPreviewData }) {
  const { imageUrl, content, brandName, brandLogo } = data
  const handle = brandName.toLowerCase().replace(/\s+/g, "")

  return (
    <div className="flex flex-col bg-white text-[#262626]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-lg font-semibold">Instagram</span>
        <div className="flex items-center gap-4">
          <Heart className="h-5 w-5" />
          <InstagramShareIcon className="h-5 w-5" />
        </div>
      </div>

      {/* Stories */}
      <div className="flex gap-3 overflow-x-auto px-4 py-2">
        {STORY_USERS.map((user, i) => (
          <div key={user} className="flex flex-col items-center gap-1">
            <div
              className="h-14 w-14 rounded-full"
              style={{
                background:
                  i % 2 === 0
                    ? "linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)"
                    : "#dbeafe",
                padding: "2px",
              }}
            >
              <div className="h-full w-full rounded-full bg-gray-200" />
            </div>
            <span className="text-[10px] text-muted-foreground">{user}</span>
          </div>
        ))}
      </div>

      {/* Post header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <BrandAvatar name={brandName} logo={brandLogo} className="h-8 w-8" textClassName="text-xs" />
          <span className="text-sm font-semibold">{handle}</span>
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
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

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Heart className="h-5 w-5" />
          <InstagramCommentIcon className="h-5 w-5" />
          <InstagramShareIcon className="h-5 w-5" />
        </div>
        <InstagramBookmarkIcon className="h-5 w-5" />
      </div>

      {/* Caption */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap text-sm">
          <span className="font-semibold">{handle}</span> {content}
        </p>
      </div>

      {/* Bottom nav */}
      <div className="mt-auto flex items-center justify-around border-t py-2">
        <Home className="h-6 w-6" fill="currentColor" />
        <Search className="h-6 w-6" />
        <PlusSquare className="h-6 w-6" />
        <Heart className="h-6 w-6" />
        <User className="h-6 w-6" />
      </div>
    </div>
  )
}
