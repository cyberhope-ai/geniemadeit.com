export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // CyberHopeAI-branded landing at geniemade.cyberhopeai.com (matches the A2P brand CyberHopeAI). Root = brand
    // page; privacy/terms served on-brand; everything else redirects to the app on geniemadeit.com.
    if (url.hostname === "geniemade.cyberhopeai.com" || url.hostname === "geniemadeit.cyberhopeai.com") {
      const path = url.pathname;
      if (path === "/" || path === "/index.html")
        return env.ASSETS.fetch(new Request(new URL("/geniemade-cyberhope.html", url), request));
      if (path === "/privacy" || path === "/terms" || path.startsWith("/assets/"))
        return env.ASSETS.fetch(request);
      return Response.redirect("https://geniemadeit.com" + path + url.search, 302);
    }
    if (url.pathname === "/api/waitlist") {
      if (request.method !== "POST")
        return new Response("Method Not Allowed", { status: 405 });
      try {
        let email = "";
        const ct = request.headers.get("content-type") || "";
        if (ct.includes("application/json")) { const b = await request.json(); email = (b.email || "").trim(); }
        else { const fd = await request.formData(); email = (fd.get("email") || "").toString().trim(); }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
          return new Response(JSON.stringify({ ok:false, error:"invalid email" }), { status:400, headers:{ "content-type":"application/json" }});
        if (env.WAITLIST) {
          const key = "wish:" + Date.now() + ":" + email.toLowerCase();
          await env.WAITLIST.put(key, JSON.stringify({ email, ts:new Date().toISOString(), ref:request.headers.get("referer")||"" }));
        }
        return new Response(JSON.stringify({ ok:true }), { headers:{ "content-type":"application/json" }});
      } catch (e) {
        return new Response(JSON.stringify({ ok:false, error:"server" }), { status:500, headers:{ "content-type":"application/json" }});
      }
    }
    // Cache generated/registry images at the geniemadeit edge (immutable, content-addressed):
    // repeat views serve from cache and skip the engine + R2 entirely.
    if (url.pathname.startsWith("/asset/") && request.method === "GET") {
      // Never cache or serve manifests — they hold the pack's secret prompts. Pass straight to the
      // engine (which returns 404). Bypassing the cache here also stops serving any already-cached copy.
      if (/\/manifest\.json$/.test(url.pathname)) {
        const t = new URL(request.url); t.protocol = "https:"; t.hostname = "geniemade-engine.cyberhopeai.workers.dev"; t.port = "";
        return fetch(new Request(t.toString(), request));
      }
      const cache = caches.default;
      const hit = await cache.match(request);
      if (hit) return hit;
      const t = new URL(request.url);
      t.protocol = "https:"; t.hostname = "geniemade-engine.cyberhopeai.workers.dev"; t.port = "";
      const resp = await fetch(new Request(t.toString(), request));
      if (resp.ok) { const c = new Response(resp.body, resp); ctx.waitUntil(cache.put(request, c.clone())); return c; }
      return resp;
    }
    // Affiliate admin — proxy the Rewardful REST API server-side (its SECRET must never reach the
    // browser). Distinct /rwadmin/ prefix so it never collides with the engine's /api/* (incl.
    // /api/admin/purge). Gated by ADMIN_TOKEN; READ-ONLY (GET) so the browser admin can never issue a
    // destructive Rewardful write — deliberate writes get a separate, audited path later.
    if (url.pathname.startsWith("/rwadmin/")) {
      const provided = request.headers.get("x-admin-token") || "";
      if (!env.ADMIN_TOKEN || provided !== env.ADMIN_TOKEN)
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" }});
      if (!env.REWARDFUL_API_SECRET)
        return new Response(JSON.stringify({ error: "rewardful_not_configured" }), { status: 503, headers: { "content-type": "application/json" }});
      if (request.method !== "GET")
        return new Response(JSON.stringify({ error: "read_only" }), { status: 405, headers: { "content-type": "application/json" }});
      const sub = url.pathname.slice("/rwadmin/".length).replace(/^\/+/, "");
      const rw = "https://api.getrewardful.com/v1/" + sub + url.search;
      const auth = "Basic " + btoa(env.REWARDFUL_API_SECRET + ":");
      try {
        const resp = await fetch(rw, { headers: { authorization: auth } });
        const body = await resp.text();
        return new Response(body, { status: resp.status, headers: { "content-type": "application/json", "cache-control": "no-store" }});
      } catch (e) {
        return new Response(JSON.stringify({ error: "upstream" }), { status: 502, headers: { "content-type": "application/json" }});
      }
    }
    // GenieAdmin customer panel — proxy the ENGINE's owner-gated admin endpoints (customer data lives in
    // the engine D1: credits, email, phone, card last4, plan). Same ADMIN_TOKEN gate; READ-ONLY. The engine
    // admin secret is sent server-side only (never the browser). Returns 503 until ENGINE_ADMIN_SECRET is
    // set — the /admin Customers tab shows a "coming online" state until then. Auth header confirmed w/ atlas2.
    if (url.pathname.startsWith("/gmadmin/")) {
      const provided = request.headers.get("x-admin-token") || "";
      if (!env.ADMIN_TOKEN || provided !== env.ADMIN_TOKEN)
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" }});
      if (!env.ENGINE_ADMIN_SECRET)
        return new Response(JSON.stringify({ error: "engine_admin_not_configured" }), { status: 503, headers: { "content-type": "application/json" }});
      const sub = url.pathname.slice("/gmadmin/".length).replace(/^\/+/, "");
      const isWrite = sub.startsWith("promo"); // promo creation is the only POST-able admin op via this proxy
      if (request.method !== "GET" && !(request.method === "POST" && isWrite))
        return new Response(JSON.stringify({ error: "read_only" }), { status: 405, headers: { "content-type": "application/json" }});
      const eng = "https://geniemade-engine.cyberhopeai.workers.dev/api/admin/" + sub + url.search;
      try {
        const init = { method: request.method, headers: { "x-admin-token": env.ENGINE_ADMIN_SECRET } };
        if (request.method === "POST") { init.body = await request.text(); init.headers["content-type"] = "application/json"; }
        const resp = await fetch(eng, init);
        const body = await resp.text();
        return new Response(body, { status: resp.status, headers: { "content-type": "application/json", "cache-control": "no-store" }});
      } catch (e) {
        return new Response(JSON.stringify({ error: "upstream" }), { status: 502, headers: { "content-type": "application/json" }});
      }
    }
    // API glue: proxy the rest of /api/* to the GenieMade engine so the Studio
    // calls same-origin and never touches a provider.
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/asset/")) {
      const target = new URL(request.url);
      target.protocol = "https:";
      target.hostname = "geniemade-engine.cyberhopeai.workers.dev";
      target.port = "";
      return fetch(new Request(target.toString(), request));
    }

    return env.ASSETS.fetch(request);
  }
}
