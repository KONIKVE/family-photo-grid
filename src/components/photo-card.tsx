import { Download, Eye, ImageIcon, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MediaAsset } from "@/lib/media";

type PhotoCardProps = {
  asset: MediaAsset;
  formatBytes: (bytes: number) => string;
  onOpen: () => void;
};

export default function PhotoCard({ asset, formatBytes, onOpen }: PhotoCardProps) {
  const TypeIcon = asset.kind === "image" ? ImageIcon : Video;

  return (
    <Card className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-muted text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {asset.kind === "image" ? (
          <img
            src={asset.src}
            alt={asset.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <>
            <video
              src={asset.src}
              muted
              preload="metadata"
              playsInline
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </span>
            </span>
          </>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs font-medium shadow">
          <TypeIcon className="h-3.5 w-3.5" />
          {asset.extension}
        </span>
        <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-black/65 p-3 text-white transition-transform duration-200 group-hover:translate-y-0 group-focus-within:translate-y-0">
          <Eye className="h-4 w-4" />
          View
        </span>
      </button>

      <div className="space-y-3 p-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold" title={asset.name}>
            {asset.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {asset.album ?? asset.folder}/ — {formatBytes(asset.size)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onOpen}>
            {asset.kind === "video" ? <Play className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {asset.kind === "video" ? "Play" : "View"}
          </Button>
          <Button asChild size="sm">
            <a href={asset.downloadUrl} download>
              <Download className="h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
