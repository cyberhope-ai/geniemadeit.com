/* Gilded Night — persistent nav: brand, links, live credits pill, account. */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LampIcon, Wordmark } from "@/components/brand/Lamp";
import { useSession } from "@/contexts/SessionContext";
import { AuthModal, AuthMode } from "@/components/AuthModal";
import { Menu, X, Phone, Mail } from "lucide-react";

const LINKS = [
  { href: "/app", label: "Studio" },
  { href: "/remove-bg", label: "Remove BG" },
  { href: "/pricing", label: "Pricing" },
  { href: "/verify", label: "Verify" },
  { href: "/triple-seal", label: "Triple Seal" },
  { href: "/qseal", label: "QSeal™" },
  { href: "/developers", label: "Developers" },
];

export function GmNav() {
  const { user, logout } = useSession();
  const [loc, navigate] = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [mobile, setMobile] = useState(false);

  function openAuth(m: AuthMode) {
    setMode(m);
    setAuthOpen(true);
    setMobile(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl" style={{ background: "rgba(19,10,38,.82)" }}>
        {/* utility bar — contact up top (not buried in the footer) + secondary links */}
        <div className="border-b border-border/40" style={{ background: "rgba(12,6,26,.55)" }}>
          <div className="container flex items-center justify-between gap-4 py-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <a href="tel:+13179613077" className="flex items-center gap-1.5 no-underline hover:text-foreground" data-testid="nav-phone"><Phone className="h-3.5 w-3.5" style={{ color: "#f5c451" }} /> (317) 961-3077</a>
              <a href="mailto:genie@geniemadeit.com" className="hidden items-center gap-1.5 no-underline hover:text-foreground sm:flex"><Mail className="h-3.5 w-3.5" style={{ color: "#f5c451" }} /> genie@geniemadeit.com</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/about" className="no-underline hover:text-foreground">About</Link>
              <Link href="/partners" className="no-underline hover:text-foreground">Partners</Link>
            </div>
          </div>
        </div>
        <nav className="container flex items-center gap-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <LampIcon className="w-7 h-7" />
            <Wordmark />
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`hover:text-foreground transition-colors ${loc === l.href ? "text-foreground font-medium" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex-1" />
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/pricing" className="rounded-full border px-3 py-1 text-xs font-semibold no-underline"
                style={{ color: "#ffe390", borderColor: "rgba(200,143,44,.6)", background: "rgba(245,196,81,.07)" }}
                title="Wishes remaining — tap to top up">
                ✦ {user.credits} {user.credits === 1 ? "wish" : "wishes"}
              </Link>
              <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground no-underline" data-testid="nav-account">
                {user.display_name || user.email.split("@")[0]}
              </Link>
              <button className="btn-gold px-4 py-2 text-sm" onClick={() => navigate("/app")}>Create</button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => openAuth("signin")} data-testid="nav-signin">
                Sign in
              </button>
              <button className="btn-gold px-4 py-2 text-sm" onClick={() => openAuth("signup")} data-testid="nav-start">
                Start creating
              </button>
            </div>
          )}
          <button className="md:hidden text-foreground" onClick={() => setMobile(!mobile)} aria-label="Menu">
            {mobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
        {mobile && (
          <div className="md:hidden border-t border-border/60 px-6 py-4 flex flex-col gap-4 text-sm" style={{ background: "rgba(19,10,38,.97)" }}>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobile(false)} className="text-foreground no-underline">
                {l.label}
              </Link>
            ))}
            <Link href="/about" onClick={() => setMobile(false)} className="text-foreground no-underline">About</Link>
            <Link href="/partners" onClick={() => setMobile(false)} className="text-foreground no-underline">Partners</Link>
            <a href="tel:+13179613077" className="text-muted-foreground no-underline">Call (317) 961-3077</a>
            {user ? (
              <>
                <Link href="/account" onClick={() => setMobile(false)} className="text-foreground no-underline">
                  Account · ✦ {user.credits} wishes
                </Link>
                <button className="btn-gold py-2.5" onClick={() => { setMobile(false); navigate("/app"); }}>Create</button>
              </>
            ) : (
              <>
                <button className="text-left text-foreground" onClick={() => openAuth("signin")}>Sign in</button>
                <button className="btn-gold py-2.5" onClick={() => openAuth("signup")}>Start creating</button>
              </>
            )}
          </div>
        )}
      </header>
      <AuthModal open={authOpen} mode={mode} onOpenChange={setAuthOpen} onModeChange={setMode} />
    </>
  );
}

/** Hook for pages that need to open the auth modal from CTAs. */
export function useAuthGate() {
  const { user } = useSession();
  const [, navigate] = useLocation();
  return (openAuth: () => void) => {
    if (user) navigate("/app");
    else openAuth();
  };
}
