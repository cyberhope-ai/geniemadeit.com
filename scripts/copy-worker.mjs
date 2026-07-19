// Postbuild: place the Cloudflare Pages worker + redirects into the output dir.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
const out = new URL("../dist/public/", import.meta.url);
mkdirSync(out, { recursive: true });
copyFileSync(new URL("../_worker.js", import.meta.url), new URL("_worker.js", out));
console.log("copied _worker.js → dist/public/_worker.js");
