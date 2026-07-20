/*
 * API Keys — developer keys for calling GenieMade from any site/app (X-Api-Key header).
 * The full key is shown ONCE on creation (we store only its hash). List shows prefix + usage.
 */
import { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, KeyRound, Copy, Trash2, Plus, ShieldCheck } from "lucide-react";

type KeyRow = { id: string; prefix: string; name: string; created_at: string; last_used_at: string | null; calls: number; revoked: boolean };

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<{ key: string } | null>(null);

  const load = () => api.listKeys().then((j) => setKeys(j.keys || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function create() {
    setCreating(true);
    try {
      const j = await api.createKey(name.trim() || undefined);
      if (j.ok && j.key) { setFresh({ key: j.key }); setName(""); load(); }
      else toast.error("Couldn't create the key — try again.");
    } catch { toast.error("Couldn't create the key — try again."); }
    finally { setCreating(false); }
  }

  async function revoke(id: string) {
    try { await api.revokeKey(id); load(); toast.success("Key revoked"); } catch { toast.error("Couldn't revoke — try again."); }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">API Keys</h2>
      <p className="mt-1 text-sm text-muted-foreground">Call GenieMade from your own site or app — pass your key in an <span className="kv-mono">X-Api-Key</span> header.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input className="min-w-[180px] flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm" placeholder="Key name — e.g. Production, My website" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} onKeyDown={(e) => e.key === "Enter" && create()} />
        <button className="btn-gold px-4 py-2 text-sm" onClick={create} disabled={creating}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create key</button>
      </div>

      {fresh && (
        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "#2f6f72", background: "rgba(102,227,232,.05)" }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#66e3e8" }}><ShieldCheck className="h-4 w-4" /> Your new key — copy it now, it won't be shown again</div>
          <div className="mt-2 flex items-center gap-2">
            <code className="kv-mono flex-1 break-all rounded-lg bg-background/60 px-3 py-2 text-xs">{fresh.key}</code>
            <button className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(fresh.key); toast.success("Key copied"); }} aria-label="Copy key"><Copy className="h-4 w-4" /></button>
          </div>
          <button className="mt-2 text-xs text-muted-foreground underline" onClick={() => setFresh(null)}>Done — hide it</button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : keys.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"><KeyRound className="mx-auto h-6 w-6 opacity-60" /><p className="mt-2">No API keys yet — create one to start building on GenieMade.</p></div>
      ) : (
        <div className="mt-6 divide-y divide-border rounded-xl border border-border">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">{k.name}{k.revoked && <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">Revoked</span>}</div>
                <div className="kv-mono mt-0.5 text-xs text-muted-foreground">{k.prefix} · {k.calls} calls · {k.last_used_at ? `last used ${fmtDate(k.last_used_at)}` : "never used"}</div>
              </div>
              {!k.revoked && <button className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => revoke(k.id)}><Trash2 className="h-3.5 w-3.5" /> Revoke</button>}
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">Live endpoints: <span className="kv-mono">/api/verify</span> · <span className="kv-mono">/api/register</span> · <span className="kv-mono">/api/anchor</span> · <span className="kv-mono">/api/removebg</span>. Full docs are coming to <span className="kv-mono">/developers</span>.</p>
    </div>
  );
}
