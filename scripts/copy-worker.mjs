// Postbuild: place the Cloudflare Pages worker + redirects into the output dir.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
const out = new URL("../dist/public/", import.meta.url);
mkdirSync(out, { recursive: true });
copyFileSync(new URL("../_worker.js", import.meta.url), new URL("_worker.js", out));
console.log("copied _worker.js → dist/public/_worker.js");

// Emit the fresh SPA shell at legacy route paths (/app, /verify, …). These were real .html files in
// the old static site; CF Pages' CDN cached them (7-day TTL) and keeps serving OLD UI for those exact
// paths (e.g. /app?auth=ok after Google sign-in) — unreachable by zone purge/dev-mode. Shipping a
// current app.html/verify.html forces CF Pages to serve the up-to-date shell for those paths.
for (const name of ["app.html", "verify.html", "pricing.html", "account.html", "qseal.html", "triple-seal.html"]) {
  copyFileSync(new URL("index.html", out), new URL(name, out));
}
console.log("emitted route-shell copies: app/verify/pricing/account/qseal.html");
