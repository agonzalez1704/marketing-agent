import { isVideoUrl } from "@/lib/media"

/** Renders post media in a feed mockup — a looping muted video for reels, else an image. */
export function FeedMedia({ src, className }: { src: string; className?: string }) {
  if (isVideoUrl(src)) {
    return <video src={src} className={className} muted loop playsInline autoPlay />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} />
}
