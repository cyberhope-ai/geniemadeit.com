import os,json,urllib.request
KEY=os.environ["FAL_KEY"]
BASE="https://geniemade-engine.cyberhopeai.workers.dev/asset/train/face-"
out="/tmp/batch3_out"; os.makedirs(out,exist_ok=True)
def call(m,p,t=120):
    r=urllib.request.Request("https://fal.run/"+m,data=json.dumps(p).encode(),headers={"Authorization":"Key "+KEY,"content-type":"application/json"})
    return json.load(urllib.request.urlopen(r,timeout=t))
n=0
for pk in json.load(open("/tmp/studio-you/batch3.json"))["packs"]:
    ref=[BASE+pk["face"]+".jpg"]; d=out+"/"+pk["id"]; os.makedirs(d,exist_ok=True)
    for l in pk["looks"]:
        prompt="A creative photo of this person "+l["prompt"]+". Keep this exact person's face. No real brand names or trademarked logos."
        try:
            r=call("fal-ai/nano-banana/edit",{"prompt":prompt,"image_urls":ref,"num_images":1,"aspect_ratio":"3:4","output_format":"png"})
            u=(r.get("images") or [r.get("image")])[0]["url"]
            urllib.request.urlretrieve(u,f"{d}/{l['id']}.png"); n+=1; print(f"OK {pk['id']}/{l['id']} ({n})",flush=True)
        except Exception as e: print(f"ERR {pk['id']}/{l['id']}: {str(e)[:60]}",flush=True)
print("BATCH3_DONE",flush=True)
