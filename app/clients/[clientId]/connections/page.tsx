import { notFound } from "next/navigation"
import { Suspense } from "react"
import { dbGetClient, dbListAccounts } from "@/lib/db"
import { ConnectionsGrid } from "@/components/connections/connections-grid"
import { ClientTabs } from "@/components/clients/client-tabs"

export const dynamic = "force-dynamic"

export default async function ConnectionsPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const [client, accounts] = await Promise.all([
    dbGetClient(clientId),
    dbListAccounts(clientId),
  ])
  if (!client) notFound()

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <ClientTabs clientId={client.id} clientName={client.name} active="connections" />
      <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect this client&apos;s social accounts. Each authorizes through LATE.
      </p>

      <div className="mt-8">
        <Suspense>
          <ConnectionsGrid clientId={client.id} accounts={accounts} />
        </Suspense>
      </div>
    </main>
  )
}
