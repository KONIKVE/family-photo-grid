import PhotoGrid from "@/components/photo-grid";
import { getMediaAssets } from "@/lib/media";
import LogoutButton from "@/components/logout-button";

export default async function Home() {
  const assets = await getMediaAssets();
  const imageCount = assets.filter((asset) => asset.kind === "image").length;
  const videoCount = assets.filter((asset) => asset.kind === "video").length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-card">
        <div className="container flex flex-col gap-6 px-4 py-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Family Gallery
            </p>
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
                Family Photo Grid
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Browse every family photo and video, open a focused viewer,
                play videos inline, and download originals.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <LogoutButton />
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border bg-background px-4 py-3">
                <p className="text-2xl font-bold">{assets.length}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Files</p>
              </div>
              <div className="rounded-md border bg-background px-4 py-3">
                <p className="text-2xl font-bold">{imageCount}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Photos</p>
              </div>
              <div className="rounded-md border bg-background px-4 py-3">
                <p className="text-2xl font-bold">{videoCount}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Videos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-8">
        <header className="mb-5 flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Family Media</h2>
          <p className="text-sm text-muted-foreground">
            Source folders:{" "}
            <span className="font-medium text-foreground">images/</span>{" "}
            and <span className="font-medium text-foreground">videos/</span>
          </p>
        </header>
        <PhotoGrid assets={assets} />
      </section>
    </main>
  );
}
