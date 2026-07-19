/*
 * Gilded Night Studio (/app) — the wish-making workspace.
 * Composer column + certificate sidecard; Vault grid below.
 * Everything is REAL: capabilities, costs, generation, certificates, credits — live engine.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { Seal } from "@/components/brand/Seal";
import { AuthModal, AuthMode } from "@/components/AuthModal";
import { PaywallModal } from "@/components/PaywallModal";
import { CertCard } from "@/components/CertCard";
import { useSession } from "@/contexts/SessionContext";
import { api, ApiError, CapabilityItem, Generation, fmtDate, shortHash } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Film, ImageIcon, Mic, X, ChevronDown } from "lucide-react";

const CHIPS = [
  "a regal fox in a velvet coat, studio light",
  "a floating island city at golden hour",
  "a glowing perfume bottle on wet stone",
  "a cozy reading nook in a treehouse, rain outside",
];

const ASPECTS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const CAP_ICON: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  audio: Mic,
};

function iconFor(id: string) {
  return CAP_ICON[id.split(".")[0]] || ImageIcon;
}

export default function Studio() {
  const { user, loading, refresh, setUser } = useSession();
  const [caps, setCaps] = useState<CapabilityItem[]>([]);
  const [cap, setCap] = useState<string>("image.text");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Generation | null>(null);
  const [genError, setGenError] = useState("");
  const [vault, setVault] = useState<Generation[]>([]);
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [payOpen, setPayOpen] = useState(false);
  const [payNeed, setPayNeed] = useState<number | undefined>();
  const [sourceImg, setSourceImg] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<Generation | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => caps.find((c) => c.id === cap), [caps, cap]);
  const isVideoFromImage = cap === "video.image2video";
  const isAudio = cap.startsWith("audio.");

  useEffect(() => {
    api.capabilities()
      .then((j) => setCaps(j.capabilities.flatMap((c) => c.items)))
      .catch(() => toast.error("Couldn't load capabilities from the engine."));
  }, []);

  const loadVault = useCallback(() => {
    if (!user) return;
    api.gallery()
      .then((j) => { setVault(j.generations || []); setVaultLoaded(true); })
      .catch(() => setVaultLoaded(true));
  }, [user]);

  useEffect(() => { loadVault(); }, [loadVault]);

  async function makeWish() {
    if (busy) return; // re-entrancy guard: block a double-fire (fast Cmd+Enter) from double-charging
    if (!user) { setAuthMode("signup"); setAuthOpen(true); return; }
    if (!prompt.trim()) { toast.error("Describe your wish first."); return; }
    if (isVideoFromImage && !sourceImg) { toast.error("Pick a source image to animate."); setPickerOpen(true); return; }
    setBusy(true);
    setGenError("");
    setResult(null);
    try {
      const payload: { capability: string; prompt: string; aspect?: string; image_url?: string } = {
        capability: cap,
        prompt: prompt.trim(),
      };
      if (!isAudio) payload.aspect = aspect;
      if (isVideoFromImage) payload.image_url = sourceImg;
      const j = await api.generate(payload);
      if (j.generation) {
        setResult({ ...j.generation, prompt: prompt.trim() });
        if (typeof j.credits_remaining === "number" && user) setUser({ ...user, credits: j.credits_remaining });
        loadVault();
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
      } else {
        setGenError("The engine returned no creation. Nothing was charged if no result was produced.");
      }
    } catch (e) {
      const a = e as ApiError;
      if (a.status === 401) { setAuthMode("signup"); setAuthOpen(true); }
      else if (a.status === 402 || a.code === "no_credits" || a.code === "insufficient_credits") {
        setPayNeed((a.body?.cost as number) ?? selected?.credits);
        setPayOpen(true);
        refresh();
      } else {
        setGenError(a.message || "The engine couldn't grant that wish. You were not charged for failed generations.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function download(g: Generation) {
    try {
      const r = await fetch(g.url);
      const b = await r.blob();
      const a = document.createElement("a");
      const ext = g.capability?.startsWith("video") ? "mp4" : g.capability?.startsWith("audio") ? "wav" : "png";
      a.href = URL.createObjectURL(b);
      a.download = `geniemade-${(g.certificate?.receipt_id || g.cert_id || g.id || "creation").toString().slice(0, 18)}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("Download failed — try again.");
    }
  }

  function renderMedia(g: Generation, cls = "w-full") {
    if (g.capability?.startsWith("video")) return <video src={g.url} controls loop className={cls} />;
    if (g.capability?.startsWith("audio")) return <audio src={g.url} controls className="w-full mt-2" />;
    return <img src={g.url} alt={g.prompt || "AI creation"} className={cls} />;
  }

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />

      <main className="container relative z-10 pt-10 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">The Studio</span>
            <h1 className="mt-3 font-display text-4xl font-semibold">Make a <em className="gold-text italic">wish.</em></h1>
          </div>
          {user && (
            <div className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground">{user.email}</span> · <span style={{ color: "#ffe390" }}>✦ {user.credits} wishes left</span>
            </div>
          )}
        </div>

        {!loading && !user && (
          <div className="gm-panel mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted-foreground m-0">
              Create a free account to start — your first <b style={{ color: "#ffe390" }}>3 wishes are free</b>, and everything you make is sealed in your Vault.
            </p>
            <button className="btn-gold px-5 py-2.5 text-sm" onClick={() => { setAuthMode("signup"); setAuthOpen(true); }}>Create free account</button>
          </div>
        )}

        {/* Composer + result */}
        <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:mx-0">
          {/* Composer */}
          <div className="cert-panel p-6">
            {/* Capability picker — live from the engine, honest statuses */}
            <div className="flex flex-wrap gap-2">
              {caps.map((c) => {
                const Icon = iconFor(c.id);
               const isSel = cap === c.id;
                // Gate both 'soon' (not built) and 'next' (built but not yet confirmed
                // stable on the engine) so neither can be clicked into a failed/empty
                // generation — Trust Standard per atlas2 deploy-readiness review.
                const disabled = c.status === "soon" || c.status === "next";
                return (
                  <button
                    key={c.id}
                    disabled={disabled}
                    data-testid={`cap-${c.id}`}
                    onClick={() => setCap(c.id)}
                    title={
                      c.status === "next"
                        ? "Coming next — being verified before we open it"
                        : c.status === "soon"
                        ? "Coming soon — not yet enabled on the engine"
                        : `${c.credits} wishes`
                    }
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                      isSel ? "" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    style={isSel ? { borderColor: "#c88f2c", background: "rgba(245,196,81,.1)", color: "#ffe390" } : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {c.name}
                    <span className="rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold" style={{ background: "rgba(245,196,81,.15)", color: "#ffe390" }}>
                      {c.credits}✦
                    </span>
                    {c.status === "next" && (
                      <span className="rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold uppercase bg-muted text-muted-foreground">
                        next
                      </span>
                    )}
                    {c.status === "soon" && (
                      <span className="rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold uppercase bg-muted text-muted-foreground">soon</span>
                    )}
                  </button>
                );
              })}
              {caps.length === 0 && <div className="text-sm text-muted-foreground">Loading engines…</div>}
            </div>

            {/* Image→Video source picker */}
            {isVideoFromImage && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Source image to animate</div>
                {sourceImg ? (
                  <div className="relative inline-block">
                    <img src={sourceImg} alt="Source to animate" className="h-28 rounded-xl border border-border" />
                    <button
                      className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-background"
                      onClick={() => setSourceImg("")}
                      aria-label="Remove source image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => setPickerOpen(true)}
                    data-testid="pick-source"
                  >
                    <ImageIcon className="h-4 w-4" /> Choose an image from your Vault
                  </button>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Animate any image you've already made. Generate one with Text → Image first if your Vault is empty.
                </p>
              </div>
            )}

            {/* Prompt */}
            <div className="mt-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (!busy && (e.metaKey || e.ctrlKey) && e.key === "Enter") makeWish(); }}
                placeholder={
                  isVideoFromImage
                    ? "Describe the motion — e.g. slow cinematic push-in, mist drifting, light flickering…"
                    : isAudio
                    ? "Type what you want spoken…"
                    : "Describe your wish — the more vivid, the better…"
                }
                className="min-h-28 resize-y bg-background/40 text-base"
                data-testid="prompt"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {CHIPS.map((c) => (
                  <button key={c} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" onClick={() => setPrompt(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect */}
            {!isAudio && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shape</span>
                {ASPECTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${aspect === a ? "" : "border-border text-muted-foreground hover:text-foreground"}`}
                    style={aspect === a ? { borderColor: "#c88f2c", background: "rgba(245,196,81,.1)", color: "#ffe390" } : undefined}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}

            {/* Generate */}
            <button className="btn-gold mt-6 w-full py-3.5 text-base" onClick={makeWish} disabled={busy} data-testid="make-wish">
              {busy ? "The lamp is working…" : `✦ Make it real${selected ? ` · ${selected.credits} ${selected.credits === 1 ? "wish" : "wishes"}` : ""}`}
            </button>
            {selected?.status === "next" && (
              <p className="mt-2 text-xs text-muted-foreground">
                This engine is being verified before it opens — check back soon.
              </p>
            )}
            {genError && (
              <div className="mt-3 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(255,80,120,.4)", background: "rgba(255,80,120,.07)", color: "#ff9db4" }}>
                {genError}
              </div>
            )}
          </div>

          {/* Result + certificate */}
          <div ref={resultRef}>
            {busy && (
              <div className="gm-panel grid place-items-center p-10 h-full min-h-72">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full animate-spin" style={{ background: "conic-gradient(from 0deg, transparent, #f5c451)", maskImage: "radial-gradient(farthest-side, transparent 62%, black 64%)", WebkitMaskImage: "radial-gradient(farthest-side, transparent 62%, black 64%)" }} />
                  <p className="mt-5 text-sm text-muted-foreground">Summoning… {isVideoFromImage ? "video can take a minute or two." : "usually a few seconds."}</p>
                </div>
              </div>
            )}
            {!busy && result && (
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-2xl border border-border">
                  {renderMedia(result)}
                </div>
                <CertCard cert={result.certificate} model={result.model} prompt={result.prompt} capability={result.capability} />
                <div className="flex gap-3">
                  <button className="btn-gold flex-1 py-2.5 text-sm" onClick={() => download(result)}>
                    <Download className="h-4 w-4" /> Download
                  </button>
                  {result.capability?.startsWith("image") && (
                    <button
                      className="btn-ghost-gold flex-1 py-2.5 text-sm"
                      onClick={() => { setCap("video.image2video"); setSourceImg(result.url); setPrompt(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      data-testid="animate-this"
                    >
                      <Film className="h-4 w-4" /> Animate this
                    </button>
                  )}
                </div>
              </div>
            )}
            {!busy && !result && (
              <div className="cert-panel grid place-items-center p-10 h-full min-h-72 text-center">
                <div>
                  <Seal className="mx-auto h-10 w-10 opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground max-w-56 mx-auto">
                    Your creation appears here — sealed with its certificate the moment it's made.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vault */}
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold">Your Vault</h2>
              <p className="mt-1 text-sm text-muted-foreground">Every creation, sealed and provably yours. Tap any to see its certificate.</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {vault.map((g) => (
              <button key={g.id} className="group relative overflow-hidden rounded-2xl border border-border text-left" onClick={() => setLightbox(g)} data-testid="vault-item">
                {g.capability?.startsWith("video") ? (
                  <video src={g.url} muted className="aspect-square w-full object-cover" />
                ) : g.capability?.startsWith("audio") ? (
                  <div className="grid aspect-square w-full place-items-center bg-accent"><Mic className="h-8 w-8 text-muted-foreground" /></div>
                ) : (
                  <img src={g.url} alt="Vault creation" loading="lazy" className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold" style={{ background: "rgba(19,10,38,.85)", color: "#ffe390" }}>
                  <Seal className="w-3 h-3" /> {shortHash(g.hash, 8)}
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[0.7rem] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  {fmtDate(g.created_at)}
                </div>
              </button>
            ))}
          </div>
          {user && vaultLoaded && vault.length === 0 && (
            <div className="cert-panel mt-6 p-10 text-center text-sm text-muted-foreground">
              <Seal className="mx-auto mb-3 h-8 w-8 opacity-40" />
              Your Vault is empty — make your first wish above and it will be sealed here.
            </div>
          )}
          {!user && !loading && (
            <div className="gm-panel mt-6 p-8 text-center text-sm text-muted-foreground">
              Sign in to see your Vault.
            </div>
          )}
        </section>
      </main>

      {/* Vault lightbox with certificate */}
      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="gm-panel max-w-3xl border-border max-h-[90vh] overflow-y-auto">
          {lightbox && (
            <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
              <div className="overflow-hidden rounded-xl border border-border self-start">
                {renderMedia(lightbox)}
              </div>
              <div className="grid gap-3 self-start">
                <DialogTitle className="font-display text-xl font-semibold m-0">Sealed creation</DialogTitle>
                <CertCard
                  cert={{
                    hash: lightbox.hash || "",
                    receipt_id: lightbox.cert_id || "",
                    issued_at: lightbox.created_at || "",
                    c2pa: false,
                  }}
                  model={lightbox.model}
                  capability={lightbox.capability}
                  compact
                />
                <div className="flex gap-2">
                  <button className="btn-gold flex-1 py-2 text-sm" onClick={() => download(lightbox)}>
                    <Download className="h-4 w-4" /> Download
                  </button>
                  {lightbox.capability?.startsWith("image") && (
                    <button
                      className="btn-ghost-gold flex-1 py-2 text-sm"
                      onClick={() => { setCap("video.image2video"); setSourceImg(lightbox.url); setLightbox(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                      <Film className="h-4 w-4" /> Animate
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vault image picker for image→video */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="gm-panel max-w-2xl border-border max-h-[85vh] overflow-y-auto">
          <DialogTitle className="font-display text-xl font-semibold">Choose an image to animate</DialogTitle>
          {vault.filter((g) => g.capability?.startsWith("image")).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No images in your Vault yet. Close this and generate one with Text → Image first — then animate it.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {vault.filter((g) => g.capability?.startsWith("image")).map((g) => (
                <button key={g.id} className="overflow-hidden rounded-xl border border-border hover:outline hover:outline-2" style={{ outlineColor: "#c88f2c" }}
                  onClick={() => { setSourceImg(g.url); setPickerOpen(false); }}>
                  <img src={g.url} alt="Vault image" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <GmFooter />
      <AuthModal open={authOpen} mode={authMode} onOpenChange={setAuthOpen} onModeChange={setAuthMode} next="/app" />
      <PaywallModal open={payOpen} onOpenChange={setPayOpen} neededCredits={payNeed} remaining={user?.credits} />
    </div>
  );
}
