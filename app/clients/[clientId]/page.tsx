import Link from "next/link"
import { notFound } from "next/navigation"
import { Link2, FileText, CalendarClock, ListChecks, Inbox } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteClientButton } from "@/components/clients/delete-client-button"
import { EditClientDialog } from "@/components/clients/edit-client-dialog"
import { ClientTabs } from "@/components/clients/client-tabs"
import { ClientAvatar } from "@/components/clients/client-avatar"
import { IdentityCard } from "@/components/clients/identity-card"
import { dbGetClientWithCounts, dbListAccounts } from "@/lib/db"

export const dynamic = "force-dynamic"

// Per-client overview. Sub-sections (Content/Calendar/Posts) land in P4–P7.
export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const [client, accounts] = await Promise.all([
    dbGetClientWithCounts(clientId),
    dbListAccounts(clientId),
  ])
  if (!client) notFound()

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <ClientTabs clientId={client.id} clientName={client.name} active="overview" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClientAvatar name={client.name} logoUrl={client.logoUrl} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              {client.assetsCount} assets · {client.postsCount} posts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditClientDialog
            client={{
              id: client.id,
              name: client.name,
              logoUrl: client.logoUrl,
              defaultGoal: client.defaultGoal,
              defaultAudience: client.defaultAudience,
            }}
          />
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Section nav */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <SectionCard
          href={`/clients/${client.id}/connections`}
          icon={<Link2 />}
          title="Connections"
          desc={`${accounts.length} account${accounts.length === 1 ? "" : "s"} connected`}
        />
        <SectionCard
          href={`/clients/${client.id}/content`}
          icon={<FileText />}
          title="Content"
          desc={`${client.assetsCount} asset${client.assetsCount === 1 ? "" : "s"} · scrape URL or PDF`}
        />
        <SectionCard
          href={`/clients/${client.id}/calendar`}
          icon={<CalendarClock />}
          title="Calendar"
          desc="Plan & schedule the month"
        />
        <SectionCard
          href={`/clients/${client.id}/posts`}
          icon={<ListChecks />}
          title="Posts"
          desc={`${client.postsCount} post${client.postsCount === 1 ? "" : "s"}`}
        />
        <SectionCard
          href={`/clients/${client.id}/inbox`}
          icon={<Inbox />}
          title="Inbox"
          desc="Reply to DMs & comments"
        />
      </div>

      <div className="mt-6">
        <IdentityCard clientId={client.id} identity={client.identity} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Defaults</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <KV k="Goal" v={client.defaultGoal} />
          <KV k="Audience" v={client.defaultAudience} />
          <KV k="LATE profile" v={client.lateProfileId} mono />
        </CardContent>
      </Card>
    </main>
  )
}

function SectionCard({
  icon,
  title,
  desc,
  phase,
  href,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  phase?: string
  href?: string
}) {
  const inner = (
    <Card className={href ? "transition-colors hover:border-primary/40" : "opacity-90"}>
      <CardContent className="flex items-center gap-3 p-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{desc}</p>
        </div>
        {phase && (
          <span className="rounded-md border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            {phase}
          </span>
        )}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function KV({ k, v, mono }: { k: string; v: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className={mono ? "font-mono text-xs" : ""}>{v || <span className="text-muted-foreground">—</span>}</p>
    </div>
  )
}
