"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deletePost } from "@/app/actions/posts"

export function DeletePostButton({
  clientId,
  postId,
  redirectToList = false,
}: {
  clientId: string
  postId: string
  redirectToList?: boolean
}) {
  const router = useRouter()
  const [pending, startTx] = useTransition()

  function onDelete() {
    startTx(async () => {
      try {
        await deletePost(clientId, postId)
        toast.success("Post deleted")
        if (redirectToList) router.push(`/clients/${clientId}/posts`)
        else router.refresh()
      } catch (e) {
        toast.error("Couldn't delete", {
          description: e instanceof Error ? e.message : "Unknown error",
        })
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      onClick={onDelete}
      disabled={pending}
    >
      <Trash2 /> Delete
    </Button>
  )
}
