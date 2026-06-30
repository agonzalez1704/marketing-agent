"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PlatformIcon } from "@/components/ui/platform-icon"
import { PLATFORMS } from "@/lib/platforms"
import type { Platform } from "@/lib/types"
import { generateFromAsset } from "@/app/actions/generate"

export function GenerateDialog({
  clientId,
  assetId,
  connectedPlatforms,
}: {
  clientId: string
  assetId: string
  connectedPlatforms: Platform[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  // platform -> count (0 = off). Default: connected platforms on at 4/each.
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(PLATFORMS.map((p) => [p.key, connectedPlatforms.includes(p.key) ? 4 : 0])),
  )

  const total = Object.values(counts).reduce((n, c) => n + c, 0)

  function set(platform: Platform, count: number) {
    setCounts((c) => ({ ...c, [platform]: Math.max(0, Math.min(30, count)) }))
  }

  async function run() {
    const targets = PLATFORMS.filter((p) => counts[p.key] > 0).map((p) => ({
      platform: p.key,
      count: counts[p.key],
    }))
    if (targets.length === 0) {
      toast.error("Pick at least one platform")
      return
    }
    setRunning(true)
    try {
      const { created } = await generateFromAsset(clientId, assetId, targets)
      toast.success(`Generated ${created} draft${created === 1 ? "" : "s"}`)
      setOpen(false)
      router.push(`/clients/${clientId}/posts`)
    } catch (e) {
      toast.error("Generation failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sparkles /> Generate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate posts</DialogTitle>
          <DialogDescription>
            Pick platforms and how many posts per platform. Drafts land in Posts, ready to schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {PLATFORMS.map((p) => {
            const on = counts[p.key] > 0
            const connected = connectedPlatforms.includes(p.key)
            return (
              <div
                key={p.key}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-2.5",
                  on ? "border-primary/40 bg-primary/5" : "border-border",
                )}
              >
                <button
                  type="button"
                  onClick={() => set(p.key, on ? 0 : 4)}
                  className="flex flex-1 items-center gap-2.5 text-left"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-muted/60">
                    <PlatformIcon platform={p.key} width={16} height={16} />
                  </span>
                  <span className="text-sm font-medium">{p.label}</span>
                  {connected && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600">
                      <Check className="size-3" /> connected
                    </span>
                  )}
                </button>
                {on && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => set(p.key, counts[p.key] - 1)}>
                      −
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">{counts[p.key]}</span>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => set(p.key, counts[p.key] + 1)}>
                      +
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} post{total === 1 ? "" : "s"} total</p>
          <Button onClick={run} disabled={running || total === 0}>
            {running ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Generate {total > 0 ? total : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
