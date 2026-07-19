/*
 * Gilded Night — Settings hub: Analytics & Monitoring + Developer panels.
 * Request History: GET /api/usage/history (falls back honestly to /api/gallery
 * — real data from a live endpoint — while the history endpoint rolls out).
 * Errors: GET /api/errors. Developer: honest "coming" state, never faked.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, Generation, HistoryItem, ErrorItem, fmtDate, shortHash } from "@/lib/api";
import { Seal } from "@/components/brand/Seal";
import { Copy, KeyRound, Webhook } from "lucide-react";
import {
  PanelHeading, PanelLoading, PanelNotLive, PanelError, PanelEmpty, PanelState, classifyError,
} from "./panelKit";

/* --------------------------- Request History --------------------------- */

type HistoryData =
  | { source: "history"; items: HistoryItem[]; nextCursor?: string }
  | { source: "gallery"; items: Generation[] };

export function HistoryPanel() {
  const [state, setState] = useState<PanelState<HistoryData>>({ kind: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(() => {
    setState({ kind: "loading" });
    api.usageHistory(50)
      .then((r) => setState({ kind: "ready", data: { source: "history", items: r.items || [], nextCursor: r.next_cursor } }))
      .catch(async (e) => {
        const c = classifyError(e);
        if (c.kind === "not_live") {
          // Honest fallback: the gallery endpoint is LIVE and real — use it,
          // and say so, until the richer history endpoint ships.
          try {
            const g = await api.gallery();
            setState({ kind: "ready", data: { source: "gallery", items: g.generations || [] } });
            return;
          } catch { /* fall through */ }
        }
        setState(c);
      });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function loadMore() {
    if (state.kind !== "ready" || state.data.source !== "history" || !state.data.nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const r = await api.usageHistory(50, state.data.nextCursor);
      setState({
        kind: "ready",
        data: { source: "history", items: [...(state.data.items as HistoryItem[]), ...(r.items || [])], nextCursor: r.next_cursor },
      });
    } catch {
      toast.error("Couldn't load more history.");
    }
    setLoadingMore(false);
  }

  function copyReceipt(id?: string) {
    if (!id) return;
    navigator.clipboard.writeText(id);
    toast.success("Receipt copied");
  }

  return (
    <div>
      <PanelHeading title="Request History" sub="Every wish, tracked: when, which engine, what it cost, and its receipt." />
      {state.kind === "loading" && <PanelLoading label="Opening the record…" />}
      {state.kind === "error" && <PanelError error={state.message} onRetry={load} />}
      {state.kind === "ready" && (
        <>
          {state.data.source === "gallery" && (
            <p className="mb-3 text-xs text-muted-foreground">
              Showing your sealed creations from the live Vault. The full request log (including status
              and per-job cost) is rolling out on the engine.
            </p>
          )}
          {state.data.items.length === 0 ? (
            <PanelEmpty>No requests yet — your history begins with your first wish.</PanelEmpty>
          ) : state.data.source === "history" ? (
            <div className="gm-panel overflow-x-auto p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-3">When</th><th className="p-3">Type</th><th className="p-3">Engine</th><th className="p-3">Wishes</th><th className="p-3">Status</th><th className="p-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {(state.data.items as HistoryItem[]).map((h) => (
                    <tr key={h.id} className="border-t border-border/60">
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{fmtDate(h.ts)}</td>
                      <td className="p-3 whitespace-nowrap">{h.capability}</td>
                      <td className="p-3 kv-mono text-xs">{h.model || "—"}</td>
                      <td className="p-3" style={{ color: "#ffe390" }}>✦ {h.credits}</td>
                      <td className="p-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase"
                          style={h.status === "ok"
                            ? { background: "rgba(139,231,155,.12)", color: "#8be79b" }
                            : { background: "rgba(255,157,180,.12)", color: "#ff9db4" }}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="p-3 kv-mono text-xs">
                        {h.cert_id ? (
                          <span className="inline-flex items-center gap-1.5">
                            {shortHash(h.cert_id, 14)}
                            <button aria-label="Copy receipt" className="opacity-50 hover:opacity-100" onClick={() => copyReceipt(h.cert_id)}>
                              <Copy className="h-3 w-3" />
                            </button>
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {state.data.nextCursor && (
                <div className="p-3 text-center">
                  <button className="btn-ghost-gold px-4 py-2 text-sm" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="gm-panel overflow-x-auto p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-3">Preview</th><th className="p-3">Type</th><th className="p-3">Engine</th><th className="p-3">Receipt</th><th className="p-3">SHA-256</th><th className="p-3">Sealed</th>
                  </tr>
                </thead>
                <tbody>
                  {(state.data.items as Generation[]).map((g) => (
                    <tr key={g.id} className="border-t border-border/60">
                      <td className="p-3">
                        {g.capability?.startsWith("image") ? (
                          <img src={g.url} alt="" className="h-11 w-11 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-accent text-xs text-muted-foreground">
                            {g.capability?.split(".")[0]}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">{g.capability}</td>
                      <td className="p-3 kv-mono text-xs">{g.model}</td>
                      <td className="p-3 kv-mono text-xs">
                        <span className="inline-flex items-center gap-1.5">
                          {shortHash(g.cert_id, 14)}
                          {g.cert_id && (
                            <button aria-label="Copy receipt" className="opacity-50 hover:opacity-100" onClick={() => copyReceipt(g.cert_id)}>
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      </td>
                      <td className="p-3 kv-mono text-xs">
                        <span className="inline-flex items-center gap-1.5"><Seal className="h-3.5 w-3.5" /> {shortHash(g.hash, 14)}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{fmtDate(g.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------- Errors ------------------------------- */

export function ErrorsPanel() {
  const [state, setState] = useState<PanelState<ErrorItem[]>>({ kind: "loading" });

  const load = useCallback(() => {
    setState({ kind: "loading" });
    api.errors(50)
      .then((r) => setState({ kind: "ready", data: r.items || [] }))
      .catch((e) => setState(classifyError(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PanelHeading title="Errors" sub="Failed generations — you're never charged for these." />
      {state.kind === "loading" && <PanelLoading label="Checking the record…" />}
      {state.kind === "not_live" && <PanelNotLive what="The error log" />}
      {state.kind === "error" && <PanelError error={state.message} onRetry={load} />}
      {state.kind === "ready" && (
        state.data.length ? (
          <div className="gm-panel overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">When</th><th className="p-3">Type</th><th className="p-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {state.data.map((it) => (
                  <tr key={it.id} className="border-t border-border/60">
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{fmtDate(it.ts)}</td>
                    <td className="p-3 whitespace-nowrap">{it.capability}</td>
                    <td className="p-3 text-xs" style={{ color: "#ff9db4" }}>{it.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <PanelEmpty>No errors — every wish has landed clean.</PanelEmpty>
        )
      )}
    </div>
  );
}

/* ------------------------------ Developer ------------------------------ */

export function DeveloperPanel({ item }: { item: "api-keys" | "webhooks" }) {
  const meta = item === "api-keys"
    ? { icon: KeyRound, title: "API Keys", sub: "Programmatic access to the GenieMade engine." }
    : { icon: Webhook, title: "Webhooks", sub: "Get notified when your generations complete." };
  const Icon = meta.icon;
  return (
    <div>
      <PanelHeading title={meta.title} sub={meta.sub} />
      <div className="gm-panel p-10 text-center">
        <Icon className="mx-auto h-7 w-7 text-muted-foreground" />
        <p className="mt-4 font-display text-lg font-semibold">Available when we open the public API</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {meta.title} will appear here the day the GenieMade public API opens. We don't show
          placeholder keys or fake endpoints — when you see it here, it works.
        </p>
      </div>
    </div>
  );
}
