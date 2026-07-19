# GenieMade Front-End Rebuild — Design Spec

This is a **rebuild of an existing brand** (geniemadeit.com — live reference audited). The brand
system is the ground-truth spec and is kept: **dark night-violet + gold "genie/lamp" identity**,
serif display headlines with gold italics, gold-dust particles, certificate-seal motif.
The task is to elevate it to invideo/Canva-grade commercial polish and make every flow REAL
against the live GenieMade engine API (proxied same-origin at /api/*).

## Chosen Approach: "Gilded Night" (existing brand, elevated)
- **Design Movement**: Luxe Art-Deco-meets-modern-SaaS. Dark celestial ground, gold metallic
  accents, engraved-certificate detailing.
- **Core Principles**:
  1. Nothing faked — every number, price, credit, certificate comes from the live engine.
  2. The certificate is the hero — the seal motif recurs on cards, results, verify page.
  3. One prompt bar to everything — image, fast, pro, video, voice from a single composer.
  4. Honest errors are part of the design — styled error states, never silent failure.
- **Color Philosophy**: Night violet (#130a26→#1c1140 range) as the sky where wishes appear;
  gold (#f5c451/#ffe390) exclusively for value moments (CTAs, credits, seals); teal `#66e3e8`
  as rare "magic spark". Gold is the signature brand color — never used for body text.
- **Layout Paradigm**: Asymmetric hero (copy left, layered floating creations right);
  Studio = focused composer column + certificate sidecard; Vault = masonry-ish grid.
- **Signature Elements**: (1) gold lamp logotype + serif "Genie**Made**" wordmark, (2) the
  eight-point certificate seal with check, (3) gold-dust particle canvas.
- **Typography System**: Fraunces (serif display, 500/600, italics for gold em words) +
  Outfit (body/UI, 400–700). No Inter.
- **Interaction Philosophy**: Wish-making is theatrical (summoning orb, staged progress,
  certificate reveal); everything else is instant and quiet. 150–250ms ease-out.
- **Animation**: entrance fades w/ 40ms stagger; button :active scale(.97); summoning orb
  conic spin; prefers-reduced-motion respected everywhere.
- **Brand Essence**: The AI studio where every creation is provably yours — for creators who
  need proof, not just pixels. Adjectives: magical, trustworthy, exacting.
- **Brand Voice**: wish/lamp metaphor, but honest. Ex: "Describe it. GenieMade makes it real."
  / "Sealed the second it's made." No "unlike anyone else" overclaims (legal fix per brief).
- **Wordmark & Logo**: existing gold lamp SVG + "Genie**Made**" serif wordmark (Made in gold).

## Hard constraints (from BMAD brief — contract)
- Trust Standard: real output or honest, actionable error. NEVER fabricate results or a
  "certified" verdict. Verify page must not fabricate a pass (engine verify is still a stub —
  surface that honestly).
- NDA: externally only "PrecognitionOS" / "QSurface" naming.
- Fix C2PA marketing overclaim: certificates positioned as "built on the open C2PA standard".
- Real pricing: packs from /api/capabilities (Starter 150/$12, Plus 600/$39, Pro 1500/$89,
  3 free) wired to POST /api/billing/checkout (returns real live Stripe URL).
- Persistent nav + account dashboard + Vault download/manage are P0.

## Pages
- `/` landing · `/app` Studio · `/account` dashboard · `/pricing` full pricing · `/verify` provenance check

## Style Decisions
- Vite dev proxy + deployed static hosting cannot proxy /api → for the deliverable we keep
  the repo's Cloudflare `_worker.js` proxy; in this preview build we call the engine via
  `https://geniemadeit.com/api` base with credentials (CORS permitting) or document the limit.
- Pages remain primarily on a night-violet celestial ground; light surfaces only as
  certificate parchment/document panels with dark violet ink and gold engraving.
- The eight-point certificate seal is a structural motif, not just an icon: major surfaces
  reference sealing/receipt/provenance in their framing (`.cert-panel`, `.deco-corners`,
  `.deco-divider`).
- Gold reserved for CTAs, seals, proof moments, and italic display emphasis; body copy never
  relies on gold or pale-on-pale contrast.
