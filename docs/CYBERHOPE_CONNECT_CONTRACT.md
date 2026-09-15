# CyberHope Connect — CineGraph · GenieMade · SkillDNA (contract v1, 2026-09-15)

One document shared by the three repos (`pcos-cinegraph-fantasy-movies`, `pcos-geniemade-vault-code` + `geniemadeit.com`, `skilldna-mothership`). Change it in all three PRs at once.

## Principles (from the SkillDNA privacy framework, applied everywhere)

- **Opt-in, specific, revocable.** Nothing connects or syncs until the person approves it. Disconnecting stops future access immediately and is as easy as connecting.
- **The person is the only author of their taste data.** No app writes favorites into another app on its own. Data that crosses over arrives as *suggestions* the person confirms item by item.
- **Private by default.** Connections never widen visibility.
- **Credentials stay server-side.** Tokens travel in URL fragments (never logged by servers), are exchanged server-to-server, and are stored hashed (issuer) or encrypted (holder).
- **No school or health tenants.** SkillDNA connectors to CineGraph are unavailable for FERPA and HIPAA tenants.
- **Email is never an account-matching key across apps.** Links are made by an explicit connect flow.

---

## A. SkillDNA ↔ CineGraph (CineGraph is the provider)

### A1. Connect (browser)

SkillDNA sends the signed-in person to:

```
https://cinegraph.cyberhopeai.com/connect/skilldna?return_to=<RETURN>&state=<STATE>
```

- `RETURN` must be exactly `https://app.skilldna.cyberhopeai.com/connect/cinegraph/return` (or `http://localhost:<port>/connect/cinegraph/return` for development).
- `STATE` is opaque to CineGraph (SkillDNA signs it and binds it to the actor; max 512 chars).
- CineGraph requires sign-in, then shows a consent screen for two scopes:
  - `movie_dna.read`: SkillDNA may read the person's saved CineGraph Movie DNA **when the person asks SkillDNA to import it**.
  - `movie_dna.suggest`: SkillDNA may send the person's SkillDNA movie interests to CineGraph as **suggestions the person confirms**.
- Approve: CineGraph mints `cgk_<43 url-safe chars>`, stores only its SHA-256, and redirects to
  `RETURN#cgtoken=<token>&state=<STATE>&scopes=movie_dna.read,movie_dna.suggest`
- Cancel: `RETURN#cgerror=access_denied&state=<STATE>`

### A2. Partner API (server-to-server)

Base `https://cinegraph.cyberhopeai.com/api/partner/v1`, header `Authorization: Bearer cgk_…`. Not behind the reviewer password page (it has its own token auth). JSON only. 60 requests per minute per token.

| Method and path | Scope | Response |
|---|---|---|
| `GET /me` | any | `{"ok":true,"app":"cinegraph","displayName":"…","scopes":["movie_dna.read","movie_dna.suggest"],"connectedAt":"ISO"}` (no email) |
| `GET /movie-dna` | `movie_dna.read` | `{"items":[{"id":123,"kind":"movie","title":"Casablanca","year":1942,"creator":"Michael Curtiz","scene":"…","why":"…","timesSeen":4,"externalRef":"tt0034583"|null,"artUrl":"…"|null,"cinegraphUrl":"https://cinegraph.cyberhopeai.com/title/casablanca","updatedAt":"ISO"}]}` Only confirmed items; `kind` is `movie` in v1. |
| `POST /suggestions` | `movie_dna.suggest` | Body `{"source":"skilldna","items":[{"externalId":"<skilldna item id>","kind":"movie","title":"…","year":1942,"creator":"…","scene":"…","why":"…","timesSeen":4,"externalRef":"tt…","artUrl":"…"}]}` (1–200 items). Stored as suggestions; dedupe on (person, source, externalId). Returns `{"accepted":N,"duplicates":M}` |
| `POST /disconnect` | any | Revokes the token. `{"ok":true}` |

Errors: `401 {"error":"invalid_token"}` (unknown, revoked), `403 {"error":"insufficient_scope"}`, `400 {"error":"invalid_request","detail":"…"}`, `429 {"error":"rate_limited"}`.

### A3. SkillDNA side

- `/me/connections` shows **CineGraph** (connected or not), except for FERPA/HIPAA tenants.
- `GET /connect/cinegraph/start` → signed state → redirect to A1.
- `/connect/cinegraph/return` reads the fragment, `POST /api/v1/profile/{actor}/cinegraph/link {token,state}`; the server validates state, calls `GET /me`, stores the token encrypted in `connector_accounts` (provider `cinegraph`) and audits it.
- **Import from CineGraph:** the server calls `GET /movie-dna`; the person picks items; confirmed picks become `interest_items` (category `movies`, `import_source='cinegraph'`, `external_ref` = IMDb id or `cinegraph:<id>`), skipping duplicates.
- **Send to CineGraph:** the person picks SkillDNA movie interests; the server posts them to `POST /suggestions`.
- **Disconnect:** `POST /disconnect` at CineGraph, then delete the stored token.

---

## B. GenieMade ↔ CineGraph (GenieMade is the provider)

### B1. Connect (browser)

CineGraph sends the signed-in person to:

```
https://geniemadeit.com/connect/cinegraph?return_to=<RETURN>
```

- `RETURN` must be `https://cinegraph.cyberhopeai.com/connect/geniemade/return` (the Azure hostname and `http://localhost:<port>` are also allowed).
- The page (`connect-cinegraph.html`, served by the site worker at `/connect/cinegraph`, a copy of the SkillDNA connect page) requires GenieMade sign-in, asks "Let CineGraph show your GenieMade creations?", then calls the existing `POST /api/vault/feed-token` and redirects to `RETURN#gmvault=<token>`; cancel redirects to `RETURN#gmerror=access_denied`. No engine change is needed.
- Feed response (existing): `{ok, owner, total, count, cursor, next_cursor, items:[{id, kind: image|video|audio, url, thumb, title, by, cert_id, created_at}]}`.
- CineGraph's server verifies the token with `GET https://geniemadeit.com/api/vault/feed/<token>` before storing it (encrypted).

### B2. Using it on CineGraph

- **Your GenieMade creations** (from the feed) appear on CineGraph's Connected accounts page.
- **Share links:** a GenieMade share link (`https://geniemadeit.com/s/<token>`) can be attached to a Movie DNA favorite; CineGraph validates it with `GET https://geniemadeit.com/api/share/<token>`.
- **Create with GenieMade:** CineGraph movie pages link to `https://geniemadeit.com/app?from=cinegraph&idea=<url-encoded idea>`. `/app` prefills the prompt from `idea` (max 500 chars). `from` is used, not `ref`: `ref` is GenieMade's affiliate parameter.

### B3. Disconnect

CineGraph deletes the stored feed token. Note: GenieMade issues **one read-only feed token per person** (`feedtok:<uid>`), shared by every app connected to the Vault (SkillDNA and CineGraph), and has no revoke endpoint yet. Per-app revocation is a future GenieMade engine change.

---

## C. Sign-in (already live, unchanged)

Social sign-in on CineGraph and SkillDNA goes through GenieMade's broker (`/api/auth/{google|ms|facebook}/start` → `#gmtoken` → `verify-token`). Accounts stay per app; the connect flows above are what link them.
