# Pick-a-Pack generation pipeline

Source-of-truth for the /app themed packs (art + manifest live in R2 `geniemade-assets/packs/`).

- `batchN.json` — pack definitions (id, name, emoji, blurb, face, looks[{id,name,prompt}]).
- `gen_batch3.py` — render template (runs on host .6; nano-banana/edit per look, one ref face).
- `wire_batch.sh <ABS batch.json> <ABS out_dir>` — pulls live manifest, optimizes art, rewords
  prompt with the copyright-safe TAIL, cover=first look, replaces/appends pack, uploads art+manifest
  to R2, purges cache. PASS ABSOLUTE PATHS (it cd's to the engine repo internally).
- `watch_pack.sh <N>` — polls host .6 gen log for BATCH<N>_DONE then pulls renders.
- `manifest-live-snapshot.json` — snapshot of the live 74-pack manifest.
