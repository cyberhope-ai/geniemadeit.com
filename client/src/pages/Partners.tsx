/*
 * /partners — the PUBLIC affiliate program page (recruiting). Separate from /affiliates (the admin console).
 * There's no self-serve signup yet — Rick approves partners and issues codes from the console — so the CTA is
 * an application email. Honest about how it works, the commission, and the ground rules.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { Link2, Share2, DollarSign, ShieldCheck, Clock, BadgeCheck, Mail } from "lucide-react";

const APPLY = "mailto:genie@geniemadeit.com?subject=GenieMade%20Partner%20Program%20application&body=Hi%20GenieMade%20team%2C%0A%0AI%27d%20like%20to%20join%20the%20partner%20program.%0A%0AName%3A%0AWebsite%2Faudience%3A%0AHow%20I%27d%20promote%20GenieMade%3A%0A%0AThanks!";

export default function Partners() {
  useEffect(() => { document.title = "Partner Program — GenieMade"; }, []);

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 max-w-4xl pt-14 pb-20">
        {/* hero */}
        <span className="eyebrow">Partner program</span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight">Earn with <em className="gold-text italic">GenieMade.</em></h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Share the only AI studio that proves what it makes — cryptographic, blockchain-anchored authenticity on
          every creation — and earn a commission on every customer you bring. It's free to join and takes one link.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a href={APPLY} className="btn-gold px-6 py-3 text-base no-underline"><Mail className="h-4 w-4" /> Apply to join</a>
          <Link href="/about" className="rounded-xl border border-border px-6 py-3 text-base text-muted-foreground no-underline transition-colors hover:text-foreground">What is GenieMade?</Link>
        </div>

        {/* how it works */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>How it works</div>
          <h2 className="font-display text-2xl font-semibold">Three steps. No code.</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { i: Link2, t: "Get your link", d: "We approve you and issue a personal referral link — geniemadeit.com/?ref=you." },
              { i: Share2, t: "Share it", d: "Drop it in a newsletter, a review, a tutorial, your tech-stack page — anywhere your audience is." },
              { i: DollarSign, t: "Earn", d: "When someone buys through your link, you earn commission. We track it automatically for 60 days after the click." },
            ].map((s, n) => (
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
        </section>

        {/* commission */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>The deal</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="gm-panel p-5">
              <div className="font-display text-4xl font-semibold gold-text">30%</div>
              <div className="mt-1 text-sm text-muted-foreground">commission on every referred order. Top partners earn more.</div>
            </div>
            <div className="gm-panel p-5">
              <div className="flex items-center gap-2 font-display text-2xl font-semibold"><Clock className="h-5 w-5" style={{ color: "#66e3e8" }} /> 60 days</div>
              <div className="mt-1 text-sm text-muted-foreground">cookie window — you get credit even if they buy later.</div>
            </div>
            <div className="gm-panel p-5">
              <div className="flex items-center gap-2 font-display text-2xl font-semibold"><BadgeCheck className="h-5 w-5" style={{ color: "#66e3e8" }} /> Net-30</div>
              <div className="mt-1 text-sm text-muted-foreground">commissions clear after 30 days, then pay out monthly (min $50).</div>
            </div>
          </div>
        </section>

        {/* why promote */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>Why it converts</div>
          <h2 className="font-display text-2xl font-semibold">You're promoting something genuinely different.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            GenieMade isn't another image generator. It's the one that gives every creation a Triple Seal —
            provable, independently verifiable authenticity that creators, professionals, and businesses increasingly
            need. That's a story worth telling, and an easy one to sell.
          </p>
        </section>

        {/* ground rules */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: "#f5c451" }} />
            <div>
              <h2 className="font-display text-xl font-semibold">A few ground rules</h2>
              <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                <li>• Disclose your affiliate relationship (FTC / your local equivalent).</li>
                <li>• No self-referrals, and no paid search bidding on our brand terms.</li>
                <li>• Promote GenieMade and the Triple Seal accurately — no exaggerated claims.</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Full terms are shared when you're approved.</p>
            </div>
          </div>
        </section>

        {/* cta */}
        <section className="mt-14 border-t border-border pt-12 text-center">
          <h2 className="font-display text-3xl font-semibold">Ready to partner up?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Tell us who you are and how you'd share GenieMade. We approve partners personally and get your link to you fast.</p>
          <div className="mt-6 flex justify-center">
            <a href={APPLY} className="btn-gold px-7 py-3.5 text-base no-underline"><Mail className="h-5 w-5" /> Apply to join</a>
          </div>
        </section>
      </main>
      <GmFooter />
    </div>
  );
}
