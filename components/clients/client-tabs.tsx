import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export type ClientTab = "overview" | "connections" | "content" | "calendar" | "posts" | "inbox"

const TABS: { key: ClientTab; label: string; seg: string }[] = [
  { key: "overview", label: "Overview", seg: "" },
  { key: "connections", label: "Connections", seg: "connections" },
  { key: "content", label: "Content", seg: "content" },
  { key: "calendar", label: "Calendar", seg: "calendar" },
  { key: "posts", label: "Posts", seg: "posts" },
  { key: "inbox", label: "Inbox", seg: "inbox" },
]

export function ClientTabs({
  clientId,
  clientName,
  active,
}: {
  clientId: string
  clientName: string
  active: ClientTab
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Clients
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="truncate text-sm font-medium">{clientName}</span>
      </div>

      <nav className="mt-3 flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const href = t.seg ? `/clients/${clientId}/${t.seg}` : `/clients/${clientId}`
          const on = t.key === active
          return (
            <Link
              key={t.key}
              href={href}
              className={cn(
                "relative -mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                on
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
