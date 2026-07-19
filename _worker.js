export default {
  async fetch(request, env) {
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
    // Client-portal glue: /api/portal/* goes to the genie-master-page backend
    // (owned by nemotron) so the SSO handoff mint is same-origin — no CORS.
    if (url.pathname.startsWith("/api/portal/")) {
      const target = new URL(request.url);
      target.protocol = "https:";
      target.hostname = env.PORTAL_API_HOST || "genie.cyberhopeai.com";
      target.port = "";
      return fetch(new Request(target.toString(), request));
    }
    // API glue: proxy the rest of /api/* and generated /asset/* to the
    // GenieMade engine so the Studio calls same-origin and never touches a provider.
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/asset/")) {
      const target = new URL(request.url);
      target.protocol = "https:";
      target.hostname = "geniemade-engine.cyberhopeai.workers.dev";
      target.port = "";
      return fetch(new Request(target.toString(), request));
    }

    // SPA fallback: the front-end is a single-page React app with client routing.
    // Serve static assets when they exist; otherwise return index.html for
    // navigation routes like /app, /pricing, /verify, /account.
    let res = await env.ASSETS.fetch(request);
    if (res.status === 404 && request.method === "GET" && (request.headers.get("accept") || "").includes("text/html")) {
      const index = new URL("/index.html", request.url);
      res = await env.ASSETS.fetch(new Request(index.toString(), request));
    }
    // Never let the SPA shell (index.html) be served stale from a per-URL cache — a cached
    // index.html pins an OLD hashed bundle to that URL (e.g. /app?auth=ok after Google sign-in),
    // which shows old UI even on refresh. Force revalidation on HTML; hashed /assets/* stay immutable.
    if ((res.headers.get("content-type") || "").includes("text/html")) {
      res = new Response(res.body, res);
      res.headers.set("Cache-Control", "no-cache, must-revalidate");
      res.headers.set("CDN-Cache-Control", "no-cache");
    }
    return res;
  }
}
