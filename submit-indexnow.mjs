#!/usr/bin/env node
/* Push every sitemap URL to the IndexNow endpoint (Bing, Yandex, Seznam, Naver).
 *
 * Google does not participate — it is sitemap-and-crawl only, which is already wired. This exists
 * because the other engines will index within hours rather than weeks, and Bing's index is what
 * ChatGPT search reads. For a site whose 65 landing pages were submitted for the first time today,
 * that is the difference between visible this week and visible next month.
 *
 * The key file must remain published: the API re-fetches it on every submission and rejects the
 * whole batch if it 404s. */
import { readFileSync, readdirSync } from "node:fs";

const key = readdirSync(".").find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.replace(/\.txt$/, "");
if (!key) { console.error("no IndexNow key file at the site root"); process.exit(1); }

const urls = [...readFileSync("sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) { console.error("sitemap.xml has no URLs"); process.exit(1); }

const body = {
  host: "geniemadeit.com",
  key,
  keyLocation: `https://geniemadeit.com/${key}.txt`,
  urlList: urls,
};
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
// 200 accepted · 202 accepted, key validation pending · 4xx see the IndexNow docs
console.log(`submitted ${urls.length} URLs -> HTTP ${r.status} ${r.statusText}`);
if (r.status >= 400) console.error(await r.text().catch(() => ""));
