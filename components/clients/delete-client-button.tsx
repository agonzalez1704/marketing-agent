"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteClient } from "@/app/actions/clients"

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  function onDelete() {
    startTransition(async () => {
      try {
        await deleteClient(clientId)
        toast.success(`Deleted ${clientName}`)
        router.push("/")
      } catch (err) {
        toast.error("Couldn't delete client", {
          description: err instanceof Error ? err.message : "Unknown error",
        })
      }
    })
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        <Trash2 /> Delete
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Delete {clientName}?</span>
      <Button variant="destructive" size="sm" onClick={onDelete} disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Confirm
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </Button>
    </div>
  )
}
