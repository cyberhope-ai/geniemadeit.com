# fal.ai Integration Report for GenieMade

**Prepared by:** Manus AI
**Date:** July 19, 2026
**Scope:** Every item on the fal.ai docs list Ric provided (Model APIs, LLMs, Fast FLUX/SDXL, Custom Workflow UI, and the full Serverless catalog), mapped against the live GenieMade architecture: Cloudflare Pages front-end → `_worker.js` same-origin proxy → `geniemade-engine` Cloudflare Worker → fal.ai → R2 storage → SHA-256 certificate + receipt + credit ledger.

---

## 1. Executive Summary

GenieMade is already built on the **right half** of fal.ai — the hosted Model APIs, where you pay per output with zero infrastructure. The engine calls `fal-ai/z-image/turbo` and `fal-ai/flux-2-pro` today, seals every output with a SHA-256 certificate, and meters credits. Almost everything on your research list falls into one of three buckets:

| Bucket | What it means for GenieMade | Effort | When |
| --- | --- | --- | --- |
| **Hosted Model APIs** (text-to-image, image-to-video, speech-to-text, LLMs, fast FLUX/SDXL) | New capabilities are **config changes in the engine**, not new infrastructure. Same fal key, same R2/certificate pipeline. | Days | Now |
| **Custom Workflow UI** (`workflows/execute`) | Multi-step "recipes" run as one job — and the workflow DAG can be embedded in the certificate, turning GenieMade's provenance from single-output into a **full provenance chain**. This is your biggest strategic opportunity. | Weeks | Next |
| **Serverless** (deploy your own models, ComfyUI, LoRA training, TTS, music, containers, migrations, metrics) | Renting GPUs by the second. Billed for idle/keep-alive time, so it only beats hosted APIs at sustained volume or for models fal doesn't host. | Months | Later, selectively |

**Bottom line:** you do not need Serverless to grow GenieMade right now. The highest-leverage moves are (1) flipping image-to-video live via hosted endpoints your Studio UI already supports, (2) adding a cheap draft tier and an LLM "Genie polish" layer, and (3) building certified multi-step workflows — a feature no competitor's "trackable, provable, traceable" story matches.

---

## 2. Model APIs — What Fits Now

### 2.1 Generate Images from Text *(already live — expand tiers)*

The tutorial pattern (`fal.subscribe("fal-ai/flux/dev", { input: { prompt } })`) is exactly what your engine already does with `z-image/turbo` (fast) and `flux-2-pro` (pro). The docs highlight two models worth adding as engine config entries:

| Model | Positioning in GenieMade | Notes |
| --- | --- | --- |
| `fal-ai/recraft-v3` | **"Design" tier** | SOTA on Artificial Analysis benchmark; handles long text in images, vector art, and brand styles — ideal for logo/poster wishes your current models fumble |
| `fal-ai/stable-diffusion-v35-large` | Optional alternative pro tier | Only if you want model choice as a feature |

### 2.2 Fastest FLUX and Fastest SDXL *(new "draft" tier)*

- `fal-ai/flux/schnell` — 1–4 inference steps, the fastest FLUX variant; output upload happens in a background thread with no GPU charge.
- `fal-ai/fast-sdxl` — ~2.3 s inference at roughly **$0.0025/image**, with LoRA and embedding support.

Either one powers a **1-credit "quick draft" tier** below your current fast tier. Cheap drafts increase generation volume, which increases paywall hits, which drives pack sales. `fast-sdxl`'s LoRA support is also the hosted-API bridge to a future "your own style" feature (see §4.3) without deploying anything.

### 2.3 Generate Videos from Image *(your Studio is already waiting for this)*

The tutorial is a one-liner: `fal.subscribe("fal-ai/minimax-video/image-to-video", { input: { prompt, image_url } })`. Recommended engine models: `minimax-video/image-to-video` (best motion quality), `kling-video/v1/standard` (cost-effective), `luma-dream-machine` (stylized). 

**This is the single highest-value flip.** Your engine already accepts `video.image2video` (status `next`, 40 credits) and the rebuilt Studio already has the full image-to-video flow — upload, animate-from-Vault, motion prompt. The engine only needs to route the call to a hosted endpoint and flip the capability status to live. The certificate pipeline works unchanged: hash the MP4 into R2 exactly like images.

### 2.4 Convert Speech to Text *(new provenance category)*

`fal.subscribe("fal-ai/whisper", { input: { audio_url } })`, or `fal-ai/wizper` (Whisper v3 Large, optimized — same accuracy, double the speed). Two GenieMade uses:

1. **Certified transcripts** — a `voice.transcribe` capability that hashes *both* the source audio and the transcript into one certificate. That extends "provable, traceable" beyond generated media into recorded speech (interviews, meetings, testimony) — a genuinely differentiated use of your certificate system.
2. **Speak your wish** — voice input in the Studio composer (record → transcribe → prompt). Low cost, nice mobile UX.

### 2.5 Use LLMs *(the invisible upgrade)*

`fal-ai/any-llm` gives you Claude 3.5 Sonnet, GPT-4o, Gemini (including cheap `google/gemini-flash-1.5`), and Llama through the **same fal key you already have** — no new vendor. Three engine-side uses, all proven in fal's own Wan2.1 production example:

| Use | How | Why it matters |
| --- | --- | --- |
| **"Genie polish"** prompt enhancement | `any-llm` with a cinematic-rewrite system prompt before generation | Better outputs from novice prompts → fewer wasted credits → happier users |
| **Safety pre-screen** | `any-llm` yes/no NSFW check on prompts + `fal-ai/imageutils/nsfw` on uploaded images (fal's own recommended pattern) | Protects the brand and blocks credit-burn on jobs that would fail |
| **Auto-captioning** | `any-llm/vision` describes finished creations | Vault search, alt text, richer certificate metadata |

---

## 3. Custom Workflow UI — The Strategic One

fal workflows are JSON DAGs: an input node, chained model nodes (values passed by reference, e.g. `"$node_1.images.0.url"`), and an output node, executed in one streaming call via `fal.stream("workflows/execute", …)`. Two properties make this a perfect match for GenieMade:

1. **Certified recipes.** A multi-step chain — *generate image → remove background → upscale*, or *image → video → soundtrack* — runs as **one job**, so your engine can meter it as one credit price and seal it with **one certificate that embeds the entire workflow DAG plus the hash of every intermediate artifact**. That turns your receipt from "proof of an output" into a **provenance chain: proof of how the output was made**. Nobody else in the consumer AI-media space offers that.
2. **Self-describing models.** Every fal endpoint exposes its input/output schema at `https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=…`. Your engine (or an admin tool) can fetch schemas to auto-generate Studio option forms when you add models — new capabilities without front-end releases.

**Recommendation:** after the Now items ship, implement a `workflow.recipe` capability in the engine with 2–3 curated recipes (e.g., "Product shot: generate → bg-remove → upscale", "Story clip: image → video"), priced as bundles, each sealing a chain certificate. Market it as **"Provenance chains — every step sealed."**

---

## 4. Serverless — What It Is and When It Pays

Serverless lets you deploy your own Python `fal.App` on rented GPUs (`fal deploy app.py::App` → your own endpoint). Critically, **you are billed per second for the runner's whole life** — SETUP, IDLE (including `keep_alive`), RUNNING, DRAINING — not per output. Multi-GPU bills as `gpu_count × duration`. That inverts the economics: hosted Model APIs are pay-per-output with zero idle cost, so **Serverless only wins when you have sustained volume or need a model fal doesn't host**. My read on each item you listed:

| Serverless doc | What it shows | GenieMade fit | Verdict |
| --- | --- | --- | --- |
| Deploy a Text-to-Image Model | Full `fal.App` anatomy: scale-to-zero, multiple endpoints, custom billing units, auto playground | Reference material only — hosted models cover you | Later |
| Deploy ComfyUI on fal | *Under construction* in the docs | — | Watch |
| Deploy a ComfyUI SDXL Turbo App | Wrap any ComfyUI workflow as an API (Docker + persistent model storage) | Productize community workflows as exclusive GenieMade pipelines (e.g., certified product-photo pipeline) | **Best Serverless candidate**, when a signature pipeline is worth owning |
| Deploy WAN LoRA Training | Fine-tune WAN video with a user's own clips (ZIP → LoRA file) | Premium **"Your Style Genie"**: train on brand footage, generate on-brand videos. Real revenue potential but H100 training costs | Later (premium tier) |
| Deploy a Text-to-Video Model | Wan2.1 with NSFW checks + LLM prompt expansion | Steal the *pattern* (safety + polish, §2.5) via hosted APIs — no deploy needed | Pattern now, deploy never |
| Deploy 3D Progressive Rendering | Text/image → 3D GLB with live voxel streaming; notably uses `z-image/turbo` (your model) as its image stage; hosted endpoint exists | Future "wish in 3D" — certified GLB assets fit provenance naturally | Watch list |
| Deploy Real-time Video-to-Video / World Model | WebRTC live streaming demos (YOLO, Matrix-Game) | Not aligned with certified-artifact business | Skip |
| Deploy Multi-GPU Inference | `fal.distributed` data parallelism | Only relevant at scale you don't have yet; hosted APIs absorb bursts | Skip for now |
| Deploy a Text-to-Speech Model | Kokoro (82M params) runs on **CPU** machines — very cheap; per-character billing | Enables `audio.tts`, but check hosted TTS endpoints (e.g., hosted Kokoro, xAI TTS) first — zero-deploy | Hosted first |
| Deploy a Text-to-Music Model | DiffRhythm full songs (95s/285s) on H100, always-warm | `music.generate` capability — but hosted music APIs exist; H100 keep-alive is a real monthly cost | Hosted first |
| Deploy Models with Custom Containers | Any Dockerfile as runtime (private registries supported) | Prerequisite knowledge for the ComfyUI path only | As needed |
| Migrate from Replicate / Modal / RunPod / Docker | Porting guides | You have nothing deployed elsewhere | N/A |
| Prometheus Pushgateway metrics | Custom metrics for self-hosted apps; fal also exports metrics natively | Your engine already tracks usage/errors (the new Settings hub surfaces them). Note: fal's **Platform APIs** offer programmatic pricing/usage per model — useful for automated cost-margin reconciliation in the engine | Only with Serverless |

---

## 5. Recommended Roadmap

**Phase 1 — Now (engine config, days):**
1. Flip `video.image2video` live via `minimax-video/image-to-video` (or Kling for cost) — the Studio UI is already done.
2. Add a 1-credit draft tier (`flux/schnell` or `fast-sdxl`) and the `recraft-v3` design tier.
3. Add `any-llm` Genie polish + NSFW pre-screen in the Worker before every job.

**Phase 2 — Next (weeks):**
4. `voice.transcribe` with dual-hash certificates (`wizper`).
5. Certified workflow recipes via `workflows/execute`, embedding the DAG in certificate metadata — the provenance-chain differentiator.
6. Use the OpenAPI schema endpoint to auto-generate model option forms.

**Phase 3 — Later (when volume/margin justifies):**
7. TTS/music via hosted endpoints first; Serverless Kokoro (CPU, cheap) only if hosted pricing disappoints.
8. "Your Style Genie" (WAN LoRA training) as a premium tier; a signature ComfyUI pipeline if you develop one worth owning.
9. Skip real-time WebRTC, multi-GPU, and migrations; keep 3D on the watch list.

**Cost guardrail:** at your current ~$0.05/job internal cost and pack pricing ($12/150 → $0.08/credit), hosted-API margins hold across all Phase 1–2 additions. Re-evaluate Serverless only when any single capability exceeds roughly $500–1,000/month in hosted spend — below that, keep-alive idle billing makes rented GPUs a loss.

---

## References

1. [Custom Workflow UI — fal.ai docs](https://fal.ai/docs/examples/integrations/custom-workflow-ui)
2. [Generate Images from Text Tutorial — fal.ai docs](https://fal.ai/docs/examples/image-generation/generate-images-from-text)
3. [Generate Videos from Image Tutorial — fal.ai docs](https://fal.ai/docs/examples/video-generation/generate-videos-from-image)
4. [Convert Speech to Text Tutorial — fal.ai docs](https://fal.ai/docs/examples/audio-speech/convert-speech-to-text)
5. [Use LLMs — fal.ai docs](https://fal.ai/docs/examples/integrations/use-llms)
6. [Fastest FLUX in the Planet — fal.ai docs](https://fal.ai/docs/examples/image-generation/fast-flux)
7. [Fastest SDXL in the Planet — fal.ai docs](https://fal.ai/docs/examples/image-generation/fast-sdxl)
8. [Deploy a Text-to-Image Model — fal.ai docs](https://fal.ai/docs/examples/image-generation/deploy-text-to-image-model)
9. [Deploy a ComfyUI SDXL Turbo App — fal.ai docs](https://fal.ai/docs/examples/image-generation/deploy-comfyui-server)
10. [Deploy WAN LoRA Training — fal.ai docs](https://fal.ai/docs/examples/video-generation/deploy-wan-lora-training)
11. [Deploy a Text-to-Video Model — fal.ai docs](https://fal.ai/docs/examples/video-generation/deploy-text-to-video-model)
12. [Deploy 3D Progressive Rendering — fal.ai docs](https://fal.ai/docs/examples/video-generation/deploy-3d-progressive-rendering)
13. [Deploy Real-time Video-to-Video Model — fal.ai docs](https://fal.ai/docs/examples/video-generation/deploy-realtime-video-to-video-model)
14. [Deploy Real-time World Model — fal.ai docs](https://fal.ai/docs/examples/video-generation/deploy-realtime-world-model)
15. [Deploy Multi-GPU Inference — fal.ai docs](https://fal.ai/docs/examples/video-generation/deploy-multi-gpu-inference)
16. [Deploy a Text-to-Speech Model — fal.ai docs](https://fal.ai/docs/examples/audio-speech/deploy-text-to-speech-model)
17. [Deploy a Text-to-Music Model — fal.ai docs](https://fal.ai/docs/examples/audio-speech/deploy-text-to-music-model)
18. [Deploy Models with Custom Containers — fal.ai docs](https://fal.ai/docs/examples/deploy-models-with-custom-containers)
19. [Serverless Pricing — fal.ai docs](https://fal.ai/docs/documentation/serverless/pricing)
20. [Publish Custom Metrics with Prometheus Pushgateway — fal.ai docs](https://fal.ai/docs/examples/serverless/deploy-prometheus-pushgateway)
21. [Platform APIs for Models — fal.ai docs](https://fal.ai/docs/api-reference/platform-apis/for-models)
