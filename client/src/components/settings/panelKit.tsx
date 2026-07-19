/*
 * Gilded Night — Settings hub shared kit.
 * Honest panel states per the Trust Standard: every panel is either
 * real API data, an honest empty state, or an explicit "backend rolling out"
 * notice when the engine returns 404 for a contract endpoint. Never fabricated.
 */
import { ReactNode } from "react";
import { Loader2, Hourglass, CircleAlert } from "lucide-react";
import { ApiError } from "@/lib/api";

export function PanelHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function PanelLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="gm-panel grid place-items-center p-10 min-h-40">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {label}
      </div>
    </div>
  );
}

/** Honest state when the engine hasn't shipped a contract endpoint yet (404). */
export function PanelNotLive({ what }: { what: string }) {
  return (
    <div className="gm-panel p-8 text-center">
      <Hourglass className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
        {what} is rolling out on the engine right now. The screen is ready — it will light up
        with your real data the moment the backend endpoint goes live. Nothing here is ever simulated.
      </p>
    </div>
  );
}

export function PanelError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="gm-panel p-8 text-center">
      <CircleAlert className="mx-auto h-6 w-6" style={{ color: "#ff9db4" }} />
      <p className="mt-3 text-sm" style={{ color: "#ff9db4" }}>{error}</p>
      {onRetry && (
        <button className="btn-ghost-gold mt-4 px-4 py-2 text-sm" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

export function PanelEmpty({ children }: { children: ReactNode }) {
  return <div className="gm-panel p-8 text-center text-sm text-muted-foreground">{children}</div>;
}

/** Classify a panel fetch failure: engine 404 = endpoint not shipped; anything else = real error. */
export type PanelState<T> =
  | { kind: "loading" }
  | { kind: "not_live" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: T };

export function classifyError(e: unknown): { kind: "not_live" } | { kind: "error"; message: string } {
  const a = e as ApiError;
  if (a?.status === 404 || a?.code === "not_found") return { kind: "not_live" };
  return { kind: "error", message: a?.message || "Something went wrong talking to the engine." };
}

export function fmtUsd(cents?: number, currency = "usd"): string {
  if (typeof cents !== "number") return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}
