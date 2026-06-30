"use client"

import { useEffect, useMemo, useState } from "react"
import { formatDistanceToNowStrict, parseISO } from "date-fns"
import {
  Search,
  Send,
  Loader2,
  ExternalLink,
  MessageCircle,
  AtSign,
  Inbox as InboxIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { PlatformIcon } from "@/components/ui/platform-icon"
import { ClientAvatar } from "@/components/clients/client-avatar"
import { cn } from "@/lib/utils"
import { knownPlatform, type InboxGroup, type InboxItem } from "@/lib/inbox-types"
import { replyToInboxItem } from "@/app/actions/inbox"

type Tab = "all" | "dm" | "comment"

export function InboxPane({
  groups,
  showClientHeaders = false,
}: {
  groups: InboxGroup[]
  showClientHeaders?: boolean
}) {
  const [tab, setTab] = useState<Tab>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<{ item: InboxItem; clientId: string; clientName: string } | null>(null)
  const [sent, setSent] = useState<Record<string, string[]>>({})

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (it) =>
              (tab === "all" || it.kind === tab) &&
              (!q || it.author.toLowerCase().includes(q) || it.preview.toLowerCase().includes(q)),
          ),
        }))
        .filter((g) => g.items.length > 0),
    [groups, tab, q],
  )

  // Flatten (preserving group order) so we can paginate across groups.
  const flat = useMemo(() => filtered.flatMap((g) => g.items.map((it) => ({ g, it }))), [filtered])
  const total = flat.length

  const PAGE = 20
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [tab, q])

  const pageCount = Math.max(1, Math.ceil(total / PAGE))
  const cur = Math.min(page, pageCount - 1)
  const start = cur * PAGE
  const slice = flat.slice(start, start + PAGE)

  // Re-group the visible slice so client separators still render per page.
  const pageGroups = useMemo(() => {
    const out: InboxGroup[] = []
    for (const { g, it } of slice) {
      const last = out[out.length - 1]
      if (last && last.clientId === g.clientId) last.items.push(it)
      else out.push({ clientId: g.clientId, clientName: g.clientName, clientLogo: g.clientLogo, items: [it] })
    }
    return out
  }, [slice])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(
            [
              ["all", "All"],
              ["dm", "Messages"],
              ["comment", "Comments"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inbox"
            className="pl-8"
          />
        </div>
      </div>

      {/* List */}
      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <InboxIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Nothing here</p>
          <p className="text-xs text-muted-foreground">
            New messages and comments from connected accounts show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {pageGroups.map((g) => (
              <div key={g.clientId}>
                {showClientHeaders && (
                  <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                    <ClientAvatar name={g.clientName} logoUrl={g.clientLogo} size="sm" className="size-6 rounded-md" />
                    <span className="text-xs font-semibold">{g.clientName}</span>
                    <span className="rounded-full bg-background px-1.5 text-[10px] tabular-nums text-muted-foreground ring-1 ring-border">
                      {g.items.length}
                    </span>
                  </div>
                )}
                {g.items.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    onClick={() => setActive({ item: it, clientId: g.clientId, clientName: g.clientName })}
                  />
                ))}
              </div>
            ))}
          </div>

          {total > PAGE && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="tabular-nums">
                {start + 1}–{Math.min(start + PAGE, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
                  <ChevronLeft /> Prev
                </Button>
                <span className="px-1 tabular-nums">
                  {cur + 1} / {pageCount}
                </span>
                <Button variant="outline" size="sm" disabled={cur >= pageCount - 1} onClick={() => setPage(cur + 1)}>
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reply sheet */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent>
          {active && (
            <ReplyView
              item={active.item}
              clientId={active.clientId}
              clientName={active.clientName}
              sent={sent[active.item.id] ?? []}
              onSent={(msg) => setSent((s) => ({ ...s, [active.item.id]: [...(s[active.item.id] ?? []), msg] }))}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PlatformGlyph({ platform, className }: { platform: string; className?: string }) {
  const known = knownPlatform(platform)
  if (known) return <PlatformIcon platform={known} width={14} height={14} className={className} />
  return <AtSign className={cn("size-3.5 text-muted-foreground", className)} />
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
  )
}

function ItemRow({ item, onClick }: { item: InboxItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40"
    >
      <div className="relative">
        <Avatar src={item.avatar} name={item.author} />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-card ring-1 ring-border">
          <PlatformGlyph platform={item.platform} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.author}</span>
          <span className="shrink-0 rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground ring-1 ring-border">
            {item.kind === "dm" ? "DM" : "Comment"}
          </span>
          {item.unread && <span className="size-2 shrink-0 rounded-full bg-blue-500" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">{item.preview || "—"}</p>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {item.timestamp ? formatDistanceToNowStrict(parseISO(item.timestamp), { addSuffix: true }) : ""}
      </span>
    </button>
  )
}

function ReplyView({
  item,
  clientId,
  clientName,
  sent,
  onSent,
}: {
  item: InboxItem
  clientId: string
  clientName: string
  sent: string[]
  onSent: (msg: string) => void
}) {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  async function send() {
    const message = draft.trim()
    if (!message || sending) return
    setSending(true)
    try {
      await replyToInboxItem({
        clientId,
        kind: item.kind,
        refId: item.refId,
        accountId: item.accountId,
        message,
      })
      onSent(message)
      setDraft("")
      toast.success("Reply sent")
    } catch (e) {
      toast.error("Couldn't send", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <PlatformGlyph platform={item.platform} />
          {item.author}
        </SheetTitle>
        <SheetDescription>
          {item.kind === "dm" ? "Direct message" : "Comment"} · {clientName}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {/* Original */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="whitespace-pre-wrap text-sm">{item.preview || "—"}</p>
          {item.permalink && (
            <a
              href={item.permalink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="size-3" /> Open original
            </a>
          )}
        </div>

        {/* Sent replies (this session) */}
        {sent.map((msg, i) => (
          <div key={i} className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
            {msg}
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && send()}
          placeholder={`Reply to ${item.author}…`}
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background p-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] tabular-nums text-muted-foreground">{draft.length}/2000</span>
          <Button size="sm" onClick={send} disabled={sending || !draft.trim()}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />} Send
          </Button>
        </div>
        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <MessageCircle className="size-2.5" /> ⌘/Ctrl + Enter to send
        </p>
      </div>
    </>
  )
}
