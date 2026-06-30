"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { CalendarClock, ChevronLeft, ChevronRight, Loader2, Sparkles, Send, X, Clock, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PlatformIcon } from "@/components/ui/platform-icon"
import { cn } from "@/lib/utils"
import { PLATFORM_COLOR, PLATFORM_LABEL } from "@/lib/platforms"
import type { Post } from "@/lib/types"
import { savePostSchedules, scheduleAll, cancelScheduledPost } from "@/app/actions/schedule"

const DEFAULT_HOUR = 10
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TIME_PRESETS = ["08:00", "09:00", "12:00", "15:00", "18:00", "20:00"]

export function CalendarBoard({ clientId, posts: initial }: { clientId: string; posts: Post[] }) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>(initial)
  const [viewing, setViewing] = useState(() => startOfMonth(new Date()))
  const [dragId, setDragId] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | "autofill" | "schedule">(null)

  // Re-sync when the server sends fresh data (e.g. after Schedule all / cancel).
  // useState(initial) ignores later prop changes, so do it explicitly.
  useEffect(() => {
    setPosts(initial)
  }, [initial])

  const tray = posts.filter((p) => p.status === "DRAFT" && !p.scheduledFor)
  const scheduledCount = posts.filter((p) => p.status === "SCHEDULED").length
  const plannedCount = posts.filter((p) => p.status === "DRAFT" && p.scheduledFor).length
  const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewing), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(viewing), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [viewing])

  function postsOn(day: Date): Post[] {
    return posts.filter((p) => p.scheduledFor && isSameDay(parseISO(p.scheduledFor), day))
  }

  function applyLocal(updates: Array<{ postId: string; scheduledFor: string | null }>) {
    setPosts((prev) =>
      prev.map((p) => {
        const u = updates.find((x) => x.postId === p.id)
        return u ? { ...p, scheduledFor: u.scheduledFor } : p
      }),
    )
  }

  async function persist(updates: Array<{ postId: string; scheduledFor: string | null }>) {
    applyLocal(updates)
    try {
      await savePostSchedules(clientId, updates)
    } catch (e) {
      toast.error("Couldn't save schedule", { description: e instanceof Error ? e.message : "" })
      router.refresh()
    }
  }

  function dropOnDay(day: Date) {
    if (!dragId) return
    const post = posts.find((p) => p.id === dragId)
    setDragId(null)
    if (!post || post.status !== "DRAFT") return
    const prev = post.scheduledFor ? parseISO(post.scheduledFor) : null
    const dt = setMinutes(setHours(day, prev?.getHours() ?? DEFAULT_HOUR), prev?.getMinutes() ?? 0)
    persist([{ postId: post.id, scheduledFor: dt.toISOString() }])
  }

  // Debounced time saves: update the UI instantly, coalesce the server writes.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<Map<string, string | null>>(new Map())

  function flushSaves() {
    const updates = [...pending.current.entries()].map(([postId, scheduledFor]) => ({ postId, scheduledFor }))
    pending.current.clear()
    if (updates.length === 0) return
    savePostSchedules(clientId, updates).catch((e) => {
      toast.error("Couldn't save schedule", { description: e instanceof Error ? e.message : "" })
      router.refresh()
    })
  }

  function setChipTime(post: Post, hhmm: string) {
    if (!post.scheduledFor || !/^\d{2}:\d{2}$/.test(hhmm)) return
    const [h, m] = hhmm.split(":").map(Number)
    const iso = setMinutes(setHours(parseISO(post.scheduledFor), h), m).toISOString()
    applyLocal([{ postId: post.id, scheduledFor: iso }]) // instant
    pending.current.set(post.id, iso)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flushSaves, 500) // coalesced write
  }

  // Flush any pending save when leaving the page.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        flushSaves()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dropOnTray() {
    if (!dragId) return
    const post = posts.find((p) => p.id === dragId)
    setDragId(null)
    if (!post || post.status !== "DRAFT") return
    persist([{ postId: post.id, scheduledFor: null }])
  }

  function autoFill() {
    if (tray.length === 0) {
      toast.message("Nothing to auto-fill", { description: "All drafts are already placed." })
      return
    }
    setBusy("autofill")
    const start = addDays(new Date(), 1)
    const updates = tray.map((p, i) => ({
      postId: p.id,
      scheduledFor: setMinutes(setHours(addDays(start, i), DEFAULT_HOUR), 0).toISOString(),
    }))
    persist(updates).finally(() => setBusy(null))
    setViewing(startOfMonth(start))
    toast.success(`Placed ${updates.length} post${updates.length === 1 ? "" : "s"}`)
  }

  async function pushAll() {
    if (plannedCount === 0) {
      toast.message("Nothing to schedule", { description: "Place some drafts on days first." })
      return
    }
    setBusy("schedule")
    try {
      const r = await scheduleAll(clientId)
      if (r.scheduled > 0) toast.success(`Scheduled ${r.scheduled} post${r.scheduled === 1 ? "" : "s"} on LATE`)
      if (r.skipped.length) {
        const plats = [...new Set(r.skipped.map((s) => s.platform))].join(", ")
        toast.warning(`Skipped ${r.skipped.length} (not connected: ${plats})`)
      }
      if (r.failed.length) toast.error(`${r.failed.length} failed`, { description: r.failed[0]?.error })
      router.refresh()
    } catch (e) {
      toast.error("Schedule failed", { description: e instanceof Error ? e.message : "" })
    } finally {
      setBusy(null)
    }
  }

  function onCancel(post: Post) {
    cancelScheduledPost(clientId, post.id, post.latePostId)
      .then(() => {
        applyLocal([]) // no schedule change; just refresh status
        toast.success("Cancelled")
        router.refresh()
      })
      .catch((e) => toast.error("Couldn't cancel", { description: e instanceof Error ? e.message : "" }))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setViewing(addMonths(viewing, -1))}>
            <ChevronLeft />
          </Button>
          <span className="min-w-40 text-center text-sm font-medium">{format(viewing, "MMMM yyyy")}</span>
          <Button variant="ghost" size="icon" onClick={() => setViewing(addMonths(viewing, 1))}>
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setViewing(startOfMonth(new Date()))}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={autoFill} disabled={busy !== null}>
            {busy === "autofill" ? <Loader2 className="animate-spin" /> : <Sparkles />} Auto-fill
          </Button>
          <Button size="sm" onClick={pushAll} disabled={busy !== null}>
            {busy === "schedule" ? <Loader2 className="animate-spin" /> : <Send />} Schedule all
          </Button>
        </div>
      </div>

      {/* Unscheduled tray — recessed holding area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={dropOnTray}
        className="rounded-xl border border-dashed border-border bg-muted/40 p-3"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-semibold">Unscheduled</span>
          <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground ring-1 ring-border">
            {tray.length}
          </span>
          <span className="text-[11px] text-muted-foreground">drag onto a day</span>
        </div>
        {tray.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">All drafts placed.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tray.map((p) => (
              <Chip key={p.id} post={p} onDragStart={() => setDragId(p.id)} draggable />
            ))}
          </div>
        )}
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <Legend className="bg-zinc-400" label="unscheduled" count={tray.length} />
        <Legend className="bg-blue-500" label="planned" count={plannedCount} />
        <Legend className="bg-green-500" label="scheduled" count={scheduledCount} />
        <Legend className="bg-emerald-600" label="published" count={publishedCount} />
      </div>

      {/* Month grid — primary elevated surface */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm shadow-primary/5">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="border-b border-border bg-muted/50 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {days.map((day) => {
            const inMonth = isSameMonth(day, viewing)
            const today = isSameDay(day, new Date())
            return (
              <div
                key={day.toISOString()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropOnDay(day)}
                className={cn(
                  "min-h-24 border-b border-r border-border p-1.5 align-top transition-colors",
                  !inMonth && "bg-muted/30",
                  today && "bg-primary/5",
                )}
              >
                <div className="mb-1 flex">
                  {today ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {format(day, "d")}
                    </span>
                  ) : (
                    <span className={cn("px-0.5 text-xs", inMonth ? "text-muted-foreground" : "text-muted-foreground/50")}>
                      {format(day, "d")}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                {postsOn(day).map((p) =>
                  p.status === "DRAFT" ? (
                    <PlannedChip
                      key={p.id}
                      post={p}
                      onDragStart={() => setDragId(p.id)}
                      onSetTime={(t) => setChipTime(p, t)}
                      onUnschedule={() => persist([{ postId: p.id, scheduledFor: null }])}
                    />
                  ) : (
                    <Chip
                      key={p.id}
                      post={p}
                      onCancel={p.status === "SCHEDULED" ? () => onCancel(p) : undefined}
                      compact
                    />
                  ),
                )}
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}

function PlatformBadge({ platform }: { platform: Post["platform"] }) {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/5">
      <PlatformIcon platform={platform} width={11} height={11} />
    </span>
  )
}

function Legend({ className, label, count }: { className: string; label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("size-2 rounded-full", className)} />
      <span className="tabular-nums text-foreground">{count}</span> {label}
    </span>
  )
}

function PlannedChip({
  post,
  onDragStart,
  onSetTime,
  onUnschedule,
}: {
  post: Post
  onDragStart: () => void
  onSetTime: (hhmm: string) => void
  onUnschedule: () => void
}) {
  const day = post.scheduledFor ? parseISO(post.scheduledFor) : new Date()
  const hhmm = format(day, "HH:mm")

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          draggable
          onDragStart={onDragStart}
          title={post.content}
          className="group flex cursor-grab items-center gap-1 rounded px-1.5 py-1 text-[11px] text-white active:cursor-grabbing"
          style={{ backgroundColor: PLATFORM_COLOR[post.platform] }}
        >
          <PlatformBadge platform={post.platform} />
          <span className="shrink-0 tabular-nums opacity-80">{hhmm}</span>
          <span className="truncate">{post.content}</span>
          <Clock className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-90" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <PlatformIcon platform={post.platform} width={14} height={14} />
              {PLATFORM_LABEL[post.platform]}
            </span>
            <span className="text-xs text-muted-foreground">{format(day, "EEE, MMM d")}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="time"
              value={hhmm}
              onChange={(e) => onSetTime(e.target.value)}
              className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TIME_PRESETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onSetTime(t)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs tabular-nums transition-colors",
                  t === hhmm
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-2">
            <p className="line-clamp-1 max-w-36 text-[11px] text-muted-foreground">{post.content}</p>
            <button
              type="button"
              onClick={onUnschedule}
              className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              Unschedule
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Chip({
  post,
  draggable,
  onDragStart,
  onCancel,
  compact,
}: {
  post: Post
  draggable?: boolean
  onDragStart?: () => void
  onCancel?: () => void
  compact?: boolean
}) {
  const scheduled = post.status === "SCHEDULED"
  const publishing = post.status === "PUBLISHING"
  const published = post.status === "PUBLISHED"
  const failed = post.status === "FAILED"
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      title={post.content}
      className={cn(
        "group flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-white",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        scheduled && "ring-2 ring-inset ring-green-400/80",
        publishing && "ring-2 ring-inset ring-amber-400 animate-pulse",
        // Published: solid emerald check badge on the left + emerald ring (clearly "live").
        published && "ring-2 ring-inset ring-emerald-500",
        failed && "ring-2 ring-inset ring-red-400",
        compact ? "max-w-full" : "max-w-44",
      )}
      style={{ backgroundColor: PLATFORM_COLOR[post.platform] }}
    >
      {published ? (
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <CheckCircle2 className="size-3" />
        </span>
      ) : (
        <PlatformBadge platform={post.platform} />
      )}
      {post.scheduledFor && (
        <span className="shrink-0 tabular-nums opacity-80">{format(parseISO(post.scheduledFor), "HH:mm")}</span>
      )}
      <span className={cn("truncate", published && "opacity-90")}>
        {compact ? post.content : `${PLATFORM_LABEL[post.platform]} · ${post.content}`}
      </span>
      {scheduled && <CalendarClock className="size-3 shrink-0 opacity-80" />}
      {onCancel && (
        <button onClick={onCancel} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" title="Cancel">
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
