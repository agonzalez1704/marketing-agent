import { notFound } from "next/navigation"
import { dbGetClient } from "@/lib/db"
import { getClientInbox } from "@/app/actions/inbox"
import { ClientTabs } from "@/components/clients/client-tabs"
import { InboxPane } from "@/components/inbox/inbox-pane"

export const dynamic = "force-dynamic"

export default async function ClientInboxPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const client = await dbGetClient(clientId)
  if (!client) notFound()
  const group = await getClientInbox(clientId)

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <ClientTabs clientId={client.id} clientName={client.name} active="inbox" />
      <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All DMs and comments across {client.name}&apos;s connected accounts.
      </p>
      <div className="mt-8">
        <InboxPane groups={[group]} />
      </div>
    </main>
  )
}
