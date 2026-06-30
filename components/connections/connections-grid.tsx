"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlatformIcon } from "@/components/ui/platform-icon"
import { PLATFORMS } from "@/lib/platforms"
import type { Platform } from "@/lib/types"
import { startConnect, disconnectAccount, syncAccounts } from "@/app/actions/connections"

export interface ConnectedAccountView {
  id: string
  platform: Platform
  username: string | null
  status: string
}

export function ConnectionsGrid({
  clientId,
  accounts,
}: {
  clientId: string
  accounts: ConnectedAccountView[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [connecting, setConnecting] = useState<Platform | null>(null)
  const [, startTx] = useTransition()

  // Surface callback result (?connected / ?error) as a toast once.
  useEffect(() => {
    const connected = searchParams.get("connected")
    const error = searchParams.get("error")
    if (connected) toast.success(`Connected ${connected}`)
    if (error) toast.error("Connection failed", { description: error })
    if (connected || error) router.replace(`/clients/${clientId}/connections`)
  }, [searchParams, clientId, router])

  const byPlatform = new Map(accounts.map((a) => [a.platform, a]))

  async function onConnect(platform: Platform) {
    setConnecting(platform)
    try {
      const authUrl = await startConnect(clientId, platform)
      window.location.href = authUrl // leave to LATE; callback returns here
    } catch (e) {
      setConnecting(null)
      toast.error("Couldn't start connection", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  function onDisconnect(account: ConnectedAccountView) {
    startTx(async () => {
      try {
        await disconnectAccount(clientId, account.id)
        toast.success("Disconnected")
        router.refresh()
      } catch (e) {
        toast.error("Couldn't disconnect", {
          description: e instanceof Error ? e.message : "Unknown error",
        })
      }
    })
  }

  function onRefresh() {
    startTx(async () => {
      try {
        await syncAccounts(clientId)
        toast.success("Accounts refreshed")
        router.refresh()
      } catch (e) {
        toast.error("Refresh failed", {
          description: e instanceof Error ? e.message : "Unknown error",
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {PLATFORMS.map((p) => {
          const account = byPlatform.get(p.key)
          const isConnecting = connecting === p.key
          return (
            <Card key={p.key}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60">
                  <PlatformIcon platform={p.key} width={20} height={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{p.label}</p>
                  {account ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {account.username ? `@${account.username}` : "Connected"}
                    </p>
                  ) : isConnecting ? (
                    <p className="text-xs text-blue-600">Connecting…</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>

                {account ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                      <Check className="size-3" /> Connected
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      onClick={() => onDisconnect(account)}
                      title="Disconnect"
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" disabled={isConnecting} onClick={() => onConnect(p.key)}>
                    {isConnecting ? <Loader2 className="animate-spin" /> : <Plus />}
                    Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
