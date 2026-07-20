/*
 * AWIN affiliate attribution. When a visitor arrives via a reseller's AWIN link, AWIN appends
 * ?awc=<click-checksum> to the landing URL. We capture it on load, keep it ~30 days, and attach it to
 * checkout so the engine can fire the S2S conversion and credit the reseller. Purely client-side + harmless.
 */
const KEY = "gm_awc";

export function captureAwin() {
  try {
    const awc = new URLSearchParams(window.location.search).get("awc");
    if (awc) document.cookie = `${KEY}=${encodeURIComponent(awc)}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax`;
  } catch { /* ignore */ }
}

export function getAwin(): string | undefined {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${KEY}=([^;]+)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  } catch { return undefined; }
}
