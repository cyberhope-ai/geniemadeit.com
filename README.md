# geniemadeit.com

Public site for **GenieMade** — AI image & video generation with certified, provably-yours creations.

Static site on **Cloudflare Pages** (project `geniemadeit`, prod branch `main`).

- `index.html` — landing page.
- `app.html` — the **Studio** (`/app`): describe a prompt → image / video / voice → sealed in your Vault with a certificate. Loads `assets/studio.js` (cache-busted via `?v=`).
- `verify.html` — verify a creation's certificate (ties to EverVerify).
- `_worker.js` — Cloudflare Pages Function: proxies `/api/*` and `/asset/*` to the engine Worker `geniemade-engine.cyberhopeai.workers.dev` (same-origin), and handles the `/api/waitlist` KV write. Provider keys never touch the browser.
- `assets/` — `studio.js` (Studio app), `landing.js`, sample creations.

**Video is async:** the Studio submits a wish, gets `{status:"processing", poll_url}`, and `studio.js` polls `/api/jobs/:id` until the render completes (Seedance 2.5, ~60–250s) — then drops the result in the Vault.

## Deploy
Not git-connected — deploy by direct upload. Node 20 → use `wrangler@3`:

```
CLOUDFLARE_API_TOKEN=… npx wrangler@3 pages deploy . --project-name=geniemadeit --branch=main
```

Then purge the zone cache (assets are served `immutable`, so a same-path change needs a purge).

The generation engine, Vault, auth, billing, and provenance live in the private repo
`cyberhope-ai/pcos-geniemade-vault-code`.

(c) CyberHope AI

- `director.html` — **The Director** (`/director`): plan a film before you shoot it. Describe a
  moment, choose the eye that frames it (persona), and get a storyboard panel, concept painting,
  location scout or lighting study — kept together as a project. Loads `assets/director.js`.
  Backed by `/api/shot/compose`, `/api/director/menu` and `/api/projects` in the engine.
