# Account & Settings Hub — spec digest (atlas2, from /home/ubuntu/upload/GENIEMADE_SETTINGS_MANUS_PROMPT.txt)

FRONTEND ONLY. Replace /account with a left-nav Settings hub (fal.ai reference structure, Gilded Night skin).
Reuse GmNav/GmFooter, SessionContext, api.ts req<T>() pattern (same-origin, cookies). Route stays /account.

## Layout
- Title "Settings", subtitle "Everything for your account, usage, and billing."
- Left nav: search box + grouped links; right = active panel. Mobile: nav collapses above panel.
- Groups:
  - General: Account | Notification Settings
  - Usage & Billing: Usage | Address | Credits | Concurrency Limits | Billing | Invoices
  - Analytics & Monitoring: Request History | Errors
  - Developer (COMING, honest): API Keys, Webhooks — "Available when we open the public API"
  - OMIT: Log Drains, Log Privacy, Training History

## Panels
- Account: avatar, display_name (edit), full_name (read-only), email (read-only), username (edit). Email+full name: "To change these, contact support." row.
- Notifications: 4 toggles (email_product_updates, email_billing, email_generation_complete, email_marketing). Optimistic saves w/ rollback.
- Usage: charts credits & est cost by day (7d/30d/90d switch) + by-model breakdown.
- Address: form line1,line2,city,region,postal_code,country.
- Credits: big balance + Top up (existing PaywallModal) + ledger table.
- Concurrency Limits: read-only card (plan concurrent-job limit).
- Billing: "Manage billing" → POST /api/billing/portal → redirect {url}.
- Invoices: table w/ Receipt link (receipt_url) per row.
- Request History: paginated (ts,type,model,credits,status,receipt) — GET /api/usage/history?limit=50&cursor=
- Errors: table (ts,type,error) — GET /api/errors?limit=50

## API contract (extend api.ts)
- GET /api/account -> {id,email,display_name,full_name,username,avatar_url,plan,credits,concurrency_limit,created_at}
- PATCH /api/account {display_name?,username?,avatar_url?}
- GET/PUT /api/settings/notifications (4 booleans)
- GET/PUT /api/settings/address {line1,line2,city,region,postal_code,country}
- GET /api/usage?range=30d -> {by_day:[{date,credits,cost_usd,jobs}], by_capability:[{capability,jobs,credits,cost_usd}], totals:{jobs,credits}}
- GET /api/usage/history?limit=50&cursor= -> {items:[{id,ts,capability,model,credits,status,cert_id}], next_cursor}
- GET /api/credits -> {balance, ledger:[{delta,reason,ref,balance_after,ts}]}
- GET /api/billing/invoices -> {invoices:[{id,pack,credits,amount_cents,currency,receipt_url,ts}]}
- POST /api/billing/portal -> {url}
- GET /api/errors?limit=50 -> {items:[{id,ts,capability,error}]}
- existing unchanged: /api/billing/checkout, /api/gallery, /api/capabilities, /api/auth/*

## Constraints
- Trust Standard: never fabricate; real data or honest empty states ("No invoices yet.", "No errors — every wish has landed clean.")
- No secrets client-side; same-origin only; surface ApiError verbatim; loading+error states per panel.

## PROBE RESULTS (Jul 19, live engine via geniemadeit.com with valid session cookie /tmp/gm_cookies.txt)
ALL new endpoints return 404 not_found: /api/account, /api/settings/notifications, /api/settings/address,
/api/usage, /api/usage/history, /api/credits, /api/billing/invoices, POST /api/billing/portal, /api/errors.
→ Backend not deployed yet. ALL PANELS ARE CONTRACT-ONLY. UI must handle 404 as "backend rolling out" honest state
(distinct from empty state). Fallbacks allowed from EXISTING endpoints: /api/auth/me (email, credits, plan),
/api/gallery (history-ish). But do NOT fake contract data.

## Deliverable
- PR against SPA repo; note which panels verified live vs contract-only.
- GitHub push auth currently broken (GH_TOKEN empty) — commit locally, deliver via checkpoint + files; retry push (user may re-enable GitHub integration).

## LIVE UPDATE (04:52) — BACKEND SHIPPED WHILE BUILDING!
All contract endpoints now LIVE on engine. Envelope shapes differ from spec:
- GET /api/account -> {ok, account:{...}} (NESTED); PATCH same; username normalized (strips dash)
- GET/PUT /api/settings/notifications -> {ok, notifications:{...}} (NESTED)
- GET/PUT /api/settings/address -> {ok, address:{...}} (NESTED)
- /api/usage, /api/usage/history, /api/credits, /api/billing/invoices, /api/errors -> FLAT as spec
- POST /api/billing/portal -> 409 no_billing_profile w/ friendly message when no purchases (show message verbatim)
→ api.ts must unwrap nested envelopes. PATCH+PUT verified working live.

## BROWSER TEST RESULTS (04:54, signed in as manus.e2e.jul18, 2 wishes)
- Settings shell renders: left nav search+groups, header Client dashboard + Sign out, hash routing works (#account, #usage)
- Account panel LIVE: shows real profile (email, free plan, member since Jul 19 2026 3:22 AM), display_name prefilled; typed username manus-e2e, clicked Save → "Saving…" (PATCH verified live via curl earlier; engine normalizes username by stripping dashes)
- Usage panel LIVE: 30d totals (✦1 spent, 1 creation), gold recharts bar for 2026-07-19, by-capability table image.text 1 job $0.05 (engine's flat_fee shows 0.006 via curl on audit acct; e2e acct shows 0.05 — engine data, not ours)
- REMAINING TO TEST: notifications toggles, address save, credits ledger, concurrency, billing 409 toast, invoices empty, history, errors empty, search filter, developer panels
- NOTE small fix applied: BillingPanel 409 no_billing_profile message shown verbatim via toast.info
## BUILD STATE (done, pending test)
Files created in /home/ubuntu/geniemade-site:
- client/src/lib/api.ts EXTENDED: types Account, NotificationPrefs, BillingAddress, UsageDay/ByCapability/Summary, HistoryItem, LedgerEntry, Invoice, ErrorItem; calls api.account/updateAccount/notificationPrefs/saveNotificationPrefs/address/saveAddress/usage/usageHistory/credits/invoices/billingPortal/errors
- client/src/components/settings/panelKit.tsx: PanelHeading/Loading/NotLive/Error/Empty, PanelState, classifyError (404→not_live), fmtUsd
- client/src/components/settings/GeneralPanels.tsx: AccountPanel (edit display_name/username; email+full_name read-only w/ contact support; 404→NotLive + session fallback), NotificationsPanel (4 optimistic toggles w/ rollback)
- client/src/components/settings/BillingPanels.tsx: UsagePanel (7d/30d/90d recharts bar + by_capability table), AddressPanel, CreditsPanel (balance falls back to session credits when 404; ledger table), ConcurrencyPanel (reads api.account), BillingPanel (POST portal → redirect), InvoicesPanel
- client/src/components/settings/AnalyticsPanels.tsx: HistoryPanel (usage/history w/ cursor pagination; honest fallback to live /api/gallery with notice), ErrorsPanel ("No errors — every wish has landed clean."), DeveloperPanel (api-keys/webhooks honest coming state)
- client/src/pages/Account.tsx REPLACED: Settings hub shell, left nav search + groups (General/Usage&Billing/Analytics/Developer w/ soon pills), hash routing #section, sign out + client dashboard handoff buttons kept in header
tsc: 0 errors. Vite console errors in logs are STALE (from 3:17 AM).
ALL contract endpoints 404 on live engine → every panel will show honest NotLive/fallbacks; test in browser next.
Also done earlier (committed locally, NOT pushed - gh auth broken): robots.txt + Studio next-gating must-fixes. Repo /home/ubuntu/geniemadeit branch manus/rebuild has 1 unpushed commit.
