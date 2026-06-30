"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Link as LinkIcon, FileUp, PenLine, ImageUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressSteps, type Step } from "@/components/ui/progress-steps"
import { cn } from "@/lib/utils"
import { createAssetFromUrl, createAssetFromPdf, createAssetFromBrief } from "@/app/actions/assets"
import { createAssetFromImage, createAssetFromVideo } from "@/app/actions/media-content"
import { extractVideoFrame } from "@/lib/video-frame"

type Mode = "url" | "pdf" | "brief" | "media"
type ScrapeMode = "url" | "pdf"

const STEP_LABELS: Record<ScrapeMode, [string, string, string]> = {
  url: ["Fetching page", "Extracting content", "Saved"],
  pdf: ["Reading PDF", "Extracting text", "Saved"],
}

export function ScrapePanel({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("url")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [briefName, setBriefName] = useState("")
  const [briefText, setBriefText] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<HTMLInputElement>(null)

  function dropHandlers(onFile: (f: File) => void) {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        if (!running) setDragOver(true)
      },
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f && !running) onFile(f)
      },
    }
  }

  function buildSteps(m: ScrapeMode, activeIdx: number, errored = false): Step[] {
    return STEP_LABELS[m].map((label, i) => ({
      key: label,
      label,
      state: i < activeIdx ? "done" : i === activeIdx ? (errored ? "error" : "active") : "pending",
    }))
  }

  async function run() {
    const m = mode as ScrapeMode
    setRunning(true)
    setSteps(buildSteps(m, 0))
    const tick = setTimeout(() => setSteps(buildSteps(m, 1)), 600)
    try {
      const asset = m === "url" ? await createAssetFromUrl(clientId, url) : await createAssetFromPdf(clientId, toFormData(file!))
      clearTimeout(tick)
      setSteps(buildSteps(m, 3))
      toast.success("Asset created", { description: asset.name })
      setUrl("")
      setFile(null)
      if (fileRef.current) fileRef.current.value = ""
      router.refresh()
      setTimeout(() => setSteps(null), 1200)
    } catch (e) {
      clearTimeout(tick)
      setSteps(buildSteps(m, 1, true))
      toast.error("Couldn't create asset", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setRunning(false)
    }
  }

  async function runMedia() {
    if (!mediaFile) return
    setRunning(true)
    const isVideo = mediaFile.type.startsWith("video/")
    setSteps([
      { key: "read", label: isVideo ? "Reading video" : "Uploading image", state: "active" },
      { key: "analyze", label: "Analyzing with AI", state: "pending" },
      { key: "saved", label: "Saved", state: "pending" },
    ])
    try {
      const fd = new FormData()
      if (isVideo) {
        const frame = await extractVideoFrame(mediaFile)
        fd.append("file", frame)
        fd.append("videoName", mediaFile.name)
        if (mediaFile.size <= 50 * 1024 * 1024) fd.append("video", mediaFile) // keep the video for reels
      } else {
        fd.append("file", mediaFile)
      }
      setSteps((s) => s && [{ ...s[0], state: "done" }, { ...s[1], state: "active" }, s[2]])
      const asset = isVideo
        ? await createAssetFromVideo(clientId, fd)
        : await createAssetFromImage(clientId, fd)
      setSteps((s) => s && s.map((x) => ({ ...x, state: "done" })))
      toast.success("Analyzed", { description: asset.name })
      setMediaFile(null)
      if (mediaRef.current) mediaRef.current.value = ""
      router.refresh()
      setTimeout(() => setSteps(null), 1200)
    } catch (e) {
      setSteps((s) => s && s.map((x) => (x.state === "active" ? { ...x, state: "error" } : x)))
      toast.error("Couldn't analyze", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setRunning(false)
    }
  }

  async function createBrief() {
    setRunning(true)
    try {
      const asset = await createAssetFromBrief(clientId, briefName, briefText)
      toast.success("Brief saved", { description: asset.name })
      setBriefName("")
      setBriefText("")
      router.refresh()
    } catch (e) {
      toast.error("Couldn't save brief", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setRunning(false)
    }
  }

  const canSubmit =
    mode === "url"
      ? url.trim().length > 0
      : mode === "pdf"
        ? !!file
        : mode === "media"
          ? !!mediaFile
          : briefName.trim().length > 0 && briefText.trim().length >= 20

  const onSubmit = mode === "brief" ? createBrief : mode === "media" ? runMedia : run
  const submitLabel =
    mode === "url" ? "Scrape" : mode === "pdf" ? "Parse" : mode === "media" ? "Analyze" : "Save brief"

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          <ModeButton active={mode === "url"} onClick={() => setMode("url")} icon={<LinkIcon />}>
            URL
          </ModeButton>
          <ModeButton active={mode === "pdf"} onClick={() => setMode("pdf")} icon={<FileUp />}>
            PDF
          </ModeButton>
          <ModeButton active={mode === "brief"} onClick={() => setMode("brief")} icon={<PenLine />}>
            From scratch
          </ModeButton>
          <ModeButton active={mode === "media"} onClick={() => setMode("media")} icon={<ImageUp />}>
            Image / Video
          </ModeButton>
        </div>

        {mode === "url" && (
          <Input
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={running}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && !running && run()}
          />
        )}

        {mode === "pdf" && (
          <label
            {...dropHandlers((f) => {
              if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) setFile(f)
              else toast.error("Drop a PDF file")
            })}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm text-muted-foreground transition-colors hover:bg-muted/40",
              dragOver ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border",
              running && "pointer-events-none opacity-60",
            )}
          >
            <FileUp className="size-5" />
            {file ? <span className="font-medium text-foreground">{file.name}</span> : "Drop or choose a PDF"}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        {mode === "media" && (
          <div className="space-y-2">
            <label
              {...dropHandlers((f) => {
                if (f.type.startsWith("image/") || f.type.startsWith("video/")) setMediaFile(f)
                else toast.error("Drop an image or video")
              })}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm text-muted-foreground transition-colors hover:bg-muted/40",
                dragOver ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border",
                running && "pointer-events-none opacity-60",
              )}
            >
              <ImageUp className="size-5" />
              {mediaFile ? (
                <span className="font-medium text-foreground">{mediaFile.name}</span>
              ) : (
                "Drop or choose an image or video"
              )}
              <input
                ref={mediaRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              We analyze the image (or a frame from the video) and write posts about it.
            </p>
          </div>
        )}

        {mode === "brief" && (
          <div className="space-y-3">
            <Input
              placeholder="Name (e.g. Joe's Auto Repair)"
              value={briefName}
              onChange={(e) => setBriefName(e.target.value)}
              disabled={running}
            />
            <textarea
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              disabled={running}
              rows={6}
              placeholder="Describe the business: what you do, key services, location, what makes you different, tone of voice, any offers to highlight…"
              className="w-full resize-y rounded-md border border-input bg-background p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
            />
            <p className="text-xs text-muted-foreground">
              No website or PDF needed — this becomes the source the AI writes posts from.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button onClick={onSubmit} disabled={!canSubmit || running}>
            {running && (mode === "brief" || mode === "media") && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>

        {steps && (
          <div className="rounded-lg bg-muted/40 p-4">
            <ProgressSteps steps={steps} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function toFormData(file: File): FormData {
  const fd = new FormData()
  fd.append("file", file)
  return fd
}

function ModeButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors [&_svg]:size-4",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  )
}
