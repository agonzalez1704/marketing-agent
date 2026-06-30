import Link from "next/link"
import { Sparkles, Inbox } from "lucide-react"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </span>
          Marketing Agent
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Inbox className="size-4" /> Inbox
          </Link>
        </nav>
      </div>
    </header>
  )
}
