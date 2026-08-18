#!/bin/bash
# usage: wire_batch.sh <batch.json> <batch_out_dir>
set -e
BATCH="$1"; OUTDIR="$2"
SP=/tmp/claude-1000/-home-cyberhope-Documents-pcos-agent/ed382083-46c7-4b2d-8dde-91a4065bac24/scratchpad
cd ~/Documents/pcos-geniemade-vault-code
set -a; . ~/.pcos-secrets/cloudflare.env 2>/dev/null; set +a
# 1) pull CURRENT live manifest
npx wrangler r2 object get "geniemade-assets/packs/manifest.json" --file="$SP/_live_manifest.json" --remote >/dev/null 2>&1
# 2) merge batch -> new manifest + art list
python3 - "$BATCH" "$OUTDIR" <<'PY'
import os,sys,json
from PIL import Image
SP="/tmp/claude-1000/-home-cyberhope-Documents-pcos-agent/ed382083-46c7-4b2d-8dde-91a4065bac24/scratchpad"
batch=json.load(open(sys.argv[1]))["packs"]; outdir=sys.argv[2]
site=os.path.expanduser("~/Documents/geniemadeit.com/assets/studio-you/packs")
man=json.load(open(SP+"/_live_manifest.json")); by={p["id"]:i for i,p in enumerate(man)}
TAIL=" Keep the person's face, features and likeness accurate and recognizable; natural, flattering skin, no distortion. Use only fictional titles/mastheads; no real brand names, trademarked logos, or real celebrity likenesses."
art=[]
def opt(s,d):
    im=Image.open(s).convert("RGB");im.thumbnail((640,860));os.makedirs(os.path.dirname(d),exist_ok=True);im.save(d,quality=82)
for pk in batch:
    pid=pk["id"];looks=[]
    for l in pk["looks"]:
        s=f"{outdir}/{pid}/{l['id']}.png";d=f"{site}/{pid}/{l['id']}.jpg"
        if not os.path.exists(s):print("MISS",s);continue
        opt(s,d);art.append((d,f"packs/{pid}/{l['id']}.jpg"))
        looks.append({"id":l["id"],"name":l["name"],"tile":f"/asset/packs/{pid}/{l['id']}.jpg","prompt":"Make this person the star of this scene: "+l["prompt"]+"."+TAIL,"capability":"image.nano"})
    if not looks:continue
    cov=pk["looks"][0]["id"];opt(f"{outdir}/{pid}/{cov}.png",f"{site}/{pid}/cover.jpg");art.append((f"{site}/{pid}/cover.jpg",f"packs/{pid}/cover.jpg"))
    entry={"id":pid,"title":pk["name"],"emoji":pk["emoji"],"blurb":pk["blurb"],"cover":f"/asset/packs/{pid}/cover.jpg","looks":looks}
    if pid in by: man[by[pid]]=entry;print("replaced",pid)
    else: man.append(entry);print("added",pid)
json.dump(man,open(SP+"/_new_manifest.json","w"),ensure_ascii=False)
json.dump(art,open(SP+"/_art.json","w"));print("TOTAL",len(man),"art",len(art))
PY
# 3) upload art + manifest
python3 -c "import json;[print(a[0]+'|'+a[1]) for a in json.load(open('$SP/_art.json'))]" > "$SP/_art.txt"
n=0; while IFS='|' read -r f k; do [ -f "$f" ] && npx wrangler r2 object put "geniemade-assets/$k" --file="$f" --content-type="image/jpeg" --remote >/dev/null 2>&1 && n=$((n+1)); done < "$SP/_art.txt"
npx wrangler r2 object put "geniemade-assets/packs/manifest.json" --file="$SP/_new_manifest.json" --content-type="application/json" --remote >/dev/null 2>&1
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/0e6fe256c5cad7c70c7816d6bd5c5a14/purge_cache" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" -d '{"purge_everything":true}' >/dev/null
echo "WIRED: $n art files uploaded, manifest live, cache purged"
