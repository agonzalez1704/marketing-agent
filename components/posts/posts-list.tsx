"use client"

import Link from "next/link"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatusChip, type PostStatusValue } from "@/components/ui/status-chip"
import { PlatformIcon } from "@/components/ui/platform-icon"
import { DuplicatePostButton } from "@/components/posts/duplicate-post-button"
import { PLATFORM_LABEL } from "@/lib/platforms"
import type { Post } from "@/lib/types"
import { deletePost } from "@/app/actions/posts"

export function PostsList({ clientId, posts }: { clientId: string; posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No posts yet. Go to Content, scrape something, and hit Generate.
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <PostRow key={p.id} clientId={clientId} post={p} />
      ))}
    </div>
  )
}

function PostRow({ clientId, post }: { clientId: string; post: Post }) {
  const router = useRouter()
  const [pending, startTx] = useTransition()

  function onDelete() {
    startTx(async () => {
      try {
        await deletePost(clientId, post.id)
        toast.success("Post deleted")
        router.refresh()
      } catch (e) {
        toast.error("Couldn't delete", {
          description: e instanceof Error ? e.message : "Unknown error",
        })
      }
    })
  }

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex gap-3 p-4">
        <Link href={`/clients/${clientId}/posts/${post.id}`} className="flex min-w-0 flex-1 gap-3">
          {post.mediaUrls[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.mediaUrls[0]} alt="" className="size-14 shrink-0 rounded-md object-cover ring-1 ring-border" />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/80">
                <PlatformIcon platform={post.platform} width={14} height={14} />
                {PLATFORM_LABEL[post.platform]}
              </span>
              <StatusChip status={post.status as PostStatusValue} />
              <span className="text-[11px] tabular-nums text-muted-foreground">{post.content.length} chars</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground/90 line-clamp-3">{post.content}</p>
          </div>
        </Link>
        <div className="flex shrink-0 items-center">
          <DuplicatePostButton clientId={clientId} postId={post.id} />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
            disabled={pending}
            title="Delete post"
          >
            <Trash2 />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
