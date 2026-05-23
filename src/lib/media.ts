import path from "path";
import { readdir, stat } from "fs/promises";
import AdmZip from "adm-zip";

export type MediaKind = "image" | "video";

export type MediaAsset = {
  id: string;
  kind: MediaKind;
  name: string;
  folder: "images" | "videos";
  album?: string;
  extension: string;
  mimeType: string;
  size: number;
  modifiedAt: string;
  src: string;
  playbackUrl: string;
  downloadUrl: string;
};

const mimeTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".ogg": "video/ogg",
  ".png": "image/png",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);
const videoExtensions = new Set([".mp4", ".webm", ".mov", ".m4v", ".ogg", ".mpg", ".mpeg"]);
const compatibilityVideoExtensions = new Set([".mpeg", ".mpg"]);

function videoUrl(fileName: string) {
  return `/media/videos/${encodeURIComponent(fileName)}`;
}

function videoPlaybackUrl(fileName: string, extension: string) {
  if (compatibilityVideoExtensions.has(extension)) {
    return `/media-playback/videos/${encodeURIComponent(fileName)}`;
  }
  return videoUrl(fileName);
}

function imageUrl(zipName: string, imageName: string) {
  return `/media/images/${encodeURIComponent(zipName)}/${encodeURIComponent(imageName)}`;
}

async function readImagesFolder(): Promise<MediaAsset[]> {
  const folderPath = path.join(process.cwd(), "images");
  const entries = await readdir(folderPath, { withFileTypes: true }).catch(() => []);
  const assets: MediaAsset[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".zip")) continue;

    const zipPath = path.join(folderPath, entry.name);
    const zipStat = await stat(zipPath).catch(() => null);
    if (!zipStat) continue;

    let zip: AdmZip;
    try {
      zip = new AdmZip(zipPath);
    } catch {
      continue;
    }

    const albumName = entry.name.replace(/\.zip$/i, "");

    for (const zipEntry of zip.getEntries()) {
      if (zipEntry.isDirectory) continue;

      const entryName = path.basename(zipEntry.entryName);
      const extension = path.extname(entryName).toLowerCase();

      if (!imageExtensions.has(extension)) continue;

      const src = imageUrl(entry.name, entryName);

      assets.push({
        id: `images/${entry.name}/${entryName}`,
        kind: "image",
        name: entryName,
        folder: "images",
        album: albumName,
        extension: extension.replace(".", "").toUpperCase(),
        mimeType: mimeTypes[extension] ?? "image/jpeg",
        size: zipEntry.header.size,
        modifiedAt: zipStat.mtime.toISOString(),
        src,
        playbackUrl: src,
        downloadUrl: `${src}?download=1`,
      });
    }
  }

  return assets;
}

async function readVideosFolder(): Promise<MediaAsset[]> {
  const folderPath = path.join(process.cwd(), "videos");
  const entries = await readdir(folderPath, { withFileTypes: true }).catch(() => []);

  const assets = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const extension = path.extname(entry.name).toLowerCase();
        if (!videoExtensions.has(extension)) return null;

        const filePath = path.join(folderPath, entry.name);
        const fileStat = await stat(filePath);
        const src = videoUrl(entry.name);

        return {
          id: `videos/${entry.name}`,
          kind: "video" as const,
          name: entry.name,
          folder: "videos" as const,
          extension: extension.replace(".", "").toUpperCase(),
          mimeType: mimeTypes[extension] ?? "application/octet-stream",
          size: fileStat.size,
          modifiedAt: fileStat.mtime.toISOString(),
          src,
          playbackUrl: videoPlaybackUrl(entry.name, extension),
          downloadUrl: `${src}?download=1`,
        } as MediaAsset;
      }),
  );

  return assets.filter(Boolean) as MediaAsset[];
}

function mediaSort(a: MediaAsset, b: MediaAsset) {
  if (a.kind !== b.kind) {
    return a.kind === "image" ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

export async function getMediaAssets() {
  const [images, videos] = await Promise.all([readImagesFolder(), readVideosFolder()]);
  return [...images, ...videos].sort(mediaSort);
}
