"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, X, Upload, Check, Link2, Sparkles, Film } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { isVideoUrl } from "@/lib/media"
import { setPostMedia } from "@/app/actions/post-media"
import { generatePoster } from "@/app/actions/poster"
import { uploadFileDirect } from "@/lib/upload-client"

const ACCEPT_IMG = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const ACCEPT_VIDEO = ["video/mp4", "video/quicktime", "video/webm"]
const ACCEPT = [...ACCEPT_IMG, ...ACCEPT_VIDEO]

export function PostMediaManager({
  clientId,
  postId,
  initialMedia,
  assetImages,
  onChange,
}: {
  clientId: string
  postId: string
  initialMedia: string[]
  assetImages: { src: string; alt?: string }[]
  /** When provided, the parent owns the preview — we notify instead of refreshing. */
  onChange?: (media: string[]) => void
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [media, setMedia] = useState<string[]>(initialMedia)
  const [url, setUrl] = useState("")
  const [reelUrl, setReelUrl] = useState("")
  const [reelOpen, setReelOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [posterBusy, setPosterBusy] = useState<string | null>(null)

  async function save(next: string[]) {
    const prev = media
    setMedia(next)
    setBusy(true)
    try {
      await setPostMedia(clientId, postId, next)
      if (onChange) onChange(next)
      else router.refresh() // re-render the live preview
    } catch (e) {
      setMedia(prev)
      toast.error("Couldn't update media", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setBusy(false)
    }
  }

  function toggle(src: string) {
    if (media.includes(src)) save(media.filter((m) => m !== src))
    else save([...media, src])
  }

  function addUrl() {
    const v = url.trim()
    if (!v) return
    if (media.includes(v)) {
      toast.info("Already added")
      return
    }
    save([...media, v])
    setUrl("")
  }

  function addReel() {
    const v = reelUrl.trim()
    if (!isVideoUrl(v)) {
      toast.error("Use a video URL ending in .mp4, .mov or .webm")
      return
    }
    if (media.includes(v)) {
      toast.info("Already added")
      return
    }
    save([...media, v])
    setReelUrl("")
    setReelOpen(false)
  }

  async function makePoster(src: string) {
    setPosterBusy(src)
    try {
      const { url: poster } = await generatePoster(clientId, postId, src)
      await save([...media, poster])
      toast.success("Poster added")
    } catch (e) {
      toast.error("Poster failed", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setPosterBusy(null)
    }
  }

  async function onUpload(file: File) {
    const isVideo = file.type.startsWith("video/")
    if (!ACCEPT.includes(file.type)) return toast.error("Use an image (PNG/JPG/WEBP/GIF) or video (MP4/MOV/WEBM)")
    if (!isVideo && file.size > 8 * 1024 * 1024) return toast.error("Image must be under 8 MB")
    if (isVideo && file.size > 50 * 1024 * 1024) return toast.error("Video must be under 50 MB (or paste a hosted URL)")
    setBusy(true)
    try {
      const { url: uploaded } = await uploadFileDirect(clientId, "post-media", file)
      await save([...media, uploaded])
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const attachedSet = new Set(media)

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Media <span className="text-muted-foreground">({media.length})</span>
        </p>
        {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Current media */}
      {media.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {media.map((src, i) => (
            <div key={src} className="group relative">
              {isVideoUrl(src) ? (
                <video src={src} muted playsInline className="size-20 rounded-lg object-cover ring-1 ring-border" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="size-20 rounded-lg object-cover ring-1 ring-border" />
              )}
              {i === 0 && (
                <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-black/70 px-1 text-[9px] font-medium text-white">
                  {isVideoUrl(src) && <Film className="size-2.5" />}
                  {isVideoUrl(src) ? "Reel" : "Cover"}
                </span>
              )}
              {posterBusy === src && (
                <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                  <Loader2 className="size-4 animate-spin" />
                </span>
              )}
              {!isVideoUrl(src) && (
                <button
                  type="button"
                  disabled={posterBusy !== null || busy}
                  onClick={() => makePoster(src)}
                  className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
                  title="Make a poster from this image (auto-toon)"
                >
                  <Sparkles className="size-2.5" /> Poster
                </button>
              )}
              <button
                type="button"
                onClick={() => save(media.filter((m) => m !== src))}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                title="Remove"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No media yet. Add from the page, a URL, or upload.</p>
      )}

      {/* From scraped images */}
      {assetImages.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">From this page</p>
          <div className="flex flex-wrap gap-2">
            {assetImages.map((img) => {
              const on = attachedSet.has(img.src)
              return (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => toggle(img.src)}
                  disabled={busy}
                  className={cn(
                    "relative size-16 overflow-hidden rounded-lg ring-2 transition-all",
                    on ? "ring-primary" : "ring-transparent hover:ring-border",
                  )}
                  title={on ? "Remove" : "Add"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt={img.alt ?? ""} className="size-full object-cover" />
                  {on && (
                    <span className="absolute inset-0 flex items-center justify-center bg-primary/30">
                      <Check className="size-5 text-white drop-shadow" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* URL + upload */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
              placeholder="Paste image or video URL"
              className="pl-8"
              disabled={busy}
            />
          </div>
          <Button type="button" variant="outline" onClick={addUrl} disabled={busy || !url.trim()}>
            <Plus /> Add
          </Button>
        </div>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload /> Upload
        </Button>
      </div>

      {/* Make it a reel */}
      {!media.some(isVideoUrl) &&
        (reelOpen ? (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Film className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={reelUrl}
                onChange={(e) => setReelUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReel())}
                placeholder="Paste a video URL (.mp4 / .mov / .webm)"
                className="pl-8"
                disabled={busy}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={addReel} disabled={busy || !reelUrl.trim()}>
                Add reel
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
                <Upload /> Upload video
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setReelOpen(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setReelOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:underline"
          >
            <Film className="size-3.5" /> Make it a reel
          </button>
        ))}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onUpload(f)
        }}
      />
    </div>
  )
}
