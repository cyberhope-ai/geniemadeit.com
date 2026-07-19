/*
 * Gilded Night — Settings hub: General panels (Account, Notification Settings).
 * Contract: GET/PATCH /api/account, GET/PUT /api/settings/notifications.
 * Trust Standard: real data, honest 404 "rolling out" state, no fabrication.
 */
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { api, Account, NotificationPrefs } from "@/lib/api";
import { useSession } from "@/contexts/SessionContext";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  PanelHeading, PanelLoading, PanelNotLive, PanelError, PanelState, classifyError,
} from "./panelKit";
import { fmtDate } from "@/lib/api";

/* ------------------------------- Account ------------------------------- */

export function AccountPanel() {
  const { user, refresh } = useSession();
  const [state, setState] = useState<PanelState<Account>>({ kind: "loading" });
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function onAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { avatar_url } = await api.uploadAvatar(file);
      setState((s) => (s.kind === "ready" ? { kind: "ready", data: { ...s.data, avatar_url } } : s));
      await refresh();
      toast.success("Photo updated.");
    } catch (er) {
      const c = classifyError(er);
      toast.error(c.kind === "not_live" ? "Photo upload isn't available yet." : c.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  const load = useCallback(() => {
    setState({ kind: "loading" });
    api.account()
      .then((a) => {
        setState({ kind: "ready", data: a });
        setDisplayName(a.display_name || "");
        setUsername(a.username || "");
      })
      .catch((e) => setState(classifyError(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (state.kind !== "ready" || saving) return;
    setSaving(true);
    try {
      const updated = await api.updateAccount({ display_name: displayName.trim(), username: username.trim() });
      setState({ kind: "ready", data: updated });
      await refresh();
      toast.success("Profile saved.");
    } catch (e) {
      const c = classifyError(e);
      toast.error(c.kind === "not_live" ? "Profile editing isn't live on the engine yet." : c.message);
    } finally {
      setSaving(false);
    }
  }

  if (state.kind === "loading") return <PanelLoading label="Opening your account…" />;

  return (
    <div>
      <PanelHeading title="Account" sub="Your profile on GenieMade — how your name appears on certificates and in the portal." />
      {state.kind === "not_live" && (
        <>
          <PanelNotLive what="The editable profile (display name, username, avatar)" />
          {/* Honest fallback: show what the existing session endpoint DOES know. */}
          {user && (
            <div className="gm-panel mt-4 p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From your session (read-only)</div>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Email</dt><dd className="break-all">{user.email}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Account ID</dt><dd className="kv-mono text-xs">{user.id}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Plan</dt><dd className="capitalize">{user.plan}</dd></div>
              </dl>
            </div>
          )}
        </>
      )}
      {state.kind === "error" && <PanelError error={state.message} onRetry={load} />}
      {state.kind === "ready" && (
        <div className="grid gap-4">
          <div className="gm-panel p-6">
            <div className="flex items-center gap-4">
              <div
                className="grid h-16 w-16 shrink-0 place-items-center rounded-full border text-xl font-display font-semibold overflow-hidden"
                style={{ borderColor: "#c88f2c", background: "rgba(245,196,81,.08)", color: "#ffe390" }}
              >
                {state.data.avatar_url
                  ? <img src={state.data.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  : (state.data.display_name || state.data.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{state.data.display_name || state.data.email}</div>
                <div className="text-xs text-muted-foreground capitalize">{state.data.plan} plan · member since {fmtDate(state.data.created_at)}</div>
                <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold" style={{ color: "#ffe390" }}>
                  {uploadingAvatar ? "Uploading…" : "Upload a photo"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onAvatarPick} disabled={uploadingAvatar} data-testid="avatar-upload" />
                </label>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display name</span>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How you want to be shown" data-testid="display-name" />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</span>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="unique-handle" data-testid="username" />
              </label>
            </div>
            <button className="btn-gold mt-5 px-5 py-2.5 text-sm" onClick={save} disabled={saving} data-testid="save-profile">
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>

          <div className="gm-panel p-6">
            <div className="grid gap-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</div>
                  <div className="mt-1 break-all">{state.data.email}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</div>
                  <div className="mt-1">{state.data.full_name || "—"}</div>
                </div>
              </div>
              <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
                To change your email or full name, contact <a href="mailto:support@cyberhopeai.com" className="underline" style={{ color: "#ffe390" }}>support</a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- Notification Settings ------------------------ */

const PREF_META: { key: keyof NotificationPrefs; label: string; sub: string }[] = [
  { key: "email_product_updates", label: "Product updates", sub: "New engines, features, and improvements." },
  { key: "email_billing", label: "Billing", sub: "Purchase confirmations and receipts." },
  { key: "email_generation_complete", label: "Generation complete", sub: "Email when a long-running wish (like video) finishes." },
  { key: "email_marketing", label: "Marketing", sub: "Occasional offers and showcases." },
];

export function NotificationsPanel() {
  const [state, setState] = useState<PanelState<NotificationPrefs>>({ kind: "loading" });

  const load = useCallback(() => {
    setState({ kind: "loading" });
    api.notificationPrefs()
      .then((p) => setState({ kind: "ready", data: p }))
      .catch((e) => setState(classifyError(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(key: keyof NotificationPrefs) {
    if (state.kind !== "ready") return;
    const prev = state.data;
    const next = { ...prev, [key]: !prev[key] };
    setState({ kind: "ready", data: next }); // optimistic
    try {
      const saved = await api.saveNotificationPrefs({
        email_product_updates: next.email_product_updates,
        email_billing: next.email_billing,
        email_generation_complete: next.email_generation_complete,
        email_marketing: next.email_marketing,
      });
      setState({ kind: "ready", data: saved });
    } catch (e) {
      setState({ kind: "ready", data: prev }); // rollback
      const c = classifyError(e);
      toast.error(c.kind === "not_live" ? "Notification settings aren't live on the engine yet." : c.message);
    }
  }

  if (state.kind === "loading") return <PanelLoading label="Loading your preferences…" />;

  return (
    <div>
      <PanelHeading title="Notification Settings" sub="Which emails GenieMade may send you." />
      {state.kind === "not_live" && <PanelNotLive what="Notification preferences" />}
      {state.kind === "error" && <PanelError error={state.message} onRetry={load} />}
      {state.kind === "ready" && (
        <div className="gm-panel divide-y divide-border/60 p-2">
          {PREF_META.map((m) => (
            <div key={m.key} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.sub}</div>
              </div>
              <Switch checked={state.data[m.key]} onCheckedChange={() => toggle(m.key)} data-testid={`pref-${m.key}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
