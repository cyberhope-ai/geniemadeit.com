/*
 * First-party affiliate referral capture (our own, $0 program — sibling of awin.ts for the network path).
 * A visitor arriving via an affiliate's link carries ?ref=CODE. We capture it, keep it 60 days (industry
 * standard cookie window), attach it at checkout so the engine credits the affiliate their commission, and
 * ping /api/ref/CODE once to count the click. Purely client-side + harmless.
 */
const KEY = "gm_ref";
const DAYS = 60;

export function captureRef() {
  try {
    const raw = new URLSearchParams(window.location.search).get("ref");
    const ref = (raw || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    if (!ref) return;
    document.cookie = `${KEY}=${encodeURIComponent(ref)}; Max-Age=${60 * 60 * 24 * DAYS}; Path=/; SameSite=Lax`;
    fetch(`/api/ref/${encodeURIComponent(ref)}`).catch(() => {}); // fire-and-forget click count
  } catch { /* ignore */ }
}

export function getRef(): string | undefined {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${KEY}=([^;]+)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  } catch { return undefined; }
}
