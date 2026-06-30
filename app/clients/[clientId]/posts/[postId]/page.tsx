import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { dbGetClient, dbGetPost, dbGetAsset } from "@/lib/db"
import { PostDetailClient } from "@/components/posts/post-detail-client"

export const dynamic = "force-dynamic"

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; postId: string }>
}) {
  const { clientId, postId } = await params
  const [client, post] = await Promise.all([dbGetClient(clientId), dbGetPost(postId)])
  if (!client || !post || post.clientId !== clientId) notFound()

  // Scraped images from the source asset (already hosted — zero storage to attach).
  const asset = post.assetId ? await dbGetAsset(post.assetId) : null
  const assetImages = asset?.images.map((i) => ({ src: i.src, alt: i.alt })) ?? []

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <Link
        href={`/clients/${clientId}/posts`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Posts
      </Link>

      <div className="mt-6">
        <PostDetailClient
          clientId={clientId}
          post={{
            id: post.id,
            platform: post.platform,
            status: post.status,
            content: post.content,
            mediaUrls: post.mediaUrls,
          }}
          clientName={client.name}
          clientLogo={client.logoUrl}
          assetImages={assetImages}
        />
      </div>
    </main>
  )
}
