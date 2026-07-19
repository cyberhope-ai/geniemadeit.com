# GenieMade Audit Notes (2026-07-19)

## Current live state
- geniemadeit.com is LIVE on Cloudflare Pages, static site (index.html, app.html, verify.html) + _worker.js proxy
- _worker.js proxies /api/* and /asset/* to https://geniemade-engine.cyberhopeai.workers.dev (private repo, real engine)
- Engine /api/capabilities is LIVE and returns:
  - Images: image.text (live, 1cr), image.fast "Fast FLUX" (live, 3cr), image.pro (live, 6cr)
  - Video: video.image2video (status "next", 40cr), video.text2video (soon, 55cr)
  - Audio: audio.speech (live, 3cr), audio.music (soon, 6cr)
  - Packs: starter 150/$12, plus 600/$39, pro 1500/$89, free_credits 3
- Landing page: dark+gold genie brand, hero, examples gallery (16), features, how-it-works, pricing 4 tiers, testimonials, FAQ. Fairly complete.
- KNOWN STUBS per BMAD brief:
  - Billing FE placeholder (alert(), not wired to Stripe /api/billing/checkout)
  - No account/dashboard screen, no persistent nav in app
  - Video/voice/music need go-live; video is "next"
  - Vault: no download/manage, no client dashboard
  - Verify backend /api/verify not built (verify.html frontend-only honest "cannot verify")
  - Marketing overclaim "unlike anyone else" C2PA (false advertising risk) - STILL PRESENT on live landing hero + features
  - Mobile/a11y defects list in appendix
- studio.js: mockGenerate function still present but unused? generate() calls real /api/generate; mock kept in file
- Auth: /api/auth/signup|login|logout|me real on engine (per brief REAL)
- Credits stored in localStorage mirror; engine authoritative

## Design direction
- Canva https://www.canva.com/ai-image-to-video/ = clean, bright-ish marketing, big hero, prompt-to-video demo, steps, FAQ
- Keep GenieMade dark+gold brand but elevate to Canva-grade polish

## User request
- Update "bmad" to workable site letting users generate videos+images, trackable/provable/traceable
- Explore fal.ai API access; templates: text-to-image, image-to-video, fast-flux
- Repo to work on: cyberhope-ai/geniemadeit.com

## Constraints from brief
- Trust standard: never fabricate results/certs
- NDA: only say "PrecognitionOS"/"QSurface" externally
- Stack: Cloudflare Pages FE + worker engine + R2 + KV + Stripe + fal.ai

## Decision needed
- We don't have access to the private engine repo (geniemade-engine). We CAN:
  a) Rebuild FE against the live engine API (same-origin proxy) — but can't fix engine-side stubs
  b) Build a new full-stack Manus webdev project implementing FE+BE (fal.ai direct) — needs FAL_KEY
- User has NOT provided FAL_KEY yet.

## LIVE ENGINE TEST RESULTS (2026-07-19, real calls)
- signup: WORKS (200, returns user w/ 3 credits, sets HttpOnly session cookie — cookie not shown in jar grep but session persisted)
- /api/me: WORKS with session; WITHOUT session returns 500 "Cannot read properties of null (reading 'id')" — BUG (should be 401 clean)
- /api/generate image.text: WORKS FOR REAL — model fal-ai/z-image/turbo, returns R2 asset URL, SHA-256 hash cert, c2pa:false, cost 1, credits decremented
- video.image2video: engine accepts capability but costs 40cr > 3 free — 402 no_credits (so video IS wired engine-side, gated by credits; status "next" in capabilities)
- /api/gallery: WORKS, returns real generation
- /api/billing/checkout: WORKS — returns REAL LIVE Stripe checkout URL (cs_live_...)! So billing BE is real; only the FE is a placeholder alert()
- /api/verify: returns {ok:true, verdict:"todo_phase2"} — STUB

## ROUND 2 PROBES
- /api/examples: REAL, 16 curated examples from R2
- /api/auth/me: works {authenticated, user{id,email,credits,plan}}
- /api/billing/portal: 404 not built
- /api/billing/checkout {plan:starter}: 200, real cs_live Stripe URL — accepts plan too (not just pack)
- /api/verify with REAL receipt id: still {verdict:"todo_phase2"} — STUB confirmed
- Google OAuth start: real 302 to accounts.google.com w/ real client_id — WORKS
- /asset/gen/... image: real 1.1MB PNG served
- audio.speech costs 3cr; only had 2 left, got honest 402
- engine deducts credits properly; new signup gets 3

## KEY CONCLUSION
The engine is mostly REAL (fal.ai-backed image gen, auth, credits, gallery, live Stripe checkout session). The FE is the weak part:
1. Billing FE placeholder — must wire paywall/pricing to /api/billing/checkout (BE ready!)
2. No account/dashboard, no persistent nav
3. Vault: no download/manage
4. Video: engine accepts video.image2video; needs image upload FE? (image→video needs source image) + capabilities says "next"
5. Verify page: /api/verify stub — FE should be honest
6. C2PA overclaim copy fix on landing
7. Mobile/a11y fixes

## Engine API surface (from studio.js/landing.js)
- POST /api/generate {capability, prompt, aspect?} -> {ok, generation:{id,type,url,model,certificate:{hash,receipt_id,issued_at,c2pa}}, credits_remaining}
- GET /api/gallery -> {generations:[...]}
- GET /api/capabilities
- POST /api/auth/signup|login, GET /api/me
- POST /api/waitlist (KV)
- /asset/* serves R2 assets
