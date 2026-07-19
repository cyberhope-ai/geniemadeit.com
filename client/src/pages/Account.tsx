/*
 * Gilded Night — Account dashboard (/account): profile, live wishes balance,
 * top-up via real Stripe checkout, creation history from the engine, sign out.
 */
import { useCallback, useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { Seal } from "@/components/brand/Seal";
import { PaywallModal } from "@/components/PaywallModal";
import { useSession } from "@/contexts/SessionContext";
import { api, Generation, fmtDate, shortHash } from "@/lib/api";
import { openClientDashboard, PORTAL_BRAND_HOST } from "@/lib/portal";
import { toast } from "sonner";
import { Download, Copy, LogOut, Sparkles, LayoutDashboard, Loader2 } from "lucide-react";

export default function Account() {
  const { user, loading, logout, refresh } = useSession();
  const [, navigate] = useLocation();
  const [gens, setGens] = useState<Generation[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  async function gotoClientDashboard() {
    if (!user || portalBusy) return;
    setPortalBusy(true);
    const r = await openClientDashboard(user.email);
    if (!r.ok) {
      setPortalBusy(false);
      if (r.reason === "denied") {
        toast.error("The portal declined this account — contact support@cyberhopeai.com.");
      } else {
        toast.info(`The client dashboard (${PORTAL_BRAND_HOST}) isn't live yet — it's on the way.`);
      }
    }
    // On success the browser navigates away; keep the spinner until then.
  }

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [loading, user, navigate]);

  const load = useCallback(() => {
    if (!user) return;
    api.gallery().then((j) => setGens(j.generations || [])).catch(() => {});
  }, [user]);

  useEffect(() => { load(); refresh(); /* also refresh credits after Stripe return */ // eslint-disable-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function download(g: Generation) {
    try {
      const r = await fetch(g.url);
      const b = await r.blob();
      const a = document.createElement("a");
      const ext = g.capability?.startsWith("video") ? "mp4" : g.capability?.startsWith("audio") ? "wav" : "png";
      a.href = URL.createObjectURL(b);
      a.download = `geniemade-${(g.cert_id || g.id || "creation").toString().slice(0, 18)}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("Download failed — try again.");
    }
  }

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <GoldDust />
        <GmNav />
        <main className="container relative z-10 grid min-h-[50vh] place-items-center pt-10 pb-16 text-muted-foreground">
          {loading ? "Opening your account…" : "Redirecting…"}
        </main>
        <GmFooter />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 pt-10 pb-16">
        <span className="eyebrow">Your account</span>
        <h1 className="mt-3 font-display text-4xl font-semibold">Welcome back<em className="gold-text italic">.</em></h1>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="gm-panel p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signed in as</div>
            <div className="mt-2 font-medium break-all">{user.email}</div>
            <div className="mt-1 text-xs text-muted-foreground kv-mono">{user.id}</div>
            <button className="btn-ghost-gold mt-5 px-4 py-2 text-sm" onClick={async () => { await logout(); navigate("/"); }} data-testid="sign-out">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
          <div className="gm-panel p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wishes remaining</div>
            <div className="mt-2 font-display text-5xl font-semibold" style={{ color: "#ffe390" }}>✦ {user.credits}</div>
            <button className="btn-gold mt-5 px-4 py-2 text-sm" onClick={() => setPayOpen(true)} data-testid="topup">
              <Sparkles className="h-4 w-4" /> Top up wishes
            </button>
          </div>
          <div className="gm-panel p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creations sealed</div>
            <div className="mt-2 font-display text-5xl font-semibold">{gens.length}</div>
            <Link href="/app" className="btn-ghost-gold mt-5 px-4 py-2 text-sm no-underline inline-flex">Open the Studio</Link>
          </div>
        </div>

        <div className="gm-panel mt-5 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client dashboard</div>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              Projects, proof-backed status, and your scoped AI team live in the GenieMade client
              portal at <span className="kv-mono text-xs">{PORTAL_BRAND_HOST}</span>. One click signs
              you in with this account — no second password.
            </p>
          </div>
          <button className="btn-gold px-4 py-2 text-sm" onClick={gotoClientDashboard} disabled={portalBusy} data-testid="open-client-dashboard">
            {portalBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutDashboard className="h-4 w-4" />}
            {portalBusy ? "Opening…" : "Open client dashboard"}
          </button>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Creation history</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every wish, tracked: what was made, when, with which engine, and its fingerprint.</p>
          <div className="gm-panel mt-5 overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">Preview</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Engine</th>
                  <th className="p-3">Receipt</th>
                  <th className="p-3">SHA-256</th>
                  <th className="p-3">Sealed</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {gens.map((g) => (
                  <tr key={g.id} className="border-t border-border/60">
                    <td className="p-3">
                      {g.capability?.startsWith("image") ? (
                        <img src={g.url} alt="" className="h-12 w-12 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-lg border border-border bg-accent text-xs text-muted-foreground">
                          {g.capability?.split(".")[0]}
                        </div>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">{g.capability}</td>
                    <td className="p-3 whitespace-nowrap kv-mono text-xs">{g.model}</td>
                    <td className="p-3 whitespace-nowrap kv-mono text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        {shortHash(g.cert_id, 14)}
                        {g.cert_id && (
                          <button aria-label="Copy receipt" className="opacity-50 hover:opacity-100" onClick={() => { navigator.clipboard.writeText(g.cert_id!); toast.success("Receipt copied"); }}>
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap kv-mono text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <Seal className="h-3.5 w-3.5" /> {shortHash(g.hash, 14)}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{fmtDate(g.created_at)}</td>
                    <td className="p-3">
                      <button className="btn-ghost-gold px-3 py-1.5 text-xs" onClick={() => download(g)}>
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
                {gens.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No creations yet — <Link href="/app" className="underline" style={{ color: "#ffe390" }}>make your first wish</Link>.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <PaywallModal open={payOpen} onOpenChange={setPayOpen} remaining={user.credits} />
      <GmFooter />
    </div>
  );
}
