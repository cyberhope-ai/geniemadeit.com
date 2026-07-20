/*
 * Free background-removal tool — now BATCH. Drop many images -> fal birefnet/v2 strips each background
 * -> every cut-out is SEALED (QSeal cert) and lands in the Vault, already authenticated. Sequential
 * processing with per-item progress. Free tool + auth-gated = the pro-volume funnel into authentication.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { Seal } from "@/components/brand/Seal";
import { useSession } from "@/contexts/SessionContext";
import { api, Generation, ApiError } from "@/lib/api";
import { ImageUp, Download, Loader2, ShieldCheck, Wand2, X, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

const MAX = 30;
const CHECKER: CSSProperties = {
  backgroundColor: "#e9edf1",
  backgroundImage:
    "linear-gradient(45deg,#c7ced6 25%,transparent 25%),linear-gradient(-45deg,#c7ced6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#c7ced6 75%),linear-gradient(-45deg,transparent 75%,#c7ced6 75%)",
  backgroundSize: "18px 18px",
  backgroundPosition: "0 0,0 9px,9px -9px,-9px 0",
};

type Status = "pending" | "processing" | "done" | "error";
type Item = { id: string; name: string; srcUrl: string; dataUri: string; status: Status; result?: Generation; err?: string };

export default function RemoveBg() {
  const { user } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [needAuth, setNeedAuth] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Remove background — free · batch · GenieMade"; }, []);

  async function addFiles(files: FileList | File[]) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setItems((prev) => {
      const room = MAX - prev.length;
      const take = imgs.slice(0, Math.max(0, room));
      const added: Item[] = take.map((f) => ({ id: crypto.randomUUID(), name: f.name, srcUrl: URL.createObjectURL(f), dataUri: "", status: "pending" }));
      // read data URIs async, then patch them in
      take.forEach((f, i) => {
        const r = new FileReader();
        r.onload = () => setItems((cur) => cur.map((x) => (x.id === added[i].id ? { ...x, dataUri: String(r.result) } : x)));
        r.readAsDataURL(f);
      });
      return [...prev, ...added];
    });
  }

  async function runAll() {
    if (running) return;
    setRunning(true); setNeedAuth(false);
    const pending = items.filter((x) => x.status === "pending");
    for (const it of pending) {
      // ensure the data URI is ready
      let dataUri = it.dataUri;
      for (let w = 0; w < 20 && !dataUri; w++) { await new Promise((r) => setTimeout(r, 150)); dataUri = (items.find((x) => x.id === it.id)?.dataUri) || ""; }
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: "processing" } : x)));
      try {
        const j = await api.removeBg(dataUri);
        if (j.generation) setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: "done", result: j.generation } : x)));
        else setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: "error", err: j.message || "couldn't process" } : x)));
      } catch (e) {
        const a = e as ApiError;
        if (a.status === 401) { setNeedAuth(true); setRunning(false); return; }
        setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: "error", err: a.message || "couldn't process" } : x)));
      }
    }
    setRunning(false);
  }

  async function download(g: Generation) {
    try {
      const b = await (await fetch(g.url)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `geniemade-cutout-${(g.cert_id || g.id || "image").toString().slice(0, 14)}.png`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch { /* ignore */ }
  }
  const downloadAll = () => items.filter((x) => x.status === "done" && x.result).forEach((x, i) => setTimeout(() => download(x.result!), i * 350));

  const done = items.filter((x) => x.status === "done").length;
  const pending = items.filter((x) => x.status === "pending").length;

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 max-w-5xl pt-14 pb-20">
        <span className="eyebrow">Free tool · batch · sealed on the way out</span>
        <h1 className="mt-4 font-display text-5xl font-semibold">Remove backgrounds — <em className="gold-text italic">by the batch.</em></h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Drop up to {MAX} images at once. We cut every background in seconds, then <b className="text-foreground">seal each one
          with a Certificate of Authenticity</b> straight into your Vault — provably yours the moment they're made.
        </p>

        {/* drop zone */}
        <div
          className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-10 text-sm transition-colors"
          style={dragOver ? { borderColor: "#66e3e8", background: "rgba(102,227,232,.06)", color: "#e8fdff" } : { borderColor: "var(--border,#2a2f3a)", color: "var(--muted-foreground)" }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
        >
          <ImageUp className="h-8 w-8" />
          <button className="btn-gold px-5 py-2.5" onClick={() => fileRef.current?.click()}>Choose images</button>
          <span className="text-xs opacity-70">…or drop them here · PNG · JPG · WebP · up to {MAX} at once</span>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
        </div>

        {needAuth && (
          <p className="mt-4 text-sm"><Link href="/app" className="underline" style={{ color: "#66e3e8" }}>Create a free account</Link> to remove backgrounds — it's free, and you get 3 wishes too.</p>
        )}

        {/* action bar */}
        {items.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button className="btn-gold px-5 py-2.5 text-sm" onClick={runAll} disabled={running || pending === 0}>
              {running ? (<><Loader2 className="h-4 w-4 animate-spin" /> Removing… {done}/{items.length}</>) : (<><Wand2 className="h-4 w-4" /> Remove {pending} background{pending === 1 ? "" : "s"} — free</>)}
            </button>
            {done > 0 && <button className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground" onClick={downloadAll}><Download className="mr-1 inline h-4 w-4" /> Download all ({done})</button>}
            <button className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground" onClick={() => { setItems([]); setNeedAuth(false); }} disabled={running}><RefreshCw className="mr-1 inline h-4 w-4" /> Clear</button>
            <span className="text-xs text-muted-foreground">{items.length}/{MAX} images</span>
          </div>
        )}

        {/* grid */}
        {items.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => (
              <div key={it.id} className="relative overflow-hidden rounded-xl border border-border">
                <div className="aspect-square w-full" style={it.status === "done" ? CHECKER : undefined}>
                  <img src={it.status === "done" && it.result ? it.result.url : it.srcUrl} alt={it.name} className="h-full w-full object-contain" />
                </div>
                <div className="flex items-center justify-between gap-1 px-2 py-1.5 text-[11px]">
                  {it.status === "pending" && <span className="text-muted-foreground">Queued</span>}
                  {it.status === "processing" && <span className="flex items-center gap-1" style={{ color: "#66e3e8" }}><Loader2 className="h-3 w-3 animate-spin" /> Removing…</span>}
                  {it.status === "done" && <><span className="flex items-center gap-1" style={{ color: "#66e3e8" }}><ShieldCheck className="h-3 w-3" /> Sealed</span><button className="text-muted-foreground hover:text-foreground" onClick={() => it.result && download(it.result)} aria-label="Download"><Download className="h-3.5 w-3.5" /></button></>}
                  {it.status === "error" && <span className="flex items-center gap-1" style={{ color: "#ff9db4" }}><AlertCircle className="h-3 w-3" /> {it.err || "failed"}</span>}
                </div>
                {it.status === "done" && it.result?.cert_id && (
                  <Link href={`/verify?receipt=${it.result.cert_id}`} className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] text-white/85 no-underline" title="Verify certificate"><CheckCircle2 className="inline h-2.5 w-2.5" /></Link>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border p-4 text-sm">
          <Seal className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p className="m-0 text-muted-foreground">
            Every cut-out is signed and saved to your Vault. Download them to your own OneDrive, Dropbox, or iCloud —
            the certificate stays valid wherever the file goes. Doing thousands? A <b className="text-foreground">pro plan</b> with
            batch limits and an API is coming — <Link href="/triple-seal" className="underline" style={{ color: "#66e3e8" }}>see Triple Seal</Link>.
          </p>
        </div>
      </main>
      <GmFooter />
    </div>
  );
}
