"use client"

import { useState } from "react"
import { Loader2, FileText, Film } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Asset, Platform } from "@/lib/types"
import { getAssetDetail } from "@/app/actions/assets"
import { GenerateDialog } from "@/components/content/generate-dialog"

const ORIGIN_LABEL: Record<string, string> = {
  WEBSITE_URL: "Website",
  PDF_FILE: "PDF",
  MANUAL: "Brief",
  IMAGE: "Image",
  VIDEO: "Video",
}

export function AssetPreviewDialog({
  clientId,
  assetId,
  connectedPlatforms,
  children,
}: {
  clientId: string
  assetId: string
  connectedPlatforms: Platform[]
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [asset, setAsset] = useState<Asset | null>(null)

  async function onOpenChange(o: boolean) {
    setOpen(o)
    if (o && !asset) {
      setLoading(true)
      try {
        const a = await getAssetDetail(clientId, assetId)
        setAsset(a)
      } catch (e) {
        toast.error("Couldn't load asset", { description: e instanceof Error ? e.message : "Unknown error" })
      } finally {
        setLoading(false)
      }
    }
  }

  const videoUrl = (asset?.videos[0] as { url?: string } | undefined)?.url

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">{asset?.name ?? "Asset"}</DialogTitle>
          <DialogDescription>
            {asset ? `${ORIGIN_LABEL[asset.origin] ?? asset.origin} · ${asset.source}` : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : asset ? (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            {videoUrl && (
              <video src={videoUrl} controls playsInline className="w-full rounded-lg bg-black" />
            )}

            {asset.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {asset.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.src}
                    src={img.src}
                    alt={img.alt ?? ""}
                    className="size-24 rounded-lg object-cover ring-1 ring-border"
                  />
                ))}
              </div>
            )}

            {asset.text && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <FileText className="size-3.5" /> What we read from it
                </p>
                <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">
                  {asset.text}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">Asset not found.</p>
        )}

        {asset && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            {videoUrl ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Film className="size-3.5 text-primary" /> Posts from this asset publish as reels.
              </p>
            ) : (
              <span className="text-xs text-muted-foreground">Turn this into posts.</span>
            )}
            <GenerateDialog
              clientId={clientId}
              assetId={assetId}
              connectedPlatforms={connectedPlatforms}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
