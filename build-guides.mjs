#!/usr/bin/env node
/* build-guides.mjs — generates /guides/*.html from the content below.
 *
 * Hand-maintaining six near-identical <head> blocks is how the header, Rewardful and Clarity
 * all drifted (46 of 92 pages, in Clarity's case). So the shell is generated and only the prose
 * is authored. `node build-guides.mjs --check` fails if any file on disk differs, which is what
 * CI runs.
 *
 * ⚠ THE ONE CLAIM THIS SITE MUST NOT MAKE
 * /import issues a *first-registration and custody* record: "owned & first registered on this
 * date", signed Ed25519, tamper-evident. It does NOT establish that the registrant authored the
 * work — nothing can, for a file made in another tool. Every guide here says "first registered
 * by you, on this date" and never "proves you made it". Overclaiming a credential is precisely
 * what got the sister Google Ads account suspended for misrepresentation on 2026-08-29.
 *
 * ⚠ TRADEMARKS. Competitor names appear only descriptively (nominative use), never in a way that
 * implies partnership or endorsement. "Starring You" is a registered mark of JibJab and must not
 * appear anywhere in this file.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";

const CHECK = process.argv.includes("--check");
const SITE = "https://geniemadeit.com";
const OUT = "guides";

const CSS = `
:root{--night:#130a26;--night2:#1c1140;--panel:#231553;--panel2:#2b1b63;--line:#3a2a6b;
--ink:#f7f1ff;--mut:#c6b6ea;--faint:#8f7fbb;--gold:#f5c451;--gold2:#ffe390;--goldd:#c88f2c;--viol:#a06bff;
--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 640px at 80% -6%,rgba(245,196,81,.13),transparent 60%),radial-gradient(900px 620px at 6% 40%,rgba(160,107,255,.08),transparent 55%),linear-gradient(178deg,var(--night2),var(--night));color:var(--ink);font:16px/1.7 var(--sans);-webkit-font-smoothing:antialiased}
.wrap{max-width:760px;margin:0 auto;padding:44px 22px 88px}
.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:0 0 12px}
h1{font-family:var(--serif);font-size:clamp(28px,5vw,44px);line-height:1.15;margin:0 0 14px;text-wrap:balance}
.dek{font-size:19px;line-height:1.6;color:var(--mut);margin:0 0 28px}
h2{font-family:var(--serif);font-size:clamp(21px,3.2vw,27px);line-height:1.25;margin:38px 0 12px;color:var(--gold2);text-wrap:balance}
h3{font-size:17px;margin:26px 0 8px;color:var(--ink)}
p{margin:0 0 15px}
ul,ol{margin:0 0 16px;padding-left:22px}li{margin-bottom:8px}
a{color:var(--gold)}a:hover{color:var(--gold2)}
strong{color:#fff}
hr{border:0;border-top:1px solid var(--line);margin:34px 0}
blockquote{margin:20px 0;padding:14px 18px;background:var(--panel);border-left:3px solid var(--gold);border-radius:0 8px 8px 0;color:var(--mut)}
blockquote p:last-child{margin:0}
.note{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px 18px;margin:22px 0;font-size:15px;color:var(--mut)}
.note strong{color:var(--gold2)}
.cta{display:block;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin:30px 0;text-decoration:none;color:var(--ink)}
.cta:hover{border-color:var(--gold)}
.cta b{display:block;font-family:var(--serif);font-size:20px;color:var(--gold2);margin-bottom:5px}
.cta span{color:var(--mut);font-size:15px}
table{width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;display:block;overflow-x:auto}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--faint);font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:600}
.meta{color:var(--faint);font-size:13px;margin:0 0 30px}
.disc{color:var(--faint);font-size:13px;line-height:1.6;margin-top:40px;padding-top:18px;border-top:1px solid var(--line)}
.cards{display:grid;gap:16px;margin:26px 0}
.card{display:block;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px 22px;text-decoration:none;color:var(--ink)}
.card:hover{border-color:var(--gold)}
.card b{display:block;font-family:var(--serif);font-size:20px;line-height:1.25;color:var(--gold2);margin-bottom:6px}
.card span{color:var(--mut);font-size:15px}
`.trim();

/* ------------------------------------------------------------------ articles */
const GUIDES = [
{
 slug: "prove-your-design-is-original",
 title: "Etsy Asked You to Prove Your Design Is Original — What to Send",
 desc: "Etsy's Creativity Standards let Etsy ask you to prove a listing is your own design. Here is what that request actually looks like and how to answer it with evidence.",
 eyebrow: "For sellers",
 h1: "Etsy asked you to prove your design is original. Here's what to send.",
 dek: "A deactivated listing is rarely about quality. It is about evidence — and most sellers have none until the moment they need it.",
 body: `
<p>If you sell print-on-demand or digital designs, you have probably seen the message, or know
someone who has: a listing is deactivated, or you are asked to demonstrate that the design is your
own original work. Etsy's Creativity Standards require listings to be a seller's own design, and
Etsy can ask for proof of authorship when a listing is challenged.</p>

<p>The hard part is that "proof" is not defined for you. Sellers scramble to assemble something
convincing after the fact, which is the worst possible time to start.</p>

<h2>What actually counts as evidence</h2>
<p>Anything that shows the work existed, in your hands, before the challenge — and that it has not
been altered since. In practice, reviewers respond to a few things:</p>
<ul>
<li><strong>Dated working files.</strong> Layered originals, drafts, or a version history that
predates the listing. Screenshots of a folder are weak; the files themselves are better.</li>
<li><strong>A record that cannot be back-dated.</strong> This is the one most sellers lack. A file
timestamp on your own computer can be changed in seconds, and everyone reviewing your case knows
that.</li>
<li><strong>Consistency.</strong> A body of work in a recognisable style is more persuasive than a
single contested image.</li>
</ul>

<h2>Why AI detection makes this worse</h2>
<p>AI-detection tools produce false positives, and they do it confidently. Sellers who never used a
generative tool have had listings pulled. Because the detector cannot be argued with, the burden
lands on you to produce something better than a denial.</p>
<p>Which means the useful question is not "how do I prove I didn't use AI" — it is
<em>"what independent record can I point to?"</em></p>

<h2>Building the record before you need it</h2>
<p>GenieMade registers a creation into a public registry and issues a certificate: an Ed25519-signed
record that this exact file — identified by its SHA-256 content hash — was
<strong>first registered by your account, on that date</strong>. Change one pixel and the hash
changes, so the record is tamper-evident. Anyone can check it without an account.</p>

<div class="note"><strong>Be precise about what this proves.</strong> A registration record shows
<em>first registration and custody</em>: this file, this account, this date, unaltered since.
It does not, and cannot, prove who originally drew something — no system can do that for a file
made somewhere else. What it does is put a fixed, independent date on your version, which is
usually the fact in dispute.</div>

<h2>What to actually send</h2>
<ol>
<li>The verification link for the registered file, so the reviewer can confirm it themselves.</li>
<li>Your dated working files or drafts, if you have them.</li>
<li>A short, plain explanation of your process — what you made, when, and how.</li>
</ol>
<p>Short and checkable beats long and assertive. A link a reviewer can click carries more weight than
several paragraphs asking them to take your word.</p>

<h2>Do it for the listings that matter</h2>
<p>You do not need to register everything. Register your best sellers, anything you have seen copied,
and any design you would genuinely fight for. That is a handful of files, and it takes a minute each.</p>

<a class="cta" href="/import"><b>Register a design →</b><span>Upload the file. Get a signed registry
record and a link anyone can verify.</span></a>

<p>The registry is public and free to check. If someone challenges your work later, you send a link
instead of an argument.</p>`,
},
{
 slug: "register-art-from-other-tools",
 title: "Made It in Midjourney or Canva? How to Register It as Yours",
 desc: "Images from other AI tools usually arrive with no durable record of who had them first. Here is how to add one in about a minute, and what that record does and does not claim.",
 eyebrow: "Guide",
 h1: "Made it in Midjourney or Canva? Here's how to register it as yours.",
 dek: "Most generators hand you a file and nothing else. No record, no date, nothing to point at when someone asks.",
 body: `
<p>You made something in Midjourney, Canva, Leonardo, Ideogram or Runway. You have a file. What you
almost certainly do not have is any durable record that you had it first.</p>
<p>That is fine right up until it isn't: someone reposts it, a marketplace challenges the listing, a
client asks where it came from, or a platform's detector flags it. At that point a file on your
drive proves very little, because file dates are trivially editable.</p>

<h2>What the tools do and don't give you</h2>
<table>
<tr><th>Tool</th><th>What comes with your file</th></tr>
<tr><td>Midjourney</td><td>The image. Your account history is inside their platform, not portable.</td></tr>
<tr><td>Canva</td><td>The export. Design history stays in your Canva account.</td></tr>
<tr><td>Leonardo / Ideogram / Krea</td><td>The image, plus in-platform generation history.</td></tr>
<tr><td>Adobe Firefly</td><td>Content Credentials — genuinely useful, but stripped by most uploads and by any screenshot.</td></tr>
</table>
<p>Content Credentials, the C2PA standard, is the closest thing to an industry answer. Its weakness
is well known: the metadata rides <em>inside</em> the file and most social platforms strip metadata
on upload. Screenshot the image and it is gone entirely.</p>

<h2>A record that survives the internet</h2>
<p>The fix is to anchor the record to the <em>content</em> rather than the file's metadata. GenieMade
takes the SHA-256 hash of the exact bytes and registers that in a public registry with an
Ed25519-signed certificate. Strip the metadata, re-upload, download it again — as long as the pixels
are unchanged, the hash still matches and the record still resolves.</p>

<div class="note"><strong>What the record claims.</strong> That this exact file was
<strong>first registered by your account on this date</strong>, and has not been altered since. It
is a custody and timestamp record. It is not a determination that you authored the work — for a file
made in another tool, no service can establish that, and you should be sceptical of any that says
otherwise.</div>

<h2>How to do it</h2>
<ol>
<li>Export at full resolution. Register the version you will actually use — a re-compressed copy has
a different hash and needs its own record.</li>
<li>Go to <a href="/import">Import &amp; Register</a> and upload the file.</li>
<li>You get a certificate ID and a public verification link. Keep the link with the project.</li>
</ol>
<p>Register once, at the resolution that matters. If you later publish a cropped or resized version,
register that too, or point people at the original.</p>

<h2>Check what you already have</h2>
<p>Before registering anything, it is worth seeing what provenance your existing files carry. Drop
one on the verify page — it hashes the file locally and checks the registry.</p>

<a class="cta" href="/verify"><b>Check a file →</b><span>Drop in any image. See whether it has a
registry record.</span></a>

<p>For most files from most tools, the answer will be that there is nothing on record. That is the
gap worth closing on the work you care about.</p>

<p class="disc">Midjourney, Canva, Leonardo, Ideogram, Krea, Runway and Adobe Firefly are trademarks
of their respective owners, referred to here only to describe their products. GenieMade is not
affiliated with, endorsed by, or partnered with any of them.</p>`,
},
{
 slug: "check-if-an-image-has-proof-of-origin",
 title: "How to Check Whether an AI Image Has Any Proof of Origin",
 desc: "There is no reliable detector that tells you whether an image is AI-generated. There is something better: checking what verifiable provenance a file actually carries.",
 eyebrow: "How-to",
 h1: "How to check whether an image has any proof of origin",
 dek: "\"Is this AI?\" is the wrong question, because nothing answers it reliably. \"What can this file prove about itself?\" is answerable.",
 body: `
<p>AI-detection tools are guesses dressed as verdicts. They return a confidence score derived from
statistical tells, they are wrong in both directions, and they get less reliable every time models
improve. People have had work removed on the strength of a detector that was simply mistaken.</p>
<p>So set that question aside. A better one has an actual answer: <strong>what verifiable record does
this file carry?</strong></p>

<h2>Three things a file might carry</h2>
<h3>1. Content Credentials (C2PA)</h3>
<p>An industry standard backed by Adobe and others that embeds signed provenance data in the file.
When present it is genuinely informative. The catch is fragility — most platforms strip metadata on
upload, and screenshots discard it entirely. Absence tells you nothing.</p>
<h3>2. EXIF and embedded metadata</h3>
<p>Camera data, software tags, timestamps. Easily edited, easily stripped, and absent from most
things you encounter online. Treat as a weak hint, never as proof.</p>
<h3>3. A content-addressed registry record</h3>
<p>Instead of storing the record inside the file, store it against the file's SHA-256 hash. Strip
every byte of metadata and the hash of the image data is unchanged, so the record still resolves.
This is what GenieMade's registry does, and it is why it survives being uploaded, downloaded and
re-shared.</p>

<h2>Checking a file</h2>
<p>Drop any image on the verify page. It fingerprints the file and looks the hash up in the public
registry. Two possible outcomes:</p>
<ul>
<li><strong>A record exists</strong> — you see who registered it, when, and a signed certificate you
can inspect. The date is the useful part.</li>
<li><strong>No record</strong> — the file has never been registered. This is the normal result for
almost everything on the internet today, and it is not an accusation. It only means there is nothing
to check against.</li>
</ul>

<a class="cta" href="/verify"><b>Verify a file →</b><span>Free, no account. Works on any image.</span></a>

<h2>How to read the result honestly</h2>
<p>A registry record establishes that specific bytes were registered by a specific account on a
specific date, and have not changed since. That is a strong, narrow fact. It does not certify
artistic authorship, and no absence of a record implies wrongdoing.</p>
<p>Narrow and true is the point. Most disputes are about <em>when</em> and <em>who had it first</em>,
and that is exactly what a timestamped record settles.</p>

<div class="note"><strong>If you are the one being challenged</strong>, the same tool works in your
favour — but only if you registered the work <em>before</em> the dispute. A record created today
proves today. See <a href="/guides/prove-your-design-is-original">what to send when a marketplace
asks for proof</a>.</div>`,
},
{
 slug: "geniemade-vs-jibjab",
 title: "GenieMade vs JibJab — Funny Ecards vs Certified Creations",
 desc: "An honest comparison. JibJab makes funny ecards very well. GenieMade makes personalized images and video that come with a verifiable record of origin. They solve different problems.",
 eyebrow: "Comparison",
 h1: "GenieMade vs JibJab",
 dek: "Two products people confuse because both put your face in something. They are built for different jobs, and the honest comparison favours each in different places.",
 body: `
<p>If you are choosing between them, the short version: <strong>JibJab is a comedy ecard company and
is good at it. GenieMade is an AI creation tool where everything you make comes with a verifiable
record of origin.</strong> The overlap is narrower than it looks.</p>

<h2>Side by side</h2>
<table>
<tr><th></th><th>JibJab</th><th>GenieMade</th></tr>
<tr><td>Core job</td><td>Send a funny ecard</td><td>Create images and video, with a record of origin</td></tr>
<tr><td>Output</td><td>Template-based comedy videos and cards</td><td>Generated images and video from your description</td></tr>
<tr><td>Style range</td><td>Humour, by design</td><td>Any style you can describe</td></tr>
<tr><td>Proof of origin</td><td>Not offered</td><td>Signed registry record on every creation</td></tr>
<tr><td>Commercial use</td><td>Personal sending</td><td>Yours, with a record you can point to</td></tr>
<tr><td>Best for</td><td>Making someone laugh on their birthday</td><td>Making something you intend to keep, publish or sell</td></tr>
</table>

<h2>Where JibJab is the better choice</h2>
<p>Genuinely: if you want to make a relative laugh, their comedy templates are polished, the format
is proven, and two decades of production has made them very good at the joke. Nobody needs a
cryptographic certificate on a birthday gag.</p>

<h2>Where GenieMade is</h2>
<p>Three situations:</p>
<ul>
<li><strong>You are not looking for a joke.</strong> Templates constrain you to what the template
does. Describing what you want removes that ceiling.</li>
<li><strong>You intend to sell or publish it.</strong> Then origin matters — marketplaces challenge
listings and platforms label AI content. Every GenieMade creation carries a record from the moment
it exists.</li>
<li><strong>You want it to still be yours later.</strong> Reposted work is hard to reclaim without a
dated record predating the theft.</li>
</ul>

<h2>The actual difference</h2>
<p>Every AI tool competes on <em>generate</em> — quality, speed, breadth. GenieMade is built around a
second verb: <strong>prove</strong>. Each creation is hashed, signed and entered into a public
registry, so anyone can confirm what it is and when it was registered, without an account and without
trusting us.</p>
<p>If that has no bearing on what you are making, it is not a reason to switch. If you sell your
work, it is the whole reason.</p>

<a class="cta" href="/verify"><b>See how verification works →</b><span>Check any file against the
public registry. Free, no account.</span></a>

<p class="disc">JibJab is a registered trademark of JibJab Media Inc. This comparison is written by
GenieMade and refers to JibJab only to describe and compare publicly available products. GenieMade
is not affiliated with, endorsed by, or sponsored by JibJab. Product details were accurate as of
publication; check their site for current features and pricing.</p>`,
},
{
 slug: "eu-ai-act-what-creators-must-do",
 title: "The EU AI Act's AI Disclosure Rules Are Live — What Creators Do Now",
 desc: "The EU AI Act's transparency obligations for AI-generated content applied from 2 August 2026. A plain-language summary of what it means if you publish AI work.",
 eyebrow: "Compliance",
 h1: "The EU AI Act disclosure rules are live. What creators actually have to do.",
 dek: "The transparency obligations applied from 2 August 2026. Most of the coverage was written for enterprises. Here is the part that touches individuals.",
 body: `
<p>The EU AI Act's transparency provisions for AI-generated content took effect on
<strong>2 August 2026</strong>. Coverage has focused on model providers and large deployers, which
has left a lot of independent creators unsure whether any of it applies to them.</p>

<div class="note"><strong>This is a plain-language summary, not legal advice.</strong> Obligations
depend on what you publish, where, and in what role. If you are making decisions with real money or
real risk attached, talk to a lawyer who works in this area.</div>

<h2>The idea in one sentence</h2>
<p>Synthetic content should be <strong>marked as synthetic in a machine-readable way</strong>, so
platforms and downstream systems can tell what they are handling — not only human viewers.</p>
<p>"Machine-readable" is the operative phrase. A caption saying "made with AI" helps a reader, but is
not a machine-readable marking.</p>

<h2>Who it reaches</h2>
<ul>
<li><strong>Providers of generative systems</strong> carry the marking obligation. If you use
someone else's tool, this is largely their problem.</li>
<li><strong>Deployers</strong> — people who publish the output — have narrower duties, chiefly around
disclosing deepfakes and certain synthetic material.</li>
<li><strong>Territorial reach is broad.</strong> It is not limited to businesses established in the
EU; what matters is whether output reaches people there. For anything published on the open
internet, assume it does.</li>
</ul>

<h2>Why this is arriving from several directions</h2>
<p>The EU is the strictest, not the only source. California's SB 942 addresses AI content
transparency, New York has legislated on synthetic performers, and the NO FAKES Act addresses digital
replicas. Platforms have moved independently: several now label AI content and some adjust
monetisation for it. The direction is consistent even where the detail differs.</p>

<h2>What to do now</h2>
<ol>
<li><strong>Check what your tools emit.</strong> Some attach Content Credentials; many attach
nothing. Know which yours does.</li>
<li><strong>Keep your own records.</strong> Whatever a regulator eventually asks for, being able to
show what you made and when is the foundation. Reconstructing it later is much harder.</li>
<li><strong>Disclose plainly where it matters</strong> — realistic depictions of real people above
all. This is the area with the least tolerance and the most attention.</li>
<li><strong>Do not rely on metadata alone.</strong> Platforms strip it on upload. If your compliance
story depends on embedded metadata surviving distribution, it will fail at the first re-upload.</li>
</ol>

<h2>Where GenieMade fits</h2>
<p>Every creation is hashed, signed and entered into a public registry, so the record is anchored to
the content rather than the file's metadata — it survives stripping, re-upload and screenshotting.
Anyone can check it without an account.</p>
<p>That is a <em>records</em> capability, not a compliance certification. It gives you a durable,
independent answer to "what is this and when did it exist", which is the question underneath most of
these rules. It does not make you compliant on its own, and no tool can.</p>

<a class="cta" href="/verify"><b>See what a record looks like →</b><span>Check any file against the
public registry.</span></a>

<p class="disc">Summarises publicly available information about the EU AI Act and related legislation
as of publication. Not legal advice. Obligations and dates change — verify against primary sources or
qualified counsel before relying on any of it.</p>`,
},
];

/* ------------------------------------------------------------------ shell */
const esc = (s) => String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function page({ slug, title, desc, eyebrow, h1, dek, body }) {
  const url = `${SITE}/guides/${slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: h1, description: desc, mainEntityOfPage: url,
        author: { "@type": "Organization", name: "GenieMade", url: SITE },
        publisher: { "@type": "Organization", name: "GenieMade", url: SITE } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "GenieMade", item: SITE },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides/` },
        { "@type": "ListItem", position: 3, name: h1, item: url } ] },
    ],
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | GenieMade</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="GenieMade">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${CSS}</style>
</head>
<body>
<main class="wrap">
<p class="eyebrow">${esc(eyebrow)}</p>
<h1>${esc(h1)}</h1>
<p class="dek">${esc(dek)}</p>
<p class="meta"><a href="/guides/">All guides</a></p>
${body.trim()}
</main>
</body>
</html>
`;
}

function indexPage() {
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage",
    name: "GenieMade Guides", url: `${SITE}/guides/`,
    description: "Practical guides on proving what you made, checking provenance, and the rules arriving around AI content." };
  const cards = GUIDES.map(g =>
    `<a class="card" href="/guides/${g.slug}"><b>${esc(g.h1)}</b><span>${esc(g.dek)}</span></a>`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Guides — proving what you made | GenieMade</title>
<meta name="description" content="Practical guides on proving a design is yours, checking what provenance a file carries, and the disclosure rules arriving around AI content.">
<link rel="canonical" href="${SITE}/guides/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="GenieMade">
<meta property="og:title" content="GenieMade Guides">
<meta property="og:description" content="Proving a design is yours, checking provenance, and the rules arriving around AI content.">
<meta property="og:url" content="${SITE}/guides/">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${CSS}</style>
</head>
<body>
<main class="wrap">
<p class="eyebrow">Guides</p>
<h1>Proving what you made</h1>
<p class="dek">Every AI tool competes on making things. These are about the part nobody else covers — showing the work is yours, and knowing what a file can actually prove about itself.</p>
<div class="cards">
${cards}
</div>
<a class="cta" href="/verify"><b>Verify a file →</b><span>Drop in any image and check it against the public registry. Free, no account.</span></a>
</main>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ emit */
if (!existsSync(OUT)) mkdirSync(OUT);
const files = { [`${OUT}/index.html`]: indexPage() };
for (const g of GUIDES) files[`${OUT}/${g.slug}.html`] = page(g);

/* ⚠ Guardrails, enforced rather than trusted to review. */
for (const [name, html] of Object.entries(files)) {
  if (/starring you/i.test(html)) throw new Error(`${name}: contains JibJab's "Starring You" mark`);
  if (/prove[sd]? (that )?you (made|created)/i.test(html))
    throw new Error(`${name}: overclaims authorship — registration proves first-registration, not authorship`);
}

/* build-nav.mjs writes its header into these same files afterwards, so a byte comparison against
 * disk would always report drift once nav has run. Strip the GMNAV block before comparing — this
 * script owns the article, build-nav.mjs owns the header. Running build-guides then build-nav is
 * the correct order; the reverse just means nav has to run again. */
const NAV_BLOCK = /<!-- GMNAV:START[\s\S]*?<!-- GMNAV:END -->\n?/;
const mine = (s) => (s == null ? null : s.replace(NAV_BLOCK, ""));

let drift = 0;
for (const [name, html] of Object.entries(files)) {
  const cur = existsSync(name) ? readFileSync(name, "utf8") : null;
  if (mine(cur) === html) continue;
  /* Writing would discard the header; let build-nav.mjs put it back. */
  drift++;
  if (CHECK) console.log(`  drift: ${name}`);
  else writeFileSync(name, html);
}
const stale = existsSync(OUT)
  ? readdirSync(OUT).filter(f => f.endsWith(".html") && !files[`${OUT}/${f}`])
  : [];
if (stale.length) console.log(`  ⚠ not generated by this script: ${stale.join(", ")}`);

if (CHECK) {
  if (drift) { console.log(`guides: ${drift} file(s) differ — run: node build-guides.mjs`); process.exit(1); }
  console.log(`guides: all ${Object.keys(files).length} files current.`);
} else {
  console.log(`guides: wrote ${drift} of ${Object.keys(files).length} files (${GUIDES.length} articles + index)`);
}
