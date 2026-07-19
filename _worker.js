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

    // SPA routing (robust): for an HTML NAVIGATION request that is not a real file, serve the FRESH
    // index.html shell DIRECTLY — never let env.ASSETS clean-URL matching resolve /app or /verify to a
    // stale page (a corrupted per-host asset manifest was doing exactly that). Real files (hashed
    // /assets, /brand, robots.txt, favicon) are served normally; the shell is no-store so it can't pin
    // an old hashed bundle to a URL (e.g. /app?auth=ok after Google sign-in).
    const path = url.pathname;
    const isFile = /\.[a-z0-9]+$/i.test(path);
    const wantsHtml = request.method === "GET" && (request.headers.get("accept") || "").includes("text/html");
    const shell = async () => {
      const idx = await env.ASSETS.fetch(new URL("/index.html", request.url).toString());
      return new Response(await idx.text(), {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store, must-revalidate",
          "cdn-cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    };
    if (wantsHtml && !isFile) return shell();
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && wantsHtml) return shell();
    return res;
  }
}
