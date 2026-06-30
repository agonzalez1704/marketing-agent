import { Search, Home, Users, PlusSquare, Bell, MessageSquare, MoreHorizontal } from "lucide-react"
import { BrandAvatar } from "./brand-avatar"
import type { FeedPreviewData } from "./types"
import { FeedMedia } from "./feed-media"

export function LinkedInFeed({ data }: { data: FeedPreviewData }) {
  const { imageUrl, content, brandName, brandLogo } = data

  const renderContent = () => {
    if (!content) return null
    const parts = content.split(/(#[a-z0-9_]+)/gi)
    return parts.map((part, i) =>
      part.match(/^#[a-z0-9_]+$/i) ? (
        <span key={i} className="font-medium text-[#0A66C2]">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }

  return (
    <div className="flex flex-col bg-gray-100 text-[#000000e6]">
      {/* Search header */}
      <div className="flex items-center gap-2 bg-white px-4 py-2">
        <BrandAvatar name={brandName} logo={brandLogo} className="h-8 w-8" textClassName="text-xs" />
        <div className="flex flex-1 items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search</span>
        </div>
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Post card */}
      <div className="mt-2 bg-white">
        <div className="flex items-start justify-between px-4 pb-2 pt-3">
          <div className="flex items-start gap-2">
            <BrandAvatar name={brandName} logo={brandLogo} className="h-12 w-12" textClassName="text-sm" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{brandName}</span>
              <span className="text-xs text-muted-foreground">12,453 followers</span>
              <span className="text-xs text-muted-foreground">
                Promoted &middot; <span>&#127758;</span>
              </span>
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="px-4 pb-2">
          <p className="whitespace-pre-wrap text-sm">{renderContent()}</p>
        </div>

        <div className="relative aspect-square w-full bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <FeedMedia src={imageUrl} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}
        </div>

        <div className="flex items-center justify-around border-t px-4 py-2">
          {[
            ["Like", <ThumbsUpIcon key="l" />],
            ["Comment", <MessageSquare key="c" className="h-4 w-4 text-muted-foreground" />],
            ["Repost", <RepostIcon key="r" />],
            ["Send", <SendIcon key="s" />],
          ].map(([label, icon]) => (
            <div key={label as string} className="flex flex-col items-center gap-0.5">
              {icon as React.ReactNode}
              <span className="text-[10px] text-muted-foreground">{label as string}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-auto flex items-center justify-around border-t bg-white py-2">
        {[
          [<Home key="h" className="h-5 w-5" fill="currentColor" />, "Home"],
          [<Users key="n" className="h-5 w-5 text-muted-foreground" />, "Network"],
          [<PlusSquare key="p" className="h-5 w-5 text-muted-foreground" />, "Post"],
          [<Bell key="b" className="h-5 w-5 text-muted-foreground" />, "Alerts"],
          [<BriefcaseIcon key="j" />, "Jobs"],
        ].map(([icon, label]) => (
          <div key={label as string} className="flex flex-col items-center gap-0.5">
            {icon as React.ReactNode}
            <span className="text-[10px] text-muted-foreground">{label as string}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ThumbsUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  )
}

function RepostIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 9 3-3 3 3" />
      <path d="M13 18H7a2 2 0 0 1-2-2V6" />
      <path d="m22 15-3 3-3-3" />
      <path d="M11 6h6a2 2 0 0 1 2 2v10" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
