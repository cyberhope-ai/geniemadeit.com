/* GenieMade commercial landing — gallery, pricing→Stripe, Google sign-in, gold dust. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);

  // ---- examples gallery ----
  // Seeded with the sample creations; a curated set from the engine drops in via /api/examples when available.
  const SEED = [
    { url: "/asset/packs/magazine-covers-3/icon-of-year.jpg", prompt: "📰 Magazine Covers Vol. 3 — Icon of the Year" },
    { url: "/asset/packs/movie-moments-2/singing-rain.jpg", prompt: "🎬 Movie Scenes Vol. 2 — Singin' in the Rain" },
    { url: "/asset/packs/memes-2/this-is-fine.jpg", prompt: "😂 Memes Vol. 2 — This Is Fine" },
    { url: "/asset/packs/exotic-cars/supercar.jpg", prompt: "🚗 Exotic Dream Cars — The Supercar" },
    { url: "/asset/packs/space-explorer/orbit.jpg", prompt: "🚀 Space Explorer — In Orbit" },
    { url: "/asset/packs/music-icon/rockstar.jpg", prompt: "🎸 Music Icon — Rock Star" },
    { url: "/asset/packs/album-covers/crosswalk.jpg", prompt: "💿 Legendary Album Covers — The Crosswalk" },
    { url: "/asset/packs/ancient-legends/gladiator.jpg", prompt: "🏛️ Ancient Legends — Gladiator" },
    { url: "/asset/packs/monster-mash/frankenstein.jpg", prompt: "🧟 Monster Mash — The Monster" },
    { url: "/asset/packs/wedding-romance/wedding-glam.jpg", prompt: "💍 Wedding & Romance — The Big Day" },
    { url: "/asset/packs/underwater-world/scuba.jpg", prompt: "🐠 Underwater World — Scuba Dive" },
    { url: "/asset/packs/you-as-art/oil-painting.jpg", prompt: "🎨 You As Art — Oil Painting" },
    { url: "/asset/packs/gangster-era/boss.jpg", prompt: "🎩 Gangster Era — The Boss" },
    { url: "/asset/packs/magazine-covers-2/fashion.jpg", prompt: "📰 Magazine Covers Vol. 2 — Fashion Cover" },
    { url: "/asset/packs/memes-4/roll-safe.jpg", prompt: "🔥 Memes Vol. 4 — Roll Safe" },
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

  // ---- pricing: subscriptions (monthly/annual, recommended) + one-time credit packs ----
  const SUB_TIERS = [
    { id: "bronze", tag: "Bronze", m: 4.95, y: 49.95, feats: ["Unlimited e-cards &amp; AI images", "Every themed pack — holidays, occasions, invitations", "Save friends &amp; family + birthday reminders", "A certificate on every creation", "Your private Vault, forever"], hot: true },
  ];
  const ONE_TIME = [
    { id: "starter", credits: "150", usd: 15 },
    { id: "plus", credits: "600", usd: 45 },
    { id: "pro", credits: "1,500", usd: 99 },
  ];
  let billing = "month"; // subscriptions are the default/recommended path
  function renderPlans() {
    const el = $("#pricingwrap");
    if (!el) return;
    const annual = billing === "year";
    const tbtn = (on) => `padding:8px 20px;border-radius:999px;border:1px solid var(--line);background:${on ? "var(--gold)" : "transparent"};color:${on ? "#1a1200" : "var(--mut)"};font-weight:700;cursor:pointer`;
    const freeCard = `
      <div class="plan">
        <div class="tag">Free</div>
        <div class="price">$0</div>
        <div class="cr">3 free wishes to start</div>
        <ul><li>Try any pack or prompt</li><li>Certificate on every creation</li><li>No card needed</li></ul>
        <a class="btn ghost" href="/app" style="text-decoration:none;text-align:center;display:block">Start free</a>
      </div>`;
    const studioCard = `
      <div class="plan">
        <div class="tag">Studio You</div>
        <div class="price">$19<span class="per"> to start</span></div>
        <div class="cr">Your own trained AI model · one-time</div>
        <ul><li>We train a private model of you</li><li>Studio-grade, unmistakably-<em>you</em> portraits</li><li>Taster $19 · Session $39</li></ul>
        <a class="btn ghost" href="/studio-you" style="text-decoration:none;text-align:center;display:block">Explore Studio You →</a>
      </div>`;
    const bronze = SUB_TIERS.map((p) => `
      <div class="plan${p.hot ? " hot" : ""}">
        ${p.hot ? '<span class="popular">Most popular</span>' : ""}
        <div class="tag">${p.tag}</div>
        <div class="price">$${annual ? p.y : p.m}<span class="per"> / ${annual ? "year" : "month"}</span></div>
        <div class="cr">${annual ? "~2 months free · cancel anytime" : "billed monthly · cancel anytime"}</div>
        <ul>${p.feats.map((f) => `<li>${f}</li>`).join("")}</ul>
        <button class="btn ${p.hot ? "gold" : "ghost"}" data-plan="${p.id}">Choose Bronze</button>
      </div>`).join("");
    const tiers = freeCard + bronze + studioCard;
    const packs = ONE_TIME.map((p) => `
      <span style="display:inline-flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:6px">
        <b>${p.credits} credits</b><span style="color:var(--faint)">$${p.usd}</span>
        <button class="btn ghost" style="padding:6px 12px;font-size:.85rem" data-pack="${p.id}">Buy once</button>
      </span>`).join("");
    el.innerHTML = `
      <div style="display:flex;justify-content:center;gap:8px;margin:0 0 26px">
        <button data-bill="month" style="${tbtn(!annual)}">Monthly</button>
        <button data-bill="year" style="${tbtn(annual)}">Annual · save 2 months</button>
      </div>
      <div class="plans">${tiers}</div>
      <div class="center" style="margin-top:34px">
        <div style="color:var(--mut);font-weight:600;margin-bottom:10px">Not ready to subscribe? Buy a one-time credit pack — no membership needed.</div>
        <div>${packs}</div>
      </div>`;
    el.querySelectorAll("button[data-bill]").forEach((b) => b.onclick = () => { billing = b.dataset.bill; renderPlans(); });
    el.querySelectorAll("button[data-plan]").forEach((b) => b.onclick = () => checkout({ mode: "subscription", plan: b.dataset.plan, interval: billing, btn: b }));
    el.querySelectorAll("button[data-pack]").forEach((b) => b.onclick = () => checkout({ pack: b.dataset.pack, btn: b }));
  }
  async function checkout(opts) {
    if (!currentUser) { pendingCheckout = opts; openAuth("signup"); return; } // must register before buying — resume after login
    const btn = opts.btn, label = btn ? btn.textContent : "";
    if (btn) { btn.textContent = "Loading…"; btn.disabled = true; }
    try {
      const referral = (window.Rewardful && window.Rewardful.referral) || undefined;
      const payload = opts.mode === "subscription"
        ? { mode: "subscription", plan: opts.plan, interval: opts.interval, client_reference_id: referral }
        : { pack: opts.pack, client_reference_id: referral };
      const r = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (r.status === 401) { pendingCheckout = opts; openAuth("signup"); return; }
      const j = await r.json();
      if (j && (j.url || j.checkout_url)) { window.location.href = j.url || j.checkout_url; return; }
      throw new Error("no url");
    } catch (_) {
      window.location.href = "/app";
    } finally { if (btn) { btn.textContent = label; btn.disabled = false; } }
  }

  // ---- auth (real email accounts today; Google when the OAuth client is set) ----
  let authMode = "signup";
  let currentUser = null;
  let pendingCheckout = null; // a buy/subscribe click interrupted by the auth modal — resumed after login
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
    $("#authTitle").textContent = mode === "signup" ? "Create your account" : "Welcome back";
    $("#authSub").textContent = mode === "signup" ? "Sign up and your three free wishes are waiting." : "Sign in to your GenieMade account.";
    $("#authSubmit").textContent = mode === "signup" ? "Create account" : "Sign in";
    $("#authSwap").innerHTML = mode === "signup"
      ? 'Already have an account? <a href="#" id="swapLink">Sign in</a>'
      : 'New here? <a href="#" id="swapLink">Create an account</a>';
    $("#swapLink").onclick = (e) => { e.preventDefault(); openAuth(mode === "signup" ? "login" : "signup"); };
    $("#authErr").textContent = "";
    renderTurnstile();
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
      const payload = { email, password };
      if (authMode === "signup") {
        const t = tsToken();
        if (!t) { $("#authErr").textContent = "One moment — finishing the human check. Please try again."; renderTurnstile(); return; }
        payload.turnstile = t;
      }
      const r = await fetch(ep, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) { $("#authErr").textContent = AUTH_MSG[j.error] || j.error || "That didn't work — check your details."; if (authMode === "signup") renderTurnstile(); return; }
      currentUser = j.user || { email };
      closeAuth();
      if (pendingCheckout) { const p = pendingCheckout; pendingCheckout = null; checkout(p); return; } // resume the interrupted purchase → Stripe
      window.location.href = "/app"; // otherwise straight into the Studio to start creating
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
    // gate "Start creating" CTAs: unauthenticated -> signup first (mandatory registration)
    document.querySelectorAll('a[href="/app"]').forEach((a) => a.addEventListener("click", (e) => {
      if (!currentUser) { e.preventDefault(); openAuth("signup"); }
    }));
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
