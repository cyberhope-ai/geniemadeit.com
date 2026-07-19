/*
 * Client-portal SSO handoff (Part B of the GenieMade client integration).
 *
 * Flow (per the canonical integration brief):
 *   1. User is signed in on geniemadeit.com (engine session).
 *   2. POST {PORTAL_API_BASE}/api/portal/mint-handoff { email, genie_host } →
 *      the genie-master-page backend mints a signed, short-lived handoff and
 *      returns a per-brand sso_url pinned to clients.geniemadeit.com.
 *   3. Redirect the browser to sso_url → the portal verifies the token at /sso,
 *      sets chp_session, and lands the user in the GenieMade-branded dashboard
 *      (auto-provisioning the tenant/space for new users).
 *
 * We NEVER mint or verify anything locally — the portal backend owns auth.
 * If the backend isn't reachable/configured yet, we fail honestly.
 */

/** The GenieMade brand host on the multi-brand client portal. */
export const PORTAL_BRAND_HOST = "clients.geniemadeit.com";

/**
 * Where the genie-master-page portal API lives.
 * - Overridable at build time via VITE_PORTAL_API_BASE (Cloudflare Pages env).
 * - Defaults to same-origin, so production can proxy /api/portal/* through
 *   _worker.js to the FastAPI backend once nemotron exposes it — keeping the
 *   call same-origin exactly like the engine /api proxy (no CORS).
 */
export const PORTAL_API_BASE: string =
  (import.meta.env.VITE_PORTAL_API_BASE as string | undefined)?.replace(/\/+$/, "") || "";

export type HandoffResult =
  | { ok: true; sso_url: string }
  | { ok: false; reason: "not_configured" | "unreachable" | "denied"; detail?: string };

/** Mint a signed handoff for `email` and return the per-brand sso_url. */
export async function mintPortalHandoff(email: string): Promise<HandoffResult> {
  try {
    const res = await fetch(`${PORTAL_API_BASE}/api/portal/mint-handoff`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, genie_host: PORTAL_BRAND_HOST }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const ssoUrl = (body.sso_url || body.ssoUrl || body.url) as string | undefined;
    if (res.ok && typeof ssoUrl === "string" && /^https:\/\//.test(ssoUrl)) {
      return { ok: true, sso_url: ssoUrl };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: "denied", detail: String(body.error || res.status) };
    }
    // 404 (route not deployed) or 5xx ("API not yet configured") → not live yet.
    return { ok: false, reason: "not_configured", detail: String(body.error || body.message || res.status) };
  } catch (e) {
    return { ok: false, reason: "unreachable", detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Mint a handoff and redirect the browser into the branded dashboard. */
export async function openClientDashboard(email: string): Promise<HandoffResult> {
  const r = await mintPortalHandoff(email);
  if (r.ok) window.location.assign(r.sso_url);
  return r;
}
