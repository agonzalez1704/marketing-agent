"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Upload, Link2, X, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlatformIcon } from "@/components/ui/platform-icon"
import { cn } from "@/lib/utils"
import { isVideoUrl } from "@/lib/media"
import { PLATFORMS } from "@/lib/platforms"
import type { Platform } from "@/lib/types"
import { createManualPosts } from "@/app/actions/posts"
import { uploadMedia } from "@/app/actions/post-media"

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,video/mp4,video/quicktime,video/webm"

export function NewPostDialog({
  clientId,
  connectedPlatforms,
}: {
  clientId: string
  connectedPlatforms: Platform[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<Platform>>(new Set(connectedPlatforms))
  const [caption, setCaption] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)

  function toggle(p: Platform) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(p)) n.delete(p)
      else n.add(p)
      return n
    })
  }

  async function onUpload(file: File) {
    setBusy(true)
    try {
      const { url } = await uploadMedia(clientId, toFormData(file))
      setMediaUrl(url)
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function addUrl() {
    const v = urlInput.trim()
    if (!/^https?:\/\//.test(v)) return toast.error("Enter a valid URL")
    setMediaUrl(v)
    setUrlInput("")
  }

  async function create() {
    const platforms = [...selected]
    if (platforms.length === 0) return toast.error("Pick at least one platform")
    setCreating(true)
    try {
      const { created } = await createManualPosts(clientId, {
        platforms,
        content: caption,
        mediaUrls: mediaUrl ? [mediaUrl] : [],
      })
      toast.success(`Created ${created} post${created === 1 ? "" : "s"}`)
      setOpen(false)
      setCaption("")
      setMediaUrl("")
      router.refresh()
    } catch (e) {
      toast.error("Couldn't create", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> New post
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
          <DialogDescription>
            Post media directly — no analysis. Videos publish as reels. Paste a URL for large files.
          </DialogDescription>
        </DialogHeader>

        {/* Platforms */}
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => {
            const on = selected.has(p.key)
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => toggle(p.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <PlatformIcon platform={p.key} width={13} height={13} />
                {p.label}
                {on && <Check className="size-3" />}
              </button>
            )
          })}
        </div>

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="Caption…"
          className="w-full resize-none rounded-md border border-input bg-background p-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {/* Media */}
        {mediaUrl ? (
          <div className="relative w-fit">
            {isVideoUrl(mediaUrl) ? (
              <video src={mediaUrl} muted playsInline className="h-28 rounded-lg ring-1 ring-border" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="" className="h-28 rounded-lg object-cover ring-1 ring-border" />
            )}
            <button
              type="button"
              onClick={() => setMediaUrl("")}
              className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-white shadow"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                placeholder="Paste image or video URL"
                className="pl-8"
                disabled={busy}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addUrl} disabled={busy || !urlInput.trim()}>
                Add
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Upload />} Upload
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={create} disabled={creating || busy || selected.size === 0}>
            {creating && <Loader2 className="animate-spin" />} Create post
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(f)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function toFormData(file: File): FormData {
  const fd = new FormData()
  fd.append("file", file)
  return fd
}
