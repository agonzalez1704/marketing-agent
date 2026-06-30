import { getAllInbox } from "@/app/actions/inbox"
import { InboxPane } from "@/components/inbox/inbox-pane"

export const dynamic = "force-dynamic"

export default async function GlobalInboxPage() {
  const groups = await getAllInbox()
  const total = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {total} message{total === 1 ? "" : "s"} across all clients — grouped by client.
      </p>
      <div className="mt-8">
        <InboxPane groups={groups} showClientHeaders />
      </div>
    </main>
  )
}
