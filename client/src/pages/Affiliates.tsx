/*
 * /affiliates — first-party affiliate operator console (our own program, $0, no external network).
 * Super-admin session only (Rick's accounts / any unlimited plan); the engine enforces 403 server-side.
 * Create a reseller code, hand out the ?ref= link, watch clicks -> orders -> commission owed, and copy a
 * ready-to-send invite. Net-30 clearing is surfaced per referral (guardrail against refunds/chargebacks).
 */
import { useEffect, useMemo, useState } from "react";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { useSession } from "@/contexts/SessionContext";
import { api, type AffiliateCode, type Referral } from "@/lib/api";
import { toast } from "sonner";
import { Copy, Link2, TrendingUp, Users, DollarSign, MousePointerClick, ShieldAlert } from "lucide-react";

const SUPERADMINS = new Set(["rick@cyberhopeai.com", "richardmbarretto@gmail.com"]);
const usd = (c?: number | null) => "$" + (((c || 0) / 100).toFixed(2));
const SITE = "https://geniemadeit.com";
const cleared = (iso: string) => Date.now() - new Date(iso).getTime() >= 30 * 864e5; // Net-30 cooling period

function inviteEmail(code: string, pct: number) {
  const link = `${SITE}/?ref=${code}`;
  return `Subject: Welcome to the GenieMade Partner Program

Hi there,

Welcome aboard! You're now a GenieMade partner — the only AI creation platform with the Triple Seal:
cryptographic, independently-verifiable proof of authenticity for every image and video created.

YOUR COMMISSION
You earn ${pct}% on every order from customers you refer. Cookie window is 60 days, and commissions
clear after a standard 30-day period (protects against refunds/chargebacks).

YOUR LINK
${link}

Drop it in a newsletter, a tech-stack page, or a quick video of the Studio + Verify flow. Two ground rules:
no self-referrals, and no paid search bidding on our brand terms (GenieMade, Triple Seal, QSeal).

Reply to this email anytime — happy to send logos, Triple Seal badges, and swipe copy.

— The GenieMade Team`;
}

export default function Affiliates() {
  const { user, loading } = useSession();
  const isAdmin = !!user && (SUPERADMINS.has((user.email || "").toLowerCase()) || user.plan === "unlimited");

  const [codes, setCodes] = useState<AffiliateCode[]>([]);
  const [refs, setRefs] = useState<Referral[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ code: "", owner_name: "", owner_email: "", commission_pct: 20 });

  useEffect(() => { document.title = "Affiliates — GenieMade"; }, []);

  async function load() {
    try {
      const [c, r] = await Promise.all([api.affiliateCodes(), api.affiliateReferrals()]);
      setCodes(c.codes || []);
      setRefs(r.referrals || []);
    } catch { /* 403 for non-admins — the gate below handles the UI */ }
  }
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const code = form.code.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (code.length < 3) { toast.error("Code must be at least 3 characters (a-z, 0-9, _ -)."); return; }
    setBusy(true);
    try {
      const r = await api.createAffiliateCode({ ...form, code });
      if (r.ok) { toast.success(`Code “${code}” saved`); setForm({ code: "", owner_name: "", owner_email: "", commission_pct: 20 }); await load(); }
      else toast.error(r.error || "Could not save code");
    } catch { toast.error("Could not save code"); }
    setBusy(false);
  }

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`), () => toast.error("Copy failed"));
  }

  const totals = useMemo(() => codes.reduce((a, c) => ({
    clicks: a.clicks + (c.clicks || 0), orders: a.orders + (c.orders || 0),
    revenue: a.revenue + (c.revenue_cents || 0), commission: a.commission + (c.commission_cents || 0),
  }), { clicks: 0, orders: 0, revenue: 0, commission: 0 }), [codes]);

  const owedCleared = useMemo(() => refs.filter((r) => cleared(r.created_at)).reduce((s, r) => s + (r.commission_cents || 0), 0), [refs]);

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 max-w-5xl pt-14 pb-20">
        <span className="eyebrow">Partners · first-party program</span>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight">Affiliate <em className="gold-text italic">console.</em></h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Create a code, hand out the link, watch it convert. $0 to run — no network fee. Commissions accrue
          on every referred order and clear after 30 days.
        </p>

        {loading ? null : !isAdmin ? (
          <div className="cert-panel mt-10 flex items-center gap-3 p-6">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" style={{ color: "#f5c451" }} />
            <p className="text-sm text-muted-foreground">This console is restricted to GenieMade admins. Sign in with an admin account to manage the affiliate program.</p>
          </div>
        ) : (
          <>
            {/* stats */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { i: MousePointerClick, k: "Clicks", v: String(totals.clicks) },
                { i: Users, k: "Orders", v: String(totals.orders) },
                { i: DollarSign, k: "Referred revenue", v: usd(totals.revenue) },
                { i: TrendingUp, k: "Commission — cleared", v: usd(owedCleared) },
              ].map((s) => (
                <div key={s.k} className="gm-panel p-4">
                  <s.i className="h-4 w-4" style={{ color: "#66e3e8" }} />
                  <div className="mt-2 font-display text-2xl font-semibold">{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.k}</div>
                </div>
              ))}
            </div>

            {/* create */}
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold">Add an affiliate</h2>
              <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Code</span>
                  <input className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm w-full" placeholder="e.g. jane" value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Partner name</span>
                  <input className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm w-full" placeholder="Jane Doe" value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Partner email</span>
                  <input className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm w-full" placeholder="jane@site.com" value={form.owner_email}
                    onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Commission %</span>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={90} className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm w-20" value={form.commission_pct}
                      onChange={(e) => setForm({ ...form, commission_pct: parseInt(e.target.value, 10) || 0 })} />
                    <button className="btn-gold whitespace-nowrap px-4 py-2 text-sm" disabled={busy}>{busy ? "Saving…" : "Add"}</button>
                  </div>
                </label>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">30% for the launch push — generous to drive early growth. Adjust per partner anytime — just re-save the same code.</p>
            </section>

            {/* codes */}
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold">Partners &amp; links</h2>
              {codes.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No codes yet — add your first partner above.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="py-2 pr-3">Code</th><th className="py-2 pr-3">Partner</th><th className="py-2 pr-3">%</th>
                        <th className="py-2 pr-3">Clicks</th><th className="py-2 pr-3">Orders</th><th className="py-2 pr-3">Revenue</th>
                        <th className="py-2 pr-3">Commission</th><th className="py-2 pr-3">Link / invite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c) => (
                        <tr key={c.code} className="border-b border-border/50">
                          <td className="py-2.5 pr-3 font-mono font-semibold" style={{ color: c.active ? "#66e3e8" : "#8a8aa0" }}>
                            {c.code}{!c.active && <span className="ml-1 text-[10px] text-muted-foreground">(off)</span>}
                          </td>
                          <td className="py-2.5 pr-3">{c.owner_name || <span className="text-muted-foreground">—</span>}</td>
                          <td className="py-2.5 pr-3 tabular-nums">{c.commission_pct}%</td>
                          <td className="py-2.5 pr-3 tabular-nums">{c.clicks}</td>
                          <td className="py-2.5 pr-3 tabular-nums">{c.orders}</td>
                          <td className="py-2.5 pr-3 tabular-nums">{usd(c.revenue_cents)}</td>
                          <td className="py-2.5 pr-3 tabular-nums font-semibold" style={{ color: "#f5c451" }}>{usd(c.commission_cents)}</td>
                          <td className="py-2.5 pr-3">
                            <div className="flex gap-1.5">
                              <button className="rounded-md border border-border px-2 py-1 text-xs hover:text-foreground" title="Copy referral link"
                                onClick={() => copy(`${SITE}/?ref=${c.code}`, "Link")}><Link2 className="h-3.5 w-3.5" /></button>
                              <button className="rounded-md border border-border px-2 py-1 text-xs hover:text-foreground" title="Copy invite email"
                                onClick={() => copy(inviteEmail(c.code, c.commission_pct), "Invite email")}><Copy className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* referrals */}
            {refs.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-xl font-semibold">Recent referrals</h2>
                <div className="mt-4 grid gap-2">
                  {refs.slice(0, 20).map((r) => (
                    <div key={r.id} className="gm-panel flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
                      <span className="font-mono font-semibold" style={{ color: "#66e3e8" }}>{r.code}</span>
                      <span className="tabular-nums">{usd(r.amount_cents)} order</span>
                      <span className="tabular-nums font-semibold" style={{ color: "#f5c451" }}>{usd(r.commission_cents)} commission</span>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] ${cleared(r.created_at) ? "text-emerald-300" : "text-amber-300"}`}
                        style={{ background: cleared(r.created_at) ? "rgba(16,185,129,.12)" : "rgba(245,196,81,.12)" }}>
                        {cleared(r.created_at) ? "Cleared — payable" : "Pending (Net-30)"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* scale-up note */}
            <section className="mt-12 border-t border-border pt-8">
              <div className="cert-panel p-5">
                <div className="kicker mb-2 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: "#f5c451" }}>When you outgrow this</div>
                <p className="text-sm text-muted-foreground">
                  This console runs your first partners at $0. When you add subscription plans or scale past a
                  handful of affiliates who want a self-serve portal + automated PayPal/Wise payouts + tax forms,
                  graduate to a Stripe-native tool (Rewardful ~$49/mo). The <span className="font-mono">?ref=</span> attribution
                  we already fire maps cleanly onto it — no rework.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
      <GmFooter />
    </div>
  );
}
