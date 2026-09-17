import { FormEvent, useState } from "react";
import { api, ApiError } from "../lib/api";
import { Gamepad2, Search, Server, UserRound, Image as ImageIcon, Download } from "lucide-react";

type Result = Record<string, unknown>;

export function Integrations() {
  const [minecraftPlayer, setMinecraftPlayer] = useState("");
  const [minecraftServer, setMinecraftServer] = useState("");
  const [robloxUser, setRobloxUser] = useState("");
  const [movie, setMovie] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFilter, setImageFilter] = useState("none");

  async function lookup(event: FormEvent, path: string) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setResult((await api.get(path)) as Result);
    } catch (cause) {
      setResult(null);
      setError(cause instanceof ApiError ? cause.message : "Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadImage(file: File) {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
  }

  function downloadImage() {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "aeris-image.png";
    link.click();
  }

  return (
    <div>
      <p className="text-sm font-medium text-brand">Connected tools</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Integrations</h1>
      <p className="mt-1 text-sm text-text-secondary">Run live Minecraft and Roblox lookups from the dashboard.</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <form onSubmit={(event) => lookup(event, `/lookups/minecraft/player/${encodeURIComponent(minecraftPlayer)}`)} className="rounded-2xl border border-border bg-surface-2 p-5">
          <div className="flex items-center gap-2 font-semibold"><Gamepad2 className="h-5 w-5 text-brand" /> Minecraft player</div>
          <input value={minecraftPlayer} onChange={(event) => setMinecraftPlayer(event.target.value)} placeholder="Notch" required className="mt-4 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-brand" />
          <button disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Search className="h-4 w-4" /> Look up</button>
        </form>
        <form onSubmit={(event) => lookup(event, `/lookups/minecraft/server/${encodeURIComponent(minecraftServer)}`)} className="rounded-2xl border border-border bg-surface-2 p-5">
          <div className="flex items-center gap-2 font-semibold"><Server className="h-5 w-5 text-brand" /> Minecraft server</div>
          <input value={minecraftServer} onChange={(event) => setMinecraftServer(event.target.value)} placeholder="play.example.com" required className="mt-4 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-brand" />
          <button disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Search className="h-4 w-4" /> Check status</button>
        </form>
        <form onSubmit={(event) => lookup(event, `/lookups/roblox/user/${encodeURIComponent(robloxUser)}`)} className="rounded-2xl border border-border bg-surface-2 p-5">
          <div className="flex items-center gap-2 font-semibold"><UserRound className="h-5 w-5 text-brand" /> Roblox user</div>
          <input value={robloxUser} onChange={(event) => setRobloxUser(event.target.value)} placeholder="builderman" required className="mt-4 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-brand" />
          <button disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Search className="h-4 w-4" /> Look up</button>
        </form>
        <form onSubmit={(event) => lookup(event, `/lookups/movie/${encodeURIComponent(movie)}`)} className="rounded-2xl border border-border bg-surface-2 p-5">
          <div className="flex items-center gap-2 font-semibold"><Search className="h-5 w-5 text-brand" /> Movie or TV</div>
          <input value={movie} onChange={(event) => setMovie(event.target.value)} placeholder="Interstellar" required className="mt-4 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-brand" />
          <button disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Search className="h-4 w-4" /> Search</button>
        </form>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-surface-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="flex items-center gap-2 font-semibold"><ImageIcon className="h-5 w-5 text-brand" /> Image studio</div><p className="mt-1 text-sm text-text-secondary">Apply a local preview filter without uploading your image.</p></div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-medium hover:border-brand">Choose image<input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && loadImage(event.target.files[0])} /></label>
            <select value={imageFilter} onChange={(event) => setImageFilter(event.target.value)} className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"><option value="none">Original</option><option value="grayscale(1)">Grayscale</option><option value="sepia(1)">Sepia</option><option value="invert(1)">Invert</option></select>
            <button type="button" onClick={downloadImage} disabled={!imageUrl} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><Download className="h-4 w-4" /> Download</button>
          </div>
        </div>
        {imageUrl ? <img src={imageUrl} alt="Image preview" className="mt-5 max-h-80 max-w-full rounded-xl object-contain" style={{ filter: imageFilter }} /> : <div className="mt-5 rounded-xl border border-dashed border-border p-10 text-center text-sm text-text-secondary">Select an image to preview it here.</div>}
      </section>

      {error && <p className="mt-5 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
      {result && <pre className="mt-5 max-h-96 overflow-auto rounded-2xl border border-border bg-surface-2 p-5 text-xs text-text-secondary">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
