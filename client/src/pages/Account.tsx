/*
 * Gilded Night — Account & Settings hub (/account), per the atlas2 spec (2026-07-19).
 * Left-nav Settings shell (fal.ai reference structure, GenieMade skin) with grouped
 * panels wired to the engine API contract. Section state lives in the URL hash
 * (#usage, #credits, …) so panels are linkable. Trust Standard: every panel shows
 * real data, an honest empty state, or an explicit "rolling out" notice — never faked.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "wouter";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { useSession } from "@/contexts/SessionContext";
import { openClientDashboard, PORTAL_BRAND_HOST } from "@/lib/portal";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  UserRound, BellRing, BarChart3, MapPin, Sparkles, Gauge, CreditCard, ReceiptText,
  History, CircleAlert, KeyRound, Webhook, LogOut, LayoutDashboard, Loader2, Search, Images,
} from "lucide-react";
import { AccountPanel, NotificationsPanel } from "@/components/settings/GeneralPanels";
import {
  UsagePanel, AddressPanel, CreditsPanel, ConcurrencyPanel, BillingPanel, InvoicesPanel,
} from "@/components/settings/BillingPanels";
import { HistoryPanel, ErrorsPanel, DeveloperPanel } from "@/components/settings/AnalyticsPanels";
import { VaultPanel } from "@/components/settings/VaultPanel";
import { ApiKeysPanel } from "@/components/settings/ApiKeysPanel";

type SectionId =
  | "vault"
  | "account" | "notifications"
  | "usage" | "address" | "credits" | "concurrency" | "billing" | "invoices"
  | "history" | "errors"
  | "api-keys" | "webhooks";

interface NavItem { id: SectionId; label: string; icon: typeof UserRound; coming?: boolean }
interface NavGroup { label: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    label: "Creations",
    items: [
      { id: "vault", label: "Vault", icon: Images },
    ],
  },
  {
    label: "General",
    items: [
      { id: "account", label: "Account", icon: UserRound },
      { id: "notifications", label: "Notification Settings", icon: BellRing },
    ],
  },
  {
    label: "Usage & Billing",
    items: [
      { id: "usage", label: "Usage", icon: BarChart3 },
      { id: "address", label: "Address", icon: MapPin },
      { id: "credits", label: "Credits", icon: Sparkles },
      { id: "concurrency", label: "Concurrency Limits", icon: Gauge },
      { id: "billing", label: "Billing", icon: CreditCard },
      { id: "invoices", label: "Invoices", icon: ReceiptText },
    ],
  },
  {
    label: "Analytics & Monitoring",
    items: [
      { id: "history", label: "Request History", icon: History },
      { id: "errors", label: "Errors", icon: CircleAlert },
    ],
  },
  {
    label: "Developer",
    items: [
      { id: "api-keys", label: "API Keys", icon: KeyRound },
      { id: "webhooks", label: "Webhooks", icon: Webhook, coming: true },
    ],
  },
];

const VALID_IDS = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.id)));

function sectionFromHash(): SectionId {
  const h = window.location.hash.replace("#", "") as SectionId;
  return VALID_IDS.has(h) ? h : "account";
}

export default function Account() {
  const { user, loading, logout } = useSession();
  const [, navigate] = useLocation();
  const [section, setSection] = useState<SectionId>(() => sectionFromHash());
  const [query, setQuery] = useState("");
  const [portalBusy, setPortalBusy] = useState(false);
  const [searchParams] = useSearchParams();
  const purchase = searchParams.get("purchase");
  const [purchaseState, setPurchaseState] = useState<null | { balance: number } | "checking">(
    purchase === "success" ? "checking" : null,
  );

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [loading, user, navigate]);

  // Stripe top-up return: confirm the credits actually arrived by re-fetching the live balance.
  useEffect(() => {
    if (purchase !== "success" || loading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { api } = await import("@/lib/api");
        const c = await api.credits();
        if (cancelled) return;
        setPurchaseState({ balance: c.balance });
        go("credits");
        toast.success(`Top-up confirmed — your balance is now ✦${c.balance}.`);
      } catch {
        if (cancelled) return;
        setPurchaseState(null);
        toast.info("Payment received — your credits may take a moment to appear. Refresh Credits shortly.");
        go("credits");
      }
      // Clean the query param so refreshes don't re-trigger the banner.
      window.history.replaceState(null, "", `/account#credits`);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchase, loading, user]);

  useEffect(() => {
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function go(id: SectionId) {
    setSection(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  async function gotoClientDashboard() {
    if (!user || portalBusy) return;
    setPortalBusy(true);
    const r = await openClientDashboard(user.email);
    if (!r.ok) {
      setPortalBusy(false);
      if (r.reason === "denied") toast.error("The portal declined this account — contact support@cyberhopeai.com.");
      else toast.info(`The client dashboard (${PORTAL_BRAND_HOST}) isn't live yet — it's on the way.`);
    }
  }

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <GoldDust />
        <GmNav />
        <main className="container relative z-10 grid min-h-[50vh] place-items-center pt-10 pb-16 text-muted-foreground">
          {loading ? "Opening your settings…" : "Redirecting…"}
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Your account</span>
            <h1 className="mt-3 font-display text-4xl font-semibold">Settings<em className="gold-text italic">.</em></h1>
            <p className="mt-2 text-sm text-muted-foreground">Everything for your account, usage, and billing.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button className="btn-ghost-gold px-4 py-2 text-sm" onClick={gotoClientDashboard} disabled={portalBusy} data-testid="open-client-dashboard">
              {portalBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutDashboard className="h-4 w-4" />}
              {portalBusy ? "Opening…" : "Client dashboard"}
            </button>
            <button className="btn-ghost-gold px-4 py-2 text-sm" onClick={async () => { await logout(); navigate("/"); }} data-testid="sign-out">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Left nav */}
          <nav aria-label="Settings sections">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search settings…"
                className="pl-9 text-sm"
                data-testid="settings-search"
              />
            </div>
            <div className="mt-5 grid gap-5">
              {filteredGroups.map((g) => (
                <div key={g.label}>
                  <div className="px-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{g.label}</div>
                  <div className="mt-1.5 grid gap-0.5">
                    {g.items.map((it) => {
                      const Icon = it.icon;
                      const active = section === it.id;
                      return (
                        <button
                          key={it.id}
                          onClick={() => go(it.id)}
                          data-testid={`nav-${it.id}`}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                            active ? "font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`}
                          style={active ? { background: "rgba(245,196,81,.1)", color: "#ffe390" } : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{it.label}</span>
                          {it.coming && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-muted-foreground">soon</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <p className="px-2 text-sm text-muted-foreground">Nothing matches “{query}”.</p>
              )}
            </div>
          </nav>

          {/* Active panel */}
          <section className="min-w-0">
            {purchaseState === "checking" && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Confirming your top-up with the registry…
              </div>
            )}
            {purchaseState && purchaseState !== "checking" && (
              <div
                className="mb-4 rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: "rgba(102,227,232,.4)", background: "rgba(102,227,232,.06)", color: "#66e3e8" }}
              >
                <b>Top-up confirmed.</b> Your credits arrived — current balance ✦{purchaseState.balance}. Every
                wish you make is sealed with a QSeal certificate the moment it lands.
              </div>
            )}
            {section === "vault" && <VaultPanel />}
            {section === "account" && <AccountPanel />}
            {section === "notifications" && <NotificationsPanel />}
            {section === "usage" && <UsagePanel />}
            {section === "address" && <AddressPanel />}
            {section === "credits" && <CreditsPanel />}
            {section === "concurrency" && <ConcurrencyPanel />}
            {section === "billing" && <BillingPanel />}
            {section === "invoices" && <InvoicesPanel />}
            {section === "history" && <HistoryPanel />}
            {section === "errors" && <ErrorsPanel />}
            {section === "api-keys" && <ApiKeysPanel />}
            {section === "webhooks" && <DeveloperPanel item="webhooks" />}
          </section>
        </div>
      </main>
      <GmFooter />
    </div>
  );
}
