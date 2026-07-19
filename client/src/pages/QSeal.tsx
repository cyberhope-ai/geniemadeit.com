/**
 * QSeal deep-dive page — Gilded Night design system.
 * Audience: B2B / API (publishers, legal, media) + curious creators.
 * Style: night-violet bg, gold #f5c451, teal #66e3e8, Fraunces display + Outfit body.
 * Honesty: never overclaim — no "unbreakable", no "blockchain", "built on C2PA standard".
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { Seal } from "@/components/brand/Seal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/api";
import { ShieldCheck, KeyRound, Fingerprint, Waves, FileCheck2, ExternalLink, ArrowRight, Building2, Scale, Newspaper } from "lucide-react";

const QSEAL_LOGO = "/brand/qseal_logo.jpg";
const QSEAL_HERO = "/brand/qseal_hero.jpg";
const DEMO_RECEIPT = "c89f1b07-443a-4b74-b5b0-8c80c48bf7ad";

type DemoState =
  | { s: "idle" }
  | { s: "checking" }
  | { s: "done"; verified: boolean; hash?: string; issued?: string; signed?: boolean; sigValid?: boolean; signer?: string | null }
  | { s: "error"; msg: string };

export default function QSeal() {
  const [demo, setDemo] = useState<DemoState>({ s: "idle" });
  const [rid, setRid] = useState(DEMO_RECEIPT);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [joined, setJoined] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "QSeal™ — cryptographic provenance for AI-made content"; }, []);

  async function runDemo() {
    const id = rid.trim();
    if (!id) return;
    setDemo({ s: "checking" });
    try {
      const r = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_id: id }),
      });
      const j = await r.json().catch(() => null);
      if (j && typeof j.verified === "boolean") {
        setDemo({
          s: "done",
          verified: j.verified,
          hash: j.certificate?.hash,
          issued: j.certificate?.issued_at,
          signed: j.certificate?.signed,
          sigValid: j.certificate?.signature_valid,
          signer: j.certificate?.signer,
        });
      } else {
        setDemo({ s: "error", msg: "The registry could not process this receipt. Try the sample receipt above." });
      }
    } catch {
      setDemo({ s: "error", msg: "Could not reach the verification registry. Please try again." });
    }
  }

  function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Enter a valid email address."); return; }
    // Honest handling: there is no waitlist endpoint yet — store intent locally and via mailto.
    const subject = encodeURIComponent("QSeal API waitlist");
    const body = encodeURIComponent(`Please add me to the QSeal API waitlist.\n\nEmail: ${email}\nCompany: ${company || "—"}`);
    window.open(`mailto:hello@geniemadeit.com?subject=${subject}&body=${body}`, "_blank");
    setJoined(true);
  }

  return (
    <div className="min-h-screen">
      <GmNav />

      {/* HERO */}
      <section className="container relative z-10 pt-16 md:pt-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="eyebrow">QSeal™ · patent pending · a CyberHope AI technology</span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-tight md:text-6xl">
              Proof, <em className="gold-text italic">woven into the work.</em>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              QSeal is a provenance layer for AI-made content: every creation is fingerprinted with
              SHA-256, sealed into a tamper-evident chain, and signed with Ed25519 — server-side,
              the instant it is generated. Anyone, anywhere can verify a seal against our public key.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="font-semibold" onClick={() => demoRef.current?.scrollIntoView({ behavior: "smooth" })}>
                Try the live demo <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <a href="#api"><Button size="lg" variant="outline">Join the API waitlist</Button></a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Live in production today on every GenieMade creation.</p>
          </div>
          <div className="deco-corners overflow-hidden rounded-3xl border border-border shadow-2xl">
            <img src={QSEAL_HERO} alt="QSeal — golden seal weaving provenance threads into a newly generated image" className="w-full" />
          </div>
        </div>
      </section>

      {/* THE MARK */}
      <section className="container relative z-10 pt-24">
        <div className="deco-divider mb-16 text-xs"><span>✦</span></div>
        <div className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
          <img src={QSEAL_LOGO} alt="The QSeal mark" className="mx-auto h-40 w-40 md:h-52 md:w-52" />
          <div>
            <span className="eyebrow">The mark</span>
            <h2 className="mt-3 font-display text-3xl font-semibold">One seal. <em className="gold-text italic">Three bindings.</em></h2>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              The QSeal mark stands for a specific, verifiable promise: the content it accompanies was
              sealed at the moment of creation, and that seal can be checked by anyone — no account,
              no trust in us required. Wherever you see the seal, there is a receipt behind it.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { i: Fingerprint, t: "Fingerprint", d: "SHA-256 of the exact bytes, sealed into a tamper-evident chain." },
                { i: KeyRound, t: "Signature", d: "Ed25519-signed certificate — forgery needs our private key." },
                { i: Waves, t: "Invisible Thread", d: "In-pixel mark that survives screenshots. Rolling out." },
              ].map((f) => (
                <div key={f.t} className="cert-panel p-4">
                  <f.i className="h-5 w-5" style={{ color: "#f5c451" }} />
                  <div className="mt-2 font-display font-semibold">{f.t}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PATENT STORY */}
      <section className="container relative z-10 pt-24">
        <div className="deco-divider mb-16 text-xs"><span>✦</span></div>
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Why it exists</span>
          <h2 className="mt-3 font-display text-3xl font-semibold">Certificates get stripped. <em className="gold-text italic">Seals survive.</em></h2>
          <div className="mt-5 space-y-4 text-muted-foreground">
            <p>
              Metadata-based provenance — including the open C2PA standard our certificates build on —
              has a known weakness: a screenshot or re-upload silently discards it. The industry's answer
              is <b className="text-foreground">durable credentials</b>: bind the proof to the pixels themselves,
              not just the file wrapper.
            </p>
            <p>
              QSeal (patent pending) is our implementation of that idea, engineered for content that is
              <b className="text-foreground"> born digital</b>. Because GenieMade controls the moment of generation,
              the seal is applied before the creation ever reaches the user — hash first, sign always,
              and (rolling out) an imperceptible in-pixel mark carrying a durable link back to the receipt.
              Four independent recovery routes mean a seal can be found even when metadata is long gone.
            </p>
            <p>
              Built on <b className="text-foreground">QSurfaces™</b>, our substrate for embedding machine-readable
              structure into generated surfaces — the foundation that lets one seal serve images today and
              video, audio, and physical prints tomorrow.
            </p>
          </div>
        </div>
      </section>

      {/* LIVE DEMO */}
      <section ref={demoRef} className="container relative z-10 pt-24" id="demo">
        <div className="deco-divider mb-16 text-xs"><span>✦</span></div>
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow">Live demonstration</span>
          <h2 className="mt-3 font-display text-3xl font-semibold">Verify a real seal, <em className="gold-text italic">right now.</em></h2>
          <p className="mt-3 text-sm text-muted-foreground">
            This is not a mock. The receipt below belongs to a real sealed creation; the check below hits
            the same production registry the <Link href="/verify" className="underline" style={{ color: "#66e3e8" }}>public verify tool</Link> uses.
          </p>
          <div className="cert-panel mt-6 p-6">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="qs-rid">Certificate receipt ID</label>
            <div className="mt-2 flex gap-2">
              <Input id="qs-rid" value={rid} onChange={(e) => setRid(e.target.value)} className="kv-mono text-xs" />
              <Button onClick={runDemo} disabled={demo.s === "checking"} className="shrink-0 font-semibold">
                {demo.s === "checking" ? "Checking…" : "Verify"}
              </Button>
            </div>
            {demo.s === "done" && (
              <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
                {demo.verified ? (
                  <>
                    <div className="flex items-center gap-2 font-display font-semibold" style={{ color: "#66e3e8" }}>
                      <ShieldCheck className="h-5 w-5" /> Seal confirmed against the registry
                    </div>
                    {demo.signed && demo.sigValid ? (
                      <div className="mt-2 text-sm font-semibold" style={{ color: "#66e3e8" }}>
                        ✓ Ed25519 signature valid
                        <a href="/api/qseal/pubkeys" target="_blank" rel="noopener" className="ml-2 inline-flex items-center gap-1 text-[11px] font-normal underline opacity-80" style={{ color: "#66e3e8" }}>
                          check our public key <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : demo.signed === false ? (
                      <p className="mt-2 text-xs italic text-muted-foreground">Genuine receipt, issued before signing rolled out.</p>
                    ) : null}
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                      {demo.hash && (<><dt className="uppercase tracking-wide text-muted-foreground">SHA-256</dt><dd className="kv-mono break-all m-0">{demo.hash}</dd></>)}
                      {demo.issued && (<><dt className="uppercase tracking-wide text-muted-foreground">Sealed</dt><dd className="m-0">{fmtDate(demo.issued)}</dd></>)}
                      {demo.signer && (<><dt className="uppercase tracking-wide text-muted-foreground">Signer</dt><dd className="kv-mono m-0">{demo.signer}</dd></>)}
                    </dl>
                  </>
                ) : (
                  <div className="text-sm" style={{ color: "#ff9d87" }}>
                    No seal found for this receipt — the registry has no record of it. That's the point:
                    an invented receipt fails, honestly.
                  </div>
                )}
              </div>
            )}
            {demo.s === "error" && <p className="mt-4 text-sm" style={{ color: "#ff9d87" }}>{demo.msg}</p>}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR + API WAITLIST */}
      <section className="container relative z-10 pt-24 pb-24" id="api">
        <div className="deco-divider mb-16 text-xs"><span>✦</span></div>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <span className="eyebrow">QSeal API — coming</span>
            <h2 className="mt-3 font-display text-3xl font-semibold">Seal your own content. <em className="gold-text italic">Verify anyone's.</em></h2>
            <p className="mt-3 text-muted-foreground">
              The same seal-and-verify pipeline that runs inside GenieMade, exposed as an API:
              seal at generation, verify by receipt, decode in-pixel marks, trace lineage.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { i: Newspaper, t: "Publishers & platforms", d: "Verify user-submitted media before it runs; show a provenance badge your audience can check themselves." },
                { i: Scale, t: "Legal & compliance", d: "Timestamped, signed, tamper-evident records of what was generated, when, from what inputs." },
                { i: Building2, t: "Brands & agencies", d: "Seal every asset your pipeline produces — provable ownership across every re-share." },
              ].map((a) => (
                <div key={a.t} className="cert-panel flex items-start gap-3 p-4">
                  <a.i className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#f5c451" }} />
                  <div>
                    <div className="font-display font-semibold">{a.t}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="cert-panel self-start p-6">
            <div className="flex items-center gap-3">
              <img src={QSEAL_LOGO} alt="" className="h-10 w-10" />
              <h3 className="font-display text-xl font-semibold m-0">Join the API waitlist</h3>
            </div>
            {joined ? (
              <div className="mt-5 rounded-xl border border-border bg-background/40 p-4 text-sm" style={{ color: "#66e3e8" }}>
                <FileCheck2 className="mb-1 h-5 w-5" /> Thank you — your email draft is ready to send.
                We reply to every waitlist request personally.
              </div>
            ) : (
              <form onSubmit={joinWaitlist} className="mt-5 space-y-3">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="wl-email">Work email</label>
                  <Input id="wl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="wl-co">Company (optional)</label>
                  <Input id="wl-co" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Media" className="mt-1" />
                </div>
                <Button type="submit" className="w-full font-semibold">Request early access</Button>
                <p className="text-[11px] text-muted-foreground">
                  Opens a pre-filled email to our team — no marketing list, no spam. The API is in
                  development; waitlist members get first access and launch pricing.
                </p>
              </form>
            )}
            <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Seal className="h-4 w-4" /> Want to see it as a creator? <Link href="/app" className="underline" style={{ color: "#f5c451" }}>Open the Studio</Link></div>
            </div>
          </div>
        </div>
      </section>

      <GmFooter />
    </div>
  );
}
