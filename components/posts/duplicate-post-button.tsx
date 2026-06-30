"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { duplicatePost } from "@/app/actions/posts"

export function DuplicatePostButton({
  clientId,
  postId,
  navigate = false,
  variant = "ghost",
  withLabel = false,
  className,
}: {
  clientId: string
  postId: string
  /** Go to the new post's detail after duplicating. */
  navigate?: boolean
  variant?: "ghost" | "outline"
  withLabel?: boolean
  className?: string
}) {
  const router = useRouter()
  const [pending, startTx] = useTransition()

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTx(async () => {
      try {
        const { id } = await duplicatePost(clientId, postId)
        toast.success("Duplicated", { description: "A new draft was created." })
        if (navigate) router.push(`/clients/${clientId}/posts/${id}`)
        else router.refresh()
      } catch (err) {
        toast.error("Couldn't duplicate", {
          description: err instanceof Error ? err.message : "Unknown error",
        })
      }
    })
  }

  return (
    <Button
      variant={variant}
      size={withLabel ? "sm" : "icon"}
      className={cn(!withLabel && "size-7", "text-muted-foreground", className)}
      onClick={onClick}
      disabled={pending}
      title="Duplicate post"
    >
      {pending ? <Loader2 className="animate-spin" /> : <Copy />}
      {withLabel && "Duplicate"}
    </Button>
  )
}
