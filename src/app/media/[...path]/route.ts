import path from "path";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextRequest } from "next/server";
import AdmZip from "adm-zip";

export const dynamic = "force-dynamic";

const allowedFolders = new Set(["images", "videos"]);

const mimeTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpg",
  ".ogg": "video/ogg",
  ".png": "image/png",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

function contentDisposition(fileName: string, download: boolean) {
  const encodedName = encodeURIComponent(fileName);
  const disposition = download ? "attachment" : "inline";
  return `${disposition}; filename="${fileName.replace(/"/g, "")}"; filename*=UTF-8''${encodedName}`;
}

function parseRange(range: string | null, fileSize: number) {
  if (!range) return null;
  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : fileSize - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end < start || start >= fileSize) {
    return null;
  }
  return { start, end: Math.min(end, fileSize - 1) };
}

async function serveFromZip(zipPath: string, imageName: string, download: boolean): Promise<Response> {
  const zipStat = await stat(zipPath).catch(() => null);
  if (!zipStat?.isFile()) return new Response("Not found", { status: 404 });

  let zip: AdmZip;
  try {
    zip = new AdmZip(zipPath);
  } catch {
    return new Response("Failed to open zip", { status: 500 });
  }

  const entry = zip.getEntry(imageName);
  if (!entry || entry.isDirectory) return new Response("Not found", { status: 404 });

  const data = entry.getData();
  const extension = path.extname(imageName).toLowerCase();
  const contentType = mimeTypes[extension] ?? "application/octet-stream";

  return new Response(data as unknown as BodyInit, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": contentDisposition(imageName, download),
      "Content-Length": String(data.length),
      "Content-Type": contentType,
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const [folder, ...fileParts] = params.path ?? [];

  if (!allowedFolders.has(folder) || fileParts.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const baseDirectory = path.resolve("/home/venkat-koniki/Documents/project/PhotoGrid", folder);
  const download = request.nextUrl.searchParams.has("download");

  if (folder === "images") {
    if (fileParts.length < 2 || !fileParts[0].toLowerCase().endsWith(".zip")) {
      return new Response("Not found", { status: 404 });
    }

    const zipName = fileParts[0];
    const imageName = fileParts.slice(1).join("/");
    const zipPath = path.resolve(baseDirectory, zipName);

    if (!zipPath.startsWith(`${baseDirectory}${path.sep}`)) {
      return new Response("Not found", { status: 404 });
    }

    if (imageName.includes("..") || path.isAbsolute(imageName)) {
      return new Response("Not found", { status: 404 });
    }

    return serveFromZip(zipPath, imageName, download);
  }

  const filePath = path.resolve(baseDirectory, ...fileParts);
  if (filePath !== baseDirectory && !filePath.startsWith(`${baseDirectory}${path.sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) return new Response("Not found", { status: 404 });

  const extension = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const contentType = mimeTypes[extension] ?? "application/octet-stream";

  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
    "Content-Disposition": contentDisposition(fileName, download),
    "Content-Type": contentType,
  });

  const range = parseRange(request.headers.get("range"), fileStat.size);

  if (range && !download) {
    const chunkSize = range.end - range.start + 1;
    headers.set("Content-Length", String(chunkSize));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${fileStat.size}`);
    return new Response(
      Readable.toWeb(createReadStream(filePath, range)) as BodyInit,
      { status: 206, headers },
    );
  }

  headers.set("Content-Length", String(fileStat.size));
  return new Response(Readable.toWeb(createReadStream(filePath)) as BodyInit, { headers });
}
