"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ImagePlus, RefreshCw, Trash2, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { uploadClientLogo, removeClientLogo } from "@/app/actions/logo"

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"]
const MAX_BYTES = 2 * 1024 * 1024

export function LogoUpload({
  clientId,
  clientName,
  logoUrl,
}: {
  clientId: string
  clientName: string
  logoUrl: string | null
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [preview, setPreview] = useState<string | null>(logoUrl)

  const initials =
    clientName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"

  function validate(file: File): string | null {
    if (!ACCEPT.includes(file.type)) return "Use PNG, JPG, WEBP, GIF or SVG"
    if (file.size > MAX_BYTES) return "Logo must be under 2 MB"
    return null
  }

  async function handleFile(file: File) {
    const err = validate(file)
    if (err) {
      toast.error(err)
      return
    }
    // Optimistic preview from a local object URL.
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const { url } = await uploadClientLogo(clientId, fd)
      setPreview(url)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1600)
      router.refresh()
    } catch (e) {
      setPreview(logoUrl) // revert
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      URL.revokeObjectURL(localUrl)
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function onRemove() {
    setBusy(true)
    try {
      await removeClientLogo(clientId)
      setPreview(null)
      router.refresh()
    } catch (e) {
      toast.error("Couldn't remove", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!busy) setDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f && !busy) handleFile(f)
      }}
      className={cn(
        "group relative flex items-center gap-4 rounded-2xl border border-dashed p-3 transition-all duration-200",
        dragging ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border hover:border-border/80",
      )}
    >
      {/* Preview tile */}
      <button
        type="button"
        onClick={() => !busy && fileRef.current?.click()}
        className={cn(
          "relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-semibold transition-transform duration-200",
          "shadow-sm shadow-primary/10 ring-1 ring-border active:scale-95",
          preview ? "bg-muted" : "bg-primary/10 text-primary",
        )}
        aria-label="Upload logo"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`${clientName} logo`} className="size-full object-cover" />
        ) : (
          initials
        )}

        {/* Hover scrim with action hint (only when idle) */}
        {!busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <ImagePlus className="size-5" />
          </span>
        )}

        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-4 animate-spin" />
          </span>
        )}
        {justSaved && !busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-green-500/90 text-white">
            <Check className="size-5" />
          </span>
        )}
      </button>

      {/* Copy + actions */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{preview ? "Logo set" : "Add a logo"}</p>
        <p className="text-xs text-muted-foreground">
          Drag &amp; drop or click · PNG, JPG, WEBP, SVG · max 2 MB
        </p>
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {preview ? <RefreshCw className="size-3" /> : <ImagePlus className="size-3" />}
            {preview ? "Replace" : "Upload"}
          </button>
          {preview && (
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="size-3" /> Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
    </div>
  )
}
