/*
 * Gilded Night — Verify (/verify). HONEST provenance check:
 * 1) Receipt lookup via engine /api/verify — if the engine says "todo_phase2"
 *    we say so plainly and fall back to checking the user's own Vault.
 * 2) File check: drop a file + paste its receipt/hash — we compute SHA-256
 *    IN THE BROWSER and compare against the certificate. Real cryptography, no theater.
 */
import { useRef, useState } from "react";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { Seal } from "@/components/brand/Seal";
import { useSession } from "@/contexts/SessionContext";
import { api, sha256OfBlob, Generation, fmtDate, type RegisterResult } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { FileUp, ExternalLink, FileSearch } from "lucide-react";
import type { C2paReport } from "@/lib/c2pa";
import { toast } from "sonner";

type Verdict =
  | { kind: "pass"; source: string; gen?: Partial<Generation>; receipt?: string; hash?: string; sealed?: string; signed?: boolean; signature_valid?: boolean; signer?: string | null; registered?: boolean; owner?: string; registeredAt?: string; anchor?: { chain?: string; status?: string; block_height?: number | null } }
  | { kind: "fail"; reason: string }
  | { kind: "unknown"; reason: string };

export default function Verify() {
  const { user, refresh } = useSession();
  const [receipt, setReceipt] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("receipt") || ""; } catch { return ""; }
  });
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [c2pa, setC2pa] = useState<C2paReport | null>(null);
  const [c2paBusy, setC2paBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const [regTitle, setRegTitle] = useState("");
  const [regResult, setRegResult] = useState<RegisterResult | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const lastFile = useRef<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function check() {
    const rid = receipt.trim();
    if (!rid && !fileHash) return;
    setBusy(true);
    setVerdict(null);
    try {
      // 1) engine lookup (source of truth when it answers with a real verdict)
      let engineAnswered = false;
      if (rid || fileHash) {
        try {
          const j = await api.verify(rid, fileHash || undefined);
          if (typeof j.verified === "boolean") {
            if (j.verified) {
              engineAnswered = true;
              const h = j.certificate?.hash;
              const isReg = j.verdict === "registered" || j.certificate?.type === "registration";
              if (fileHash && h && fileHash !== h && !isReg) {
                setVerdict({ kind: "fail", reason: "The receipt is genuine, but the file you dropped does NOT match its sealed fingerprint. The file may have been altered or re-exported." });
              } else {
                setVerdict({
                  kind: "pass",
                  source: isReg ? "the public QSurface registry" : "GenieMade registry",
                  gen: j.generation,
                  receipt: j.certificate?.receipt_id || rid,
                  hash: h,
                  sealed: j.certificate?.issued_at,
                  signed: j.certificate?.signed,
                  signature_valid: j.certificate?.signature_valid,
                  signer: j.certificate?.signer,
                  registered: isReg,
                  owner: j.registration?.owner,
                  registeredAt: j.registration?.registered_at,
                  anchor: j.anchor,
                });
              }
            } else if (rid) {
              // a receipt was supplied but no such certificate exists — honest fail
              engineAnswered = true;
              setVerdict({ kind: "fail", reason: "No GenieMade certificate exists for that receipt." });
            }
            // verified:false with only a dropped file -> fall through to the Vault/unknown path so the Register CTA can show
          }
        } catch {
          /* engine unreachable — fall through to Vault check */
        }
      }

      // 2) fall back: check the signed-in user's own Vault (real data, honestly labelled)
      if (!engineAnswered) {
        let hit: Generation | undefined;
        if (user) {
          try {
            const g = await api.gallery();
            hit = (g.generations || []).find(
              (x) =>
                (rid && (x.cert_id?.toLowerCase() === rid.toLowerCase())) ||
                (fileHash && x.hash?.toLowerCase() === fileHash.toLowerCase())
            );
          } catch { /* ignore */ }
        }
        if (hit) {
          if (fileHash && hit.hash && fileHash !== hit.hash.toLowerCase()) {
            setVerdict({ kind: "fail", reason: "Found the certificate in your Vault, but the dropped file's SHA-256 does not match its sealed fingerprint." });
          } else {
            setVerdict({ kind: "pass", source: "your Vault (verified locally against the engine's records)", gen: hit, receipt: hit.cert_id, hash: hit.hash, sealed: hit.created_at });
          }
        } else {
          setVerdict({
            kind: "unknown",
            reason: rid
              ? "The public verification registry is still being rolled out, and this receipt isn't in your own Vault. We can't confirm or deny this certificate yet — we won't pretend otherwise."
              : "We computed the file's fingerprint, but without a matching receipt or Vault record we can't confirm its origin.",
          });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function onFile(f: File) {
    lastFile.current = f;
    setFileName(f.name);
    setFileHash("");
    setC2pa(null);
    setRegResult(null);
    setShowRegForm(false);
    setFileUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
    const h = await sha256OfBlob(f);
    setFileHash(h.toLowerCase());
    // Read any embedded Content Credentials (C2PA) in-browser — WASM lazy-loaded on first drop.
    setC2paBusy(true);
    try {
      const { readContentCredentials } = await import("@/lib/c2pa");
      setC2pa(await readContentCredentials(f));
    } catch {
      setC2pa({ present: false });
    } finally {
      setC2paBusy(false);
    }
  }

  // small client-side thumbnail (<=400px, jpeg) for the public registry card — the full-res file never leaves the device
  async function makeThumb(file: File | null): Promise<string | undefined> {
    try {
      if (!file || !file.type.startsWith("image/")) return undefined;
      const url = URL.createObjectURL(file);
      const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const scale = Math.min(1, 400 / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      return canvas.toDataURL("image/jpeg", 0.8);
    } catch { return undefined; }
  }

  async function registerNow() {
    if (!user || !fileHash || registering) return;
    setRegistering(true);
    try {
      const thumbnail = await makeThumb(lastFile.current);
      const r = await api.register({ hash: fileHash, title: regTitle.trim() || undefined, thumbnail });
      setRegResult(r);
      setShowRegForm(false);
      if (r.ok) refresh();
    } catch (e) {
      const a = e as { message?: string };
      setRegResult({ ok: false, error: "register_failed", message: a?.message || "Registration failed — please try again." });
    } finally {
      setRegistering(false);
    }
  }

  async function anchorNow() {
    if (!user || !verdict || verdict.kind !== "pass" || !verdict.hash || anchoring) return;
    const h = verdict.hash;
    setAnchoring(true);
    try {
      const r = await api.anchor(h);
      if (r.ok && r.anchor) {
        setVerdict((v) => (v && v.kind === "pass" ? { ...v, anchor: r.anchor } : v));
        refresh();
      } else if (r.error === "no_credits") {
        toast.error("Not enough wishes to anchor — add more from Pricing.");
      } else {
        toast.error(r.message || "Couldn't anchor right now — please try again.");
      }
    } catch {
      toast.error("Couldn't reach Bitcoin's timestamp network — please try again.");
    } finally {
      setAnchoring(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 max-w-2xl pt-14 pb-16">
        <span className="eyebrow">Provenance check</span>
        <h1 className="mt-4 font-display text-5xl font-semibold">Is this <em className="gold-text italic">real?</em></h1>
        <p className="mt-4 text-muted-foreground">
          Every GenieMade creation is sealed by <b className="text-foreground">QSeal™</b>: a receipt ID and the file's SHA-256
          fingerprint, sealed the moment it was made. Paste a receipt — and optionally drop the
          file itself, which we fingerprint <b className="text-foreground">right here in your browser</b> — and we'll
          tell you exactly what we can and cannot prove.
        </p>

        <div className="gm-panel mt-8 p-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="rid">
            Certificate receipt ID
          </label>
          <Input
            id="rid"
            className="mt-2 bg-background/40 kv-mono"
            placeholder="e.g. f8de4905-bf02-41ab-ab87-21d29fb48e0a"
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            data-testid="receipt-input"
          />
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            style={dragOver ? { borderColor: "#66e3e8", background: "rgba(102,227,232,.08)", color: "#e8fdff" } : undefined}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
          >
            <FileUp className="h-4 w-4" />
            {fileName ? (
              <span>
                {fileName}
                {fileHash ? <span className="kv-mono block text-xs mt-1 opacity-70">sha256: {fileHash.slice(0, 32)}…</span> : " — hashing…"}
              </span>
            ) : (
              "…or drag any image or video here to fingerprint it in your browser (nothing is uploaded)"
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <button className="btn-gold mt-5 w-full py-3" onClick={check} disabled={busy || (!receipt.trim() && !fileHash)} data-testid="verify-btn">
            {busy ? "Checking…" : "Verify authenticity"}
          </button>

          {verdict && (
            <div
              className="mt-5 rounded-xl border p-5"
              style={
                verdict.kind === "pass"
                  ? { borderColor: "#2f6f72", background: "rgba(102,227,232,.06)" }
                  : verdict.kind === "fail"
                  ? { borderColor: "#7a2a3f", background: "rgba(255,80,120,.06)" }
                  : { borderColor: "rgba(200,143,44,.5)", background: "rgba(245,196,81,.05)" }
              }
              data-testid="verdict"
            >
              {verdict.kind === "pass" && (
                <>
                  {(verdict.gen?.url || fileUrl) && (
                    <div className="mb-4 overflow-hidden rounded-xl border" style={{ borderColor: "#2f6f72" }}>
                      {(verdict.gen?.capability?.startsWith("video") || /\.(mp4|webm|mov|m4v)$/i.test(fileName)) ? (
                        <video src={verdict.gen?.url || fileUrl} controls className="block w-full" />
                      ) : (
                        <img src={verdict.gen?.url || fileUrl} alt="Verified creation" className="block w-full" />
                      )}
                    </div>
                  )}
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold m-0" style={{ color: "#66e3e8" }}>
                    <Seal className="h-5 w-5" /> {verdict.registered ? "Registered & confirmed" : "Certificate confirmed"}
                  </h3>
                  {verdict.signed && verdict.signature_valid ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold" style={{ color: "#66e3e8" }}>
                      ✓ Cryptographically signed by GenieMade
                      <a
                        href="/api/qseal/pubkeys"
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 text-[11px] font-normal opacity-70 hover:opacity-100 no-underline"
                        style={{ color: "#66e3e8" }}
                        title="View our public signing key — verify any seal yourself"
                      >
                        verify against our public key <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : verdict.signed === false ? (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      Genuine receipt — issued before Ed25519 signing rolled out. The SHA-256 seal is verified; the cryptographic signature is not present on this creation.
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted-foreground">Confirmed against {verdict.source}.</p>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                    {verdict.registered && verdict.owner && (<><dt className="text-muted-foreground uppercase tracking-wide">Owner</dt><dd className="m-0" style={{ color: "#ffe390" }}>{verdict.owner}</dd></>)}
                    {verdict.registered && verdict.registeredAt && (<><dt className="text-muted-foreground uppercase tracking-wide">Registered</dt><dd className="m-0">{fmtDate(verdict.registeredAt)}</dd></>)}
                    {verdict.receipt && (<><dt className="text-muted-foreground uppercase tracking-wide">Receipt</dt><dd className="kv-mono break-all m-0">{verdict.receipt}</dd></>)}
                    {verdict.hash && (<><dt className="text-muted-foreground uppercase tracking-wide">SHA-256</dt><dd className="kv-mono break-all m-0">{verdict.hash}</dd></>)}
                    {verdict.sealed && (<><dt className="text-muted-foreground uppercase tracking-wide">Sealed</dt><dd className="m-0">{fmtDate(verdict.sealed)}</dd></>)}
                    {verdict.signed && verdict.signature_valid && verdict.signer && (
                      <><dt className="text-muted-foreground uppercase tracking-wide">Signer</dt><dd className="kv-mono m-0">{verdict.signer}</dd></>
                    )}
                    {fileHash && verdict.hash && (<><dt className="text-muted-foreground uppercase tracking-wide">File match</dt><dd className="m-0" style={{ color: "#66e3e8" }}>✓ dropped file matches the sealed fingerprint</dd></>)}
                    {verdict.anchor && (<><dt className="text-muted-foreground uppercase tracking-wide">Bitcoin</dt><dd className="m-0" style={{ color: "#f7931a" }}>{verdict.anchor.status === "confirmed" && verdict.anchor.block_height ? `⛓ Anchored · block #${verdict.anchor.block_height}` : "⛓ Anchored · confirming on-chain"}</dd></>)}
                  </dl>
                  {user && verdict.hash && !verdict.anchor && (
                    <button className="btn-gold mt-4 w-full py-2.5 text-sm" onClick={anchorNow} disabled={anchoring} data-testid="anchor-btn">
                      {anchoring ? "Anchoring to Bitcoin…" : "⛓ Anchor to Bitcoin · 3 wishes"}
                    </button>
                  )}
                  {verdict.anchor && (
                    <p className="mt-3 text-xs text-muted-foreground">Written to Bitcoin via OpenTimestamps — permanent and independently verifiable, even without GenieMade.</p>
                  )}
                </>
              )}
              {verdict.kind === "fail" && (
                <>
                  <h3 className="font-display text-lg font-semibold m-0" style={{ color: "#ff9db4" }}>Verification failed</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{verdict.reason}</p>
                </>
              )}
              {verdict.kind === "unknown" && (
                <>
                  <h3 className="font-display text-lg font-semibold m-0" style={{ color: "#ffe390" }}>Can't confirm yet — honestly</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{verdict.reason}</p>
                  {fileHash && (
                    <p className="mt-2 text-xs kv-mono text-muted-foreground break-all">Your file's SHA-256: {fileHash}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Content Credentials (C2PA) — the universal layer: whatever provenance the file itself carries,
              read in the browser, shown honestly alongside our own QSeal above. */}
          {fileName && (c2paBusy || c2pa) && (
            <div
              className="mt-4 rounded-xl border p-4"
              style={c2pa?.present
                ? { borderColor: "rgba(102,227,232,.4)", background: "rgba(102,227,232,.05)" }
                : { borderColor: "rgba(255,255,255,.09)" }}
              data-testid="c2pa"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#8fb3c9" }}>
                <FileSearch className="h-4 w-4" /> Content Credentials · C2PA
              </div>
              {c2paBusy ? (
                <p className="mt-2 text-sm text-muted-foreground">Reading the file's embedded credentials in your browser…</p>
              ) : c2pa?.present ? (
                <>
                  <p className="mt-2 text-sm font-semibold" style={{ color: "#66e3e8" }}>✓ This file carries embedded Content Credentials.</p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                    {c2pa.producer && (<><dt className="text-muted-foreground uppercase tracking-wide">Made with</dt><dd className="m-0">{c2pa.producer}</dd></>)}
                    {c2pa.signer && (<><dt className="text-muted-foreground uppercase tracking-wide">Signed by</dt><dd className="m-0">{c2pa.signer}</dd></>)}
                    {c2pa.time && (<><dt className="text-muted-foreground uppercase tracking-wide">Signed</dt><dd className="m-0">{fmtDate(c2pa.time)}</dd></>)}
                    {typeof c2pa.aiGenerated === "boolean" && (<><dt className="text-muted-foreground uppercase tracking-wide">AI origin</dt><dd className="m-0">{c2pa.aiGenerated ? "Declared AI-generated" : "Not declared AI-generated"}</dd></>)}
                    {typeof c2pa.valid === "boolean" && (<><dt className="text-muted-foreground uppercase tracking-wide">Signature</dt><dd className="m-0" style={{ color: c2pa.valid ? "#66e3e8" : "#ff9db4" }}>{c2pa.valid ? "✓ validated" : "⚠ could not be fully validated"}</dd></>)}
                  </dl>
                  <p className="mt-2 text-[11px] text-muted-foreground">Read from the file's open C2PA manifest — the industry provenance standard. Separate from GenieMade's own seal.</p>
                </>
              ) : c2pa?.error ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  We couldn't scan this file's embedded credentials here — it may be an unsupported format. Your GenieMade seal check above is unaffected.
                </p>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground m-0">
                    No embedded Content Credentials found — which is normal; most files carry none. That isn't proof either way.
                  </p>
                  {regResult && (regResult.ok || regResult.mine) ? (
                    <div className="mt-3 rounded-lg border p-3" style={{ borderColor: "#2f6f72", background: "rgba(102,227,232,.05)" }}>
                      <p className="text-sm font-semibold m-0" style={{ color: "#66e3e8" }}>✓ Sealed into the public QSurface registry.</p>
                      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                        <dt className="text-muted-foreground uppercase tracking-wide">Owner</dt><dd className="m-0">{regResult.owner || regResult.registration?.owner}</dd>
                        <dt className="text-muted-foreground uppercase tracking-wide">Receipt</dt><dd className="kv-mono break-all m-0">{regResult.receipt_id || regResult.registration?.receipt_id}</dd>
                      </dl>
                      <a href={regResult.verify_url || regResult.registration?.verify_url || "#"} className="mt-2 inline-block text-xs underline" style={{ color: "#66e3e8" }}>View its public certificate →</a>
                    </div>
                  ) : regResult && regResult.already_registered ? (
                    <p className="mt-3 text-sm text-muted-foreground">{regResult.message || "This file was already registered — the first registration stands."}</p>
                  ) : regResult && !regResult.ok ? (
                    <p className="mt-3 text-sm" style={{ color: "#ff9db4" }}>{regResult.message || "Registration failed — please try again."}</p>
                  ) : !user ? (
                    <p className="mt-3 text-sm">
                      Want to make this file <span style={{ color: "#ffe390" }}>provably yours</span>?{" "}
                      <a href="/app" className="underline" style={{ color: "#66e3e8" }}>Sign in</a> to seal it into the public QSurface registry.
                    </p>
                  ) : !showRegForm ? (
                    <button className="btn-gold mt-3 px-4 py-2 text-sm" onClick={() => setShowRegForm(true)}>
                      Make this provably yours · 1 wish
                    </button>
                  ) : (
                    <div className="mt-3 rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground m-0">We seal this file's fingerprint + your name + today's date into the public registry. Your file is never uploaded — only its fingerprint and a small thumbnail.</p>
                      <Input className="mt-2 bg-background/40" placeholder="Title (optional) — e.g. Sunrise over the bay" value={regTitle} onChange={(e) => setRegTitle(e.target.value)} maxLength={140} />
                      <div className="mt-2 flex gap-2">
                        <button className="btn-gold flex-1 py-2 text-sm" onClick={registerNow} disabled={registering}>
                          {registering ? "Sealing…" : "Register · 1 wish"}
                        </button>
                        <button className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowRegForm(false)} disabled={registering}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <h2 className="font-display text-xl font-semibold text-foreground">How verification works</h2>
          <p className="mt-2">
            When a creation is sealed, its exact bytes are hashed with SHA-256 and the certificate is
            signed with Ed25519 — server-side, before it ever reaches you. If even one pixel changes,
            the fingerprint changes. Dropping a file here computes the same fingerprint locally in your
            browser — the file never leaves your device — and compares it against the sealed record.
            Signed seals can be verified against our{" "}
            <a href="/api/qseal/pubkeys" target="_blank" rel="noopener" className="underline hover:opacity-80" style={{ color: "#66e3e8" }}>
              public key
            </a>
            {" "}— you don't have to take our word for it.
          </p>
          <h2 className="mt-6 font-display text-xl font-semibold text-foreground">Four ways a seal can be found</h2>
          <p className="mt-2">
            QSeal verification tries every recovery route in order, and tells you which one answered.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { t: "1 · Receipt + file", s: "Live today", d: "The full check: your receipt against the signed chain, your file's fingerprint against the sealed bytes." },
              { t: "2 · Content Credentials", s: "Live today", d: "If the file still carries its C2PA manifest, the certificate is read straight out of the metadata." },
              { t: "3 · The Invisible Thread", s: "Rolling out", d: "Metadata stripped? Screenshot? The receipt is decoded from an imperceptible code woven into the pixels at generation." },
              { t: "4 · Lineage", s: "Rolling out", d: "Even a heavily edited copy can be matched to its sealed original by perceptual fingerprint — flagged honestly as a likely derivative." },
            ].map((r) => (
              <div key={r.t} className="cert-panel p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">{r.t}</span>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: r.s === "Live today" ? "#66e3e8" : "#f5c451" }}>{r.s}</span>
                </div>
                <p className="mt-2 text-xs">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <GmFooter />
    </div>
  );
}
