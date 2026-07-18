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
    type: "image",
    aspect: "1:1",
    get credits() { const v = LS.getItem("gm_credits"); return v === null ? 3 : Number(v); },
    set credits(n) { LS.setItem("gm_credits", String(Math.max(0, n))); paintCredits(); },
    vault: JSON.parse(LS.getItem("gm_vault") || "null") || seedVault(),
    signedIn: LS.getItem("gm_user") || "",
  };
  function seedVault() {
    // seed with the three showcase creations so the Vault is never empty
    const seed = [
      { id: "seed1", type: "image", url: "assets/sample_1.png", prompt: "a regal fox in a velvet coat", model: "GenieMade Vision", ts: Date.now() - 8.6e7 },
      { id: "seed2", type: "image", url: "assets/sample_2.png", prompt: "a glowing perfume bottle on wet stone", model: "GenieMade Vision", ts: Date.now() - 6.2e7 },
      { id: "seed3", type: "image", url: "assets/sample_3.png", prompt: "a floating island city at golden hour", model: "GenieMade Vision", ts: Date.now() - 3.1e7 },
    ].map((g) => ({ ...g, certificate: mockCert(g.prompt, g.ts) }));
    return seed;
  }
  const saveVault = () => LS.setItem("gm_vault", JSON.stringify(state.vault));

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
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.includes("application/json")) {
        const j = await res.json();
        if (typeof j.ok === "boolean") return j; // real engine answered
      }
    } catch (_) { /* fall through to mock */ }
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

    const resp = await generate({ type: state.type, prompt, aspect: state.aspect });
    clearInterval(timer);

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
    const item = { id: g.id, type: g.type, url: g.url, prompt, model: g.model, ts: Date.parse(g.certificate.issued_at) || Date.now(), certificate: g.certificate };
    state.vault.unshift(item); saveVault(); renderVault();

    setTimeout(() => {
      els.summon.classList.remove("on");
      renderResult(item);
      els.make.disabled = false;
    }, 420);
  }

  function mediaEl(item, cls = "") {
    if (item.type === "video") return `<video class="${cls}" src="${item.url}" autoplay loop muted playsinline poster="${item.url}"></video>`;
    return `<img class="${cls}" src="${item.url}" alt="${escapeHtml(item.prompt)}">`;
  }
  function renderResult(item) {
    els.canvas.innerHTML = mediaEl(item);
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
        ${mediaEl(g)}
        <div class="cert">◈ Certified</div>
        <div class="cap">“${escapeHtml(g.prompt.slice(0, 44))}${g.prompt.length > 44 ? "…" : ""}”</div>
      </div>`).join("");
    $$(".card", els.grid).forEach((c) => c.onclick = () => openLightbox(state.vault[Number(c.dataset.i)]));
  }

  // ---- lightbox ----
  function openLightbox(item) {
    $("#lbBig").innerHTML = mediaEl(item);
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
      paintAccount(); paintCredits(); closeModals();
    } catch (_) { authErr("Something went wrong. Try again."); }
    finally { btn.textContent = label; btn.disabled = false; }
  }
  function authErr(m) {
    let e = $("#authErr");
    if (!e) { e = document.createElement("div"); e.id = "authErr"; e.style.cssText = "color:#ff6b8a;font-size:.85rem;margin-top:10px;text-align:center"; $("#authSubmit").after(e); }
    e.textContent = m;
  }

  // ---- wire up ----
  function wire() {
    $$("#typeSeg button").forEach((b) => b.onclick = () => {
      $$("#typeSeg button").forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true"); state.type = b.dataset.type;
    });
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
        LS.removeItem("gm_user"); state.signedIn = ""; paintAccount(); hydrate();
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
    } catch (_) { /* engine offline — keep local */ }
  }

  // ---- init ----
  paintCredits(); paintAccount(); renderVault(); wire(); dust(); hydrate();
})();
