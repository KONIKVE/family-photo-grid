import path from "path";
import { spawn, spawnSync } from "child_process";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextRequest } from "next/server";
import ffmpegStaticPath from "ffmpeg-static";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedFolders = new Set(["videos"]);
const compatibilityExtensions = new Set([".mpeg", ".mpg"]);

function contentDisposition(fileName: string) {
  const encodedName = encodeURIComponent(fileName.replace(/\.[^.]+$/, ".mp4"));
  return `inline; filename="${fileName.replace(/"/g, "").replace(/\.[^.]+$/, ".mp4")}"; filename*=UTF-8''${encodedName}`;
}

function ffmpegIsAvailable(ffmpegPath: string) {
  const result = spawnSync(ffmpegPath, ["-version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
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
  const filePath = path.resolve(baseDirectory, ...fileParts);

  if (filePath !== baseDirectory && !filePath.startsWith(`${baseDirectory}${path.sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  const extension = path.extname(filePath).toLowerCase();

  if (!compatibilityExtensions.has(extension)) {
    return new Response("Unsupported compatibility format", { status: 415 });
  }

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const ffmpegPath =
    process.env.FFMPEG_PATH ||
    (ffmpegIsAvailable("ffmpeg") ? "ffmpeg" : null) ||
    (ffmpegStaticPath && ffmpegIsAvailable(ffmpegStaticPath) ? ffmpegStaticPath : null);

  if (!ffmpegPath) {
    return new Response(
      "MPG playback requires ffmpeg on the server. Install ffmpeg or set FFMPEG_PATH.",
      { status: 501 },
    );
  }

  const ffmpeg = spawn(
    ffmpegPath,
    [
      "-hide_banner", "-loglevel", "error",
      "-i", filePath,
      "-map", "0:v:0", "-map", "0:a?",
      "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k",
      "-movflags", "frag_keyframe+empty_moov+faststart",
      "-f", "mp4", "pipe:1",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  const output = ffmpeg.stdout;
  if (!output) {
    ffmpeg.kill("SIGKILL");
    return new Response("Unable to open ffmpeg output stream", { status: 500 });
  }

  ffmpeg.stderr?.resume();
  request.signal.addEventListener("abort", () => ffmpeg.kill("SIGKILL"));

  return new Response(Readable.toWeb(output) as BodyInit, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": contentDisposition(path.basename(filePath)),
      "Content-Type": "video/mp4",
    },
  });
}
