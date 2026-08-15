#!/usr/bin/env python3
"""One-shot: add render_index() (the /make occasions gallery) to gen-occasion-pages.py + wire it."""
f = "scripts/gen-occasion-pages.py"
t = open(f, encoding="utf-8").read()

RENDER_INDEX = '''def render_index():
    cards = "".join(
        \'<a class="look" href="/make/\' + o["id"] + \'">\'
        \'<img src="\' + SITE + \'/asset/packs/\' + o.get("pack", o["id"]) + \'/cover.jpg" \'
        \'alt="\' + esc(o["kw"]) + \' — GenieMade" loading="lazy" width="512" height="512">\'
        \'<div class="cap"><b>\' + o["emoji"] + \' \' + esc(o["title"]) + \'</b>\'
        \'<span class="go">Make it →</span></div></a>\'
        for o in OCCASIONS)
    url = SITE + "/make"
    ld = (\'<script type="application/ld+json">\'
          \'{"@context":"https://schema.org","@type":"CollectionPage",\'
          \'"name":"Make AI photos & cards for any occasion — GenieMade","url":"\' + url + \'"}</script>\')
    head = (\'<!doctype html><html lang="en"><head>\'
        \'<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\'
        \'<title>Make AI Photos &amp; Cards for Any Occasion | GenieMade</title>\'
        \'<meta name="description" content="Turn any photo into a personalized AI card, photo or video — \'
        \'birthdays, anniversaries, Halloween, graduations and more. Certified and provably yours. First 3 free.">\'
        \'<link rel="canonical" href="\' + url + \'">\'
        \'<meta name="robots" content="index, follow, max-image-preview:large">\'
        \'<meta property="og:type" content="website"><meta property="og:site_name" content="GenieMade">\'
        \'<meta property="og:title" content="Make AI photos &amp; cards for any occasion">\'
        \'<meta property="og:description" content="Personalized AI cards, photos and video — certified and provably yours. First 3 free.">\'
        \'<meta property="og:url" content="\' + url + \'"><meta property="og:image" content="\' + SITE + \'/assets/sample_1.png">\'
        \'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\'
        \'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">\'
        + TRACKING + ld + "<style>" + BRAND_CSS + "</style></head>")
    body = (\'<body><header><div class="wrap nav"><a class="wm" href="/">Genie<b>Made</b></a>\'
        \'<nav class="links"><a class="hide-sm" href="/studio-you">Studio You</a>\'
        \'<a class="hide-sm" href="/#pricing">Pricing</a>\'
        \'<a class="btn gold" href="/app" style="padding:9px 18px">Open the Studio</a></nav></div></header>\'
        \'<main class="wrap"><section class="hero">\'
        \'<span class="eyebrow"><span class="spark"></span>Any occasion</span>\'
        "<h1>Make something they'll <em>never forget</em></h1>"
        \'<p class="lead">Turn one photo into a personalized card, photo or video for any moment — \'
        \'certified and provably yours.</p>\'
        \'<div class="cta-row"><a class="btn gold" href="/app">Start free</a></div>\'
        \'<div class="free">✦ Your first 3 creations are free · no credit card to start</div></section>\'
        \'<section id="looks" class="sec"><h2>Pick an <em>occasion</em></h2>\'
        \'<div class="looks">\' + cards + \'</div></section></main>\'
        \'<footer><div class="wrap foot"><div>© GenieMade · a CyberHope AI product</div>\'
        \'<div style="display:flex;gap:18px;flex-wrap:wrap"><a href="/studio-you">Studio You</a>\'
        \'<a href="https://eververify.org/verify" target="_blank" rel="noopener">Verify a creation</a>\'
        \'<a class="aff" href="/affiliates">Earn with GenieMade →</a></div></div></footer></body></html>")
    return head + body


'''

assert "def build_sitemap():" in t
t = t.replace("def build_sitemap():", RENDER_INDEX + "def build_sitemap():", 1)

anchor = "    written = set()\n    nmod = 0"
assert anchor in t
t = t.replace(anchor,
              '    written = set()\n'
              '    with open(os.path.join(mk, "index.html"), "w", encoding="utf-8") as f:\n'
              '        f.write(render_index())\n'
              '    written.add("index.html")\n'
              '    nmod = 0', 1)

old_core = 'core = ["/", "/app", "/studio-you", "/verify", "/import", "/affiliates"]'
assert old_core in t
t = t.replace(old_core, 'core = ["/", "/make", "/app", "/studio-you", "/verify", "/import", "/affiliates"]')

open(f, "w", encoding="utf-8").write(t)
print("patched render_index + main() + sitemap /make")
