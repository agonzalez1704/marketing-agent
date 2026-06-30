import Link from "next/link"
import { Plus, Users, Link2, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ClientAvatar } from "@/components/clients/client-avatar"
import { listClients } from "@/app/actions/clients"

// Queries the DB per request — never statically prerendered.
export const dynamic = "force-dynamic"

// S1 — Clients grid.
export default async function ClientsPage() {
  const clients = await listClients()

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage each client, connect their socials, plan the month.
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus /> New client
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {clients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Users />
              </span>
              <div>
                <p className="font-medium">No clients yet</p>
                <p className="text-sm text-muted-foreground">
                  Add your first client to connect accounts and schedule content.
                </p>
              </div>
              <Button asChild className="mt-2">
                <Link href="/clients/new">
                  <Plus /> New client
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <ClientAvatar name={c.name} logoUrl={c.logoUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.name}</p>
                        {c.defaultAudience && (
                          <p className="truncate text-xs text-muted-foreground">
                            {c.defaultAudience}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 className="size-3.5" /> {c.accountsCount} connected
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="size-3.5" /> {c.postsCount} posts
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
