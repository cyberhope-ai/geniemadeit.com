/*
 * /developers — the public API quickstart. Everything here is REAL and live: the endpoints, the
 * X-Api-Key auth, the code samples. The five-minute on-ramp the whole platform funnels through.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { ShieldCheck, Fingerprint, Anchor, ImageOff, KeyRound, ArrowRight } from "lucide-react";

const BASE = "https://geniemadeit.com/api";

const ENDPOINTS = [
  { m: "POST", p: "/api/verify", i: ShieldCheck, d: "Check any file's provenance — our seal, or the public registry.", body: '{ "receipt_id": "…" }  // or { "hash": "<sha-256>" }', auth: false },
  { m: "POST", p: "/api/register", i: Fingerprint, d: "Seal & authenticate a file into the QSurface registry.", body: '{ "hash": "<sha-256>", "owner_name": "Acme", "title": "…" }', auth: true },
  { m: "POST", p: "/api/anchor", i: Anchor, d: "Anchor a seal to Bitcoin — permanent, independently verifiable.", body: '{ "hash": "<sha-256>" }', auth: true },
  { m: "POST", p: "/api/removebg", i: ImageOff, d: "Remove a background and get a sealed cut-out back.", body: '{ "image": "data:image/png;base64,…" }', auth: true },
];

function Code({ label, children }: { label: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-[color:rgba(255,255,255,.03)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed" style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)", color: "#cfeff1" }}><code>{children}</code></pre>
    </div>
  );
}

export default function Developers() {
  useEffect(() => { document.title = "Developers — the GenieMade API"; }, []);

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 max-w-4xl pt-14 pb-20">
        {/* hero */}
        <span className="eyebrow">Developers · the Trust API</span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight">Build on <em className="gold-text italic">GenieMade.</em></h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Seal, verify, and anchor content from your own site or app with one call. The same API that powers our
          studio — authentication as infrastructure. You're live in five minutes.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/account#api-keys" className="btn-gold px-6 py-3 text-base no-underline"><KeyRound className="h-4 w-4" /> Get an API key</Link>
          <a href="#quickstart" className="rounded-xl border border-border px-6 py-3 text-base text-muted-foreground no-underline transition-colors hover:text-foreground">Quickstart <ArrowRight className="ml-1 inline h-4 w-4" /></a>
        </div>

        {/* auth */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>Authentication</div>
          <h2 className="font-display text-2xl font-semibold">One header. That's it.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Create a key in <Link href="/account#api-keys" className="underline" style={{ color: "#66e3e8" }}>Account → API Keys</Link> (shown once — store it safely),
            then pass it on every request. Calls run against your account and credits; keep the key server-side.
          </p>
          <div className="mt-4"><Code label="header">{`X-Api-Key: gm_live_xxxxxxxxxxxxxxxxxxxxxxxx`}</Code></div>
          <p className="mt-3 text-sm text-muted-foreground">Base URL: <span className="kv-mono" style={{ color: "#f5c451" }}>{BASE}</span></p>
        </section>

        {/* quickstart */}
        <section id="quickstart" className="mt-12 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>Quickstart</div>
          <h2 className="font-display text-2xl font-semibold">Seal your first file.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Hash your file (SHA-256), then register it. You get back a receipt and a public verify URL — proof it's yours, from this moment.</p>
          <div className="mt-5 grid gap-4">
            <Code label="curl">{`curl -X POST ${BASE}/register \\
  -H "X-Api-Key: gm_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "hash": "<sha-256 of your file>", "owner_name": "Acme Studios" }'

# → { "ok": true, "receipt_id": "…", "verify_url": "/verify?receipt=…" }`}</Code>
            <Code label="javascript (node / browser)">{`const res = await fetch("${BASE}/register", {
  method: "POST",
  headers: { "X-Api-Key": "gm_live_…", "Content-Type": "application/json" },
  body: JSON.stringify({ hash, owner_name: "Acme Studios" }),
});
const { receipt_id, verify_url } = await res.json();`}</Code>
            <Code label="python">{`import requests
r = requests.post("${BASE}/register",
    headers={"X-Api-Key": "gm_live_…"},
    json={"hash": sha256_hex, "owner_name": "Acme Studios"})
print(r.json()["receipt_id"])`}</Code>
          </div>
        </section>

        {/* endpoints */}
        <section className="mt-12 border-t border-border pt-10">
          <div className="kicker mb-3 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#66e3e8" }}>Endpoints</div>
          <h2 className="font-display text-2xl font-semibold">Four calls, all live.</h2>
          <div className="mt-5 grid gap-3">
            {ENDPOINTS.map((e) => (
              <div key={e.p} className="cert-panel p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="kv-mono rounded px-2 py-0.5 text-xs font-bold" style={{ background: "#66e3e8", color: "#0b0d12" }}>{e.m}</span>
                  <span className="kv-mono text-sm text-foreground">{e.p}</span>
                  {e.auth
                    ? <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground"><KeyRound className="h-3 w-3" /> key required</span>
                    : <span className="ml-auto text-[11px] text-muted-foreground">public</span>}
                </div>
                <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground"><e.i className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#f5c451" }} />{e.d}</p>
                <div className="kv-mono mt-2 rounded-lg bg-[color:rgba(0,0,0,.35)] px-3 py-2 text-xs" style={{ color: "#9fd8dd" }}>{e.body}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Every seal you create is Ed25519-signed and independently verifiable — your users can check it themselves against our <a href="/api/qseal/pubkeys" className="underline" style={{ color: "#66e3e8" }}>public key</a>.</p>
        </section>

        {/* build + earn */}
        <section className="mt-12 border-t border-border pt-10">
          <div className="cert-panel p-6" style={{ background: "linear-gradient(180deg, rgba(245,196,81,.06), transparent)" }}>
            <div className="kicker mb-2 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#f5c451" }}>Build &amp; earn — coming soon</div>
            <h2 className="font-display text-2xl font-semibold">Put the seal on your users' content — and get rewarded for it.</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Soon you'll drop in a "Verify with Triple Seal" badge and earn credits or revenue-share for every seal and
              verification you send our way. The more places the seal appears, the more it's worth — and you share in it.
            </p>
            <Link href="/triple-seal" className="mt-4 inline-flex items-center gap-1 text-sm underline" style={{ color: "#66e3e8" }}>See where this goes — Triple Seal <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </section>

        {/* cta */}
        <section className="mt-14 border-t border-border pt-12 text-center">
          <h2 className="font-display text-3xl font-semibold">Authentication, in five minutes.</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/account#api-keys" className="btn-gold px-7 py-3.5 text-base no-underline"><KeyRound className="h-5 w-5" /> Get your API key</Link>
            <Link href="/verify" className="rounded-xl border border-border px-7 py-3.5 text-base text-muted-foreground no-underline transition-colors hover:text-foreground">Try Verify first</Link>
          </div>
        </section>
      </main>
      <GmFooter />
    </div>
  );
}
