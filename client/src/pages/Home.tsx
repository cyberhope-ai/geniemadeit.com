/*
 * Gilded Night landing — dark night-violet + gold, Fraunces display, asymmetric hero.
 * All examples/pricing come from the live engine. No fabricated testimonials or claims.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { Seal } from "@/components/brand/Seal";
import { AuthModal, AuthMode } from "@/components/AuthModal";
import { useSession } from "@/contexts/SessionContext";
import { api, Pack } from "@/lib/api";
import { Wand2, Film, ShieldCheck, Vault, Download, ArrowRight } from "lucide-react";

const HERO_IMG = "/manus-storage/gm_hero_lamp_abe4e1d4.png";
const VIDEO_STILL = "/manus-storage/gm_video_still_09d15b8e.png";
const VAULT_IMG = "/manus-storage/gm_vault_illustration_d11dbf00.png";

interface Example { url: string; prompt: string }

const PACK_META: Record<string, { name: string; blurb: string; hot?: boolean; feats: string[] }> = {
  starter: { name: "Starter", blurb: "Try everything", feats: ["150 wishes", "Text → Image (1 wish)", "Fast & Pro image models", "Certificate on every creation"] },
  plus: { name: "Plus", blurb: "Best value for creators", hot: true, feats: ["600 wishes", "Everything in Starter", "Enough for image → video", "Full-resolution downloads"] },
  pro: { name: "Pro", blurb: "Heavy production", feats: ["1,500 wishes", "Everything in Plus", "Priority support", "Early access to new engines"] },
};

export default function Home() {
  const { user } = useSession();
  const [, navigate] = useLocation();
  const [examples, setExamples] = useState<Example[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");

  useEffect(() => {
    api.examples().then((j) => setExamples(j.examples || [])).catch(() => {});
    api.capabilities().then((j) => setPacks(j.packs || [])).catch(() => {});
  }, []);

  function startCreating() {
    if (user) navigate("/app");
    else { setMode("signup"); setAuthOpen(true); }
  }

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />

      {/* HERO — asymmetric: copy left, layered art right */}
      <section className="container relative z-10 grid items-center gap-12 pt-16 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div>
          <span className="eyebrow"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#66e3e8" }} /> AI images &amp; video · sealed &amp; provably yours</span>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
            Describe it.<br />GenieMade <em className="gold-text not-italic font-display italic">makes it real.</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Turn a few words — or a single photo — into striking images and video in seconds.
            Every creation is <b className="text-foreground">sealed with a certificate of authenticity</b>,
            built on the open C2PA content-credentials standard.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button className="btn-gold px-6 py-3.5 text-base" onClick={startCreating} data-testid="hero-cta">
              ✦ Start creating — 3 free wishes
            </button>
            <a href="#examples" className="btn-ghost-gold px-6 py-3.5 text-base no-underline">See examples</a>
          </div>
          <div className="mt-6 text-sm text-muted-foreground">
            No credit card to start · Wishes never expire · Made by CyberHope AI
          </div>
        </div>
        <div className="relative hidden sm:block">
          <div className="overflow-hidden rounded-3xl border border-border shadow-2xl" style={{ boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
            <img src={HERO_IMG} alt="The GenieMade lamp conjuring images and film" className="w-full" />
          </div>
          <div className="absolute -bottom-6 -left-8 w-44 overflow-hidden rounded-2xl border border-border shadow-xl rotate-[-4deg]">
            <img src={VIDEO_STILL} alt="Frame from an AI-generated video" className="w-full" />
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold" style={{ background: "rgba(19,10,38,.85)", color: "#ffe390" }}>
              <Seal className="w-3 h-3" /> Certified
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP — honest capability line */}
      <div className="relative z-10 border-y border-border/60" style={{ background: "rgba(28,17,64,.5)" }}>
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5 text-sm font-semibold text-muted-foreground">
          <span>Text → Image</span><span className="opacity-30">·</span>
          <span>Image → Video</span><span className="opacity-30">·</span>
          <span>Text → Voice</span><span className="opacity-30">·</span>
          <span>SHA-256 sealed certificates</span><span className="opacity-30">·</span>
          <span>PrecognitionOS Vault</span>
        </div>
      </div>

      {/* EXAMPLES — live from the engine */}
      <section id="examples" className="container relative z-10 pt-20">
        <div className="deco-divider mb-16 text-xs tracking-[0.3em] uppercase"><span>✦</span></div>
        <div className="max-w-2xl">
          <span className="eyebrow">Made with GenieMade</span>
          <h2 className="mt-4 font-display text-4xl font-semibold">A wish, made real — <em className="gold-text italic">and certified.</em></h2>
          <p className="mt-3 text-muted-foreground">Real creations from real prompts, straight from the engine. Every one ships with a signed certificate of authenticity.</p>
        </div>
        <div className="mt-10 columns-2 gap-4 md:columns-3 lg:columns-4 [&>div]:mb-4">
          {examples.slice(0, 12).map((ex, i) => (
            <div key={i} className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-border">
              <img src={ex.url} alt={ex.prompt} loading="lazy" className="w-full transition-transform duration-300 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <div className="absolute bottom-2 left-2 right-2 text-xs text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100 line-clamp-2">“{ex.prompt}”</div>
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold" style={{ background: "rgba(19,10,38,.85)", color: "#ffe390" }}>
                <Seal className="w-3 h-3" /> Certified
              </div>
            </div>
          ))}
          {examples.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground">Loading live examples from the engine…</div>
          )}
        </div>
      </section>

      {/* IMAGE -> VIDEO feature band (Canva-style) */}
      <section className="container relative z-10 grid items-center gap-12 pt-24 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <div className="deco-corners overflow-hidden rounded-3xl border border-border shadow-2xl">
            <img src={VIDEO_STILL} alt="AI video frame — enchanted stag" className="w-full" />
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid h-16 w-16 place-items-center rounded-full border" style={{ background: "rgba(19,10,38,.7)", borderColor: "rgba(200,143,44,.6)", backdropFilter: "blur(4px)" }}>
              <Film className="h-7 w-7" style={{ color: "#ffe390" }} />
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <span className="eyebrow">Image → Video</span>
          <h2 className="mt-4 font-display text-4xl font-semibold">Bring any image <em className="gold-text italic">to life.</em></h2>
          <p className="mt-4 text-muted-foreground">
            Pick any creation from your Vault — or any image you've made — describe the motion you
            want, and the Studio turns it into a moving clip. Camera pushes, drifting mist, flickering
            light: you direct, the lamp delivers. Sealed with the same certificate as everything else.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <li className="flex gap-3"><Wand2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#f5c451" }} /> Start from a prompt or from an existing image</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#f5c451" }} /> Every frame provably yours — hash-sealed on creation</li>
            <li className="flex gap-3"><Download className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#f5c451" }} /> Download and use anywhere</li>
          </ul>
          <button className="btn-gold mt-8 px-6 py-3" onClick={startCreating}>
            Animate an image <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* PROVENANCE band */}
      <section className="container relative z-10 grid items-center gap-12 pt-24 lg:grid-cols-2">
        <div>
          <span className="eyebrow">Trackable · Provable · Traceable — QSeal™</span>
          <h2 className="mt-4 font-display text-4xl font-semibold">The certificate is <em className="gold-text italic">the point.</em></h2>
          <p className="mt-4 text-muted-foreground">
            The moment a creation is made, GenieMade's <b className="text-foreground">QSeal™</b> technology
            computes its SHA-256 fingerprint, issues a receipt ID, and seals both into a certificate
            stored with the work in your PrecognitionOS Vault. Anyone can check a receipt on
            the <Link href="/verify" className="underline" style={{ color: "#ffe390" }}>Verify page</Link> —
            when it was made, by which engine, and that the file hasn't been altered.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { t: "Trackable", d: "Every creation logged to your Vault with time, engine, and cost." },
              { t: "Provable", d: "SHA-256 fingerprint + receipt ID sealed at the moment of creation." },
              { t: "Traceable", d: "Built on the open C2PA content-credentials standard." },
            ].map((f) => (
              <div key={f.t} className="cert-panel p-4">
                <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: "#ffe390" }}><Seal className="w-4 h-4" />{f.t}</div>
                <p className="mt-2 text-xs text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="deco-corners overflow-hidden rounded-3xl border border-border shadow-2xl">
          <img src={VAULT_IMG} alt="The PrecognitionOS Vault — sealed artworks in a crystal archive" className="w-full" />
        </div>
      </section>

      {/* QSEAL — Triple Binding technology section */}
      <section id="qseal" className="container relative z-10 pt-24">
        <div className="deco-divider mb-16 text-xs"><span>✦</span></div>
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow justify-center">QSeal™ · patent pending · built on QSurfaces™</span>
          <h2 className="mt-4 font-display text-4xl font-semibold">Every wish is born <em className="gold-text italic">sealed.</em></h2>
          <p className="mt-4 text-muted-foreground">
            A cryptographically signed certificate of authenticity, issued the instant it's made —
            server-side, before it ever reaches you. Signed with Ed25519. Verify it yourself against
            our public key — <b className="text-foreground">you don't have to take our word for it.</b>
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "The Fingerprint",
              tag: "SHA-256 · live today",
              d: "The exact bytes of your creation are hashed with SHA-256 and sealed into a tamper-evident chain. Change one pixel and the fingerprint changes. Forge a receipt? You'd need our private signing key.",
            },
            {
              t: "Signed Proof",
              tag: "Ed25519 · live today",
              d: "Every seal carries an Ed25519 signature from GenieMade's signing key. Any altered or invented certificate fails verification. Verify any seal yourself against our public key — the check is open.",
            },
            {
              t: "The Invisible Thread",
              tag: "In-pixel mark · rolling out",
              d: "An imperceptible mark woven into the pixels so the seal survives screenshots and re-encodes — carrying a durable link back to the proof. Rolling out; not yet active on new creations.",
            },
          ].map((f) => (
            <div key={f.t} className="cert-panel p-6">
              <div className="flex items-center gap-2 font-display text-xl font-semibold"><span style={{ color: "#f5c451" }}><Seal className="w-5 h-5" /></span>{f.t}</div>
              <div className="mt-1 text-[11px] uppercase tracking-widest" style={{ color: "#66e3e8" }}>{f.tag}</div>
              <p className="mt-3 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
          Honest by design: the in-pixel mark carries a durable <em>link</em> back to the proof — not the
          proof itself. A forger can strip provenance from a copy, but can never fake it: forging a
          GenieMade seal requires our private signing key. Every seal is linked into a tamper-evident chain.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="container relative z-10 pt-24">
        <div className="deco-divider mb-16 text-xs"><span>✦</span></div>
        <div className="max-w-2xl">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-4 font-display text-4xl font-semibold">Four steps. <em className="gold-text italic">Seconds.</em></h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            { n: "1", t: "Prompt", d: "Type what you imagine — or drop in an image to animate.", i: Wand2 },
            { n: "2", t: "Generate", d: "The lamp goes to work. Your vision appears in seconds.", i: Film },
            { n: "3", t: "Sealed", d: "Hashed and certified the instant it's made.", i: ShieldCheck },
            { n: "4", t: "Yours", d: "It lands in your Vault — download it, verify it, own it.", i: Vault },
          ].map((s) => (
            <div key={s.n} className="cert-panel p-6">
              <div className="flex items-center justify-between">
                <s.i className="h-5 w-5" style={{ color: "#f5c451" }} />
                <span className="font-display text-3xl font-semibold opacity-20">{s.n}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING — real packs from the engine */}
      <section id="pricing" className="container relative z-10 pt-24">
        <div className="deco-divider mb-16 text-xs"><span>✦</span></div>
        <div className="max-w-2xl">
          <span className="eyebrow">Pricing</span>
          <h2 className="mt-4 font-display text-4xl font-semibold">Start free. <em className="gold-text italic">Top up when ready.</em></h2>
          <p className="mt-3 text-muted-foreground">Three free wishes on signup. Then one-time wish packs — no subscription, wishes never expire.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {packs.map((p) => {
            const meta = PACK_META[p.key] || { name: p.key, blurb: "", feats: [`${p.credits} wishes`] };
            return (
              <div key={p.key} className={`gm-panel relative p-6 ${meta.hot ? "outline outline-2" : ""}`} style={meta.hot ? { outlineColor: "#c88f2c" } : undefined}>
                {meta.hot && (
                  <span className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide" style={{ background: "#f5c451", color: "#2a1a05" }}>
                    Most popular
                  </span>
                )}
                <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{meta.name}</div>
                <div className="mt-2 font-display text-4xl font-semibold">${p.usd}<span className="text-base text-muted-foreground font-sans"> one-time</span></div>
                <div className="mt-1 text-sm" style={{ color: "#ffe390" }}>✦ {p.credits.toLocaleString()} wishes</div>
                <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  {meta.feats.map((f) => <li key={f} className="flex gap-2"><span style={{ color: "#f5c451" }}>✓</span>{f}</li>)}
                </ul>
                <Link href="/pricing" className={`${meta.hot ? "btn-gold" : "btn-ghost-gold"} mt-6 w-full py-2.5 no-underline`}>
                  Get {meta.name}
                </Link>
              </div>
            );
          })}
          {packs.length === 0 && <div className="text-sm text-muted-foreground">Loading live pricing…</div>}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">Secure checkout powered by Stripe · prices come live from the engine</p>
      </section>

      {/* FAQ */}
      <section className="container relative z-10 pt-24 max-w-3xl">
        <span className="eyebrow">Questions</span>
        <h2 className="mt-4 font-display text-4xl font-semibold">Good to know</h2>
        <div className="mt-8 grid gap-3">
          {[
            ["What makes GenieMade different?", "Every creation is sealed with a certificate of authenticity — a SHA-256 fingerprint and receipt ID issued the instant it's made, built on the open C2PA content-credentials standard. Most tools give you an image; we give you an image you can prove is yours."],
            ["What is QSeal?", "QSeal is our patent-pending sealing technology, built on the QSurfaces provable-receipt substrate. It binds proof to your creation three ways: a SHA-256 fingerprint on a signed, tamper-evident chain (live today), a perceptual lineage fingerprint that ties derivatives back to the original (live today), and the Invisible Thread — a code woven into the pixels during generation that survives screenshots and metadata stripping (rolling out)."],
            ["Do I really get three free wishes?", "Yes. Your first three creations are free, no credit card required. After that, top up with a one-time wish pack — wishes never expire."],
            ["Does it make video too?", "Yes — image → video is in the Studio: pick any image you've made and describe the motion. Text → video is on the roadmap and clearly marked in the Studio until it's live."],
            ["Can I use my creations commercially?", "You can download everything you make in full resolution with its certificate. For commercial use, check the licence terms of the underlying model shown on each creation's certificate."],
            ["What is the Vault?", "Your private PrecognitionOS Vault keeps every creation with its certificate — trackable, verifiable, and downloadable from any device."],
          ].map(([q, a]) => (
            <details key={q} className="gm-panel group p-5">
              <summary className="cursor-pointer list-none font-semibold flex items-center justify-between">
                {q}<span className="transition-transform group-open:rotate-45 text-xl" style={{ color: "#f5c451" }}>+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container relative z-10 pt-24">
        <div className="gm-panel relative overflow-hidden p-10 text-center md:p-16">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center 30%" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(19,10,38,.75), rgba(19,10,38,.9))" }} />
          <div className="relative">
            <span className="eyebrow">the lamp is lit</span>
            <h2 className="mt-4 font-display text-4xl font-semibold md:text-5xl">Your first three <em className="gold-text italic">wishes</em> are free.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Describe something impossible. Watch it become real — and provably yours.</p>
            <button className="btn-gold mt-8 px-8 py-4 text-base" onClick={startCreating}>✦ Start creating</button>
          </div>
        </div>
      </section>

      <GmFooter />
      <AuthModal open={authOpen} mode={mode} onOpenChange={setAuthOpen} onModeChange={setMode} />
    </div>
  );
}
