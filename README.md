# geniemadeit.com

Public site for **GenieMade** — AI image & video generation with certified, provably-yours creations.

Static site on **Cloudflare Pages** (project `geniemadeit`, prod branch `main`).

## Pages

- `index.html` — landing page.
- `app.html` — the **Studio** (`/app`): describe a prompt → image / video / voice → sealed in your Vault with a certificate. Loads `assets/studio.js` (cache-busted via `?v=`).
- `director.html` — **The Director** (`/director`): plan a film before you shoot it. Describe a moment, choose the eye that frames it (persona), and get a storyboard panel, concept painting, location scout or lighting study — kept together as a project. Loads `assets/director.js`. Backed by `/api/shot/compose`, `/api/director/menu` and `/api/projects` in the engine.
- `films.html` — GenieMade Films (`/films`).
- `verify.html` — verify a creation's certificate (ties to EverVerify).
- `account.html`, `studio-you.html`, `import.html`, `affiliates.html`, `privacy.html`, `terms.html`.
- `make/` (39), `invitations/` (13), `holidays/` (13), `studio-you/` (7) — occasion landing pages.
- `people/`, `card/` — My People, and the card/e-invite maker.
- `c/`, `share.html` — the **recipient's** view of something they were sent. These are the delivered artifact, not pages of the site, and deliberately carry no site chrome.
- `_worker.js` — Pages Function: proxies `/api/*` and `/asset/*` to the engine Worker `geniemade-engine.cyberhopeai.workers.dev` (same-origin), and handles the `/api/waitlist` KV write. Provider keys never touch the browser.
- `assets/` — `studio.js` (Studio app), `director.js`, `landing.js`, sample creations.

**Video is async:** the Studio submits a wish, gets `{status:"processing", poll_url}`, and `studio.js` polls `/api/jobs/:id` until the render completes (Seedance 2.5, ~60–250s) — then drops the result in the Vault.

## Navigation — edit one file, not 86

`nav/menu.mjs` is the **only** place site navigation is defined. `build-nav.mjs` renders it into
every page between `<!-- GMNAV:START -->` / `<!-- GMNAV:END -->` markers.

```bash
node build-nav.mjs           # rewrite the header in every page
node build-nav.mjs --check   # fail if any page is stale (CI runs this)
```

**Never hand-edit a page header** — the next build overwrites it, and CI fails first.

Pages are part listed, part **discovered**: the root pages are enumerated in `build-nav.mjs`, but
anything under `make/`, `invitations/`, `holidays/`, `studio-you/`, `people/` and `card/` is picked
up automatically. Add a new occasion page and it gets the canonical header with no code change.

Why this exists: the header used to be hand-maintained in **86 copies**. A new feature landed in
whichever copy you remembered, which is how the Director shipped visible from `/app` and
`/director` and invisible from the other 84 — including `/account`, and including `/people`, which
the nav itself linked to.

Structure is single words in the bar with detail in the dropdown, so the bar stays on one line.
The **Studio** group holds the creation tools (Make a wish, Director, Films, Studio You, My People,
Import).

### Three traps worth knowing before you touch the header

1. **`body{overflow-x:hidden}` kills `position:sticky`.** It makes body a scroll container, so the
   bar pins to a scrollport that never moves and scrolls off the page — this is exactly what
   happened on `/#pricing`. The generated CSS sets `body{overflow-x:clip}`, which suppresses
   horizontal overflow the same way *without* creating a scroll container. Don't switch it back.
2. **Old page CSS still leaks in.** Several pages ship a bare `header{...}` rule from their previous
   bespoke bar, and `verify.html` has `button{width:100%}`. A class beats an element selector only
   for properties it actually declares, so the generated CSS states every property those rules
   touch. If a page renders the bar inset or a button stretched, that is the cause.
3. **`#accountBtn` is the auth toggle, not the Account link.** `assets/studio.js` rewrites its text
   to the signed-in user's name and calls `.onclick` on it *with no null guard*, so it must exist on
   every page that could load `studio.js`. It is rendered everywhere and shown only on `/app`.
   Merging it into the Account link makes "Account" read "Sign in".

Signed-in vs signed-out is resolved once from `/api/me` in the header runtime, not per page.
`#gmSignout` and `#creditN` keep their ids because existing page scripts drive them.

## Deploy

Not git-connected — deploy by direct upload. Node 20 → use `wrangler@3`:

```bash
CLOUDFLARE_API_TOKEN=… npx wrangler@3 pages deploy . --project-name=geniemadeit --branch=main
```

Merging a PR changes **nothing** in production until this runs. Use `--branch=<name>` for a preview
deploy at `https://<name>.geniemadeit.pages.dev` — worth doing for anything that touches every page.

Then purge the zone cache (assets are served `immutable`, so a same-path change needs a purge). When
you change `assets/*.js`, bump its `?v=` in the referring page or returning browsers keep running
the old bundle.

The generation engine, Vault, auth, billing, and provenance live in the private repo
`cyberhope-ai/pcos-geniemade-vault-code`.

(c) CyberHope AI
