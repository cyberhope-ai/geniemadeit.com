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
import { api, sha256OfBlob, Generation, fmtDate } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { FileUp } from "lucide-react";

type Verdict =
  | { kind: "pass"; source: string; gen?: Partial<Generation>; receipt?: string; hash?: string; sealed?: string }
  | { kind: "fail"; reason: string }
  | { kind: "unknown"; reason: string };

export default function Verify() {
  const { user } = useSession();
  const [receipt, setReceipt] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("receipt") || ""; } catch { return ""; }
  });
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function check() {
    const rid = receipt.trim();
    if (!rid && !fileHash) return;
    setBusy(true);
    setVerdict(null);
    try {
      // 1) engine lookup (source of truth when it answers with a real verdict)
      let engineAnswered = false;
      if (rid) {
        try {
          const j = await api.verify(rid);
          if (typeof j.verified === "boolean") {
            engineAnswered = true;
            if (j.verified) {
              const h = j.certificate?.hash;
              if (fileHash && h && fileHash !== h) {
                setVerdict({ kind: "fail", reason: "The receipt is genuine, but the file you dropped does NOT match its sealed fingerprint. The file may have been altered or re-exported." });
              } else {
                setVerdict({ kind: "pass", source: "GenieMade registry", gen: j.generation, receipt: j.certificate?.receipt_id || rid, hash: h, sealed: j.certificate?.issued_at });
              }
            } else {
              setVerdict({ kind: "fail", reason: "No GenieMade certificate exists for that receipt." });
            }
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
    setFileName(f.name);
    setFileHash("");
    const h = await sha256OfBlob(f);
    setFileHash(h.toLowerCase());
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
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            {fileName ? (
              <span>
                {fileName}
                {fileHash ? <span className="kv-mono block text-xs mt-1 opacity-70">sha256: {fileHash.slice(0, 32)}…</span> : " — hashing…"}
              </span>
            ) : (
              "…or drop the file here to fingerprint it in your browser (nothing is uploaded)"
            )}
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
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
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold m-0" style={{ color: "#66e3e8" }}>
                    <Seal className="h-5 w-5" /> Certificate confirmed
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">Confirmed against {verdict.source}.</p>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                    {verdict.receipt && (<><dt className="text-muted-foreground uppercase tracking-wide">Receipt</dt><dd className="kv-mono break-all m-0">{verdict.receipt}</dd></>)}
                    {verdict.hash && (<><dt className="text-muted-foreground uppercase tracking-wide">SHA-256</dt><dd className="kv-mono break-all m-0">{verdict.hash}</dd></>)}
                    {verdict.sealed && (<><dt className="text-muted-foreground uppercase tracking-wide">Sealed</dt><dd className="m-0">{fmtDate(verdict.sealed)}</dd></>)}
                    {fileHash && verdict.hash && (<><dt className="text-muted-foreground uppercase tracking-wide">File match</dt><dd className="m-0" style={{ color: "#66e3e8" }}>✓ dropped file matches the sealed fingerprint</dd></>)}
                  </dl>
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
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <h2 className="font-display text-xl font-semibold text-foreground">How verification works</h2>
          <p className="mt-2">
            When a creation is sealed, its exact bytes are hashed with SHA-256 and stored with a
            receipt ID. If even one pixel changes, the fingerprint changes. Dropping a file here
            computes the same fingerprint locally in your browser — the file never leaves your
            device — and compares it against the sealed record. Public registry lookup is rolling
            out; where it isn't live yet, we say so instead of guessing.
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
