"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, RefreshCw, Palette } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ClientIdentity } from "@/lib/types"
import { buildClientIdentity } from "@/app/actions/identity"

export function IdentityCard({ clientId, identity }: { clientId: string; identity: ClientIdentity | null }) {
  const router = useRouter()
  const [pending, startTx] = useTransition()

  function build() {
    startTx(async () => {
      try {
        await buildClientIdentity(clientId)
        toast.success("Brand identity built")
        router.refresh()
      } catch (e) {
        toast.error("Couldn't build identity", { description: e instanceof Error ? e.message : "Unknown error" })
      }
    })
  }

  if (!identity) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Palette className="size-5" />
          </span>
          <div>
            <p className="font-medium">No brand identity yet</p>
            <p className="text-sm text-muted-foreground">
              Analyze this client&apos;s content to learn their tone, colors &amp; key features.
            </p>
          </div>
          <Button onClick={build} disabled={pending} className="mt-1">
            {pending ? <Loader2 className="animate-spin" /> : <Sparkles />} Build brand identity
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="size-4 text-primary" /> Brand identity
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={build} disabled={pending} className="text-muted-foreground">
          {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {identity.summary && <p className="text-sm leading-relaxed">{identity.summary}</p>}

        {identity.colors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {identity.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-full border border-border py-1 pl-1 pr-2.5">
                <span className="size-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />
                <span className="text-xs">{c.label || c.hex}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{c.hex}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Tone" value={identity.tone} />
          <Field label="Audience" value={identity.audience} />
          <Field label="Voice" value={identity.voice} />
          <Field label="Industry" value={identity.industry} />
        </div>

        {identity.services.length > 0 && <Chips label="Services" items={identity.services} />}
        {identity.keywords.length > 0 && <Chips label="Keywords" items={identity.keywords} accent />}
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  )
}

function Chips({ label, items, accent }: { label: string; items: string[]; accent?: boolean }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span
            key={i}
            className={cn(
              "rounded-md px-2 py-0.5 text-xs",
              accent ? "bg-primary/10 text-primary" : "bg-muted text-foreground/80",
            )}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  )
}
