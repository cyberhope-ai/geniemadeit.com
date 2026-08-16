# geniemadeit.com — Site Audit TODO (do AFTER all pages built)

## 1. NAVIGATION CONSISTENCY (CEO-flagged 2026-08-15) — HIGH
Every page currently has a DIFFERENT top menu (different links, order, labels). Standardize ONE canonical
nav across ALL ~50 pages (root + /make/*), same order + labels + styling.

**Canonical menu (proposed):** Home · Studio You · Occasions (/make) · Examples · Pricing · Import · Verify
· [right side] Account / Sign in.  (admin.html stays intentionally UNLINKED.)

Current state (audit):
- index: Examples · Studio You · Pricing · Import
- studio-you: Examples · Studio You · The Looks · Pricing · Import · Verify
- app: Home · Studio You · Examples · Pricing · Import · Verify
- account: Studio You · Occasions · Studio · Pricing
- /make/* (44 pages): Occasions · Studio You · Pricing
Approach: build ONE shared header partial (or a script that rewrites the <header> block) applied to all pages;
verify each renders + all links resolve; commit + redeploy.

## 2. LOGIN SYSTEM BUGS (CEO-flagged 2026-08-15) — FIX LAST
CEO: "not 100% happy with the login system, several glaring bugs." Fix LAST (after content/nav).
TODO: enumerate the specific bugs (get repro steps from CEO), then fix. Known auth surface: /api/auth/login
(PBKDF2), Google sign-in (auth:google:*), email/password (auth:<email>), session cookie gm_session.
Password reset / account linking (email vs Google dup accounts) is a likely culprit — the family accounts
have BOTH email-password (auth:<email>) AND possibly Google (auth:google:*) entries for the same person.

## 3. Studio You age-range spoke pages (SEO, CEO-requested) — after vaults locked
Dedicated SEO landing pages: /studio-you/kids (Faith), /studio-you/teens (Hope), /studio-you/young-adults
(Grant+Pierce), /studio-you/men (Rick), /studio-you/women (Cara). Hub-and-spoke off /studio-you. Unique
title/meta/H1 + that person's example gallery + FAQ schema + sitemap entries.
