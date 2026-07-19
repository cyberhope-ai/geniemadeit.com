/* Gilded Night — footer. */
import { Link } from "wouter";
import { Wordmark } from "@/components/brand/Lamp";

export function GmFooter() {
  return (
    <footer className="relative z-10 border-t border-border/60 mt-24">
      <div className="container py-12 grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Wordmark className="text-lg" />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            AI images &amp; video, sealed and provably yours. Powered by QSeal™ and QSurfaces™
            provenance technology (patent pending). A CyberHope AI company.
          </p>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-3 text-foreground">Product</div>
          <div className="grid gap-2 text-muted-foreground">
            <Link href="/app" className="hover:text-foreground no-underline">Studio</Link>
            <Link href="/pricing" className="hover:text-foreground no-underline">Pricing</Link>
            <Link href="/verify" className="hover:text-foreground no-underline">Verify a creation</Link>
            <Link href="/account" className="hover:text-foreground no-underline">Your Vault</Link>
          </div>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-3 text-foreground">Company</div>
          <div className="grid gap-2 text-muted-foreground">
            <a href="https://cyberhopeai.com" target="_blank" rel="noopener" className="hover:text-foreground no-underline">CyberHope AI</a>
            <Link href="/qseal" className="hover:text-foreground no-underline">QSeal™ technology</Link>
            <Link href="/#how" className="hover:text-foreground no-underline">How it works</Link>
            <a href="tel:+13179613077" className="hover:text-foreground no-underline">Call (317) 961-3077</a>
            <a href="mailto:hello@geniemadeit.com" className="hover:text-foreground no-underline">hello@geniemadeit.com</a>
          </div>
        </div>
      </div>
      <div className="container pb-8 text-xs text-muted-foreground/70">
        © 2026 GenieMade · geniemadeit.com · QSeal™ &amp; QSurfaces™ are trademarks of CyberHope AI (patent pending) · SHA-256 certificates · open C2PA content credentials on the way
      </div>
    </footer>
  );
}
