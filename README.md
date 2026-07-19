# geniemadeit.com — GenieMade

AI image & video generation where every creation is **trackable, provable, traceable** —
sealed with a SHA-256 certificate the moment it's made. A CyberHope AI company.

This branch (`manus/rebuild`) replaces the static splash/app pages with a full React
front-end wired to the live GenieMade engine. The previous site is preserved in `legacy/`.

## Architecture

```
Browser ── same-origin ──▶ Cloudflare Pages (this repo)
                             ├── static React SPA (dist/public)
                             └── _worker.js
                                   ├── /api/*  ──▶ geniemade-engine.cyberhopeai.workers.dev
                                   ├── /asset/* ─▶ engine (R2-backed generated media)
                                   └── SPA fallback → index.html for /app, /pricing, /verify, /account
```

The engine (separate private repo) handles auth, fal.ai generation, R2 storage,
SHA-256 certificates, credits, and Stripe checkout. This front-end calls it
exclusively through the same-origin `/api` proxy, so cookies stay first-party
and no provider is ever exposed to the browser.

## Pages

| Route | What it does |
|---|---|
| `/` | Landing — live examples from `/api/examples`, live pricing from `/api/capabilities` |
| `/app` | Studio — text→image (fast/pro), image→video (from Vault image or prompt), aspect ratios, certificate reveal, Vault grid |
| `/pricing` | Wish packs (live from the engine) wired to `POST /api/billing/checkout` → real Stripe checkout |
| `/account` | Dashboard — credits, creation history with receipts/hashes, downloads, sign-out |
| `/verify` | Provenance check — receipt lookup + local (in-browser) SHA-256 file fingerprinting; honest fallback while engine `/api/verify` is a stub |

## Local development

```bash
pnpm install
pnpm dev        # http://localhost:3000 — /api proxied to the live engine
pnpm check      # typecheck
pnpm build      # outputs dist/public (includes _worker.js)
```

## Cloudflare Pages settings (IMPORTANT — changed on this branch)

| Setting | Value |
|---|---|
| Build command | `pnpm install && pnpm build` |
| Build output directory | `dist/public` |
| Node version | 22 (set `NODE_VERSION=22` env var if needed) |

`scripts/copy-worker.mjs` copies `_worker.js` into `dist/public` at the end of the
build, so the existing `/api` + `/asset` proxying (and the `WAITLIST` KV binding)
keeps working unchanged. `_worker.js` also gained an SPA fallback so deep links
like `/app` and `/verify` resolve.

## What changed vs. `main`

- **Working billing**: paywall + pricing now call the engine's real Stripe checkout
  (the old `alert()` stub is gone). Packs render live from `/api/capabilities`.
- **Full Studio**: capability picker (image fast/pro, image→video), aspect ratios,
  animate-from-Vault, staged generation progress, certificate reveal, styled errors.
- **New pages**: `/account` dashboard and full `/pricing`; persistent nav with live
  credit count everywhere.
- **Honest verify**: receipt lookup + client-side SHA-256 hashing (file never leaves
  the browser). While the engine `/api/verify` endpoint is a stub, verification falls
  back to the signed-in user's Vault records and says exactly what it can and cannot prove.
- **Copy fixes per the BMAD brief**: removed the "unlike anyone else" C2PA overclaim —
  certificates are positioned as "built on the open C2PA content-credentials standard".
- **Brand elevation**: "Gilded Night" design system (night-violet + gold, Fraunces +
  Outfit, certificate/deco motifs, gold-dust canvas), custom hero/section art in
  `client/public/brand/`.

## Engine TODOs surfaced by this rebuild (backend repo)

- `POST /api/verify` returns `{ status: "todo_phase2" }` — implement public receipt
  lookup so `/verify` works signed-out.
- `image.fast` (fal-ai/z-image/turbo) intermittently returns provider errors; the UI
  surfaces them honestly, but worth a look.
- Consider an account-deletion + email-change endpoint for the dashboard.

(c) CyberHope AI
