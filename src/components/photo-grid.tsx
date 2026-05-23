"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  Grid2X2,
  ImageIcon,
  Pause,
  Play,
  Search,
  Timer,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import PhotoCard from "./photo-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaAsset, MediaKind } from "@/lib/media";

type FilterValue = "all" | MediaKind;
type SortValue = "name" | "newest" | "largest";

const PAGE_SIZE = 24;

type PhotoGridProps = {
  assets: MediaAsset[];
};

const filters: { value: FilterValue; label: string; icon: LucideIcon }[] = [
  { value: "all", label: "All", icon: Grid2X2 },
  { value: "image", label: "Photos", icon: ImageIcon },
  { value: "video", label: "Videos", icon: Video },
];

const delayOptions = [
  { value: "1", label: "1s" },
  { value: "2", label: "2s" },
  { value: "3", label: "3s" },
  { value: "5", label: "5s" },
  { value: "10", label: "10s" },
  { value: "15", label: "15s" },
  { value: "30", label: "30s" },
];

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function sortAssets(assets: MediaAsset[], sort: SortValue) {
  return [...assets].sort((a, b) => {
    if (sort === "newest") {
      return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
    }
    if (sort === "largest") {
      return b.size - a.size;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  });
}

export default function PhotoGrid({ assets }: PhotoGridProps) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>("name");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [useDirectPlayback, setUseDirectPlayback] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [slideshowDelay, setSlideshowDelay] = useState(3);

  const visibleAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = assets.filter((asset) => {
      const matchesFilter = filter === "all" || asset.kind === filter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        asset.name.toLowerCase().includes(normalizedQuery) ||
        asset.extension.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
    return sortAssets(filtered, sort);
  }, [assets, filter, query, sort]);

  useEffect(() => { setPage(1); }, [filter, query, sort]);

  const displayedAssets = useMemo(
    () => visibleAssets.slice(0, page * PAGE_SIZE),
    [visibleAssets, page],
  );
  const hasMore = displayedAssets.length < visibleAssets.length;

  const selectedIndex = selectedId
    ? visibleAssets.findIndex((asset) => asset.id === selectedId)
    : -1;
  const selectedAsset = selectedIndex >= 0 ? visibleAssets[selectedIndex] : null;
  const selectedVideoSrc =
    selectedAsset?.kind === "video"
      ? useDirectPlayback
        ? selectedAsset.src
        : selectedAsset.playbackUrl
      : "";

  useEffect(() => {
    setUseDirectPlayback(false);
    setPlaybackFailed(false);
  }, [selectedAsset?.id]);

  useEffect(() => {
    if (!selectedAsset) setSlideshowActive(false);
  }, [selectedAsset]);

  const moveSelection = useCallback(
    (direction: -1 | 1) => {
      if (!visibleAssets.length || selectedIndex < 0) return;
      const nextIndex = (selectedIndex + direction + visibleAssets.length) % visibleAssets.length;
      setSelectedId(visibleAssets[nextIndex].id);
    },
    [visibleAssets, selectedIndex],
  );

  useEffect(() => {
    if (!slideshowActive || !selectedAsset) return;
    const timer = setTimeout(() => moveSelection(1), slideshowDelay * 1000);
    return () => clearTimeout(timer);
  }, [slideshowActive, selectedAsset?.id, slideshowDelay, moveSelection]);

  const openAsset = (asset: MediaAsset) => setSelectedId(asset.id);

  const startSlideshow = () => {
    if (visibleAssets.length === 0) return;
    if (!selectedAsset) setSelectedId(visibleAssets[0].id);
    setSlideshowActive(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
          <TabsList className="grid h-auto w-full grid-cols-3 lg:w-auto">
            {filters.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-3 sm:flex-row lg:min-w-[560px]">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search photos & videos"
              className="pl-9"
            />
          </label>
          <div className="flex gap-2">
            <div className="grid grid-cols-3 gap-2 sm:w-[130px]">
              <Button
                type="button"
                variant={sort === "name" ? "default" : "outline"}
                size="icon"
                aria-label="Sort by name"
                title="Sort by name"
                onClick={() => setSort("name")}
              >
                <ArrowDownAZ className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={sort === "newest" ? "default" : "outline"}
                size="icon"
                aria-label="Sort by newest"
                title="Sort by newest"
                onClick={() => setSort("newest")}
              >
                <ArrowDownWideNarrow className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={sort === "largest" ? "default" : "outline"}
                size="icon"
                aria-label="Sort by largest"
                title="Sort by largest"
                onClick={() => setSort("largest")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(slideshowDelay)}
                onValueChange={(v) => setSlideshowDelay(Number(v))}
              >
                <SelectTrigger className="w-[72px] h-10" aria-label="Slideshow delay">
                  <Timer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {delayOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={startSlideshow}
                disabled={visibleAssets.length === 0}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Slideshow
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing <span className="font-medium text-foreground">{displayedAssets.length}</span>{" "}
          of <span className="font-medium text-foreground">{visibleAssets.length}</span> files
        </p>
        {query ? (
          <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>

      {visibleAssets.length ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedAssets.map((asset) => (
              <PhotoCard
                key={asset.id}
                asset={asset}
                formatBytes={formatBytes}
                onOpen={() => openAsset(asset)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                Load more ({visibleAssets.length - displayedAssets.length} remaining)
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
          <Search className="mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No media found</h3>
          <p className="text-sm text-muted-foreground">Try another filter or search term.</p>
        </div>
      )}

      <Dialog open={Boolean(selectedAsset)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[92vh] max-w-[95vw] overflow-hidden p-0 sm:rounded-xl lg:max-w-6xl">
          {selectedAsset ? (
            <div className="grid max-h-[92vh] grid-rows-[auto_minmax(0,1fr)_auto] bg-background">
              <div className="flex items-start justify-between gap-4 border-b px-4 py-3 pr-12">
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base">{selectedAsset.name}</DialogTitle>
                  <DialogDescription>
                    {selectedAsset.kind === "image" ? "Photo" : "Video"} —{" "}
                    {selectedAsset.extension} — {formatBytes(selectedAsset.size)}
                  </DialogDescription>
                </div>
              </div>

              <div className="relative flex min-h-0 items-center justify-center bg-black p-2 md:p-4">
                {selectedAsset.kind === "image" ? (
                  <img
                    src={selectedAsset.src}
                    alt={selectedAsset.name}
                    className="max-h-[68vh] w-auto max-w-full object-contain"
                  />
                ) : (
                  <div className="relative flex w-full justify-center">
                    <video
                      key={`${selectedAsset.id}-${selectedVideoSrc}`}
                      src={selectedVideoSrc}
                      controls
                      autoPlay
                      playsInline
                      className="max-h-[68vh] w-auto max-w-full"
                      onError={() => {
                        if (selectedAsset.playbackUrl !== selectedAsset.src && !useDirectPlayback) {
                          setUseDirectPlayback(true);
                          return;
                        }
                        setPlaybackFailed(true);
                      }}
                    />
                    {playbackFailed ? (
                      <div className="absolute inset-x-4 bottom-4 rounded-xl bg-background/95 p-3 text-sm text-foreground shadow-lg">
                        This video format is not supported by the browser player.
                        Use Download to save the original file, or install ffmpeg on the server for MPG compatibility playback.
                      </div>
                    ) : null}
                  </div>
                )}

                {slideshowActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                      key={`${selectedAsset.id}-${slideshowDelay}-${slideshowActive}`}
                      className="h-full origin-left bg-primary"
                      style={{
                        animation: `slideshow-progress ${slideshowDelay}s linear forwards`,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedIndex + 1} of {visibleAssets.length}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Previous"
                    title="Previous"
                    onClick={() => moveSelection(-1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Next"
                    title="Next"
                    onClick={() => moveSelection(1)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={slideshowActive ? "default" : "outline"}
                    onClick={() => setSlideshowActive((v) => !v)}
                    className="gap-2"
                    title={slideshowActive ? "Pause slideshow" : "Play slideshow"}
                  >
                    {slideshowActive ? (
                      <><Pause className="h-4 w-4" /> Pause</>
                    ) : (
                      <><Play className="h-4 w-4" /> Play</>
                    )}
                  </Button>
                  <Select
                    value={String(slideshowDelay)}
                    onValueChange={(v) => setSlideshowDelay(Number(v))}
                  >
                    <SelectTrigger className="w-[72px]" aria-label="Slideshow delay">
                      <Timer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {delayOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button asChild variant="outline">
                    <a href={selectedAsset.src} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </a>
                  </Button>
                  <Button asChild>
                    <a href={selectedAsset.downloadUrl} download>
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
