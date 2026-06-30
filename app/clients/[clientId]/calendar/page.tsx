import { notFound } from "next/navigation"
import { dbGetClient, dbListPosts } from "@/lib/db"
import { runStatusSync } from "@/lib/status"
import { CalendarBoard } from "@/components/calendar/calendar-board"
import { ClientTabs } from "@/components/clients/client-tabs"
import { SyncStatusButton } from "@/components/posts/sync-status-button"

export const dynamic = "force-dynamic"

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const client = await dbGetClient(clientId)
  if (!client) notFound()
  await runStatusSync(clientId) // refresh live statuses before rendering
  const posts = await dbListPosts(clientId)

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <ClientTabs clientId={client.id} clientName={client.name} active="calendar" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto-fill spreads drafts across the month. Drag to adjust, then Schedule all to publish via LATE.
          </p>
        </div>
        <SyncStatusButton clientId={client.id} />
      </div>

      <div className="mt-8">
        <CalendarBoard clientId={client.id} posts={posts} />
      </div>
    </main>
  )
}
