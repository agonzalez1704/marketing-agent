"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { syncClientStatuses } from "@/app/actions/status"

export function SyncStatusButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [pending, startTx] = useTransition()

  function onSync() {
    startTx(async () => {
      try {
        const { updated } = await syncClientStatuses(clientId)
        toast.success(updated > 0 ? `Updated ${updated} post${updated === 1 ? "" : "s"}` : "Up to date")
        router.refresh()
      } catch (e) {
        toast.error("Sync failed", { description: e instanceof Error ? e.message : "Unknown error" })
      }
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={onSync} disabled={pending}>
      <RefreshCw className={cn(pending && "animate-spin")} /> Sync
    </Button>
  )
}
