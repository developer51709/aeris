import { FormEvent, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useI18n, INTEGRATION_MESSAGES } from "../i18n";
import { Gamepad2, Search, Server, UserRound, Image as ImageIcon, Download } from "lucide-react";

type Result = Record<string, unknown>;

export function Integrations() {
  const { locale } = useI18n();
  const copy = INTEGRATION_MESSAGES[locale];
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
    event.preventDefault(); setLoading(true); setError(null);
    try { setResult((await api.get(path)) as Result); }
    catch (cause) { setResult(null); setError(cause instanceof ApiError ? cause.message : copy.lookupFailed); }
    finally { setLoading(false); }
  }

  function loadImage(file: File) { if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(URL.createObjectURL(file)); }
  function downloadImage() { if (!imageUrl) return; const link = document.createElement("a"); link.href = imageUrl; link.download = "aeris-image.png"; link.click(); }

  const buttonClass = "mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50";
  const inputClass = "mt-4 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div>
      <p className="text-sm font-medium text-brand">{copy.eyebrow}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{copy.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-text-secondary">{copy.intro}</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <form onSubmit={(event) => lookup(event, `/lookups/minecraft/player/${encodeURIComponent(minecraftPlayer)}`)} className="rounded-2xl border border-border bg-surface-2 p-5"><div className="flex items-center gap-2 font-semibold"><Gamepad2 className="h-5 w-5 text-brand" /> {copy.minecraftPlayer}</div><input value={minecraftPlayer} onChange={(event) => setMinecraftPlayer(event.target.value)} placeholder={copy.usernamePlaceholder} required className={inputClass} /><button disabled={loading} className={buttonClass}><Search className="h-4 w-4" /> {copy.lookup}</button></form>
        <form onSubmit={(event) => lookup(event, `/lookups/minecraft/server/${encodeURIComponent(minecraftServer)}`)} className="rounded-2xl border border-border bg-surface-2 p-5"><div className="flex items-center gap-2 font-semibold"><Server className="h-5 w-5 text-brand" /> {copy.minecraftServer}</div><input value={minecraftServer} onChange={(event) => setMinecraftServer(event.target.value)} placeholder={copy.serverPlaceholder} required className={inputClass} /><button disabled={loading} className={buttonClass}><Search className="h-4 w-4" /> {copy.checkStatus}</button></form>
        <form onSubmit={(event) => lookup(event, `/lookups/roblox/user/${encodeURIComponent(robloxUser)}`)} className="rounded-2xl border border-border bg-surface-2 p-5"><div className="flex items-center gap-2 font-semibold"><UserRound className="h-5 w-5 text-brand" /> {copy.robloxUser}</div><input value={robloxUser} onChange={(event) => setRobloxUser(event.target.value)} placeholder={copy.usernamePlaceholder} required className={inputClass} /><button disabled={loading} className={buttonClass}><Search className="h-4 w-4" /> {copy.lookup}</button></form>
        <form onSubmit={(event) => lookup(event, `/lookups/movie/${encodeURIComponent(movie)}`)} className="rounded-2xl border border-border bg-surface-2 p-5"><div className="flex items-center gap-2 font-semibold"><Search className="h-5 w-5 text-brand" /> {copy.movie}</div><input value={movie} onChange={(event) => setMovie(event.target.value)} placeholder={copy.moviePlaceholder} required className={inputClass} /><button disabled={loading} className={buttonClass}><Search className="h-4 w-4" /> {copy.search}</button></form>
      </div>
      <section className="mt-6 rounded-2xl border border-border bg-surface-2 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 font-semibold"><ImageIcon className="h-5 w-5 text-brand" /> {copy.imageStudio}</div><p className="mt-1 text-sm text-text-secondary">{copy.imageIntro}</p></div><div className="flex flex-wrap items-center gap-2"><label className="cursor-pointer rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-medium hover:border-brand">{copy.chooseImage}<input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && loadImage(event.target.files[0])} /></label><select aria-label={copy.imageStudio} value={imageFilter} onChange={(event) => setImageFilter(event.target.value)} className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"><option value="none">{copy.original}</option><option value="grayscale(1)">{copy.grayscale}</option><option value="sepia(1)">{copy.sepia}</option><option value="invert(1)">{copy.invert}</option></select><button type="button" onClick={downloadImage} disabled={!imageUrl} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><Download className="h-4 w-4" /> {copy.download}</button></div></div>{imageUrl ? <img src={imageUrl} alt={copy.imageAlt} className="mt-5 max-h-80 max-w-full rounded-xl object-contain" style={{ filter: imageFilter }} /> : <div className="mt-5 rounded-xl border border-dashed border-border p-10 text-center text-sm text-text-secondary">{copy.selectImage}</div>}</section>
      {error && <p className="mt-5 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
      {result && <section className="mt-5"><h2 className="mb-2 text-sm font-semibold">{copy.resultTitle}</h2><pre className="max-h-96 overflow-auto rounded-2xl border border-border bg-surface-2 p-5 text-xs text-text-secondary">{JSON.stringify(result, null, 2)}</pre></section>}
    </div>
  );
}
