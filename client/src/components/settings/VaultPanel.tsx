/*
 * Vault — the account's home for every creation: view the media + its Certificate of Authenticity,
 * and export it to your own storage. HONEST: we don't fake a direct-to-cloud upload we can't do —
 * Download is the real export (OneDrive/Dropbox/iCloud folders sync locally), and long-term GenieMade
 * storage is stated as a future paid plan, not an enforced promise. Data comes from the live /api/gallery.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { api, Generation, Certificate, fmtDate } from "@/lib/api";
import { CertCard } from "@/components/CertCard";
import { Seal } from "@/components/brand/Seal";
import { Loader2, Download, ShieldCheck, ExternalLink, Sparkles, X, Cloud, Globe } from "lucide-react";

export function VaultPanel() {
  const [gens, setGens] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Generation | null>(null);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [regPub, setRegPub] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);

  useEffect(() => {
    api.gallery().then((j) => setGens(j.generations || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.registryMine().then((j) => {
      const m: Record<string, boolean> = {};
      (j.registrations || []).forEach((r) => { m[r.hash_short] = r.is_public; });
      setRegPub(m);
    }).catch(() => {});
  }, []);

  async function doPublish(makePublic: boolean) {
    if (!sel?.hash) return;
    setPubBusy(true);
    try {
      await api.registryPublish({ hash: sel.hash, is_public: makePublic });
      setRegPub((p) => ({ ...p, [sel.hash!.slice(0, 16)]: makePublic }));
      setConfirming(false);
      toast.success(makePublic ? "Published to the EverVerify registry" : "Made private");
    } catch { toast.error("Couldn't update — try again."); }
    setPubBusy(false);
  }

  async function open(g: Generation) {
    setSel(g);
    setConfirming(false);
    // seed the certificate from the gallery row, then enrich with the full signed verdict
    setCert({ hash: g.hash, receipt_id: g.cert_id, issued_at: g.created_at } as Certificate);
    if (g.cert_id) {
      try { const v = await api.verify(g.cert_id); if (v.certificate) setCert(v.certificate as Certificate); } catch { /* keep the seed */ }
    }
  }

  async function download(g: Generation) {
    try {
      const r = await fetch(g.url);
      const b = await r.blob();
      const ext = g.capability?.startsWith("video") ? "mp4" : g.capability?.startsWith("audio") ? "wav" : "png";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `geniemade-${(g.cert_id || g.id || "creation").toString().slice(0, 18)}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Downloaded — keep it in your OneDrive, Dropbox, or iCloud");
    } catch { toast.error("Download failed — try again."); }
  }

  const thumb = (g: Generation, cls: string) =>
    g.capability?.startsWith("video") ? <video src={g.url} className={cls} muted playsInline /> :
    g.capability?.startsWith("audio") ? <div className={`${cls} grid place-items-center text-2xl text-muted-foreground`}>♪</div> :
    <img src={g.url} alt={g.prompt || "creation"} className={cls} loading="lazy" />;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Your Vault</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every creation you make, sealed — view it and its Certificate of Authenticity, and take it anywhere.</p>
        </div>
        <Link href="/app" className="btn-gold px-4 py-2 text-sm no-underline"><Sparkles className="h-4 w-4" /> Make a new one</Link>
      </div>

      {/* storage / ownership note — honest */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-border p-4 text-sm">
        <Cloud className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: "#66e3e8" }} />
        <p className="m-0 text-muted-foreground">
          <b className="text-foreground">Your files, yours to keep.</b> Download any creation to your own OneDrive, Dropbox, or iCloud —
          its certificate stays valid wherever the file travels. Long-term storage on GenieMade will be part of a paid plan;
          until then, keep your own copy. <span style={{ color: "#66e3e8" }}>Your proof is permanent regardless.</span>
        </p>
      </div>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your Vault…</div>
      ) : gens.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-border p-12 text-center">
          <img src="/brand/gm_logo_lamp.png" alt="" className="h-16 w-16 opacity-80" />
          <p className="mt-4 text-muted-foreground">Your Vault is empty — nothing sealed yet.</p>
          <Link href="/app" className="btn-gold mt-4 px-5 py-2.5 text-sm no-underline">Make your first creation</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gens.map((g) => (
            <button key={g.id} onClick={() => open(g)} className="group relative overflow-hidden rounded-xl border border-border transition-colors hover:border-[color:rgba(200,143,44,.6)]" data-testid="vault-item">
              {thumb(g, "aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]")}
              <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">{(g.capability || "").split(".")[0]}</span>
              <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 ring-1 ring-[color:rgba(245,196,81,.55)]" title="Sealed with a Certificate of Authenticity"><Seal className="h-4 w-4" /></span>
              <span className="absolute bottom-0 left-0 right-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] text-white/85"><ShieldCheck className="h-3 w-3" style={{ color: "#66e3e8" }} /> Sealed · {g.created_at ? fmtDate(g.created_at) : ""}</span>
            </button>
          ))}
        </div>
      )}

      {/* detail overlay */}
      {sel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSel(null)}>
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-background p-5" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-3 rounded-full border border-border p-1.5 text-muted-foreground hover:text-foreground" onClick={() => setSel(null)} aria-label="Close"><X className="h-4 w-4" /></button>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-border">
                {sel.capability?.startsWith("video") ? <video src={sel.url} controls loop className="w-full" /> :
                 sel.capability?.startsWith("audio") ? <audio src={sel.url} controls className="w-full" /> :
                 <img src={sel.url} alt={sel.prompt || "creation"} className="w-full" />}
              </div>
              <div>
                <CertCard cert={cert} model={sel.model} prompt={sel.prompt} capability={sel.capability} />
                <div className="mt-3 grid gap-2">
                  <button className="btn-gold w-full py-2.5 text-sm" onClick={() => download(sel)}><Download className="h-4 w-4" /> Download to your device / cloud</button>
                  <Link href={`/verify?receipt=${sel.cert_id || ""}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-muted-foreground no-underline hover:text-foreground">
                    <ExternalLink className="h-4 w-4" /> Verify its certificate
                  </Link>
                </div>
                {(() => {
                  const isPub = regPub[(sel.hash || "").slice(0, 16)] === true;
                  return (
                    <div className="mt-2 rounded-xl border border-border p-3">
                      {isPub ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-sm" style={{ color: "#66e3e8" }}><Globe className="h-4 w-4" /> On the public EverVerify wall</span>
                          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => doPublish(false)} disabled={pubBusy}>{pubBusy ? "…" : "Make private"}</button>
                        </div>
                      ) : confirming ? (
                        <div>
                          <p className="m-0 text-xs text-muted-foreground">Add this to the <b className="text-foreground">public</b> EverVerify registry? You can make it private again anytime — the authentication record itself stays permanent.</p>
                          <div className="mt-2 flex gap-2">
                            <button className="btn-gold px-3 py-1.5 text-xs" onClick={() => doPublish(true)} disabled={pubBusy}>{pubBusy ? "Publishing…" : "Yes, publish it"}</button>
                            <button className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => setConfirming(false)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setConfirming(true)}><Globe className="h-4 w-4" /> Publish to EverVerify</button>
                      )}
                    </div>
                  );
                })()}
                <p className="mt-3 text-[11px] text-muted-foreground">Save the download into your OneDrive, Dropbox, Google Drive, or iCloud — those folders sync from your device. One-click cloud connections are coming.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
