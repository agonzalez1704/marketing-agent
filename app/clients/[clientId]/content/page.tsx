import { notFound } from "next/navigation"
import { dbGetClient, dbListAssets, dbListAccounts } from "@/lib/db"
import { ScrapePanel } from "@/components/content/scrape-panel"
import { AssetList } from "@/components/content/asset-list"
import { ClientTabs } from "@/components/clients/client-tabs"

export const dynamic = "force-dynamic"

export default async function ContentPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const [client, assets, accounts] = await Promise.all([
    dbGetClient(clientId),
    dbListAssets(clientId),
    dbListAccounts(clientId),
  ])
  if (!client) notFound()
  const connectedPlatforms = [...new Set(accounts.map((a) => a.platform))]

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <ClientTabs clientId={client.id} clientName={client.name} active="content" />
      <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Scrape a web page or upload a PDF. We extract the text and images to use as source material.
      </p>

      <div className="mt-8 space-y-6">
        <ScrapePanel clientId={client.id} />
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Assets</h2>
          <AssetList clientId={client.id} assets={assets} connectedPlatforms={connectedPlatforms} />
        </div>
      </div>
    </main>
  )
}
