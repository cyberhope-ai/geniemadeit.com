/* GenieMade commercial landing — gallery, pricing→Stripe, Google sign-in, gold dust. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);

  // ---- examples gallery ----
  // Seeded with the sample creations; a curated set from the engine drops in via /api/examples when available.
  const SEED = [
    { url: "assets/sample_1.png", prompt: "a regal fox in a velvet coat" },
    { url: "assets/sample_2.png", prompt: "a glowing perfume bottle on wet stone" },
    { url: "assets/sample_3.png", prompt: "a floating island city at golden hour" },
    { url: "assets/sample_1.png", prompt: "a cinematic portrait, volumetric light" },
    { url: "assets/sample_3.png", prompt: "a fantasy metropolis in the clouds" },
    { url: "assets/sample_2.png", prompt: "luxury product shot, macro detail" },
    { url: "assets/sample_1.png", prompt: "storybook character, painterly" },
    { url: "assets/sample_3.png", prompt: "concept art, epic scale" },
    { url: "assets/sample_2.png", prompt: "editorial still life, moody" },
  ];
  function renderGallery(items) {
    const g = $("#gallery");
    if (!g) return;
    g.innerHTML = items.map((it) => `
      <div class="shot">
        <img src="${it.url}" alt="${(it.prompt || "AI creation").replace(/"/g, "&quot;")}" loading="lazy">
        <div class="cert">◈ Certified</div>
        <div class="cap">"${(it.prompt || "").slice(0, 44)}"</div>
      </div>`).join("");
  }
  async function loadExamples() {
    renderGallery(SEED);
    try {
      const r = await fetch("/api/examples", { headers: { accept: "application/json" } });
      const ct = r.headers.get("content-type") || "";
      if (r.ok && ct.includes("application/json")) {
        const j = await r.json();
        const items = (j.examples || j.items || []).filter((x) => x && x.url);
        if (items.length >= 3) renderGallery(items);
      }
    } catch (_) { /* keep seed */ }
  }

  // ---- pricing ----
  const PLANS = [
    { id: "free", tag: "Free", price: "$0", per: "forever", cr: "3 wishes to start", feats: ["Text → Image", "Certificate on every creation", "Your private Vault"], cta: "Start free", href: "/app", hot: false },
    { id: "starter", tag: "Starter", price: "$12", per: "/ month", cr: "150 credits / mo", feats: ["Everything in Free", "Text → Video", "Full-resolution export", "Priority generation"], cta: "Choose Starter", hot: false },
    { id: "plus", tag: "Plus", price: "$39", per: "/ month", cr: "600 credits / mo", feats: ["Everything in Starter", "Faster video", "Commercial license", "Bulk download"], cta: "Choose Plus", hot: true },
    { id: "pro", tag: "Pro", price: "$89", per: "/ month", cr: "1,500 credits / mo", feats: ["Everything in Plus", "Highest priority", "Early access to new models", "API access"], cta: "Choose Pro", hot: false },
  ];
  function renderPlans() {
    const el = $("#plans");
    if (!el) return;
    el.innerHTML = PLANS.map((p) => `
      <div class="plan${p.hot ? " hot" : ""}">
        ${p.hot ? '<span class="popular">Most popular</span>' : ""}
        <div class="tag">${p.tag}</div>
        <div class="price">${p.price}<span class="per"> ${p.per}</span></div>
        <div class="cr">${p.cr}</div>
        <ul>${p.feats.map((f) => `<li>${f}</li>`).join("")}</ul>
        <button class="btn ${p.hot ? "gold" : "ghost"}" data-plan="${p.id}" ${p.href ? `data-href="${p.href}"` : ""}>${p.cta}</button>
      </div>`).join("");
    el.querySelectorAll("button[data-plan]").forEach((b) => b.onclick = () => checkout(b.dataset.plan, b.dataset.href, b));
  }
  async function checkout(plan, href, btn) {
    if (href) { window.location.href = href; return; }
    const label = btn.textContent; btn.textContent = "Loading…"; btn.disabled = true;
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ plan }),
      });
      const j = await r.json();
      if (j && (j.url || j.checkout_url)) { window.location.href = j.url || j.checkout_url; return; }
      throw new Error("no url");
    } catch (_) {
      // engine/billing not reachable — send them into the Studio, upgrade prompt lives there too
      window.location.href = "/app";
    } finally { btn.textContent = label; btn.disabled = false; }
  }

  // ---- auth (real email accounts today; Google when the OAuth client is set) ----
  let authMode = "signup";
  let currentUser = null;
  function openAuth(mode) {
    authMode = mode;
    $("#authTitle").textContent = mode === "signup" ? "Create your account" : "Welcome back";
    $("#authSub").textContent = mode === "signup" ? "Sign up and your three free wishes are waiting." : "Sign in to your GenieMade account.";
    $("#authSubmit").textContent = mode === "signup" ? "Create account" : "Sign in";
    $("#authSwap").innerHTML = mode === "signup"
      ? 'Already have an account? <a href="#" id="swapLink">Sign in</a>'
      : 'New here? <a href="#" id="swapLink">Create an account</a>';
    $("#swapLink").onclick = (e) => { e.preventDefault(); openAuth(mode === "signup" ? "login" : "signup"); };
    $("#authErr").textContent = "";
    $("#authModal").classList.add("on");
  }
  const closeAuth = () => $("#authModal").classList.remove("on");
  async function doAuth() {
    const email = $("#authEmail").value.trim();
    const password = $("#authPass").value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("#authEmail").focus(); return; }
    if (authMode === "signup" && password.length < 8) { $("#authErr").textContent = "Password must be at least 8 characters."; return; }
    const btn = $("#authSubmit"); const label = btn.textContent; btn.textContent = "…"; btn.disabled = true;
    try {
      const ep = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const r = await fetch(ep, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ email, password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) { $("#authErr").textContent = j.error || "That didn't work — check your details."; return; }
      currentUser = j.user || { email };
      closeAuth();
      window.location.href = "/app"; // straight into the Studio to start creating
    } catch (_) { $("#authErr").textContent = "Something went wrong. Try again."; }
    finally { btn.textContent = label; btn.disabled = false; }
  }
  function paintAccount() {
    const s = $("#signinLink"); if (!s) return;
    if (currentUser) {
      s.textContent = "◈ " + (currentUser.email || "Account").split("@")[0];
      s.classList.add("acct"); s.title = "Sign out";
      s.onclick = async () => { try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (_) {} currentUser = null; paintAccount(); };
    } else {
      s.textContent = "Sign in"; s.classList.remove("acct"); s.title = "";
      s.onclick = () => openAuth("login");
    }
  }
  function wireSignin() {
    paintAccount();
    $("#authSubmit").onclick = doAuth;
    $("#googleBtn").onclick = () => { window.location.href = "/api/auth/google/start?redirect=/app"; };
    document.querySelectorAll("[data-close]").forEach((b) => b.onclick = closeAuth);
    $("#authModal").addEventListener("click", (e) => { if (e.target.id === "authModal") closeAuth(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAuth(); });
    $("#authEmail").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#authPass").focus(); });
    $("#authPass").addEventListener("keydown", (e) => { if (e.key === "Enter") doAuth(); });
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json()).then((j) => { if (j && j.authenticated && j.user) { currentUser = j.user; paintAccount(); } })
      .catch(() => {});
  }

  // ---- hero image rotate ----
  function heroRotate() {
    const m = $("#heroMain"); if (!m) return;
    const imgs = ["assets/sample_1.png", "assets/sample_2.png", "assets/sample_3.png"]; let i = 0;
    setInterval(() => { i = (i + 1) % imgs.length; m.style.opacity = "0"; setTimeout(() => { m.src = imgs[i]; m.style.opacity = "1"; }, 300); }, 4200);
    m.style.transition = "opacity .3s";
  }

  // ---- gold dust ----
  function dust() {
    const c = $("#dust"); if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const x = c.getContext("2d"); let W, H, P = [];
    const seed = () => { W = c.width = innerWidth; H = c.height = innerHeight; const n = Math.min(70, (W * H / 20000) | 0); P = [];
      for (let i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + .4, s: Math.random() * .4 + .1, d: Math.random() * 6.28, h: Math.random() < .22 ? "#66e3e8" : "#f5c451" }); };
    seed(); addEventListener("resize", seed);
    (function loop() { x.clearRect(0, 0, W, H); for (const p of P) { p.y -= p.s; p.x += Math.sin(p.d += .01) * .22; if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
      x.globalAlpha = .5 + Math.sin(p.d * 2) * .4; x.fillStyle = p.h; x.shadowBlur = 8; x.shadowColor = p.h; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); }
      x.globalAlpha = 1; x.shadowBlur = 0; requestAnimationFrame(loop); })();
  }

  loadExamples(); renderPlans(); wireSignin(); heroRotate(); dust();
})();
