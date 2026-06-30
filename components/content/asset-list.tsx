"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Globe, FileText, ImageIcon, PenLine, Film } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Asset, Platform } from "@/lib/types"
import { deleteAsset } from "@/app/actions/assets"
import { GenerateDialog } from "@/components/content/generate-dialog"
import { AssetPreviewDialog } from "@/components/content/asset-preview-dialog"

export function AssetList({
  clientId,
  assets,
  connectedPlatforms,
}: {
  clientId: string
  assets: Asset[]
  connectedPlatforms: Platform[]
}) {
  if (assets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No assets yet. Scrape a URL, upload a PDF, or write a brief from scratch above.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {assets.map((a) => (
        <AssetRow key={a.id} clientId={clientId} asset={a} connectedPlatforms={connectedPlatforms} />
      ))}
    </div>
  )
}

function AssetRow({
  clientId,
  asset,
  connectedPlatforms,
}: {
  clientId: string
  asset: Asset
  connectedPlatforms: Platform[]
}) {
  const router = useRouter()
  const [pending, startTx] = useTransition()

  function onDelete() {
    startTx(async () => {
      try {
        await deleteAsset(clientId, asset.id)
        toast.success("Asset deleted")
        router.refresh()
      } catch (e) {
        toast.error("Couldn't delete", {
          description: e instanceof Error ? e.message : "Unknown error",
        })
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <AssetPreviewDialog clientId={clientId} assetId={asset.id} connectedPlatforms={connectedPlatforms}>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity hover:opacity-80"
            title="Preview asset"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
              {asset.origin === "WEBSITE_URL" ? (
                <Globe />
              ) : asset.origin === "MANUAL" ? (
                <PenLine />
              ) : asset.origin === "IMAGE" ? (
                <ImageIcon />
              ) : asset.origin === "VIDEO" ? (
                <Film />
              ) : (
                <FileText />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{asset.name}</p>
              <p className="truncate text-xs text-muted-foreground">{asset.source}</p>
            </div>
          </button>
        </AssetPreviewDialog>
        {asset.images.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ImageIcon className="size-3.5" /> {asset.images.length}
          </span>
        )}
        <GenerateDialog clientId={clientId} assetId={asset.id} connectedPlatforms={connectedPlatforms} />
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          disabled={pending}
          title="Delete asset"
        >
          <Trash2 />
        </Button>
      </CardContent>
    </Card>
  )
}
