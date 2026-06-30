"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Undo2, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusChip, type PostStatusValue } from "@/components/ui/status-chip"
import { PlatformIcon } from "@/components/ui/platform-icon"
import { DeletePostButton } from "@/components/posts/delete-post-button"
import { DuplicatePostButton } from "@/components/posts/duplicate-post-button"
import { PostMediaManager } from "@/components/posts/post-media-manager"
import { FeedPreview } from "@/components/posts/feed-preview/feed-preview"
import { cn } from "@/lib/utils"
import { PLATFORM_LABEL, PLATFORM_CHAR_LIMIT } from "@/lib/platforms"
import type { Platform } from "@/lib/types"
import { updatePostContent, refinePostContent } from "@/app/actions/posts"

interface PostLite {
  id: string
  platform: Platform
  status: string
  content: string
  mediaUrls: string[]
}

const AI_PRESETS: { label: string; instruction: string }[] = [
  { label: "Shorter", instruction: "Make it shorter and punchier without losing the core message." },
  { label: "Longer", instruction: "Expand it with a bit more detail and value." },
  { label: "Professional", instruction: "Make the tone more professional." },
  { label: "Casual", instruction: "Make the tone more casual and friendly." },
]

export function PostDetailClient({
  clientId,
  post,
  clientName,
  clientLogo,
  assetImages,
}: {
  clientId: string
  post: PostLite
  clientName: string
  clientLogo: string | null
  assetImages: { src: string; alt?: string }[]
}) {
  const router = useRouter()
  const [content, setContent] = useState(post.content)
  const [saved, setSaved] = useState(post.content)
  const [media, setMedia] = useState(post.mediaUrls)
  const [saving, setSaving] = useState(false)
  const [aiBusy, setAiBusy] = useState<string | null>(null)
  const [prev, setPrev] = useState<string | null>(null)

  const limit = PLATFORM_CHAR_LIMIT[post.platform]
  const over = content.length > limit
  const dirty = content !== saved
  const editable = post.status === "DRAFT" || post.status === "FAILED"

  async function save() {
    if (over || !content.trim()) return
    setSaving(true)
    try {
      await updatePostContent(clientId, post.id, content)
      setSaved(content)
      setPrev(null)
      toast.success("Saved")
      router.refresh()
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setSaving(false)
    }
  }

  async function applyAi(label: string, instruction: string) {
    setAiBusy(label)
    try {
      const { content: refined } = await refinePostContent(post.platform, content, instruction)
      setPrev(content)
      setContent(refined)
      toast.success("Rewritten — review & save")
    } catch (e) {
      toast.error("AI rewrite failed", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setAiBusy(null)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left: edit */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            <PlatformIcon platform={post.platform} width={16} height={16} />
            {PLATFORM_LABEL[post.platform]}
          </span>
          <StatusChip status={post.status as PostStatusValue} />
          <div className="ml-auto flex items-center gap-1">
            <DuplicatePostButton clientId={clientId} postId={post.id} navigate withLabel variant="outline" />
            <DeletePostButton clientId={clientId} postId={post.id} redirectToList />
          </div>
        </div>

        {/* Editor */}
        <div className="rounded-xl border border-border">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!editable}
            rows={8}
            className="w-full resize-y rounded-t-xl bg-transparent p-3 text-sm leading-relaxed focus-visible:outline-none disabled:opacity-70"
          />
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
            <span className={cn("text-xs tabular-nums", over ? "font-medium text-destructive" : "text-muted-foreground")}>
              {content.length} / {limit}
            </span>
            <div className="flex items-center gap-2">
              {prev !== null && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContent(prev)
                    setPrev(null)
                  }}
                >
                  <Undo2 /> Undo
                </Button>
              )}
              <Button size="sm" onClick={save} disabled={!editable || !dirty || over || saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Check />} Save
              </Button>
            </div>
          </div>
        </div>

        {/* AI refine */}
        {editable && (
          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" /> Rewrite with AI
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AI_PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  disabled={aiBusy !== null}
                  onClick={() => applyAi(p.label, p.instruction)}
                >
                  {aiBusy === p.label ? <Loader2 className="animate-spin" /> : null}
                  {p.label}
                </Button>
              ))}
              {over && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={aiBusy !== null}
                  onClick={() => applyAi("Fit", `Trim to under ${limit} characters without losing the key message.`)}
                >
                  {aiBusy === "Fit" ? <Loader2 className="animate-spin" /> : null}
                  Fit limit
                </Button>
              )}
            </div>
            <CustomInstruction disabled={aiBusy !== null} onApply={(instr) => applyAi("Custom", instr)} />
          </div>
        )}

        <PostMediaManager
          clientId={clientId}
          postId={post.id}
          initialMedia={media}
          assetImages={assetImages}
          onChange={setMedia}
        />
      </div>

      {/* Right: live preview */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          Preview — how it looks on {PLATFORM_LABEL[post.platform]}
        </p>
        <div className="flex justify-center rounded-2xl bg-muted/40 p-4 sm:p-6">
          <FeedPreview
            platform={post.platform}
            content={content}
            mediaUrls={media}
            brandName={clientName}
            brandLogo={clientLogo}
          />
        </div>
      </div>
    </div>
  )
}

function CustomInstruction({ disabled, onApply }: { disabled: boolean; onApply: (instr: string) => void }) {
  const [v, setV] = useState("")
  return (
    <div className="flex gap-2">
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) {
            onApply(v.trim())
            setV("")
          }
        }}
        placeholder="Tell the AI… (e.g. add a CTA)"
        disabled={disabled}
        className="h-8 text-xs"
      />
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled || !v.trim()}
        onClick={() => {
          onApply(v.trim())
          setV("")
        }}
      >
        Apply
      </Button>
    </div>
  )
}
