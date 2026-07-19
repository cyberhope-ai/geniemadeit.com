/*
 * Content Credentials (C2PA) reader — the "universal verify" layer.
 * Reads any dropped file's embedded C2PA manifest ENTIRELY IN THE BROWSER via the official
 * @contentauth/c2pa-web WASM SDK (the file never leaves the user's device — same promise as our
 * SHA-256 check). We surface it honestly alongside our own QSeal: this is the open, industry-wide
 * provenance standard (Adobe, OpenAI, Google, Sony/Nikon/Leica, TikTok, …). It is NOT our seal —
 * we read whatever the file already carries and label the source plainly.
 *
 * Loaded lazily (dynamic import from Verify) so the WASM never weighs down first paint.
 */
import { createC2pa } from "@contentauth/c2pa-web";
import wasmSrc from "@contentauth/c2pa-web/resources/c2pa.wasm?url";

export interface C2paReport {
  present: boolean;          // does the file carry a C2PA manifest at all?
  producer?: string;         // the tool that made/edited it (claim generator)
  signer?: string;           // who cryptographically signed the manifest
  time?: string;             // when it was signed
  title?: string;
  aiGenerated?: boolean;     // manifest declares AI-generated source
  valid?: boolean;           // signature/validation had no errors
  manifestCount?: number;
  error?: string;            // set only on an unexpected read failure
}

let _c2pa: Awaited<ReturnType<typeof createC2pa>> | null = null;
async function getC2pa() {
  if (!_c2pa) _c2pa = await createC2pa({ wasmSrc });
  return _c2pa;
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export async function readContentCredentials(file: File): Promise<C2paReport> {
  let reader: Awaited<ReturnType<Awaited<ReturnType<typeof createC2pa>>["reader"]["fromBlob"]>> = null;
  try {
    const c2pa = await getC2pa();
    reader = await c2pa.reader.fromBlob(file.type || "application/octet-stream", file);
    if (!reader) return { present: false }; // no C2PA / unsupported container
    // reader.json() returns the c2pa-rs ManifestStore serialization (snake_case).
    const j: any = await reader.json();
    const manifests = j?.manifests || {};
    const activeLabel = j?.active_manifest;
    const m = (activeLabel && manifests[activeLabel]) || Object.values(manifests)[0];
    if (!m) return { present: false };

    const gen = Array.isArray(m.claim_generator_info) ? m.claim_generator_info[0] : undefined;
    const producer = gen
      ? [str(gen.name), str(gen.version)].filter(Boolean).join(" ")
      : str(m.claim_generator)?.split("(")[0].trim();

    const sig = m.signature_info || {};

    // AI-generated? look for a c2pa.created action carrying a "trainedAlgorithmicMedia" source type
    const allActions: any[] = (m.assertions || []).flatMap((a: any) =>
      a?.label?.startsWith("c2pa.actions") ? a?.data?.actions || [] : []
    );
    const dst = allActions.map((x) => x?.digitalSourceType).find(Boolean);
    const aiGenerated = typeof dst === "string" && /trainedAlgorithmicMedia|algorithmicMedia/i.test(dst);

    const vstat = j?.validation_status;
    const valid = !(Array.isArray(vstat) && vstat.some((v: any) => /error|fail|invalid|untrusted|not.?trusted/i.test(String(v?.code || ""))));

    return {
      present: true,
      producer: producer || undefined,
      signer: str(sig.issuer),
      time: str(sig.time),
      title: str(m.title),
      aiGenerated,
      valid,
      manifestCount: Object.keys(manifests).length,
    };
  } catch (e) {
    return { present: false, error: String((e as Error)?.message || e).slice(0, 120) };
  } finally {
    try { await reader?.free(); } catch { /* ignore */ }
  }
}
