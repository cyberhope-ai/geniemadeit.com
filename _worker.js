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
    return env.ASSETS.fetch(request);
  }
}
