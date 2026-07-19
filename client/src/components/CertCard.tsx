/* Gilded Night — certificate of authenticity card. All fields from the live engine. */
import { Seal } from "@/components/brand/Seal";
import { Certificate, fmtDate, shortHash } from "@/lib/api";
import { toast } from "sonner";
import { Copy } from "lucide-react";

const CERT_BG = "/brand/gm_certificate_texture.jpg";

interface Props {
  cert?: Certificate | null;
  model?: string;
  prompt?: string;
  capability?: string;
  compact?: boolean;
}

function Row({ k, v, copyable }: { k: string; v: string; copyable?: boolean }) {
  return (
    <>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground/80 pt-0.5">{k}</dt>
      <dd className="kv-mono text-xs break-all flex items-start gap-1.5 m-0">
        <span>{v}</span>
        {copyable && v !== "—" && (
          <button
            aria-label={`Copy ${k}`}
            className="opacity-50 hover:opacity-100 shrink-0 mt-px"
            onClick={() => {
              navigator.clipboard.writeText(v);
              toast.success(`${k} copied`);
            }}
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </dd>
    </>
  );
}

export function CertCard({ cert, model, prompt, capability, compact }: Props) {
  return (
    <div
      className="rounded-2xl border p-5 relative overflow-hidden"
      style={{
        borderColor: "rgba(200,143,44,.45)",
        backgroundImage: `linear-gradient(rgba(19,10,38,.55), rgba(19,10,38,.75)), url(${CERT_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#ffe390" }}>
        <Seal className="w-5 h-5" /> Certificate of authenticity
      </div>
      {prompt && !compact && (
        <p className="mt-2 text-sm text-muted-foreground italic line-clamp-2">“{prompt}”</p>
      )}
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <Row k="Receipt" v={cert?.receipt_id || "—"} copyable />
        <Row k="Sealed" v={fmtDate(cert?.issued_at)} />
        <Row k="SHA-256" v={compact ? shortHash(cert?.hash, 24) : cert?.hash || "—"} copyable />
        {model && <Row k="Engine" v={model} />}
        {capability && <Row k="Type" v={capability} />}
        <Row k="Credentials" v={cert ? (cert.c2pa ? "C2PA embedded" : "SHA-256 sealed · C2PA embedding coming") : "—"} />
      </dl>
    </div>
  );
}
