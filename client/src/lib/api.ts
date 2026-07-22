/*
 * GenieMade engine API client — Gilded Night FE.
 * All calls are same-origin (/api/*) and proxied to the live engine
 * (dev: vite proxy; prod: Cloudflare Pages _worker.js). Cookies are HttpOnly.
 * TRUST STANDARD: never fabricate results — surface real errors verbatim.
 */
import { getAwin } from "./awin";
import { getRef } from "./ref";

export interface GmUser {
  id: string;
  email: string;
  credits: number;
  plan: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface CapabilityItem {
  id: string;
  name: string;
  status: "live" | "next" | "soon";
  credits: number;
}

export interface CapabilityCat {
  cat: string;
  items: CapabilityItem[];
}

export interface Pack {
  key: string;
  credits: number;
  usd: number;
}

export interface Capabilities {
  ok: boolean;
  capabilities: CapabilityCat[];
  packs: Pack[];
  free_credits: number;
}

export interface Certificate {
  hash: string;
  receipt_id: string;
  issued_at: string;
  c2pa: boolean;
  /** QSeal proof layer (live 2026-07): Ed25519 server-side signing */
  signed?: boolean;
  signature_valid?: boolean;
  signer?: string | null;
  watermarked?: boolean;
  parents?: string[];
}

export interface Generation {
  id: string;
  capability: string;
  url: string;
  model: string;
  prompt?: string;
  certificate?: Certificate;
  hash?: string;
  cert_id?: string;
  created_at?: string;
}

export interface GenerateResult {
  ok: boolean;
  generation?: Generation;
  cost?: number;
  credits_remaining?: number;
  error?: string;
  message?: string;
  // async video: the engine returns a job to poll instead of an immediate creation
  status?: "processing" | "completed" | "failed";
  job_id?: string;
  poll_url?: string;
}

export interface JobResult {
  ok: boolean;
  status: "processing" | "completed" | "failed";
  generation?: Generation;
  error?: string;
  credits_remaining?: number;
  queue_position?: number | null;
}

export interface RegisterResult {
  ok: boolean;
  receipt_id?: string;
  owner?: string;
  title?: string | null;
  registered_at?: string;
  signature?: string | null;
  signer?: string;
  verify_url?: string;
  thumb_url?: string | null;
  is_public?: boolean;
  credits_remaining?: number;
  already_registered?: boolean;
  mine?: boolean;
  registration?: { receipt_id?: string; owner?: string; registered_at?: string; verify_url?: string };
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  body?: Record<string, unknown>;
  constructor(status: number, code?: string, message?: string, body?: Record<string, unknown>) {
    super(message || code || `HTTP ${status}`);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/* ---- Account & Settings hub contract (atlas2 spec, 2026-07-19) ----
 * These endpoints are being built by the fleet (Cloudflare D1 backend).
 * Until they ship they return 404 not_found — panels must show an honest
 * "backend rolling out" state, never fabricated data.
 */

export interface Account {
  id: string;
  email: string;
  display_name?: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  skilldna_url?: string;
  plan: string;
  credits: number;
  concurrency_limit?: number;
  created_at?: string;
}

export interface NotificationPrefs {
  email_product_updates: boolean;
  email_billing: boolean;
  email_generation_complete: boolean;
  email_marketing: boolean;
}

export interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface UsageDay {
  date: string;
  credits: number;
  cost_usd: number;
  jobs: number;
}

export interface UsageByCapability {
  capability: string;
  jobs: number;
  credits: number;
  cost_usd: number;
}

export interface UsageSummary {
  ok: boolean;
  by_day: UsageDay[];
  by_capability: UsageByCapability[];
  totals: { jobs: number; credits: number };
}

export interface HistoryItem {
  id: string;
  ts: string;
  capability: string;
  model?: string;
  credits: number;
  status: string;
  cert_id?: string;
}

export interface LedgerEntry {
  delta: number;
  reason: string;
  ref?: string;
  balance_after?: number;
  ts: string;
}

export interface Invoice {
  id: string;
  pack?: string;
  credits?: number;
  amount_cents: number;
  currency: string;
  receipt_url?: string;
  ts: string;
}

export interface ErrorItem {
  id: string;
  ts: string;
  capability: string;
  error: string;
}

export interface AffiliateCode {
  code: string;
  owner_name: string | null;
  owner_email: string | null;
  commission_pct: number;
  active: number;
  note: string | null;
  clicks: number;
  orders: number;
  revenue_cents: number;
  commission_cents: number;
  created_at: string;
}

export interface Referral {
  id: string;
  code: string;
  user_id: string | null;
  amount_cents: number | null;
  commission_cents: number | null;
  currency: string | null;
  created_at: string;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    credentials: "same-origin",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    ...init,
  });
  const ct = r.headers.get("content-type") || "";
  const j = ct.includes("application/json") ? await r.json().catch(() => null) : null;
  if (!r.ok || (j && j.ok === false)) {
    throw new ApiError(r.status, j?.error, j?.message || j?.error, j || undefined);
  }
  return j as T;
}

export const api = {
  capabilities: () => req<Capabilities>("/api/capabilities"),
  me: () =>
    req<{ ok: boolean; authenticated: boolean; user?: GmUser }>("/api/auth/me"),
  signup: (email: string, password: string) =>
    req<{ ok: boolean; user: GmUser }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    req<{ ok: boolean; user: GmUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => req<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  generate: (payload: { capability: string; prompt: string; aspect?: string; image_url?: string }) =>
    req<GenerateResult>("/api/generate", { method: "POST", body: JSON.stringify(payload) }),
  job: (id: string) => req<JobResult>(`/api/jobs/${encodeURIComponent(id)}`),
  gallery: () => req<{ ok: boolean; generations: Generation[] }>("/api/gallery"),
  examples: () => req<{ ok: boolean; examples: { url: string; prompt: string }[] }>("/api/examples"),
  checkout: (pack: string) => {
    // Rewardful attribution: pass the tracking script's referral UUID as client_reference_id (server-side
    // checkout). Guarded — harmless if the Rewardful snippet hasn't loaded / no referral present.
    const body: Record<string, unknown> = { pack, plan: pack, awc: getAwin(), ref: getRef() };
    const rw = (window as unknown as { Rewardful?: { referral?: string } }).Rewardful?.referral;
    if (rw) body.client_reference_id = rw;
    return req<{ ok: boolean; url?: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify(body) });
  },
  verify: (receipt_id: string, hash?: string) =>
    req<{ ok: boolean; verdict?: "authentic" | "registered" | "unknown" | "no_receipt" | string; verified?: boolean; generation?: Partial<Generation>; certificate?: (Certificate & { type?: string }); registration?: { owner?: string; registered_at?: string; title?: string | null; thumb_url?: string | null; is_public?: boolean }; anchor?: { chain?: string; status?: string; block_height?: number | null; submitted_at?: string; confirmed_at?: string | null } }>(
      "/api/verify",
      { method: "POST", body: JSON.stringify({ receipt_id, hash }) }
    ),
  register: (payload: { hash: string; title?: string; owner_name?: string; note?: string; is_public?: boolean; thumbnail?: string }) =>
    req<RegisterResult>("/api/register", { method: "POST", body: JSON.stringify(payload) }),
  registryRecent: () => req<{ ok: boolean; count: number; registrations: { receipt_id: string; owner: string; title: string | null; hash_short: string; thumb_url: string | null; created_at: string; verify_url: string }[] }>("/api/registry/recent"),
  registryMine: () => req<{ ok: boolean; count: number; registrations: { receipt_id: string; owner: string; title: string | null; hash_short: string; thumb_url: string | null; is_public: boolean; created_at: string; verify_url: string; ever_url: string }[] }>("/api/registry/mine"),
  registryPublish: (body: { receipt_id?: string; hash?: string; is_public: boolean }) => req<{ ok: boolean; receipt_id: string; is_public: boolean }>("/api/registry/publish", { method: "POST", body: JSON.stringify(body) }),
  autoPublishGet: () => req<{ ok: boolean; auto_publish: boolean }>("/api/settings/auto-publish"),
  autoPublishSet: (enabled: boolean) => req<{ ok: boolean; auto_publish: boolean }>("/api/settings/auto-publish", { method: "POST", body: JSON.stringify({ enabled }) }),
  anchor: (hash: string) =>
    req<{ ok: boolean; already?: boolean; anchor?: { chain?: string; status?: string; block_height?: number | null; submitted_at?: string }; cost?: number; credits_remaining?: number; error?: string; message?: string }>("/api/anchor", { method: "POST", body: JSON.stringify({ hash }) }),
  removeBg: (image: string, level?: string) => req<GenerateResult>("/api/removebg", { method: "POST", body: JSON.stringify({ image, level }) }),
  listKeys: () => req<{ ok: boolean; keys: { id: string; prefix: string; name: string; created_at: string; last_used_at: string | null; calls: number; revoked: boolean }[] }>("/api/keys"),
  createKey: (name?: string) => req<{ ok: boolean; id: string; name: string; key: string; prefix: string; created_at: string; note: string }>("/api/keys", { method: "POST", body: JSON.stringify({ name }) }),
  revokeKey: (id: string) => req<{ ok: boolean }>(`/api/keys/${encodeURIComponent(id)}/revoke`, { method: "POST" }),

  /* ---- Affiliate program (first-party, $0). Super-admin session only; engine enforces (403 otherwise). ---- */
  affiliateCodes: () => req<{ ok: boolean; codes: AffiliateCode[] }>("/api/affiliates/codes"),
  createAffiliateCode: (payload: { code: string; owner_name?: string; owner_email?: string; commission_pct?: number; active?: boolean; note?: string }) =>
    req<{ ok: boolean; code?: AffiliateCode; error?: string }>("/api/affiliates/codes", { method: "POST", body: JSON.stringify(payload) }),
  affiliateReferrals: (code?: string) =>
    req<{ ok: boolean; referrals: Referral[] }>(`/api/affiliates/referrals${code ? `?code=${encodeURIComponent(code)}` : ""}`),

  /** QSeal public signing keys — anyone can verify our seals against these. */
  qsealPubkeys: () =>
    req<{ ok: boolean; keys: { epoch: string; alg: string; public_key_hex: string; active: boolean }[] }>(
      "/api/qseal/pubkeys"
    ),

  /* ---- Settings hub (contract per atlas2 spec; 404 until backend ships) ---- */
  account: () => req<{ ok: boolean; account: Account }>("/api/account").then((r) => r.account),
  updateAccount: (patch: { display_name?: string; username?: string; avatar_url?: string; skilldna_url?: string }) =>
    req<{ ok: boolean; account: Account }>("/api/account", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }).then((r) => r.account),
  uploadAvatar: async (file: File) => {
    const r = await fetch("/api/account/avatar", {
      method: "POST", credentials: "same-origin",
      headers: { "content-type": file.type || "image/jpeg" }, body: file,
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) throw new ApiError(r.status, j?.error, j?.message || j?.error, j || undefined);
    return j as { ok: boolean; avatar_url: string };
  },
  notificationPrefs: () =>
    req<{ ok: boolean; notifications: NotificationPrefs }>("/api/settings/notifications").then((r) => r.notifications),
  saveNotificationPrefs: (prefs: NotificationPrefs) =>
    req<{ ok: boolean; notifications: NotificationPrefs }>("/api/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(prefs),
    }).then((r) => r.notifications),
  address: () => req<{ ok: boolean; address: BillingAddress }>("/api/settings/address").then((r) => r.address),
  saveAddress: (addr: BillingAddress) =>
    req<{ ok: boolean; address: BillingAddress }>("/api/settings/address", {
      method: "PUT",
      body: JSON.stringify(addr),
    }).then((r) => r.address),
  usage: (range: "7d" | "30d" | "90d" = "30d") => req<UsageSummary>(`/api/usage?range=${range}`),
  usageHistory: (limit = 50, cursor?: string) =>
    req<{ ok: boolean; items: HistoryItem[]; next_cursor?: string }>(
      `/api/usage/history?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`
    ),
  credits: () => req<{ ok: boolean; balance: number; ledger: LedgerEntry[] }>("/api/credits"),
  invoices: () => req<{ ok: boolean; invoices: Invoice[] }>("/api/billing/invoices"),
  billingPortal: () => req<{ ok: boolean; url?: string }>("/api/billing/portal", { method: "POST" }),
  errors: (limit = 50) => req<{ ok: boolean; items: ErrorItem[] }>(`/api/errors?limit=${limit}`),
};

/** SHA-256 of a File/Blob in the browser — used by the honest Verify tool. */
export async function sha256OfBlob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const GOOGLE_START = "/api/auth/google/start?redirect=/app";

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function shortHash(h?: string, n = 16): string {
  if (!h) return "—";
  return h.length > n ? `${h.slice(0, n)}…` : h;
}
