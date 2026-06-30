import { notFound } from "next/navigation"
import { dbGetClient, dbListPosts } from "@/lib/db"
import { runStatusSync } from "@/lib/status"
import { PostsList } from "@/components/posts/posts-list"
import { ClientTabs } from "@/components/clients/client-tabs"
import { SyncStatusButton } from "@/components/posts/sync-status-button"

export const dynamic = "force-dynamic"

export default async function PostsPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const client = await dbGetClient(clientId)
  if (!client) notFound()
  await runStatusSync(clientId)
  const posts = await dbListPosts(clientId)

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <ClientTabs clientId={client.id} clientName={client.name} active="posts" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {posts.length} post{posts.length === 1 ? "" : "s"} · drafts ready to schedule on the calendar.
          </p>
        </div>
        <SyncStatusButton clientId={client.id} />
      </div>

      <div className="mt-8">
        <PostsList clientId={client.id} posts={posts} />
      </div>
    </main>
  )
}
