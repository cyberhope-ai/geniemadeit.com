/* GenieMade Studio — front-end logic.
 * Calls the /api/generate contract (the PrecognitionOS engine). Real result or an
 * honest error — the site NEVER fabricates a result and NEVER calls a provider
 * directly; every creation goes through /api/generate.
 */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LS = window.localStorage;

  // ---- state ----
  const state = {
    capability: "image.text",
    aspect: "1:1",
    refUrl: "",       // uploaded reference photo (same-origin /asset URL)
    uploading: false,
    packMode: false,  // user picked an occasion pack — a face photo is required ("Starring You")
    pack: null,       // { id, look, label } — we send ids, never the (server-side, secret) prompt
    get credits() { const v = LS.getItem("gm_credits"); return v === null ? 3 : Number(v); },
    set credits(n) { LS.setItem("gm_credits", String(Math.max(0, n))); paintCredits(); },
    // The Vault is the real user's creations from /api/gallery — never seeded. Empty for new accounts.
    vault: [],
    signedIn: LS.getItem("gm_user") || "",
    name: LS.getItem("gm_name") || "",   // display name (from the engine) — the greeting, not the email prefix
  };
  const saveVault = () => {}; // no local persistence — /api/gallery is the source of truth

  // Load the signed-in user's real creations from the engine.
  async function loadGallery() {
    if (!state.signedIn) { state.vault = []; renderVault(); return; }
    try {
      const r = await fetch("/api/gallery", { credentials: "same-origin", headers: { accept: "application/json" } });
      if (!r.ok) return;
      const d = await r.json();
      const gens = d.generations || d.items || d.gallery || [];
      state.vault = gens.map((g) => ({
        id: g.id,
        kind: kindOf(g.capability || "") || g.kind || "image",
        type: g.type,
        url: g.url,
        thumb: g.thumb,
        prompt: g.prompt || "",
        model: g.model || "GenieMade",
        ts: Date.parse(g.created_at || (g.certificate && g.certificate.issued_at)) || Date.now(),
        // /api/gallery returns FLAT cert fields (cert_id/created_at/hash) — rebuild the nested shape the
        // certificate modal reads, so reloaded + imported creations show Receipt/Sealed/Fingerprint (not blanks).
        certificate: g.certificate || { receipt_id: g.cert_id, issued_at: g.created_at, hash: g.hash, c2pa: true },
      }));
      renderVault();
    } catch (e) { console.error("loadGallery failed:", e); /* keep whatever we have */ }
  }

  // ---- helpers ----
  function mockHash() {
    const h = "0123456789abcdef";
    let s = ""; for (let i = 0; i < 64; i++) s += h[(Math.random() * 16) | 0];
    return s;
  }
  function mockCert(prompt, ts) {
    return {
      hash: mockHash(),
      receipt_id: "GM-" + String(ts).slice(-8) + "-" + ((Math.random() * 46656) | 0).toString(36).toUpperCase().padStart(3, "0"),
      issued_at: new Date(ts).toISOString(),
      c2pa: true,
    };
  }
  const fmtTime = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const shortHash = (h) => (h ? h.slice(0, 10) + "…" + h.slice(-6) : "—");

  // ---- MOCK engine (contract-shaped) ----
  async function mockGenerate(body) {
    await new Promise((r) => setTimeout(r, 600));
    if (state.credits <= 0) return { ok: false, error: "no_credits", credits_remaining: 0 };
    const samples = ["assets/sample_1.png", "assets/sample_2.png", "assets/sample_3.png"];
    const url = samples[Math.floor(Math.random() * samples.length)];
    const ts = Date.now();
    return {
      ok: true,
      generation: {
        id: "gen_" + ts.toString(36),
        type: body.type,
        url,
        model: body.type === "video" ? "GenieMade Motion" : "GenieMade Vision",
        certificate: mockCert(body.prompt, ts),
        parent_id: null,
      },
      credits_remaining: state.credits - 1,
    };
  }
  // Try the real engine; fall back to mock if it is not live yet.
  async function generate(body) {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) return { ok: false, error: j.error || "auth_required" };
      if (res.ok && typeof j.ok === "boolean") return j; // real engine answered
      // Real endpoint returned an error — surface it. NEVER fake a result.
      return { ok: false, error: j.error || "generation_failed", message: j.message || `The engine returned ${res.status}.` };
    } catch (_) {
      return { ok: false, error: "network", message: "Couldn't reach the engine. Please try again." };
    }
  }

  // Video renders are async (~1 min): the engine returns { status:"processing", poll_url }.
  // Poll it until the job completes (real generation) or fails (credits are refunded server-side).
  async function pollJob(url, onTick) {
    const started = Date.now();
    while (Date.now() - started < 420000) { // 7-min ceiling (Seedance 2.5 renders run 60–250s)
      await new Promise((r) => setTimeout(r, 4000));
      let j = null;
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        j = await res.json().catch(() => ({}));
      } catch (_) { continue; } // transient network blip — keep polling
      if (j && j.status === "completed") return j;
      if (j && j.status === "failed")
        return { ok: false, error: "gen_failed", message: j.error || "The video couldn't be generated — your credits were refunded." };
      if (onTick) onTick(j || {}); // still processing
    }
    return { ok: false, error: "timeout", message: "This is taking longer than usual — it'll appear in your Vault when it's ready." };
  }

  // ---- create flow ----
  const els = {
    prompt: $("#prompt"), make: $("#makeBtn"), summon: $("#summon"), summonSt: $("#summonSt"),
    summonSb: $("#summonSb"), prog: $("#progBar"), result: $("#result"), canvas: $("#resultCanvas"),
    grid: $("#grid"),
  };
  const SUMMON_STEPS = ["warming the lamp", "reading your wish", "shaping the vision", "sealing the certificate"];

  async function makeWish() {
    const prompt = els.prompt.value.trim();
    if (!prompt && !state.packMode) { els.prompt.focus(); return; } // packs carry no visible prompt
    if (!state.signedIn) { openAuth("signup"); return; } // registration required before a wish
    if (state.credits <= 0) { openModal("payModal"); return; }
    if (state.uploading) { setRefHint("Hang on — your photo is still uploading."); return; }
    if (state.capability === "video.image2video" && !state.refUrl) {
      setRefHint("Add a photo to animate first.");
      const rb = $("#refBtn"); if (rb) rb.focus();
      return;
    }
    if (state.packMode && !state.refUrl) {
      setRefHint("Add your photo to star in this pack first.");
      const rb = $("#refBtn"); if (rb) rb.focus();
      return;
    }
    els.make.disabled = true;
    els.result.classList.remove("on");
    els.summon.classList.add("on");
    els.summon.scrollIntoView({ behavior: "smooth", block: "center" });
    let step = 0, pct = 6;
    els.prog.style.width = pct + "%";
    const timer = setInterval(() => {
      pct = Math.min(94, pct + Math.random() * 16);
      els.prog.style.width = pct + "%";
      if (Math.random() < 0.5 && step < SUMMON_STEPS.length - 1) { step++; els.summonSb.textContent = SUMMON_STEPS[step]; }
    }, 520);

    const kind = kindOf(state.capability);
    // Pack wish: send only the pack+look ids + the photo. The engine holds the (secret) prompt.
    const body = (state.packMode && state.pack)
      ? { pack: state.pack.id, look: state.pack.look, image_url: state.refUrl }
      : {
          capability: state.capability, prompt,
          ...(kind === "audio" ? {} : { aspect: state.aspect }),
          ...(state.refUrl ? { image_url: state.refUrl } : {}),
        };
    let resp = await generate(body);

    // Async job (video): the engine accepted the wish and is rendering. Keep the
    // lamp animating and poll until the finished creation (or a refunded failure).
    if (resp.ok && resp.status === "processing" && resp.poll_url) {
      els.summonSb.textContent = "rendering your video — this can take a couple of minutes";
      resp = await pollJob(resp.poll_url, () => { els.summonSb.textContent = "rendering your video — still working, hang tight"; });
    }
    clearInterval(timer);

    if (!resp.ok && resp.error === "auth_required") {
      els.summon.classList.remove("on"); els.make.disabled = false; openAuth("signup"); return;
    }
    if (!resp.ok && resp.error === "no_credits") {
      els.summon.classList.remove("on"); els.make.disabled = false; openModal("payModal"); return;
    }
    if (!resp.ok) {
      els.summonSt.textContent = resp.message || "That didn't work — please try again.";
      els.make.disabled = false; setTimeout(() => els.summon.classList.remove("on"), 2600); return;
    }
    els.prog.style.width = "100%";
    exitPackUI(); // wish landed — restore the normal composer for the next one
    const g = resp.generation;
    if (typeof resp.credits_remaining === "number") LS.setItem("gm_credits", String(resp.credits_remaining));
    else state.credits = state.credits - 1;
    LS.setItem("gm_first_wish_done", "1"); // first wish made — retire the onboarding nudge
    paintCredits();

    // record in vault
    const item = { id: g.id, kind: kindOf(state.capability), type: g.type, url: g.url, prompt, model: g.model, ts: Date.parse(g.certificate.issued_at) || Date.now(), certificate: g.certificate };
    state.vault.unshift(item); saveVault(); renderVault();

    setTimeout(() => {
      els.summon.classList.remove("on");
      renderResult(item);
      els.make.disabled = false;
    }, 420);
  }

  function isAudio(item) {
    const u = (item.url || "").toLowerCase();
    return item.kind === "audio" || item.type === "voice" || item.type === "audio.speech" || u.endsWith(".wav") || u.endsWith(".mp3");
  }
  function mediaEl(item, big) {
    if (isAudio(item)) {
      if (big) {
        return `<div style="position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:14px;padding:24px;text-align:center;background:conic-gradient(from 210deg at 55% 40%,rgba(245,196,81,.12),rgba(102,227,232,.08),rgba(160,107,255,.12),rgba(245,196,81,.12))">
          <div style="font-size:2.8rem">🔊</div>
          <audio controls src="${item.url}" style="width:90%;max-width:340px"></audio>
          <div style="font-size:.82rem;color:var(--mut)">"${escapeHtml((item.prompt || "").slice(0, 64))}"</div></div>`;
      }
      return `<div style="position:absolute;inset:0;display:grid;place-items:center;background:conic-gradient(from 210deg at 60% 40%,rgba(245,196,81,.14),rgba(102,227,232,.10),rgba(160,107,255,.14),rgba(245,196,81,.14))"><div style="font-size:2rem">🔊</div></div>`;
    }
    if (item.type === "video" || item.kind === "video") {
      const poster = item.thumb ? ` poster="${item.thumb}"` : "";
      return big
        ? `<video src="${item.url}" autoplay loop muted playsinline controls${poster}></video>`   // controls: films have sound — let people unmute + scrub
        : `<video src="${item.url}"${poster} muted playsinline preload="${item.thumb ? "none" : "metadata"}"></video>`;   // vault tiles: poster paints instantly, no video download until opened
    }
    return big
      ? `<img src="${item.url}" alt="${escapeHtml(item.prompt)}">`
      : `<img src="${item.url}" loading="lazy" decoding="async" alt="${escapeHtml(item.prompt)}">`;   // vault tiles: only load when scrolled into view
  }
  function renderResult(item) {
    els.canvas.innerHTML = mediaEl(item, true);
    $("#certTitle").textContent = `“${item.prompt.slice(0, 60)}${item.prompt.length > 60 ? "…" : ""}”`;
    $("#certModel").textContent = item.model;
    $("#certReceipt").textContent = item.certificate.receipt_id;
    $("#certTime").textContent = fmtTime(item.certificate.issued_at);
    $("#certHash").textContent = shortHash(item.certificate.hash);
    $("#certC2pa").textContent = item.certificate.c2pa ? "C2PA embedded" : "—";
    (function(){ var rid = item.certificate && item.certificate.receipt_id;
      if (!rid) return; var ev = "https://eververify.org/r/" + encodeURIComponent(rid);
      var l = document.getElementById("everVerifyLink"); if (l) { l.href = ev; l.style.display = ""; }
      var b = document.getElementById("everVerifyBadge"); if (b) { b.href = ev; var im = b.querySelector("img"); if (im) im.src = "https://eververify.org/badge/" + encodeURIComponent(rid) + ".svg"; b.style.display = ""; }
    })();
    els.result.classList.add("on");
    $("#dlBtn").onclick = () => gmDownload(item);
    var dc = $("#dlCertBtn"); if (dc) dc.onclick = () => gmDownloadCert(item);
    // Turn an image result into a greeting card / e-invite (the composer reads ?img=)
    var cb = $("#cardBtn");
    if (cb) {
      var isImg = item.url && /\.(png|jpe?g|webp)(\?|$)/i.test(item.url);
      if (isImg) { cb.style.display = ""; cb.href = "/card?img=" + encodeURIComponent(item.url) + (item.look_name ? "&title=" + encodeURIComponent(item.look_name) : ""); }
      else cb.style.display = "none";
    }
    els.result.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderVault() {
    if (!state.vault.length) { els.grid.innerHTML = `<div class="empty">Your Vault is empty — make your first wish above.</div>`; return; }
    els.grid.innerHTML = state.vault.map((g, i) => `
      <div class="card" data-i="${i}">
        ${mediaEl(g, false)}
        <div class="cert">◈ Certified</div>
        <div class="cap">“${escapeHtml(g.prompt.slice(0, 44))}${g.prompt.length > 44 ? "…" : ""}”</div>
      </div>`).join("");
    $$(".card", els.grid).forEach((c) => c.onclick = () => openLightbox(state.vault[Number(c.dataset.i)]));
  }

  // ---- lightbox ----
  function openLightbox(item) {
    $("#lbBig").innerHTML = mediaEl(item, true);
    $("#lbTitle").textContent = `“${item.prompt}”`;
    $("#lbDesc").textContent = "Sealed in your PrecognitionOS Vault — provably yours.";
    $("#lbModel").textContent = item.model;
    $("#lbReceipt").textContent = item.certificate.receipt_id;
    $("#lbTime").textContent = fmtTime(item.certificate.issued_at);
    $("#lbHash").textContent = shortHash(item.certificate.hash);
    var d1 = $("#lbDl"); if (d1) d1.onclick = () => gmDownload(item);
    var d2 = $("#lbCert"); if (d2) d2.onclick = () => gmDownloadCert(item);
    var d3 = $("#lbDelete"); if (d3) d3.onclick = () => openDelete(item);
    var d4 = $("#lbShare"); if (d4) d4.onclick = () => openShare(item);
    $("#lightbox").classList.add("on");
  }

  // ---- downloads + delete ----
  function niceName(item){ return (((item && (item.look_name || item.prompt)) || "GenieMade") + "").replace(/[^\w \-]+/g, "").trim().slice(0, 60) || "GenieMade"; }
  function gmDownload(item){
    if (!item || !item.url) return;
    var sep = item.url.indexOf("?") >= 0 ? "&" : "?";
    var a = document.createElement("a");
    a.href = item.url + sep + "download=1&name=" + encodeURIComponent(niceName(item));
    a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
  }
  function gmCertHtml(item){
    var c = (item && item.certificate) || {}, rid = c.receipt_id || "";
    var ev = rid ? "https://eververify.org/r/" + encodeURIComponent(rid) : "";
    return "<!doctype html><meta charset=utf-8><title>GenieMade Certificate — " + escapeHtml(rid) + "</title>" +
    "<div style=\"font-family:Georgia,serif;max-width:640px;margin:40px auto;padding:34px;border:2px solid #c88f2c;border-radius:16px;background:#130a26;color:#f7f1ff\">" +
    "<div style=\"font-size:22px;color:#ffe390\">GenieMade — Certificate of Authenticity</div>" +
    "<p style=\"color:#c6b6ea\">This confirms the creation below was made on GenieMade and sealed in a PrecognitionOS Vault.</p>" +
    "<img src=\"" + item.url + "\" style=\"width:100%;border-radius:10px;margin:12px 0\">" +
    "<table style=\"width:100%;font-size:14px;color:#eaf1ff;border-collapse:collapse\">" +
    "<tr><td style=\"color:#8f7fbb;padding:5px 0\">Title</td><td>" + escapeHtml(((item.look_name || item.prompt) || "").slice(0, 80)) + "</td></tr>" +
    "<tr><td style=\"color:#8f7fbb;padding:5px 0\">Receipt</td><td>" + escapeHtml(rid) + "</td></tr>" +
    "<tr><td style=\"color:#8f7fbb;padding:5px 0\">Engine</td><td>" + escapeHtml(item.model || "") + "</td></tr>" +
    "<tr><td style=\"color:#8f7fbb;padding:5px 0\">Sealed</td><td>" + escapeHtml(c.issued_at || "") + "</td></tr>" +
    "<tr><td style=\"color:#8f7fbb;padding:5px 0\">Content hash (SHA-256)</td><td style=\"font-family:monospace;font-size:11px;word-break:break-all\">" + escapeHtml(c.hash || "") + "</td></tr>" +
    "<tr><td style=\"color:#8f7fbb;padding:5px 0\">Content credentials</td><td>" + (c.c2pa ? "C2PA embedded" : "—") + "</td></tr></table>" +
    (ev ? "<p style=\"margin-top:16px\"><a href=\"" + ev + "\" style=\"color:#66e3e8\">Verify on EverVerify</a> — independent public registry (our sister company).</p>" : "") +
    "<p style=\"color:#8f7fbb;font-size:12px;margin-top:18px\">(c) 2026 GenieMade — portable copy; the authoritative record lives at geniemadeit.com/verify and on EverVerify.</p></div>";
  }
  function gmDownloadCert(item){
    if (!item || !item.certificate) return;
    var blob = new Blob([gmCertHtml(item)], { type: "text/html" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "GenieMade-Certificate-" + (item.certificate.receipt_id || "receipt") + ".html";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  }
  var _delItem = null;
  function openDelete(item){
    _delItem = item; if (!item || !item.id) return;
    var w = $("#delWhat"); if (w) w.textContent = "“" + ((item.look_name || item.prompt || "") + "").slice(0, 50) + "”";
    var k = $("#delKeepOriginal"); if (k) k.checked = false;
    var m = $("#delMsg"); if (m) m.textContent = "";
    var c = $("#delConfirm"); if (c) c.onclick = doDelete;
    openModal("deleteModal");
  }
  async function doDelete(){
    if (!_delItem || !_delItem.id) return;
    var keep = $("#delKeepOriginal") && $("#delKeepOriginal").checked;
    var m = $("#delMsg"); if (m) m.textContent = "Deleting…";
    try {
      var r = await fetch("/api/vault/delete", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ id: _delItem.id, keep_original: !!keep }) });
      var d = await r.json().catch(function(){ return {}; });
      if (r.ok && d.ok) {
        state.vault = (state.vault || []).filter(function(g){ return g.id !== _delItem.id; });
        renderVault(); closeModals(); $("#lightbox").classList.remove("on"); _delItem = null;
      } else if (m) { m.textContent = d.message || d.error || "Couldn't delete."; }
    } catch (e) { if (m) m.textContent = "Network error — try again."; }
  }

  // ---- sharing: one public full-res link per creation; authenticity optional; revocable ----
  var _shareItem = null;
  async function shareCall(includeCert) {
    var r = await fetch("/api/share", { method: "POST", credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: _shareItem.id, include_cert: !!includeCert }) });
    return r.json().catch(function(){ return {}; });
  }
  function openShare(item) {
    _shareItem = item; if (!item || !item.id) return;
    var w = $("#shWhat"); if (w) w.textContent = item.prompt ? "“" + item.prompt.slice(0, 55) + "”" : "";
    var u = $("#shUrl"); if (u) u.value = "";
    var m = $("#shMsg"); if (m) m.textContent = "Creating your link…";
    var c = $("#shCert"); if (c) c.checked = true;
    openModal("shareModal");
    shareCall(true).then(function(d){
      if (d.ok && u) { u.value = d.url; if (m) m.textContent = "Anyone with this link can view + download the full-resolution original."; }
      else if (m) m.textContent = d.message || "Couldn't create the link — try again.";
    });
  }
  var _shc = $("#shCert"); if (_shc) _shc.onchange = async function(e){
    if (!_shareItem) return;
    var d = await shareCall(e.target.checked);
    var m = $("#shMsg");
    if (m) m.textContent = d.ok ? (e.target.checked ? "Authenticity certificate attached to the link." : "Link now shares the media only — no certificate.") : (d.message || "Update failed.");
  };
  var _shcp = $("#shCopy"); if (_shcp) _shcp.onclick = async function(){
    var u = $("#shUrl"); if (!u || !u.value) return;
    try { await navigator.clipboard.writeText(u.value); } catch (_) { u.select(); document.execCommand("copy"); }
    var m = $("#shMsg"); if (m) m.textContent = "Link copied — paste it anywhere.";
  };
  var _shrv = $("#shRevoke"); if (_shrv) _shrv.onclick = async function(){
    if (!_shareItem) return;
    var r = await fetch("/api/share/revoke", { method: "POST", credentials: "same-origin",
      headers: { "content-type": "application/json" }, body: JSON.stringify({ id: _shareItem.id }) });
    var d = await r.json().catch(function(){ return {}; });
    var u = $("#shUrl"); if (u) u.value = "";
    var m = $("#shMsg"); if (m) m.textContent = d.revoked ? "Link revoked — it no longer works anywhere." : (d.message || "No active link to revoke.");
  };

  // ---- modals ----
  function openModal(id) { $("#" + id).classList.add("on"); }
  function closeModals() { $$(".modal, .lb").forEach((m) => m.classList.remove("on")); }

  // ---- credits / account ----
  function paintCredits() {
    $("#creditN").textContent = state.credits;
    $("#creditHint").textContent = state.credits + (state.credits === 1 ? " wish left" : " wishes left");
    paintOnboarding();
  }
  // ---- onboarding: first-run welcome + "use your free wishes" until the first creation ----
  const seenWelcome = () => LS.getItem("gm_welcomed") === "1";
  const firstWishDone = () => LS.getItem("gm_first_wish_done") === "1";
  function paintOnboarding() {
    const ob = $("#onboardBanner");
    if (!ob) return;
    const show = !!state.signedIn && !firstWishDone() && state.credits > 0;
    ob.style.display = show ? "" : "none";
    const n = $("#obN"); if (n) n.textContent = state.credits;
  }
  function maybeWelcome() {
    if (state.signedIn && !seenWelcome() && !firstWishDone() && state.credits > 0) {
      LS.setItem("gm_welcomed", "1"); openModal("welcomeModal");
    }
  }
  function checkPurchaseReturn() {
    const q = new URLSearchParams(location.search);
    if (q.get("purchase") === "success" || q.get("sub") === "success") {
      LS.setItem("gm_first_wish_done", "1"); // a paying user isn't a first-timer — retire the free-wishes nudge
      const bb = $("#buyBanner"); if (bb) { const bn = $("#buyN"); if (bn) bn.textContent = state.credits; bb.style.display = ""; }
      paintOnboarding();
    }
  }
  function paintAccount() {
    const b = $("#accountBtn");
    // Prefer the real display name (matches the /account panel); fall back to the email local-part.
    b.textContent = state.signedIn ? (state.name || state.signedIn.split("@")[0]) : "Sign in";
  }
  // Capture the engine's display name so the header greeting matches the account page ("Rick", not "rick").
  function setName(u) {
    const n = (u && (u.display_name || u.full_name || u.name)) ? String(u.display_name || u.full_name || u.name).trim() : "";
    state.name = n;
    if (n) LS.setItem("gm_name", n); else LS.removeItem("gm_name");
  }

  // ---- auth (real email + Google session via the engine) ----
  let authMode = "signin";
  // ---- Turnstile bot-guard (only the signup path mints free credits) ----
  const TS_SITEKEY = "0x4AAAAAAELcSNe5KdmNBXR9";
  let tsWidgetId = null;
  function renderTurnstile() {
    if (!window.turnstile) return;
    const box = $("#tsBox"); if (!box) return;
    if (tsWidgetId !== null) { try { window.turnstile.reset(tsWidgetId); } catch (_) {} return; }
    try { tsWidgetId = window.turnstile.render(box, { sitekey: TS_SITEKEY, appearance: "interaction-only", theme: "dark" }); } catch (_) {}
  }
  window.gmTsReady = renderTurnstile; // fired by the Turnstile api.js onload
  function tsToken() { try { return (window.turnstile && tsWidgetId !== null) ? window.turnstile.getResponse(tsWidgetId) : ""; } catch (_) { return ""; } }
  const AUTH_MSG = { email_exists: "That email already has an account — try signing in.", human_check_failed: "The human check didn't pass — please try again.", bad_credentials: "Email or password is incorrect.", invalid_input: "Enter a valid email and an 8+ character password." };
  function openAuth(mode) {
    authMode = mode;
    $("#authTitle").textContent = mode === "signin" ? "Welcome back" : "Create your account";
    $("#authSub").textContent = mode === "signin" ? "Sign in to keep your wishes and your Vault across devices." : "Sign up and your three free wishes are waiting.";
    $("#authSubmit").textContent = mode === "signin" ? "Sign in" : "Create account";
    $("#authSwap").innerHTML = mode === "signin" ? `New here? <a href="#" id="swapLink">Create an account</a>` : `Already have an account? <a href="#" id="swapLink">Sign in</a>`;
    $("#swapLink").onclick = (e) => { e.preventDefault(); openAuth(mode === "signin" ? "signup" : "signin"); };
    renderTurnstile();
    openModal("authModal");
  }
  async function doAuth() {
    const email = $("#authEmail").value.trim();
    const password = $("#authPass").value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("#authEmail").focus(); return; }
    if (!password) { $("#authPass").focus(); return; }
    const btn = $("#authSubmit"); const label = btn.textContent; btn.textContent = "…"; btn.disabled = true;
    try {
      const ep = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload = { email, password };
      if (authMode === "signup") {
        const t = tsToken();
        if (!t) { authErr("One moment — finishing the human check. Please try again."); renderTurnstile(); return; }
        payload.turnstile = t;
      }
      const r = await fetch(ep, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) { authErr(AUTH_MSG[j.error] || j.error || "That didn't work — check your details."); if (authMode === "signup") renderTurnstile(); return; }
      const u = j.user || {};
      LS.setItem("gm_user", u.email || email); state.signedIn = u.email || email; setName(u);
      if (typeof u.credits === "number") { LS.setItem("gm_credits", String(u.credits)); }
      paintAccount(); paintCredits(); closeModals(); loadGallery(); loadMyPhotos(); loadReminderBanner(); maybeWelcome();
    } catch (_) { authErr("Something went wrong. Try again."); }
    finally { btn.textContent = label; btn.disabled = false; }
  }
  function authErr(m) {
    let e = $("#authErr");
    if (!e) { e = document.createElement("div"); e.id = "authErr"; e.style.cssText = "color:#ff6b8a;font-size:.85rem;margin-top:10px;text-align:center"; $("#authSubmit").after(e); }
    e.textContent = m;
  }

  // ---- data-driven capabilities (phased release straight from /api/capabilities) ----
  const ICON = { image: "◈", video: "▶", audio: "🔊" };
  const kindOf = (id) => (id || "").split(".")[0];
  const DEFAULT_CAPS = [
    { id: "image.text", name: "Image", status: "live", credits: 1 },
    { id: "audio.speech", name: "Voice", status: "live", credits: 3 },
  ];
  function shortName(it) {
    const k = kindOf(it.id);
    if (it.id === "image.text") return "Image";
    if (it.id === "audio.speech") return "Voice";
    if (it.id === "audio.music") return "Music";
    if (it.id === "video.image2video") return "Animate Photo";
    if (it.id === "video.text2video") return "Video";
    if (k === "video") return "Video";
    return it.name;
  }
  // Does this capability use a reference/source photo, and is it required?
  function refMode(id) {
    if (id === "video.image2video") return { show: true, required: true, label: "Add a photo to animate", hint: "Required — your photo becomes the first frame." };
    if (kindOf(id) === "image") return { show: true, required: false, label: "Add a photo (optional)", hint: "Optional — upload a face/photo to star in the result." };
    return { show: false, required: false, label: "", hint: "" };
  }
  // Upload a reference photo to the engine; store the returned same-origin URL.
  async function uploadRef(file) {
    if (!file) return;
    if (!state.signedIn) { openAuth("signup"); return; }
    if (!/^image\//.test(file.type)) { setRefHint("Please choose a JPG, PNG, or WebP image."); return; }
    if (file.size > 12 * 1024 * 1024) { setRefHint("That image is over 12MB — pick a smaller one."); return; }
    state.uploading = true; setRefHint("Uploading…");
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
      const j = await r.json().catch(() => ({}));
      if (!j.ok || !j.url) { setRefHint(j.message || "Upload failed — try again."); state.uploading = false; return; }
      state.refUrl = j.url;
      const thumb = $("#refThumb"), prev = $("#refPreview"), btn = $("#refBtn");
      if (thumb) thumb.src = j.url;
      if (prev) prev.style.display = "flex";
      if (btn) $("#refBtnLabel").textContent = "Change photo";
      setRefHint("");
      savePhoto(j.url); // remember it in My Photos so they never re-find it on their device
    } catch (_) { setRefHint("Upload failed — try again."); }
    finally { state.uploading = false; }
  }
  function clearRef() {
    state.refUrl = "";
    const prev = $("#refPreview"), inp = $("#refInput");
    if (prev) prev.style.display = "none";
    if (inp) inp.value = "";
    const m = refMode(state.capability);
    if ($("#refBtnLabel")) $("#refBtnLabel").textContent = m.label || "Add a photo";
    setRefHint(m.hint);
  }
  function setRefHint(t) { const h = $("#refHint"); if (h) h.textContent = t || ""; }
  // ---- My Photos: the customer's saved reference photos, reusable without re-finding on device ----
  async function loadMyPhotos() {
    if (!state.signedIn) { const w0 = $("#myPhotos"); if (w0) w0.style.display = "none"; return; }
    try {
      const r = await fetch("/api/photos", { credentials: "same-origin", headers: { accept: "application/json" } });
      const j = await r.json().catch(() => ({}));
      renderMyPhotos((j && j.photos) || []);
    } catch (_) {}
  }
  function renderMyPhotos(list) {
    const wrap = $("#myPhotos"), row = $("#myPhotosRow");
    if (!wrap || !row) return;
    if (!list.length) { wrap.style.display = "none"; return; }
    wrap.style.display = "";
    row.innerHTML = list.map((ph) => `
      <div class="myph" data-id="${ph.id}" data-url="${escAttr(ph.url)}" style="position:relative;flex:0 0 auto">
        <img src="${escAttr(ph.url)}" alt="saved photo" style="width:58px;height:58px;object-fit:cover;border-radius:12px;border:1px solid var(--line);cursor:pointer;display:block">
        <button class="myphdel" title="Remove" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:#2a1140;color:#ffb3c6;font-size:12px;line-height:1;cursor:pointer">✕</button>
      </div>`).join("");
    $$(".myph img", row).forEach((im) => im.onclick = () => useSavedPhoto(im.parentNode.dataset.url));
    $$(".myphdel", row).forEach((b) => b.onclick = (e) => { e.stopPropagation(); deletePhoto(b.parentNode.dataset.id); });
  }
  function useSavedPhoto(url) {
    state.refUrl = url;
    const thumb = $("#refThumb"), prev = $("#refPreview");
    if (thumb) thumb.src = url;
    if (prev) prev.style.display = "flex";
    if ($("#refBtnLabel")) $("#refBtnLabel").textContent = "Change photo";
    setRefHint("Using your saved photo — hit Make a wish.");
  }
  async function savePhoto(url) {
    if (!url) return;
    try {
      const r = await fetch("/api/photos", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const j = await r.json().catch(() => ({})); if (j && j.photos) renderMyPhotos(j.photos);
    } catch (_) {}
  }
  async function deletePhoto(id) {
    try {
      const r = await fetch("/api/photos/delete", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      const j = await r.json().catch(() => ({})); if (j && j.photos) renderMyPhotos(j.photos);
    } catch (_) {}
  }
  // ---- Reminder banner: surface the soonest upcoming person-occasion right in the Studio ----
  async function loadReminderBanner() {
    if (!state.signedIn) return;
    var box = $("#remBanner"); if (!box) return;
    try {
      var r = await fetch("/api/reminders?days=30", { credentials: "same-origin" });
      var d = await r.json(); var rem = (d && d.reminders) || [];
      if (!rem.length) { box.style.display = "none"; return; }
      var x = rem[0];
      var when = x.days_away === 0 ? "today" : x.days_away === 1 ? "tomorrow" : ("in " + x.days_away + " days");
      var icon = x.kind === "birthday" ? "🎂" : "🎉";
      var first = (x.name || "them").split(" ")[0];
      box.innerHTML = '<span>' + icon + ' <b>' + escHtml(x.name || "Someone") + "'s " + escHtml(x.label) + '</b> is ' + when + ' — put ' + escHtml(first) + ' in the scene.</span>' +
        '<button class="btn gold" id="remGo" style="margin-left:auto;white-space:nowrap">Make ' + escHtml(first) + "'s card →</button>";
      box.style.display = "flex";
      var pk = x.kind === "birthday" ? "birthday" : "congrats";
      $("#remGo").onclick = function () {
        if (x.photo) useSavedPhoto(x.photo);
        var p = (PACKS && PACKS.find) ? PACKS.find(function (pp) { return pp.id === pk; }) : null;
        if (p && p.looks && p.looks[0]) applyPack(p, p.looks[0]);
        var comp = document.querySelector(".composer"); if (comp) comp.scrollIntoView({ behavior: "smooth", block: "center" });
      };
    } catch (_) {}
  }
  // ?ref=<url> deep-link (from /people "make their card") — pre-load that person's photo as the reference
  function checkRefParam() {
    try {
      var ref = new URLSearchParams(location.search).get("ref");
      if (ref && /^(\/asset\/|%2Fasset)/.test(ref)) useSavedPhoto(decodeURIComponent(ref));
    } catch (_) {}
  }
  function selectCapability(id) {
    state.capability = id;
    $$("#typeSeg button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.cap === id)));
    const k = kindOf(id);
    const showAspect = k === "image" || k === "video";
    const asp = $("#aspectSeg"), lab = $("#shapeLab");
    if (asp) asp.style.display = showAspect ? "" : "none";
    if (lab) lab.style.display = showAspect ? "" : "none";
    els.prompt.placeholder = k === "audio"
      ? "Type what you want spoken aloud — e.g. Welcome to GenieMade, where your words come to life…"
      : id === "video.image2video"
      ? "Describe the motion — e.g. gentle zoom, confetti falling, hair blowing in the wind…"
      : "a regal fox in a velvet coat, cinematic light, ultra detailed…";
    $("#makeBtn").textContent = k === "audio" ? "✦ Speak it" : id === "video.image2video" ? "✦ Animate it" : "✦ Make a wish";
    // reference/upload control — required for Animate Photo, optional for images
    const m = refMode(id);
    const rb = $("#refBox");
    if (rb) rb.style.display = m.show ? "flex" : "none";
    if ($("#refBtnLabel")) $("#refBtnLabel").textContent = state.refUrl ? "Change photo" : (m.label || "Add a photo");
    setRefHint(state.refUrl ? "" : m.hint);
  }
  async function renderCapabilities() {
    let cats = null;
    try {
      const r = await fetch("/api/capabilities", { headers: { accept: "application/json" } });
      const ct = r.headers.get("content-type") || "";
      if (r.ok && ct.includes("application/json")) { const j = await r.json(); cats = j.capabilities || j.categories; }
    } catch (_) {}
    const items = cats ? cats.flatMap((c) => c.items || []) : DEFAULT_CAPS;
    let live = items.filter((it) => it.status === "live");
    const soon = items.filter((it) => it.status && it.status !== "live");
    if (!live.length) live = [DEFAULT_CAPS[0]];
    const seg = $("#typeSeg");
    seg.innerHTML = live.map((it, i) =>
      `<button data-cap="${it.id}" aria-pressed="${i === 0}" title="${it.credits || 1} credit${(it.credits || 1) > 1 ? "s" : ""}">${ICON[kindOf(it.id)] || "✦"} ${shortName(it)}</button>`).join("");
    $$("#typeSeg button").forEach((b) => b.onclick = () => { exitPackUI(); selectCapability(b.dataset.cap); });
    selectCapability(live[0].id);
    const hint = $("#soonHint");
    if (hint) hint.textContent = soon.length ? "More coming soon: " + soon.map((s) => s.name).join(" · ") : "";
  }

  // ---- occasion packs (the pick-a-pack angle) ----
  const escHtml = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const escAttr = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let PACKS = [];
  // simple fullscreen image lightbox (pack cover / tile enlarge)
  function showImgLightbox(src, alt) {
    let ov = document.getElementById("imgLight");
    if (!ov) {
      ov = document.createElement("div"); ov.id = "imgLight";
      ov.style.cssText = "position:fixed;inset:0;z-index:95;background:rgba(8,4,18,.92);display:flex;align-items:center;justify-content:center;padding:24px;cursor:zoom-out";
      ov.innerHTML = '<img style="max-width:92vw;max-height:92vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.6)">';
      ov.onclick = () => { ov.style.display = "none"; };
      document.body.appendChild(ov);
    }
    ov.querySelector("img").src = src; ov.querySelector("img").alt = alt || "";
    ov.style.display = "flex";
  }
  async function renderPacks() {
    const grid = $("#packGrid"), sect = $("#packs");
    if (!grid) return;
    try {
      const r = await fetch("/api/packs", { headers: { accept: "application/json" } });
      const j = await r.json();
      PACKS = (j && j.packs) || [];
    } catch (_) { PACKS = []; }
    if (!PACKS.length) { if (sect) sect.style.display = "none"; return; }
    if (sect) sect.style.display = "";
    grid.innerHTML = PACKS.map((p, pi) => `
      <div class="packcard">
        <div class="cover" data-pi="${pi}" title="Click to enlarge"><img id="pcover-${pi}" loading="lazy" src="${escAttr(p.cover)}" alt="${escAttr(p.title)}">
          <div class="title">${escHtml(p.emoji || "✨")} ${escHtml(p.title)}</div></div>
        <div class="body">
          <p class="blurb">${escHtml(p.blurb || "")}</p>
          <div class="packlooks">
            ${(p.looks || []).map((l, li) => `
              <button class="looktile" data-pi="${pi}" data-li="${li}" title="${escAttr(l.name)} — click to preview, then Add your face">
                <img loading="lazy" src="${escAttr(l.tile)}" alt="${escAttr(l.name)}"><span class="ln">${escHtml(l.name)}</span>
              </button>`).join("")}
          </div>
          <button class="starron" data-pi="${pi}">✦ Create My Image →</button>
          <div class="starsub">Add your face · Starring You · certified</div>
        </div>
      </div>`).join("");
    // Tile click: JUST swap it into the big cover (preview) + arm it — no scroll/applyPack (that's the button's job)
    $$("#packGrid .looktile").forEach((b) => b.onclick = () => {
      const pi = +b.dataset.pi, li = +b.dataset.li, p = PACKS[pi], l = p && p.looks[li];
      if (!l) return;
      const cov = document.getElementById("pcover-" + pi); if (cov) cov.src = l.tile;
      $$(`#packGrid .looktile[data-pi="${pi}"]`).forEach((x) => x.classList.toggle("armed", +x.dataset.li === li));
    });
    // Cover click: enlarge in a lightbox
    $$("#packGrid .cover").forEach((c) => c.onclick = () => {
      const img = c.querySelector("img"); if (img) showImgLightbox(img.src, img.alt);
    });
    // "Add your face" starts the currently-armed (or first) look of that pack
    $$("#packGrid .starron").forEach((b) => b.onclick = () => {
      const pi = +b.dataset.pi, p = PACKS[pi];
      const armed = document.querySelector(`#packGrid .looktile[data-pi="${pi}"].armed`);
      const li = armed ? +armed.dataset.li : 0;
      if (p && p.looks[li]) applyPack(p, p.looks[li]);
    });
    // Deep-link: /app?pack=<id> lands on a specific theme (from the /make theme links) — scroll + highlight.
    const wantPack = new URLSearchParams(location.search).get("pack");
    if (wantPack) {
      const pi = PACKS.findIndex((p) => p.id === wantPack);
      const card = pi >= 0 ? grid.children[pi] : null;
      if (card) {
        setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
        card.classList.add("deeplinked");
        setTimeout(() => card.classList.remove("deeplinked"), 2800);
      }
    }
  }

  // Seed the composer from a pack look. The prompt is a trade secret held by the engine — we never
  // fetch it or show it. We store only the pack+look ids, show a clean banner, and require a face photo.
  function applyPack(pack, look) {
    selectCapability(look.capability || "image.nano");
    state.packMode = true;
    state.pack = { id: pack.id, look: look.id, label: pack.title + " · " + look.name };
    // hide the free-text prompt + chips (nothing for the user to type or copy) and show the pack banner
    els.prompt.value = "";
    els.prompt.style.display = "none";
    const chips = $("#chips"); if (chips) chips.style.display = "none";
    const bt = $("#packBannerTitle"); if (bt) bt.textContent = (pack.emoji || "✨") + " " + state.pack.label;
    const banner = $("#packBanner"); if (banner) banner.style.display = "flex";
    state.aspect = "1:1";
    $$("#aspectSeg button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.aspect === "1:1")));
    setRefHint(state.refUrl
      ? "Your photo's ready — hit “Make a wish” to star in this look."
      : `Add your photo to star in “${look.name},” then hit “Make a wish.”`);
    const comp = $(".composer"); if (comp) comp.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!state.refUrl) { const rb = $("#refBtn"); if (rb) setTimeout(() => rb.focus(), 420); }
  }
  // Leave pack mode: restore the normal composer (free-text prompt + chips), hide the banner.
  function exitPackUI() {
    state.packMode = false; state.pack = null;
    els.prompt.style.display = "";
    const chips = $("#chips"); if (chips) chips.style.display = "";
    const banner = $("#packBanner"); if (banner) banner.style.display = "none";
  }
  function clearPack() { exitPackUI(); selectCapability("image.text"); setRefHint(""); els.prompt.focus(); }

  // ---- wire up ----
  function wire() {
    renderCapabilities();
    renderPacks();
    $$("#aspectSeg button").forEach((b) => b.onclick = () => {
      $$("#aspectSeg button").forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true"); state.aspect = b.dataset.aspect;
    });
    $$("#chips .chip").forEach((c) => c.onclick = () => { els.prompt.value = c.textContent; els.prompt.focus(); });
    // reference-photo upload (click, pick, drag-drop, clear)
    const refInput = $("#refInput"), refBtn = $("#refBtn"), refClear = $("#refClear"), refBox = $("#refBox");
    if (refBtn && refInput) refBtn.onclick = () => refInput.click();
    if (refInput) refInput.onchange = (e) => uploadRef(e.target.files && e.target.files[0]);
    if (refClear) refClear.onclick = clearRef;
    const packClear = $("#packClear"); if (packClear) packClear.onclick = clearPack;
    if (refBox) {
      refBox.addEventListener("dragover", (e) => { e.preventDefault(); refBox.style.opacity = ".7"; });
      refBox.addEventListener("dragleave", () => { refBox.style.opacity = "1"; });
      refBox.addEventListener("drop", (e) => { e.preventDefault(); refBox.style.opacity = "1"; const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) uploadRef(f); });
    }
    els.make.onclick = makeWish;
    els.prompt.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") makeWish(); });
    $("#againBtn").onclick = () => { els.result.classList.remove("on"); els.prompt.focus(); els.prompt.scrollIntoView({ behavior: "smooth", block: "center" }); };
    $("#accountBtn").onclick = async () => {
      if (state.signedIn) {
        try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (_) {}
        LS.removeItem("gm_user"); LS.removeItem("gm_vault"); LS.removeItem("gm_name"); state.signedIn = ""; state.name = ""; state.vault = []; renderVault(); paintAccount(); hydrate();
      } else openAuth("signin");
    };
    $("#authSubmit").onclick = doAuth;
    $("#googleBtn").onclick = () => { window.location.href = "/api/auth/google/start?return_to=/app"; };
    const msB = $("#msBtn"), fbB = $("#fbBtn");
    if (msB) msB.onclick = () => { window.location.href = "/api/auth/ms/start?return_to=/app"; };
    if (fbB) fbB.onclick = () => { window.location.href = "/api/auth/facebook/start?return_to=/app"; };
    // social buttons render only for providers the engine says are actually configured — no dead buttons
    fetch("/api/auth/providers").then((r) => r.json()).then((pr) => {
      if (pr && pr.microsoft && msB) msB.style.display = "";
      if (pr && pr.facebook && fbB) fbB.style.display = "";
    }).catch(() => {});
    $("#swapLink").onclick = (e) => { e.preventDefault(); openAuth("signup"); };
    $$("#payModal button[data-plan]").forEach((b) => b.onclick = () => studioCheckout(b.dataset.plan, b.dataset.interval));
    const ws = $("#welcomeStart"); if (ws) ws.onclick = () => { closeModals(); const p = $("#prompt"); if (p) p.focus(); };
    const om = $("#obMore"); if (om) om.onclick = (e) => { e.preventDefault(); openModal("payModal"); };
    $$("[data-close]").forEach((b) => b.onclick = closeModals);
    $$(".modal, .lb").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModals(); }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });
  }
  function escapeHtml(s) { return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  // ---- in-app checkout: real Stripe session (was a dead alert). Carries the Rewardful referral. ----
  async function studioCheckout(plan, interval) {
    if (!state.signedIn) { openAuth("signup"); return; }
    try {
      const referral = (window.Rewardful && window.Rewardful.referral) || undefined;
      const r = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ mode: "subscription", plan, interval: interval || "month", client_reference_id: referral }),
      });
      if (r.status === 401) { openAuth("signup"); return; }
      const j = await r.json().catch(() => ({}));
      if (j && (j.url || j.checkout_url)) { window.location.href = j.url || j.checkout_url; return; }
      alert("Checkout is temporarily unavailable. Please try again in a moment.");
    } catch (_) {
      alert("Checkout is temporarily unavailable. Please try again in a moment.");
    }
  }

  // ---- gold dust (brand continuity) ----
  function dust() {
    const c = $("#dust"); if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const x = c.getContext("2d"); let W, H, P = [];
    const seed = () => { W = c.width = innerWidth; H = c.height = innerHeight; const n = Math.min(80, (W * H / 18000) | 0); P = [];
      for (let i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.7 + .4, s: Math.random() * .45 + .12, d: Math.random() * 6.28, h: Math.random() < .22 ? "#66e3e8" : "#f5c451" }); };
    seed(); addEventListener("resize", seed);
    (function loop() { x.clearRect(0, 0, W, H); for (const p of P) { p.y -= p.s; p.x += Math.sin(p.d += .01) * .25; if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
      x.globalAlpha = .5 + Math.sin(p.d * 2) * .4; x.fillStyle = p.h; x.shadowBlur = 8; x.shadowColor = p.h; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); }
      x.globalAlpha = 1; x.shadowBlur = 0; requestAnimationFrame(loop); })();
  }

  // ---- hydrate real credits/plan/session from the engine (source of truth) ----
  async function hydrate() {
    try {
      const r = await fetch("/api/auth/me", { credentials: "same-origin" });
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || !ct.includes("application/json")) return;
      const j = await r.json();
      const u = j && j.user;
      if (u && typeof u.credits === "number") { LS.setItem("gm_credits", String(u.credits)); paintCredits(); }
      if (j && j.authenticated && u && u.email) { LS.setItem("gm_user", u.email); state.signedIn = u.email; setName(u); }
      else { LS.removeItem("gm_user"); state.signedIn = ""; setName(null); }
      if (u && u.plan) state.plan = u.plan;
      paintAccount();
      loadGallery();
      loadMyPhotos();
      loadReminderBanner();
      checkRefParam();
      maybeWelcome();
      checkPurchaseReturn();
    } catch (_) { /* engine offline — keep local */ }
  }

  // ---- init ----
  paintCredits(); paintAccount(); renderVault(); wire(); dust(); hydrate();
})();
