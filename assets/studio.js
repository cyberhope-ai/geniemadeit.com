/* GenieMade Studio — front-end logic.
 * Calls the /api/generate contract (atlas2's engine). Until that engine is live,
 * a client-side MOCK returns contract-shaped responses so the full UX works; it
 * auto-flips to the real engine the moment /api/generate answers with ok JSON.
 * The site NEVER calls a provider directly — only /api/generate.
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
    get credits() { const v = LS.getItem("gm_credits"); return v === null ? 3 : Number(v); },
    set credits(n) { LS.setItem("gm_credits", String(Math.max(0, n))); paintCredits(); },
    // The Vault is the real user's creations from /api/gallery — never seeded. Empty for new accounts.
    vault: [],
    signedIn: LS.getItem("gm_user") || "",
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
        prompt: g.prompt || "",
        model: g.model || "GenieMade",
        ts: Date.parse(g.created_at || (g.certificate && g.certificate.issued_at)) || Date.now(),
        certificate: g.certificate || {},
      }));
      renderVault();
    } catch (_) { /* keep whatever we have */ }
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
      if (res.status === 401) {
        const j = await res.json().catch(() => ({}));
        return { ok: false, error: j.error || "auth_required" };
      }
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.includes("application/json")) {
        const j = await res.json();
        if (typeof j.ok === "boolean") return j; // real engine answered
      }
    } catch (_) { /* engine unreachable — fall through to mock */ }
    return mockGenerate(body);
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
    if (!prompt) { els.prompt.focus(); return; }
    if (!state.signedIn) { openAuth("signup"); return; } // registration required before a wish
    if (state.credits <= 0) { openModal("payModal"); return; }
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
    const body = { capability: state.capability, prompt, ...(kind === "audio" ? {} : { aspect: state.aspect }) };
    const resp = await generate(body);
    clearInterval(timer);

    if (!resp.ok && resp.error === "auth_required") {
      els.summon.classList.remove("on"); els.make.disabled = false; openAuth("signup"); return;
    }
    if (!resp.ok && resp.error === "no_credits") {
      els.summon.classList.remove("on"); els.make.disabled = false; openModal("payModal"); return;
    }
    if (!resp.ok) {
      els.summonSt.textContent = "The lamp flickered — try again.";
      els.make.disabled = false; setTimeout(() => els.summon.classList.remove("on"), 1600); return;
    }
    els.prog.style.width = "100%";
    const g = resp.generation;
    if (typeof resp.credits_remaining === "number") LS.setItem("gm_credits", String(resp.credits_remaining));
    else state.credits = state.credits - 1;
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
  function mediaEl(item, player) {
    if (isAudio(item)) {
      if (player) {
        return `<div style="position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:14px;padding:24px;text-align:center;background:conic-gradient(from 210deg at 55% 40%,rgba(245,196,81,.12),rgba(102,227,232,.08),rgba(160,107,255,.12),rgba(245,196,81,.12))">
          <div style="font-size:2.8rem">🔊</div>
          <audio controls src="${item.url}" style="width:90%;max-width:340px"></audio>
          <div style="font-size:.82rem;color:var(--mut)">"${escapeHtml((item.prompt || "").slice(0, 64))}"</div></div>`;
      }
      return `<div style="position:absolute;inset:0;display:grid;place-items:center;background:conic-gradient(from 210deg at 60% 40%,rgba(245,196,81,.14),rgba(102,227,232,.10),rgba(160,107,255,.14),rgba(245,196,81,.14))"><div style="font-size:2rem">🔊</div></div>`;
    }
    if (item.type === "video" || item.kind === "video") return `<video src="${item.url}" autoplay loop muted playsinline poster="${item.url}"></video>`;
    return `<img src="${item.url}" alt="${escapeHtml(item.prompt)}">`;
  }
  function renderResult(item) {
    els.canvas.innerHTML = mediaEl(item, true);
    $("#certTitle").textContent = `“${item.prompt.slice(0, 60)}${item.prompt.length > 60 ? "…" : ""}”`;
    $("#certModel").textContent = item.model;
    $("#certReceipt").textContent = item.certificate.receipt_id;
    $("#certTime").textContent = fmtTime(item.certificate.issued_at);
    $("#certHash").textContent = shortHash(item.certificate.hash);
    $("#certC2pa").textContent = item.certificate.c2pa ? "C2PA embedded" : "—";
    els.result.classList.add("on");
    $("#dlBtn").onclick = () => window.open(item.url, "_blank");
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
    $("#lightbox").classList.add("on");
  }

  // ---- modals ----
  function openModal(id) { $("#" + id).classList.add("on"); }
  function closeModals() { $$(".modal, .lb").forEach((m) => m.classList.remove("on")); }

  // ---- credits / account ----
  function paintCredits() {
    $("#creditN").textContent = state.credits;
    $("#creditHint").textContent = state.credits + (state.credits === 1 ? " wish left" : " wishes left");
  }
  function paintAccount() {
    const b = $("#accountBtn");
    b.textContent = state.signedIn ? state.signedIn.split("@")[0] : "Sign in";
  }

  // ---- auth (mock UI; real session swaps in with atlas2 engine) ----
  let authMode = "signin";
  function openAuth(mode) {
    authMode = mode;
    $("#authTitle").textContent = mode === "signin" ? "Welcome back" : "Create your account";
    $("#authSub").textContent = mode === "signin" ? "Sign in to keep your wishes and your Vault across devices." : "Sign up and your three free wishes are waiting.";
    $("#authSubmit").textContent = mode === "signin" ? "Sign in" : "Create account";
    $("#authSwap").innerHTML = mode === "signin" ? `New here? <a href="#" id="swapLink">Create an account</a>` : `Already have an account? <a href="#" id="swapLink">Sign in</a>`;
    $("#swapLink").onclick = (e) => { e.preventDefault(); openAuth(mode === "signin" ? "signup" : "signin"); };
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
      const r = await fetch(ep, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ email, password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) { authErr(j.error || "That didn't work — check your details."); return; }
      const u = j.user || {};
      LS.setItem("gm_user", u.email || email); state.signedIn = u.email || email;
      if (typeof u.credits === "number") { LS.setItem("gm_credits", String(u.credits)); }
      paintAccount(); paintCredits(); closeModals(); loadGallery();
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
    if (k === "video") return "Video";
    return it.name;
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
      : "a regal fox in a velvet coat, cinematic light, ultra detailed…";
    $("#makeBtn").textContent = k === "audio" ? "✦ Speak it" : "✦ Make a wish";
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
    $$("#typeSeg button").forEach((b) => b.onclick = () => selectCapability(b.dataset.cap));
    selectCapability(live[0].id);
    const hint = $("#soonHint");
    if (hint) hint.textContent = soon.length ? "More coming soon: " + soon.map((s) => s.name).join(" · ") : "";
  }

  // ---- wire up ----
  function wire() {
    renderCapabilities();
    $$("#aspectSeg button").forEach((b) => b.onclick = () => {
      $$("#aspectSeg button").forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true"); state.aspect = b.dataset.aspect;
    });
    $$("#chips .chip").forEach((c) => c.onclick = () => { els.prompt.value = c.textContent; els.prompt.focus(); });
    els.make.onclick = makeWish;
    els.prompt.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") makeWish(); });
    $("#againBtn").onclick = () => { els.result.classList.remove("on"); els.prompt.focus(); els.prompt.scrollIntoView({ behavior: "smooth", block: "center" }); };
    $("#accountBtn").onclick = async () => {
      if (state.signedIn) {
        try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (_) {}
        LS.removeItem("gm_user"); LS.removeItem("gm_vault"); state.signedIn = ""; state.vault = []; renderVault(); paintAccount(); hydrate();
      } else openAuth("signin");
    };
    $("#authSubmit").onclick = doAuth;
    $("#googleBtn").onclick = () => { window.location.href = "/api/auth/google/start?redirect=/app"; };
    $("#swapLink").onclick = (e) => { e.preventDefault(); openAuth("signup"); };
    $("#checkoutBtn").onclick = () => { alert("Secure Stripe checkout opens here once billing is live."); };
    $$("[data-close]").forEach((b) => b.onclick = closeModals);
    $$(".modal, .lb").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModals(); }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });
  }
  function escapeHtml(s) { return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

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
      if (j && j.authenticated && u && u.email) { LS.setItem("gm_user", u.email); state.signedIn = u.email; }
      else { LS.removeItem("gm_user"); state.signedIn = ""; }
      if (u && u.plan) state.plan = u.plan;
      paintAccount();
      loadGallery();
    } catch (_) { /* engine offline — keep local */ }
  }

  // ---- init ----
  paintCredits(); paintAccount(); renderVault(); wire(); dust(); hydrate();
})();
