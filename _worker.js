export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
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
