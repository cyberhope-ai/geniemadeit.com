/*
 * /about — who we are, in plain language first, then the technology and the company (CyberHope AI).
 * Written for a regular visitor: what GenieMade actually does, why proof-of-origin matters, then the
 * QSeal / QSurface / Triple Seal stack and the company behind it.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { Sparkles, ShieldCheck, Fingerprint, Anchor, Building2, ArrowRight } from "lucide-react";

export default function About() {
  useEffect(() => { document.title = "About — GenieMade"; }, []);

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 max-w-3xl pt-14 pb-20">
        {/* hero */}
        <span className="eyebrow">About · a CyberHope AI company</span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight">Make anything. <em className="gold-text italic">Prove it's yours.</em></h1>
        <p className="mt-5 text-lg text-muted-foreground">
          GenieMade is a creation studio. You describe what you want — an image, a video, a logo — and it makes it.
          The part no one else does: every single thing you create leaves here with a tamper-proof certificate that
          says <span className="text-foreground">you made it, and exactly when</span>. Think of it as a notary stamp
          baked into the file itself.
        </p>

        {/* what you do here — plain terms */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">What you can do here</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { i: Sparkles, t: "Create", d: "Type a description and get a finished image or video in seconds — plus tools like background removal for professionals." },
              { i: Fingerprint, t: "Own it", d: "Every creation is signed and certified the moment it's made, so it's provably yours from the first second." },
              { i: ShieldCheck, t: "Verify anything", d: "Drop in any image or video — ours or not — and check whether it carries real proof of who made it and when." },
              { i: Anchor, t: "Make it permanent", d: "With Triple Seal, that proof can be anchored to Bitcoin — so it survives, independently checkable, even without us." },
            ].map((c) => (
              <div key={c.t} className="cert-panel p-5">
                <c.i className="h-5 w-5" style={{ color: "#f5c451" }} />
                <div className="mt-3 font-display text-lg font-semibold">{c.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* why it matters */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>Why it matters</div>
          <h2 className="font-display text-2xl font-semibold">In a world of AI content, proof is the point.</h2>
          <p className="mt-4 text-muted-foreground">
            Anyone can generate a picture now. What's becoming rare — and valuable — is being able to <em>prove</em> where
            something came from: who created it, when, and that it hasn't been altered since. That's the layer GenieMade
            adds to everything you make. Not a watermark you can crop off, but a cryptographic certificate anyone can check.
          </p>
        </section>

        {/* the technology */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>The technology</div>
          <h2 className="font-display text-2xl font-semibold">How the proof works.</h2>
          <div className="mt-6 grid gap-5">
            <div>
              <h3 className="font-semibold text-foreground">QSeal™ — the signature</h3>
              <p className="mt-1 text-muted-foreground">Every creation is fingerprinted (a SHA-256 hash) and signed with a private cryptographic key (Ed25519). Anyone can check that signature against our public key — no account, no trust in us required. If a single pixel changes, the seal breaks.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">QSurface™ — the registry</h3>
              <p className="mt-1 text-muted-foreground">Seals are recorded in a hash-linked provenance ledger, so a creation's certificate is backed by an independent record of when it was registered and by whom.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Triple Seal — permanence you choose</h3>
              <p className="mt-1 text-muted-foreground">For work that has to outlive us, Triple Seal anchors the proof to public blockchains (Bitcoin, and Ethereum for the top tier). At that point the evidence lives on infrastructure no one owns — verifiable forever, with or without GenieMade.</p>
            </div>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            We also read the open C2PA / Content Credentials standard, so GenieMade can verify content sealed by other tools too — a neutral place to check provenance, not just our own.
          </p>
        </section>

        {/* the company */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>The company</div>
          <div className="cert-panel p-6">
            <Building2 className="h-6 w-6" style={{ color: "#f5c451" }} />
            <h2 className="mt-3 font-display text-2xl font-semibold">Built by CyberHope AI</h2>
            <p className="mt-3 text-muted-foreground">
              GenieMade is a product of <a href="https://cyberhopeai.com" target="_blank" rel="noopener" className="underline" style={{ color: "#66e3e8" }}>CyberHope AI</a>,
              a company building trust and provenance infrastructure for the AI era — the QSurface provenance layer and
              our PrecognitionOS platform. Our belief is simple: as more of the world is generated, people and businesses
              deserve a way to prove what's real and what's theirs. GenieMade is that idea made usable by anyone.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <a href="tel:+13179613077" className="hover:text-foreground">Call (317) 961-3077</a>
              <a href="mailto:genie@geniemadeit.com" className="hover:text-foreground">genie@geniemadeit.com</a>
            </div>
          </div>
        </section>

        {/* cta */}
        <section className="mt-14 border-t border-border pt-12 text-center">
          <h2 className="font-display text-3xl font-semibold">Create something — and own it for good.</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/app" className="btn-gold px-7 py-3.5 text-base no-underline"><Sparkles className="h-5 w-5" /> Start creating</Link>
            <Link href="/verify" className="rounded-xl border border-border px-7 py-3.5 text-base text-muted-foreground no-underline transition-colors hover:text-foreground">Verify a creation <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <GmFooter />
    </div>
  );
}
