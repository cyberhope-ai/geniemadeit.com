/*
 * Gilded Night — Pricing (/pricing): live packs from the engine, real Stripe checkout.
 */
import { useEffect, useState } from "react";
import { GmNav } from "@/components/GmNav";
import { GmFooter } from "@/components/GmFooter";
import { GoldDust } from "@/components/brand/GoldDust";
import { AuthModal, AuthMode } from "@/components/AuthModal";
import { useSession } from "@/contexts/SessionContext";
import { api, ApiError, Pack, CapabilityItem } from "@/lib/api";
import { toast } from "sonner";

const PACK_META: Record<string, { name: string; blurb: string; hot?: boolean; feats: string[] }> = {
  starter: { name: "Starter", blurb: "Great for trying everything", feats: ["≈150 images", "or 50 voice clips", "Certificate on every creation", "Vault included"] },
  plus: { name: "Plus", blurb: "Best value for creators", hot: true, feats: ["≈600 images", "or ~15 image → video clips", "Full-resolution downloads", "Priority generation"] },
  pro: { name: "Pro", blurb: "For heavy production", feats: ["≈1,500 images", "or ~37 image → video clips", "Everything in Plus", "Early access to new engines"] },
};

export default function Pricing() {
  const { user } = useSession();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [caps, setCaps] = useState<CapabilityItem[]>([]);
  const [free, setFree] = useState(3);
  const [busy, setBusy] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");

  useEffect(() => {
    api.capabilities().then((j) => {
      setPacks(j.packs || []);
      setCaps(j.capabilities.flatMap((c) => c.items));
      if (typeof j.free_credits === "number") setFree(j.free_credits);
    }).catch(() => toast.error("Couldn't load live pricing from the engine."));
  }, []);

  async function buy(key: string) {
    if (!user) { setMode("signup"); setAuthOpen(true); return; }
    setBusy(key);
    try {
      const j = await api.checkout(key);
      if (j.url) { window.location.href = j.url; return; }
      toast.error("Checkout didn't return a payment link.");
    } catch (e) {
      toast.error((e as ApiError).message || "Checkout failed — please try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="relative min-h-screen">
      <GoldDust />
      <GmNav />
      <main className="container relative z-10 pt-14 pb-16">
        <div className="max-w-2xl">
          <span className="eyebrow">Pricing</span>
          <h1 className="mt-4 font-display text-5xl font-semibold">Start free. <em className="gold-text italic">Top up when ready.</em></h1>
          <p className="mt-4 text-muted-foreground">
            Every new account gets <b style={{ color: "#ffe390" }}>{free} free wishes</b> — no credit card.
            After that, buy a one-time wish pack. No subscription, and wishes never expire.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {packs.map((p) => {
            const meta = PACK_META[p.key] || { name: p.key, blurb: "", feats: [] };
            const perWish = (p.usd / p.credits).toFixed(3).replace(/0$/, "");
            return (
              <div key={p.key} className={`gm-panel relative p-7 ${meta.hot ? "outline outline-2" : ""}`} style={meta.hot ? { outlineColor: "#c88f2c" } : undefined}>
                {meta.hot && (
                  <span className="absolute -top-3 left-7 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide" style={{ background: "#f5c451", color: "#2a1a05" }}>
                    Most popular
                  </span>
                )}
                <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{meta.name}</div>
                <div className="mt-3 font-display text-5xl font-semibold">${p.usd}</div>
                <div className="mt-1 text-sm text-muted-foreground">one-time · ${perWish}/wish</div>
                <div className="mt-2 text-sm font-semibold" style={{ color: "#ffe390" }}>✦ {p.credits.toLocaleString()} wishes</div>
                <ul className="mt-5 grid gap-2.5 text-sm text-muted-foreground">
                  {meta.feats.map((f) => <li key={f} className="flex gap-2"><span style={{ color: "#f5c451" }}>✓</span>{f}</li>)}
                </ul>
                <button
                  className={`${meta.hot ? "btn-gold" : "btn-ghost-gold"} mt-7 w-full py-3`}
                  onClick={() => buy(p.key)}
                  disabled={!!busy}
                  data-testid={`buy-${p.key}`}
                >
                  {busy === p.key ? "Opening checkout…" : `Get ${meta.name}`}
                </button>
              </div>
            );
          })}
          {packs.length === 0 && <div className="text-muted-foreground">Loading live pricing from the engine…</div>}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">Secure checkout powered by Stripe. Prices and pack sizes come live from the engine.</p>

        {/* What wishes buy — live costs */}
        <section className="mt-16 max-w-3xl">
          <h2 className="font-display text-2xl font-semibold">What a wish buys</h2>
          <p className="mt-1 text-sm text-muted-foreground">Live costs, straight from the engine.</p>
          <div className="gm-panel mt-5 overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">Creation</th><th className="p-3">Status</th><th className="p-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {caps.map((c) => (
                  <tr key={c.id} className="border-t border-border/60">
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">
                      {c.status === "live" ? (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(102,227,232,.12)", color: "#66e3e8" }}>Live</span>
                      ) : c.status === "next" ? (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(245,196,81,.12)", color: "#ffe390" }}>Just added</span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Coming soon</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap" style={{ color: "#ffe390" }}>✦ {c.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <GmFooter />
      <AuthModal open={authOpen} mode={mode} onOpenChange={setAuthOpen} onModeChange={setMode} next="/pricing" />
    </div>
  );
}
