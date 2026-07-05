import { notFound } from "next/navigation"
import { dbGetClient, dbListPosts, dbListAccounts } from "@/lib/db"
import { runStatusSync } from "@/lib/status"
import { PostsList } from "@/components/posts/posts-list"
import { ClientTabs } from "@/components/clients/client-tabs"
import { SyncStatusButton } from "@/components/posts/sync-status-button"
import { NewPostDialog } from "@/components/posts/new-post-dialog"

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
  const [posts, accounts] = await Promise.all([dbListPosts(clientId), dbListAccounts(clientId)])
  const connectedPlatforms = [...new Set(accounts.map((a) => a.platform))]

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
        <div className="flex items-center gap-2">
          <SyncStatusButton clientId={client.id} />
          <NewPostDialog clientId={client.id} connectedPlatforms={connectedPlatforms} />
        </div>
      </div>

      <div className="mt-8">
        <PostsList clientId={client.id} posts={posts} />
      </div>
    </main>
  )
}
