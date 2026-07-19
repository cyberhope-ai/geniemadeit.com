/*
 * Free background-removal tool — the top-of-funnel magnet. Drop an image -> fal birefnet/v2 strips the
 * background -> the cut-out is SEALED (QSeal cert) and lands in the Vault, already authenticated.
 * Step 1: remove background (free). Step 2: it's provably yours. Then Verify / Anchor.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { Seal } from "@/components/brand/Seal";
import { useSession } from "@/contexts/SessionContext";
import { api, Generation, ApiError } from "@/lib/api";
import { ImageUp, Download, Loader2, ShieldCheck, ExternalLink, Wand2, RefreshCw } from "lucide-react";

const CHECKER = {
  backgroundColor: "#e9edf1",
  backgroundImage:
    "linear-gradient(45deg,#c7ced6 25%,transparent 25%),linear-gradient(-45deg,#c7ced6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#c7ced6 75%),linear-gradient(-45deg,transparent 75%,#c7ced6 75%)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0,0 11px,11px -11px,-11px 0",
};

export default function RemoveBg() {
  const { user } = useSession();
  const [srcUrl, setSrcUrl] = useState("");
  const [dataUri, setDataUri] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Generation | null>(null);
  const [err, setErr] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Remove background — free · GenieMade"; }, []);

  async function onFile(f: File) {
    if (!f.type.startsWith("image/")) { setErr("Please choose an image (PNG, JPG, or WebP)."); return; }
    setResult(null); setErr(""); setFileName(f.name);
    setSrcUrl((p) => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(f); });
    try {
      const du = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
      setDataUri(du);
    } catch { setErr("Couldn't read that file — try another."); }
  }

  async function remove() {
    if (!dataUri || busy) return;
    setBusy(true); setErr("");
    try {
      const j = await api.removeBg(dataUri);
      if (j.generation) setResult(j.generation);
      else setErr(j.message || "Couldn't remove the background — try another image.");
    } catch (e) {
      const a = e as ApiError;
      if (a.status === 401) setErr("auth");
      else setErr(a.message || "Couldn't remove the background — please try again.");
    } finally { setBusy(false); }
  }

  async function download(g: Generation) {
    try {
      const b = await (await fetch(g.url)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `geniemade-cutout-${(g.cert_id || g.id || "image").toString().slice(0, 14)}.png`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch { setErr("Download failed — try again."); }
  }

  function reset() { setResult(null); setDataUri(""); setSrcUrl(""); setFileName(""); setErr(""); }

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 max-w-3xl pt-14 pb-20">
        <span className="eyebrow">Free tool · sealed on the way out</span>
        <h1 className="mt-4 font-display text-5xl font-semibold">Remove any <em className="gold-text italic">background.</em></h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Drop an image — we cut the background out in seconds. Then it's <b className="text-foreground">sealed with a
          Certificate of Authenticity</b> and saved to your Vault, so it's provably yours the moment it's made.
        </p>

        {!result && (
          <div className="gm-panel mt-8 p-6">
            <button
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-12 text-sm transition-colors"
              style={dragOver ? { borderColor: "#66e3e8", background: "rgba(102,227,232,.06)", color: "#e8fdff" } : { borderColor: "var(--border,#2a2f3a)", color: "var(--muted-foreground)" }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
            >
              {srcUrl ? (
                <img src={srcUrl} alt="Your upload" className="max-h-64 rounded-lg" />
              ) : (
                <><ImageUp className="h-8 w-8" /><span>Drop an image here, or click to choose</span><span className="text-xs opacity-70">PNG · JPG · WebP · up to ~10MB</span></>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

            {srcUrl && (
              <div className="mt-4 flex items-center gap-3">
                <button className="btn-gold flex-1 py-3" onClick={remove} disabled={busy || !dataUri} data-testid="removebg-btn">
                  {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Removing background…</>) : (<><Wand2 className="h-4 w-4" /> Remove background — free</>)}
                </button>
                <button className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground" onClick={() => fileRef.current?.click()}>Change</button>
              </div>
            )}

            {err === "auth" ? (
              <p className="mt-4 text-sm">
                <Link href="/app" className="underline" style={{ color: "#66e3e8" }}>Create a free account</Link> to remove backgrounds — it's free, and you get 3 wishes too.
              </p>
            ) : err ? (
              <p className="mt-4 text-sm" style={{ color: "#ff9db4" }}>{err}</p>
            ) : null}
          </div>
        )}

        {result && (
          <div className="gm-panel mt-8 p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background removed</div>
                <div className="mt-2 overflow-hidden rounded-xl border border-border" style={CHECKER}>
                  <img src={result.url} alt="Background removed" className="mx-auto max-h-80" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 font-display text-lg font-semibold" style={{ color: "#66e3e8" }}>
                  <Seal className="h-5 w-5" /> Sealed &amp; yours
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Your cut-out is signed and saved to your Vault with a Certificate of Authenticity.</p>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted-foreground uppercase tracking-wide">Receipt</dt><dd className="kv-mono break-all m-0">{result.certificate?.receipt_id || result.cert_id}</dd>
                  <dt className="text-muted-foreground uppercase tracking-wide">SHA-256</dt><dd className="kv-mono break-all m-0">{(result.certificate?.hash || result.hash || "").slice(0, 40)}…</dd>
                </dl>
                <div className="mt-4 grid gap-2">
                  <button className="btn-gold w-full py-2.5 text-sm" onClick={() => download(result)}><Download className="h-4 w-4" /> Download PNG</button>
                  <Link href={`/verify?receipt=${result.certificate?.receipt_id || result.cert_id || ""}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-muted-foreground no-underline hover:text-foreground">
                    <ShieldCheck className="h-4 w-4" /> Verify &amp; anchor to Bitcoin <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground" onClick={reset}>
                    <RefreshCw className="h-4 w-4" /> Do another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Powered by GenieMade’s engine. Backgrounds are removed on our servers and never shared. Want this on <i>your</i> site?
          A developer API is on the way — <Link href="/triple-seal" className="underline" style={{ color: "#66e3e8" }}>see Triple Seal</Link>.
        </p>
      </main>
      <GmFooter />
    </div>
  );
}
