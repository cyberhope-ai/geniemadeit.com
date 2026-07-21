/*
 * /authenticity — education + positioning. Explains the content-authenticity crisis, the wave of provenance
 * regulations (EU AI Act, SB 942, NO FAKES...), why the incumbent standard (C2PA/Content Credentials) fails
 * (its metadata gets stripped on upload/screenshot), and how GenieMade's Triple Seal survives distribution.
 * Educates, then funnels to the toolset. This is the SEO + trust page behind the whole "prove it" positioning.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { ShieldAlert, Fingerprint, ScanLine, Link2, Wand2, BadgeCheck, ImageOff, Code2, ArrowRight, Gavel } from "lucide-react";

const LAWS = [
  { t: "EU AI Act — Article 50", when: "Aug 2, 2026", d: "AI-generated output must be marked in machine-readable form; deepfakes must be disclosed. Penalties up to €15M or 3% of global turnover." },
  { t: "California SB 942 — AI Transparency Act", when: "In effect 2026", d: "Requires AI-detection tools and provenance disclosure for AI-generated content from large providers." },
  { t: "NY Synthetic Performer Disclosure", when: "In effect 2026", d: "Advertising and media using AI-generated performers must be labeled." },
  { t: "NO FAKES Act (federal)", when: "Advancing", d: "Consent required before any AI 'digital replica' of a person's voice or face — a licensable likeness right." },
  { t: "Platforms already enforce it", when: "Now", d: "TikTok integrated C2PA and has labeled ~1.3B AI videos; YouTube and Meta auto-label AI content and ads." },
  { t: "Marketplaces demand proof", when: "June 2025", d: "Etsy's Creativity Standards require every listing be a seller's original design — and Etsy can demand proof of authorship on challenge." },
];

const SEALS = [
  { i: Fingerprint, t: "Cryptographic content hash", d: "A fingerprint of the actual pixels — not removable metadata. The proof is the content itself, so it can't be quietly stripped out." },
  { i: ScanLine, t: "Embedded watermark", d: "An imperceptible signal woven into the image, carrying its identity even if the file is copied or re-saved." },
  { i: Link2, t: "Blockchain anchor", d: "An immutable, timestamped record on a public chain — independently verifiable by anyone, with zero trust in us required." },
];

const TOOLS = [
  { i: Wand2, t: "Create & Seal", d: "Generate images and video — every creation is sealed on the way out.", href: "/app", cta: "Open the Studio" },
  { i: BadgeCheck, t: "Verify", d: "Check any creation's certificate and provenance in one click.", href: "/verify", cta: "Verify a creation" },
  { i: ShieldAlert, t: "Triple Seal", d: "The full breakdown of how the seal is made and how to read it.", href: "/triple-seal", cta: "How it works" },
  { i: ImageOff, t: "Remove Background", d: "Free background removal — and every cut-out lands sealed in your Vault.", href: "/remove-bg", cta: "Try it free" },
  { i: Code2, t: "Developer API", d: "Seal, verify, and register programmatically across your own stack.", href: "/developers", cta: "See the API" },
];

export default function Authenticity() {
  useEffect(() => { document.title = "Content Authenticity & AI Provenance — GenieMade"; }, []);

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 max-w-4xl pt-14 pb-20">
        {/* hero */}
        <span className="eyebrow">Content authenticity</span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight">Proving what's real <em className="gold-text italic">just became the law.</em></h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          AI made everything easy to fake. Now regulators, platforms, and marketplaces are demanding proof of what's
          authentic and who made it. GenieMade builds that proof into everything you create — and unlike today's
          standard, ours survives the real world.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/app" className="btn-gold px-6 py-3 text-base no-underline"><Wand2 className="h-4 w-4" /> Create something provably yours</Link>
          <Link href="/verify" className="rounded-xl border border-border px-6 py-3 text-base text-muted-foreground no-underline transition-colors hover:text-foreground">Verify a creation</Link>
        </div>

        {/* the problem */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>The problem</div>
          <h2 className="font-display text-2xl font-semibold">You can't tell what's real anymore.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Deepfakes, stolen designs, cloned likenesses, AI "slop." When anyone can generate anything, value flips to a
            single question: <b className="text-foreground">can you prove it's authentic and yours?</b> Trust is already
            moving — consumer preference for AI-generated creator content fell from ~60% in 2023 to ~26% in 2025. For
            creators and sellers, "prove you made it" isn't philosophical anymore. It's a livelihood question.
          </p>
        </section>

        {/* regulations */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>The regulations closing in</div>
          <h2 className="font-display text-2xl font-semibold">Provenance is going from nice-to-have to mandatory.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">A fast-moving wall of law and policy now requires marking and disclosing AI content. A sample of what's live or imminent:</p>
          <div className="mt-6 grid gap-3">
            {LAWS.map((l) => (
              <div key={l.t} className="flex items-start gap-3 rounded-xl border border-border p-4">
                <Gavel className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: "#f5c451" }} />
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold">{l.t}</span>
                    <span className="kv-mono text-xs" style={{ color: "#66e3e8" }}>{l.when}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* C2PA + flaw */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>Today's standard — and its fatal flaw</div>
          <h2 className="font-display text-2xl font-semibold">C2PA / Content Credentials: a signal, not proof.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            The industry's answer is <b className="text-foreground">C2PA</b> (Content Credentials) — backed by Adobe,
            Google, Microsoft, and camera makers, now shipping in phones and cameras. It embeds "who made this and how"
            as metadata inside the file. It's a real step forward.
          </p>
          <div className="mt-5 rounded-2xl border p-5" style={{ borderColor: "rgba(224,164,74,.4)", background: "rgba(224,164,74,.08)" }}>
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-6 w-6 flex-shrink-0" style={{ color: "#e0a44a" }} />
              <div>
                <h3 className="font-display text-lg font-semibold" style={{ color: "#e0a44a" }}>The flaw: it's metadata — and metadata gets stripped.</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every time a file is uploaded to social media, screenshotted, or re-encoded, the Content Credentials are
                  erased. Security researchers call it <i>"a provenance signal, not proof by itself,"</i> and in 2025 a
                  camera maker's signing key was even compromised. So C2PA fails at exactly the moment you need it most:
                  <b className="text-foreground"> after your work leaves your hands.</b>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* the fix */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>How GenieMade fixes it</div>
          <h2 className="font-display text-2xl font-semibold">The Triple Seal — proof that survives the real world.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">We don't rely on metadata that can be stripped. Every GenieMade creation is sealed three ways:</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {SEALS.map((s, n) => (
              <div key={s.t} className="cert-panel p-5">
                <div className="flex items-center gap-2">
                  <span className="kv-mono text-xs font-bold" style={{ color: "#f5c451" }}>{n + 1}</span>
                  <s.i className="h-5 w-5" style={{ color: "#f5c451" }} />
                </div>
                <div className="mt-3 font-display text-lg font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-muted-foreground">
            Because the seal is tied to the content itself and anchored on a public blockchain, it survives screenshots,
            re-uploads, and re-encoding — the exact thing C2PA can't do. Anyone can verify it, anytime.
          </p>
          <div className="mt-5 gm-panel p-5">
            <p className="m-0 font-display text-xl font-semibold leading-snug">
              "C2PA tells you what a file <em className="gold-text italic">claims.</em> The Triple Seal lets you <em className="gold-text italic">prove</em> it — anywhere the file goes."
            </p>
          </div>
        </section>

        {/* toolset */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>The toolset</div>
          <h2 className="font-display text-2xl font-semibold">Every tool ships proof by default.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <Link key={t.t} href={t.href} className="group flex items-start gap-3 rounded-xl border border-border p-4 no-underline transition-colors hover:border-foreground/30">
                <t.i className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: "#66e3e8" }} />
                <div>
                  <div className="font-semibold text-foreground">{t.t}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.d}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#f5c451" }}>{t.cta} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* cta */}
        <section className="mt-14 border-t border-border pt-12 text-center">
          <h2 className="font-display text-3xl font-semibold">Create something you can prove is yours.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">The regulations are coming, the platforms are labeling, and buyers want proof. Get ahead of all of it — with authenticity built in from the first pixel.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/app" className="btn-gold px-7 py-3.5 text-base no-underline"><Wand2 className="h-5 w-5" /> Start creating</Link>
            <Link href="/triple-seal" className="rounded-xl border border-border px-7 py-3.5 text-base text-muted-foreground no-underline transition-colors hover:text-foreground">See how the seal works</Link>
          </div>
        </section>
      </main>
      <GmFooter />
    </div>
  );
}
