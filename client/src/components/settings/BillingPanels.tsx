/*
 * Gilded Night — Settings hub: Usage & Billing panels.
 * Contract: /api/usage, /api/settings/address, /api/credits, /api/billing/invoices,
 * POST /api/billing/portal. Trust Standard throughout: real data, honest 404
 * "rolling out" states, honest empty states, no fabrication.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  api, BillingAddress, Invoice, LedgerEntry, UsageSummary, fmtDate,
} from "@/lib/api";
import { useSession } from "@/contexts/SessionContext";
import { Input } from "@/components/ui/input";
import { PaywallModal } from "@/components/PaywallModal";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
} from "recharts";
import { Sparkles, ExternalLink, Loader2, ReceiptText } from "lucide-react";
import {
  PanelHeading, PanelLoading, PanelNotLive, PanelError, PanelEmpty, PanelState, classifyError, fmtUsd,
} from "./panelKit";

/* -------------------------------- Usage -------------------------------- */

const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];

export function UsagePanel() {
  const [range, setRange] = useState<Range>("30d");
  const [state, setState] = useState<PanelState<UsageSummary>>({ kind: "loading" });

  const load = useCallback((r: Range) => {
    setState({ kind: "loading" });
    api.usage(r)
      .then((u) => setState({ kind: "ready", data: u }))
      .catch((e) => setState(classifyError(e)));
  }, []);
  useEffect(() => { load(range); }, [range, load]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PanelHeading title="Usage" sub="Wishes spent and estimated cost, day by day." />
        <div className="mb-5 flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${range === r ? "" : "border-border text-muted-foreground hover:text-foreground"}`}
              style={range === r ? { borderColor: "#c88f2c", background: "rgba(245,196,81,.1)", color: "#ffe390" } : undefined}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {state.kind === "loading" && <PanelLoading label="Adding up your wishes…" />}
      {state.kind === "not_live" && <PanelNotLive what="Usage analytics" />}
      {state.kind === "error" && <PanelError error={state.message} onRetry={() => load(range)} />}
      {state.kind === "ready" && (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gm-panel p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wishes spent ({range})</div>
              <div className="mt-1.5 font-display text-4xl font-semibold" style={{ color: "#ffe390" }}>✦ {state.data.totals?.credits ?? 0}</div>
            </div>
            <div className="gm-panel p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creations ({range})</div>
              <div className="mt-1.5 font-display text-4xl font-semibold">{state.data.totals?.jobs ?? 0}</div>
            </div>
          </div>

          {state.data.by_day?.length ? (
            <div className="gm-panel p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wishes by day</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={state.data.by_day} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8f88a3" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#8f88a3" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip
                      cursor={{ fill: "rgba(245,196,81,.06)" }}
                      contentStyle={{ background: "#221e2e", border: "1px solid rgba(245,196,81,.25)", borderRadius: 10, fontSize: 12 }}
                      formatter={(v: number, name: string) => [name === "cost_usd" ? `$${Number(v).toFixed(2)}` : v, name === "credits" ? "wishes" : name === "cost_usd" ? "est. cost" : "jobs"]}
                    />
                    <Bar dataKey="credits" fill="#f5c451" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <PanelEmpty>No usage in this range yet — the chart fills in as you create.</PanelEmpty>
          )}

          {state.data.by_capability?.length ? (
            <div className="gm-panel overflow-x-auto p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-3">Engine / capability</th><th className="p-3">Creations</th><th className="p-3">Wishes</th><th className="p-3">Est. cost</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.by_capability.map((c) => (
                    <tr key={c.capability} className="border-t border-border/60">
                      <td className="p-3 kv-mono text-xs">{c.capability}</td>
                      <td className="p-3">{c.jobs}</td>
                      <td className="p-3" style={{ color: "#ffe390" }}>✦ {c.credits}</td>
                      <td className="p-3">{typeof c.cost_usd === "number" ? `$${c.cost_usd.toFixed(2)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Address ------------------------------- */

const ADDR_FIELDS: { key: keyof BillingAddress; label: string; span2?: boolean }[] = [
  { key: "line1", label: "Address line 1", span2: true },
  { key: "line2", label: "Address line 2 (optional)", span2: true },
  { key: "city", label: "City" },
  { key: "region", label: "State / region" },
  { key: "postal_code", label: "Postal code" },
  { key: "country", label: "Country" },
];

export function AddressPanel() {
  const [state, setState] = useState<PanelState<BillingAddress>>({ kind: "loading" });
  const [form, setForm] = useState<BillingAddress>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setState({ kind: "loading" });
    api.address()
      .then((a) => { setState({ kind: "ready", data: a }); setForm(a); })
      .catch((e) => setState(classifyError(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await api.saveAddress(form);
      setState({ kind: "ready", data: saved });
      toast.success("Billing address saved.");
    } catch (e) {
      const c = classifyError(e);
      toast.error(c.kind === "not_live" ? "The billing address isn't live on the engine yet." : c.message);
    } finally {
      setSaving(false);
    }
  }

  if (state.kind === "loading") return <PanelLoading label="Loading your address…" />;

  return (
    <div>
      <PanelHeading title="Address" sub="Billing address shown on your invoices." />
      {state.kind === "not_live" && <PanelNotLive what="The billing address" />}
      {state.kind === "error" && <PanelError error={state.message} onRetry={load} />}
      {state.kind === "ready" && (
        <div className="gm-panel p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {ADDR_FIELDS.map((f) => (
              <label key={f.key} className={`grid gap-1.5 text-sm ${f.span2 ? "sm:col-span-2" : ""}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</span>
                <Input
                  value={form[f.key] || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  data-testid={`addr-${f.key}`}
                />
              </label>
            ))}
          </div>
          <button className="btn-gold mt-5 px-5 py-2.5 text-sm" onClick={save} disabled={saving} data-testid="save-address">
            {saving ? "Saving…" : "Save address"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Credits ------------------------------- */

const LEDGER_REASON: Record<string, string> = {
  signup_grant: "Welcome wishes",
  spend: "Wish spent",
  purchase: "Pack purchased",
  admin_grant: "Granted by support",
};

export function CreditsPanel() {
  const { user } = useSession();
  const [state, setState] = useState<PanelState<{ balance: number; ledger: LedgerEntry[] }>>({ kind: "loading" });
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(() => {
    setState({ kind: "loading" });
    api.credits()
      .then((c) => setState({ kind: "ready", data: { balance: c.balance, ledger: c.ledger || [] } }))
      .catch((e) => setState(classifyError(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  const balance = state.kind === "ready" ? state.data.balance : user?.credits;

  return (
    <div>
      <PanelHeading title="Credits" sub="Your wish balance and every change to it — auditable, like everything here." />
      <div className="gm-panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wishes remaining</div>
          <div className="mt-1.5 font-display text-5xl font-semibold" style={{ color: "#ffe390" }}>
            ✦ {typeof balance === "number" ? balance : "—"}
          </div>
          {state.kind === "not_live" && (
            <div className="mt-1 text-xs text-muted-foreground">Live balance from your session — the full ledger is rolling out.</div>
          )}
        </div>
        <button className="btn-gold px-5 py-2.5 text-sm" onClick={() => setPayOpen(true)} data-testid="topup">
          <Sparkles className="h-4 w-4" /> Top up
        </button>
      </div>

      <div className="mt-4">
        {state.kind === "loading" && <PanelLoading label="Opening the ledger…" />}
        {state.kind === "not_live" && <PanelNotLive what="The credit ledger" />}
        {state.kind === "error" && <PanelError error={state.message} onRetry={load} />}
        {state.kind === "ready" && (
          state.data.ledger.length ? (
            <div className="gm-panel overflow-x-auto p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-3">When</th><th className="p-3">Change</th><th className="p-3">Reason</th><th className="p-3">Reference</th><th className="p-3">Balance after</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.ledger.map((l, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{fmtDate(l.ts)}</td>
                      <td className="p-3 font-medium" style={{ color: l.delta >= 0 ? "#8be79b" : "#ff9db4" }}>
                        {l.delta >= 0 ? `+${l.delta}` : l.delta}
                      </td>
                      <td className="p-3">{LEDGER_REASON[l.reason] || l.reason}</td>
                      <td className="p-3 kv-mono text-xs">{l.ref ? `${l.ref.slice(0, 18)}…` : "—"}</td>
                      <td className="p-3">{typeof l.balance_after === "number" ? l.balance_after : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <PanelEmpty>No ledger entries yet — your first wish will start the record.</PanelEmpty>
          )
        )}
      </div>
      {user && <PaywallModal open={payOpen} onOpenChange={setPayOpen} remaining={user.credits} />}
    </div>
  );
}

/* ---------------------------- Concurrency ------------------------------ */

export function ConcurrencyPanel() {
  const [state, setState] = useState<PanelState<{ limit?: number; plan?: string }>>({ kind: "loading" });

  const load = useCallback(() => {
    setState({ kind: "loading" });
    api.account()
      .then((a) => setState({ kind: "ready", data: { limit: a.concurrency_limit, plan: a.plan } }))
      .catch((e) => setState(classifyError(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PanelHeading title="Concurrency Limits" sub="How many wishes can run at the same time on your plan." />
      {state.kind === "loading" && <PanelLoading />}
      {state.kind === "not_live" && <PanelNotLive what="Per-plan concurrency" />}
      {state.kind === "error" && <PanelError error={state.message} onRetry={load} />}
      {state.kind === "ready" && (
        <div className="gm-panel p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Concurrent jobs · <span className="capitalize">{state.data.plan || "free"} plan</span></div>
          <div className="mt-1.5 font-display text-5xl font-semibold">{typeof state.data.limit === "number" ? state.data.limit : "—"}</div>
          <p className="mt-3 text-sm text-muted-foreground">This limit is set by your plan and applied by the engine. Need more? <a href="mailto:support@cyberhopeai.com" className="underline" style={{ color: "#ffe390" }}>Talk to us</a>.</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Billing ------------------------------- */

export function BillingPanel() {
  const [busy, setBusy] = useState(false);

  async function openPortal() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.billingPortal();
      if (r.url) { window.location.href = r.url; return; }
      toast.error("The engine didn't return a portal link.");
    } catch (e) {
      const c = classifyError(e);
      if (c.kind === "not_live") {
        toast.error("The billing portal isn't live on the engine yet — it's rolling out.");
      } else {
        // e.g. 409 no_billing_profile: "Buy credits once to open a billing profile…"
        toast.info(c.message);
      }
    }
    setBusy(false);
  }

  return (
    <div>
      <PanelHeading title="Billing" sub="Payment method and official receipts, managed securely by Stripe." />
      <div className="gm-panel flex flex-wrap items-center justify-between gap-4 p-6">
        <p className="m-0 max-w-md text-sm text-muted-foreground">
          Cards and official tax receipts live in the Stripe Billing Portal — GenieMade never sees or
          stores your card details.
        </p>
        <button className="btn-gold px-5 py-2.5 text-sm" onClick={openPortal} disabled={busy} data-testid="manage-billing">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          {busy ? "Opening…" : "Manage billing"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- Invoices ------------------------------ */

export function InvoicesPanel() {
  const [state, setState] = useState<PanelState<Invoice[]>>({ kind: "loading" });

  const load = useCallback(() => {
    setState({ kind: "loading" });
    api.invoices()
      .then((r) => setState({ kind: "ready", data: r.invoices || [] }))
      .catch((e) => setState(classifyError(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PanelHeading title="Invoices" sub="Every credit-pack purchase, with its official Stripe receipt." />
      {state.kind === "loading" && <PanelLoading label="Fetching your purchases…" />}
      {state.kind === "not_live" && <PanelNotLive what="The invoice list" />}
      {state.kind === "error" && <PanelError error={state.message} onRetry={load} />}
      {state.kind === "ready" && (
        state.data.length ? (
          <div className="gm-panel overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">Date</th><th className="p-3">Pack</th><th className="p-3">Wishes</th><th className="p-3">Amount</th><th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {state.data.map((inv) => (
                  <tr key={inv.id} className="border-t border-border/60">
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{fmtDate(inv.ts)}</td>
                    <td className="p-3 capitalize">{inv.pack || "—"}</td>
                    <td className="p-3" style={{ color: "#ffe390" }}>✦ {inv.credits ?? "—"}</td>
                    <td className="p-3">{fmtUsd(inv.amount_cents, inv.currency)}</td>
                    <td className="p-3">
                      {inv.receipt_url ? (
                        <a href={inv.receipt_url} target="_blank" rel="noreferrer" className="btn-ghost-gold inline-flex px-3 py-1.5 text-xs no-underline">
                          <ReceiptText className="h-3.5 w-3.5" /> Receipt
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <PanelEmpty>No invoices yet.</PanelEmpty>
        )
      )}
    </div>
  );
}
