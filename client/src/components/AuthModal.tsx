/* Gilded Night — real auth: engine signup/login + Google OAuth. Honest errors only. */
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiError, GOOGLE_START } from "@/lib/api";
import { useSession } from "@/contexts/SessionContext";
import { Wordmark } from "@/components/brand/Lamp";
import { useLocation } from "wouter";

export type AuthMode = "signup" | "signin";

interface Props {
  open: boolean;
  mode: AuthMode;
  onOpenChange: (v: boolean) => void;
  onModeChange: (m: AuthMode) => void;
  /** where to go after successful auth; default /app */
  next?: string;
}

function GoogleG() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45 24c0-1.6-.1-2.8-.4-4H24v7.5h12c-.2 2-1.7 5-5 7l7.7 6c4.5-4.2 6.3-10.4 6.3-16.5z" />
      <path fill="#34A853" d="M24 46c6.5 0 11.9-2.1 15.9-5.9l-7.7-6c-2.1 1.4-4.9 2.4-8.2 2.4-6.3 0-11.6-4.2-13.5-9.9l-8 6.1C8.5 40.9 15.6 46 24 46z" />
      <path fill="#FBBC05" d="M10.5 26.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-8-6.1C1 14.3 0 18 0 22s1 7.7 2.5 10.7l8-6.1z" />
      <path fill="#EA4335" d="M24 9.5c3.5 0 6 1.5 7.4 2.8l6.8-6.6C34 2 28.6 0 24 0 15.6 0 8.5 5.1 5.5 12.3l8 6.1C15.4 12.7 20.7 9.5 24 9.5z" />
    </svg>
  );
}

export function AuthModal({ open, mode, onOpenChange, onModeChange, next = "/app" }: Props) {
  const { setUser } = useSession();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  async function submit() {
    setErr("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErr("Enter a valid email address.");
      return;
    }
    if (isSignup && pass.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const j = isSignup ? await api.signup(email, pass) : await api.login(email, pass);
      setUser(j.user);
      onOpenChange(false);
      navigate(next);
    } catch (e) {
      const a = e as ApiError;
      if (a.code === "email_exists") setErr("That email already has an account — sign in instead.");
      else if (a.status === 401) setErr("Wrong email or password.");
      else setErr(a.message || "That didn't work — check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gm-panel max-w-sm border-border">
        <div className="mb-1"><Wordmark className="text-lg" /></div>
        <DialogTitle className="font-display text-2xl font-semibold">
          {isSignup ? "Create your account" : "Welcome back"}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          {isSignup
            ? "Sign up and your three free wishes are waiting."
            : "Sign in to keep your wishes and your Vault across devices."}
        </DialogDescription>
        <button
          className="btn-ghost-gold w-full py-2.5 text-sm"
          onClick={() => (window.location.href = GOOGLE_START)}
          data-testid="google-oauth"
        >
          <GoogleG /> Continue with Google
        </button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>
        <Input
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Input
          type="password"
          placeholder={isSignup ? "Password (8+ characters)" : "Password"}
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="btn-gold w-full py-2.5" onClick={submit} disabled={busy}>
          {busy ? "One moment…" : isSignup ? "Create account" : "Sign in"}
        </button>
        {err && <div className="text-sm text-red-400 text-center">{err}</div>}
        <div className="text-center text-sm text-muted-foreground">
          {isSignup ? (
            <>Already have an account?{" "}
              <button className="text-gold-soft underline underline-offset-2" style={{ color: "#ffe390" }} onClick={() => onModeChange("signin")}>
                Sign in
              </button>
            </>
          ) : (
            <>New here?{" "}
              <button className="underline underline-offset-2" style={{ color: "#ffe390" }} onClick={() => onModeChange("signup")}>
                Create an account
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
