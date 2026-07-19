/**
 * Triple Seal — the tiered-permanence product page. Gilded Night design system, full-vigour.
 * The ladder (Open → Sealed → Anchored → Eternal) is the centerpiece. HONEST throughout:
 * Sealed is LIVE (the QSurface registry); Anchored/Eternal are badged "building" — we never imply
 * the on-chain anchoring ships before it does. Claims stay tamper-EVIDENT, never "unhackable",
 * never "we built a blockchain", never "NFT = proof".
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { Seal } from "@/components/brand/Seal";
import { Anchor, ShieldCheck, Fingerprint, ArrowRight, Check, X, Sparkles, Share2, Layers } from "lucide-react";

const TIERS = [
  {
    n: 0, name: "Open", sub: "No seal", price: "Free", live: true, accent: "#6c7482",
    blurb: "Verify a file and read whatever provenance it already carries. The free front door — establishes nothing.",
    marks: [],
  },
  {
    n: 1, name: "Sealed", sub: "QSurface ledger", price: "1 wish", live: true, accent: "#66e3e8",
    blurb: "Ed25519-signed onto our hash-linked registry the instant it's made. Instant, public, cryptographically yours.",
    marks: ["Q"],
  },
  {
    n: 2, name: "Anchored", sub: "+ Bitcoin", price: "~5 wishes", live: true, accent: "#f7931a",
    blurb: "Everything in Sealed, plus your fingerprint written onto a public blockchain. From here on, the proof survives us.",
    marks: ["Q", "₿"],
  },
  {
    n: 3, name: "Eternal", sub: "QSurface + Bitcoin + Ethereum", price: "~15 wishes", live: false, accent: "#f5c451",
    blurb: "Triple-redundant across our ledger and both major chains. Survives almost anything short of the internet itself.",
    marks: ["Q", "₿", "Ξ"],
  },
];

export default function TripleSeal() {
  useEffect(() => { document.title = "Triple Seal — proof that outlives the proof-keeper"; }, []);
  const [active, setActive] = useState(3);

  return (
    <div className="relative min-h-screen">
      <style>{`
        .ts-hero-title{ background:linear-gradient(92deg,#f5c451,#fff2cf 45%,#f5c451); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .ts-glow{ animation:tsGlow 4.5s ease-in-out infinite; }
        @keyframes tsGlow{ 0%,100%{ opacity:.55; transform:scale(1);} 50%{ opacity:1; transform:scale(1.06);} }
        .ts-float{ animation:tsFloat 7s ease-in-out infinite; }
        @keyframes tsFloat{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-7px);} }
        .ts-tier{ transition:transform .28s ease, box-shadow .28s ease, border-color .28s ease, background .28s ease; }
        .ts-tier:hover, .ts-tier.on{ transform:translateY(-4px); }
        .ts-chip{ font-family:var(--font-display, "Fraunces", Georgia, serif); }
        .ts-shimmer{ position:relative; overflow:hidden; }
        .ts-shimmer::after{ content:""; position:absolute; inset:0; background:linear-gradient(115deg,transparent 30%,rgba(245,196,81,.12) 50%,transparent 70%); transform:translateX(-100%); animation:tsShimmer 6s ease-in-out infinite; }
        @keyframes tsShimmer{ 0%,60%{ transform:translateX(-100%);} 85%,100%{ transform:translateX(100%);} }
        .ts-rungline{ background:linear-gradient(180deg,rgba(102,227,232,.15),rgba(247,147,26,.25),rgba(245,196,81,.6)); }
        @media (prefers-reduced-motion: reduce){ .ts-glow,.ts-float,.ts-shimmer::after{ animation:none !important; } }
      `}</style>

      <GoldDust />
      <GmNav />

      <main className="container relative z-10">
        {/* ============ HERO ============ */}
        <section className="pt-14 pb-8 md:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <span className="eyebrow">GenieMade · Triple Seal</span>
              <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
                Proof that <span className="ts-hero-title">outlives</span> the proof-keeper.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                A ladder of permanence for anything you make — from our own signed ledger up to Bitcoin
                and Ethereum. Seal it once, and its authenticity stands <b className="text-foreground">even if GenieMade
                itself disappears.</b>
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/verify" className="btn-gold px-6 py-3 text-base no-underline">
                  <Sparkles className="h-4 w-4" /> Seal a creation — it's live
                </Link>
                <a href="#ladder" className="rounded-xl border border-border px-6 py-3 text-base text-muted-foreground no-underline transition-colors hover:text-foreground">
                  See the four tiers <ArrowRight className="ml-1 inline h-4 w-4" />
                </a>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                <span style={{ color: "#66e3e8" }}>●</span> <b className="text-foreground">Sealed &amp; Anchored</b> live today ·
                <span style={{ color: "#f5c451" }}> ●</span> Eternal (Bitcoin + Ethereum) in build
              </p>
            </div>

            {/* hero visual — the Triple Seal certification mark on a light plaque */}
            <div className="relative mx-auto hidden w-full max-w-sm lg:block">
              <div className="absolute -inset-6 rounded-[2.2rem] ts-glow" style={{ background: "radial-gradient(circle, rgba(245,196,81,.30), transparent 70%)" }} />
              <div className="ts-float relative rounded-[1.7rem] border p-8" style={{ background: "linear-gradient(180deg,#fcfbf7,#eceef1)", borderColor: "rgba(200,143,44,.55)", boxShadow: "0 34px 80px -34px rgba(0,0,0,.65)" }}>
                <img src="/brand/triple_seal_logo.png" alt="GenieMade Triple Seal — Certified Trust · Premium Security" className="mx-auto w-full max-w-[320px]" />
              </div>
              <div className="mt-5 flex items-center justify-center gap-4 text-2xl">
                <span className="ts-chip" style={{ color: "#66e3e8" }} title="QSurface">Q</span>
                <span className="ts-chip" style={{ color: "#f7931a" }} title="Bitcoin">₿</span>
                <span className="ts-chip" style={{ color: "#8ea2f0" }} title="Ethereum">Ξ</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ THE PROBLEM ============ */}
        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow" style={{ color: "#ff9db4" }}>The problem no one else solves</span>
            <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
              Every "verified" badge <em className="gold-text italic">dies with the company that issued it.</em>
            </h2>
            <p className="mt-5 text-muted-foreground">
              A certificate is only as permanent as the server that stores it. If the issuer is hacked, acquired,
              defunded, or simply shuts its doors, every badge it ever granted turns to dust — and the people who
              trusted it are left holding files they can no longer prove. Triple Seal is built the other way around.
            </p>
          </div>
        </section>

        {/* ============ THE LADDER ============ */}
        <section id="ladder" className="border-t border-border py-16">
          <div className="text-center">
            <span className="eyebrow">The product — choose how immortal</span>
            <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">One creation. Four levels of permanence.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              The higher you seal, the less it depends on us — because the top tiers live on public chains no
              single company can rewrite. Upgrading is one click: <span style={{ color: "#f5c451" }}>“Make it Eternal.”</span>
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {TIERS.map((t) => (
              <button
                key={t.n}
                onMouseEnter={() => setActive(t.n)}
                onFocus={() => setActive(t.n)}
                className={`ts-tier cert-panel relative flex flex-col p-5 text-left ${active === t.n ? "on" : ""}`}
                style={{
                  borderColor: active === t.n ? t.accent : undefined,
                  boxShadow: active === t.n ? `0 0 0 1px ${t.accent}, 0 18px 50px -24px ${t.accent}` : undefined,
                  background: t.n === 3 ? "linear-gradient(180deg, rgba(245,196,81,.08), rgba(247,147,26,.03))" : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="ts-chip text-xs uppercase tracking-[.2em]" style={{ color: t.accent }}>Tier {t.n}</span>
                  {t.live
                    ? <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "#66e3e8", color: "#0b0d12" }}>Live</span>
                    : <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide" style={{ borderColor: t.accent, color: t.accent }}>Building</span>}
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold" style={{ color: t.n >= 2 ? t.accent : undefined }}>{t.name}</h3>
                <div className="mt-0.5 text-xs text-muted-foreground">{t.sub}</div>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{t.blurb}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {t.marks.length === 0
                      ? <span className="text-xs text-muted-foreground">—</span>
                      : t.marks.map((m) => (
                          <span key={m} className="ts-chip grid h-7 w-7 place-items-center rounded-full border text-sm"
                            style={{ borderColor: m === "Q" ? "#66e3e8" : m === "₿" ? "#f7931a" : "#8ea2f0", color: m === "Q" ? "#66e3e8" : m === "₿" ? "#f7931a" : "#8ea2f0" }}>{m}</span>
                        ))}
                  </div>
                  <span className="kv-mono text-sm" style={{ color: "#f5c451" }}>{t.price}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Prices indicative — tuned to <em>value</em>, not cost. Batched anchoring makes even a Bitcoin seal a
            fraction of a cent for us, so the upper tiers are almost pure margin.
          </p>
          <div className="mt-8 text-center">
            <Link href="/verify" className="btn-gold px-6 py-3 no-underline"><Fingerprint className="h-4 w-4" /> Seal your first creation free</Link>
          </div>
        </section>

        {/* ============ SURVIVES US ============ */}
        <section className="border-t border-border py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow" style={{ color: "#f7931a" }}>Why it can't be erased</span>
              <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
                We don't build a blockchain. We <span style={{ color: "#f7931a" }}>anchor</span> to the ones that already won.
              </h2>
              <p className="mt-5 text-muted-foreground">
                From the Anchored tier up, your fingerprint is written onto Bitcoin and/or Ethereum — public ledgers
                that no company, including ours, can alter or backdate. Verification stops depending on our servers
                and starts depending on math and the most battle-tested networks on earth.
              </p>
              <p className="mt-4 text-muted-foreground">
                We become a company you don't have to trust — you can <b className="text-foreground">check it yourself, forever.</b>
              </p>
            </div>
            <div className="cert-panel p-6">
              <div className="flex items-center gap-3 text-sm">
                <span className="ts-chip grid h-9 w-9 place-items-center rounded-full border" style={{ borderColor: "#66e3e8", color: "#66e3e8" }}>Q</span>
                <div><div className="font-semibold text-foreground">QSurface ledger</div><div className="text-xs text-muted-foreground">Signed the instant you create — live today</div></div>
              </div>
              <div className="my-2 ml-4 h-6 w-px ts-rungline" />
              <div className="flex items-center gap-3 text-sm">
                <span className="ts-chip grid h-9 w-9 place-items-center rounded-full border" style={{ borderColor: "#f7931a", color: "#f7931a" }}>₿</span>
                <div><div className="font-semibold text-foreground">Anchored to Bitcoin</div><div className="text-xs text-muted-foreground">Thousands of seals batch into one write — cost ≈ $0 each</div></div>
              </div>
              <div className="my-2 ml-4 h-6 w-px ts-rungline" />
              <div className="flex items-center gap-3 text-sm">
                <span className="ts-chip grid h-9 w-9 place-items-center rounded-full border" style={{ borderColor: "#8ea2f0", color: "#8ea2f0" }}>Ξ</span>
                <div><div className="font-semibold text-foreground">Anchored to Ethereum</div><div className="text-xs text-muted-foreground">Independently queryable — verify with or without us</div></div>
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-muted-foreground">
                <Anchor className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#f5c451" }} />
                It's the same technique behind OpenTimestamps and Sigstore — proven, keyless, and permanent.
              </div>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="border-t border-border py-16">
          <span className="eyebrow">How a seal is made</span>
          <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">Sign → batch → anchor → prove.</h2>
          <div className="mt-9 grid gap-4 md:grid-cols-4">
            {[
              { i: Fingerprint, t: "Sign", d: "Your creation is Ed25519-signed over its exact fingerprint and added to the QSurface ledger.", c: "#66e3e8" },
              { i: Layers, t: "Batch", d: "New seals are folded into a single Merkle root — one hash standing in for thousands.", c: "#9aa3b2" },
              { i: Anchor, t: "Anchor", d: "That root is written to Bitcoin/Ethereum in one transaction. Per-item cost rounds to zero.", c: "#f7931a" },
              { i: ShieldCheck, t: "Prove", d: "Each seal keeps its proof + the on-chain transaction. Anyone can confirm it against the public chain.", c: "#f5c451" },
            ].map((s, idx) => (
              <div key={s.t} className="cert-panel p-5">
                <div className="flex items-center gap-2">
                  <span className="ts-chip text-xs" style={{ color: s.c }}>0{idx + 1}</span>
                  <s.i className="h-5 w-5" style={{ color: s.c }} />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ PROOF PASSPORT ============ */}
        <section className="border-t border-border py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="cert-panel p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Share2 className="h-4 w-4" style={{ color: "#66e3e8" }} /> geniemadeit.com/p/yourname</div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((k) => (
                    <div key={k} className="aspect-square rounded-lg border border-border" style={{ background: "linear-gradient(135deg, rgba(102,227,232,.08), rgba(245,196,81,.06))" }} />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>6 sealed works · 2 Eternal</span>
                  <span className="kv-mono" style={{ color: "#66e3e8" }}>verify any of them ↗</span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="eyebrow">The Proof Passport</span>
              <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">Your body of work — <span className="gold-text italic">portable, public, permanent.</span></h2>
              <p className="mt-5 text-muted-foreground">
                Every seal a person earns lives in their Proof Passport: one shareable link — for a bio, a listing,
                or a court filing — with each entry independently verifiable straight from the blockchain.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li><b className="text-foreground">Portable</b> — their proof travels with them, not locked inside our app.</li>
                <li><b className="text-foreground">Survivable</b> — anchored entries verify from Bitcoin/Ethereum alone.</li>
                <li><b className="text-foreground">Compounding</b> — the more they seal, the more their Passport is worth.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ============ HONEST CLAIMS ============ */}
        <section className="border-t border-border py-16">
          <div className="text-center">
            <span className="eyebrow">The honesty is the moat</span>
            <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">What we will — and won't — say.</h2>
          </div>
          <div className="mx-auto mt-9 grid max-w-3xl gap-4 md:grid-cols-2">
            <div className="cert-panel p-6">
              <div className="text-sm font-semibold" style={{ color: "#66e3e8" }}>Defensible &amp; true</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {["Cryptographically signed — can't be forged", "Anchored to Bitcoin / Ethereum — can't be backdated or rewritten, even by us", "Independently verifiable against the public chain", "Tamper-evident and survivable — outlives any one company"].map((x) => (
                  <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#66e3e8" }} />{x}</li>
                ))}
              </ul>
            </div>
            <div className="cert-panel p-6">
              <div className="text-sm font-semibold" style={{ color: "#ff9db4" }}>We never claim</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {["“Unhackable.” Nothing is — we say tamper-evident.", "“We built a blockchain / a coin.” We anchor to existing ones.", "“An NFT proves you made it.” It doesn't — minting isn't authorship."].map((x) => (
                  <li key={x} className="flex gap-2"><X className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#ff9db4" }} />{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
            This discipline isn't a limitation — it's the whole product. The moment we overclaim, we become the
            thing we're selling protection from.
          </p>
        </section>

        {/* ============ CTA ============ */}
        <section className="border-t border-border py-20 text-center">
          <h2 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight md:text-5xl">
            Anyone can claim a thing is real.<br /><span className="gold-text italic">Triple Seal lets you prove it — forever.</span>
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/verify" className="btn-gold px-7 py-3.5 text-base no-underline"><Seal className="h-5 w-5" /> Seal a creation now</Link>
            <Link href="/app" className="rounded-xl border border-border px-7 py-3.5 text-base text-muted-foreground no-underline transition-colors hover:text-foreground">Make something to seal</Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Sealed &amp; Anchored live today · Eternal in build — <Link href="/verify" className="underline" style={{ color: "#66e3e8" }}>start with a free seal</Link></p>
        </section>
      </main>

      <GmFooter />
    </div>
  );
}
