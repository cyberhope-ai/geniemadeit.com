/* Gilded Night — paywall wired to the REAL engine Stripe checkout (live keys). */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api, ApiError, Pack } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** cost of the blocked action, for honest messaging */
  neededCredits?: number;
  remaining?: number;
}

const PACK_META: Record<string, { name: string; blurb: string; hot?: boolean }> = {
  starter: { name: "Starter", blurb: "Great for trying video" },
  plus: { name: "Plus", blurb: "Best value for creators", hot: true },
  pro: { name: "Pro", blurb: "For heavy production" },
};

export function PaywallModal({ open, onOpenChange, neededCredits, remaining }: Props) {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!open) return;
    api.capabilities().then((c) => setPacks(c.packs || [])).catch(() => setPacks([]));
  }, [open]);

  async function buy(key: string) {
    setBusy(key);
    try {
      const j = await api.checkout(key);
      if (j.url) {
        window.location.href = j.url; // real Stripe checkout session
        return;
      }
      toast.error("Checkout didn't return a payment link. Please try again.");
    } catch (e) {
      const a = e as ApiError;
      toast.error(a.message || "Checkout failed — please try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gm-panel max-w-md border-border">
        <DialogTitle className="font-display text-2xl font-semibold">
          {typeof remaining === "number" && remaining <= 0
            ? "Your wishes are used up."
            : "Not enough wishes for that."}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          {typeof neededCredits === "number" && (
            <>This creation costs <b style={{ color: "#ffe390" }}>{neededCredits} wishes</b>
            {typeof remaining === "number" && <> — you have {remaining}</>}. </>
          )}
          Top up and the lamp never runs dry. Wishes never expire.
        </DialogDescription>
        <div className="grid gap-3 mt-1">
          {packs.length === 0 && (
            <div className="text-sm text-muted-foreground">Loading packs…</div>
          )}
          {packs.map((p) => {
            const meta = PACK_META[p.key] || { name: p.key, blurb: "" };
            return (
              <button
                key={p.key}
                onClick={() => buy(p.key)}
                disabled={!!busy}
                data-testid={`pack-${p.key}`}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                  meta.hot ? "border-[#c88f2c]" : "border-border"
                } hover:bg-accent`}
                style={meta.hot ? { background: "rgba(245,196,81,.06)" } : undefined}
              >
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {meta.name}
                    {meta.hot && (
                      <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide" style={{ background: "#f5c451", color: "#2a1a05" }}>
                        Best value
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.credits} wishes · {meta.blurb}</div>
                </div>
                <div className="font-display text-xl font-semibold" style={{ color: "#ffe390" }}>
                  {busy === p.key ? "…" : `$${p.usd}`}
                </div>
              </button>
            );
          })}
        </div>
        <div className="text-center text-xs text-muted-foreground">Secure checkout · powered by Stripe</div>
      </DialogContent>
    </Dialog>
  );
}

