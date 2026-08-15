#!/usr/bin/env python3
"""Generate B2C SEO occasion landing pages (the JibJab playbook) for GenieMade.

One indexable static page per occasion at /make/<slug>, each keyword-targeted, brand-matched, wired to the
Studio, and cross-linked. Plus a sitemap with per-tile <image:image> entries (JibJab wins Google Images the
same way). Pure additive static HTML — the CF Pages worker serves it; nothing in /api or the engine changes.

Rerun: python3 scripts/gen-occasion-pages.py  → writes make/*.html + sitemap.xml.
"""
import html
import os

SITE = "https://geniemadeit.com"
OUT = os.path.join(os.path.dirname(__file__), "..")

# Site-wide tracking. Rewardful affiliate tracking must be on EVERY page (incl. these SEO/affiliate
# landing pages) so a referral is captured no matter where the visitor lands — the exact snippet the
# core funnel (/, /app) uses. (Analytics like Clarity go in via CLARITY_ID once the CEO creates a project.)
REWARDFUL = ("<!-- Rewardful affiliate tracking -->\n"
             "<script>(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');</script>\n"
             "<script async src='https://r.wdfl.co/rw.js' data-rewardful='3b9f63'></script>")

# Microsoft Clarity — heatmaps + session recordings + funnel (CEO growth-plan "day one"). Project y21d6q7oku.
CLARITY = ('<!-- Microsoft Clarity -->\n'
           '<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};'
           't=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;'
           'y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","y21d6q7oku");</script>')

TRACKING = REWARDFUL + "\n" + CLARITY

# Occasion catalog = the live /api/packs, enriched with SEO intent (keyword, title, meta, hero copy).
# looks: (slug, name) — tiles live at /asset/packs/<id>/<slug>.jpg (served via the engine proxy).
OCCASIONS = [
    {"id": "birthday", "emoji": "🎂", "title": "Birthday Bash",
     "kw": "AI birthday card", "h1": "Make a birthday photo they'll never forget",
     "meta": "Turn any photo into a personalized AI birthday card — confetti, cake smash or neon party. Certified and provably yours. Your first 3 are free.",
     "intro": "Upload one photo and GenieMade makes them the star of the party — a birthday card so good they'll screenshot it. Every creation is sealed with a certificate of authenticity that's provably yours.",
     "looks": [("confetti", "Confetti Celebration"), ("cake-smash", "Cake Smash"), ("neon", "Neon Party")]},
    {"id": "love", "emoji": "💘", "title": "Love & Anniversary",
     "kw": "AI anniversary & valentine card", "h1": "A love portrait made for the one you love",
     "meta": "Turn a photo into a romantic AI portrait for an anniversary or valentine — classic, retro or starry-eyed. Certified and provably yours. First 3 free.",
     "intro": "Say it with a portrait, not a text. Upload one photo and GenieMade turns it into a romantic keepsake — sealed with a certificate that's provably yours.",
     "looks": [("classic-romance", "Classic Romance"), ("retro-valentine", "Retro Valentine"), ("starry-dance", "Starry Slow Dance")]},
    {"id": "congrats", "emoji": "🏆", "title": "Congrats!",
     "kw": "AI congratulations card", "h1": "Celebrate the win like a champion",
     "meta": "Graduation, promotion or big news? Turn a photo into a trophy-worthy AI congrats card. Certified and provably yours. First 3 free.",
     "intro": "Graduations, promotions, big news — GenieMade casts them as the champion they are, from one photo. Certified and provably yours.",
     "looks": [("trophy", "Trophy Moment"), ("grad", "Graduation Glory"), ("confetti-cannon", "Confetti Cannon")]},
    {"id": "cheer-up", "emoji": "☀️", "title": "Cheer Up",
     "kw": "AI cheer-up card", "h1": "Send a little sunshine",
     "meta": "Brighten someone's day with a warm, uplifting AI portrait — sunshine, cozy comfort or rainbow vibes. Certified and provably yours. First 3 free.",
     "intro": "A warm, uplifting portrait that says 'thinking of you' better than words — made from a single photo and provably yours.",
     "looks": [("sunshine", "Sunshine & Lollipops"), ("cozy", "Cozy Comfort"), ("rainbow", "Rainbow Vibes")]},
    {"id": "thank-you", "emoji": "🙏", "title": "Thank You",
     "kw": "AI thank-you card", "h1": "Gratitude that actually lands",
     "meta": "Turn a photo into a heartfelt AI thank-you card — a grateful bouquet, golden spotlight or heartfelt scene. Certified and provably yours. First 3 free.",
     "intro": "A heartfelt portrait that says thanks better than a text — from one photo, sealed and provably yours.",
     "looks": [("bouquet", "Grateful Bouquet"), ("spotlight", "Golden Spotlight"), ("heartfelt", "Heartfelt Thanks")]},
    {"id": "dance", "emoji": "🕺", "title": "Dance Floor",
     "kw": "put your face in a dance video", "h1": "Drop them onto the dance floor",
     "meta": "Put anyone in a music-video moment — disco, 90s hip-hop or full rockstar — from one photo. Certified and provably yours. First 3 free.",
     "intro": "Cue the moves. GenieMade drops them into a music-video moment from a single photo — and seals it as provably yours.",
     "looks": [("disco", "Disco Fever"), ("hiphop", "90s Hip-Hop"), ("rockstar", "Rockstar Encore")]},
    {"id": "halloween", "emoji": "🎃", "title": "Halloween",
     "kw": "AI Halloween photo", "h1": "Turn any photo into a Halloween star — no costume needed",
     "meta": "Become a monster, witch or neon-haunt star from one photo — no costume, no makeup. Certified AI Halloween photos, provably yours. First 3 free.",
     "intro": "Spook-tacular and costume-free. Upload one photo and GenieMade turns it into a monster, witch or neon-haunt star — sealed and provably yours.",
     "looks": [("monster", "Classic Monster"), ("witch", "Enchanted Witch"), ("neon-haunt", "Neon Haunt")]},
    {"id": "legends", "emoji": "⚡", "title": "Epic Legends",
     "kw": "AI legend portrait", "h1": "Cast anyone as the legend they were born to be",
     "meta": "Rockstar, wild-west outlaw or caped hero — turn a photo into an epic AI legend portrait. Certified and provably yours. First 3 free.",
     "intro": "Rockstar, outlaw, caped hero — GenieMade casts them as a legend from one photo, sealed and provably yours.",
     "looks": [("rock-legend", "Rockstar Legend"), ("outlaw", "Wild West Outlaw"), ("super-hero", "Caped Super Hero")]},
    {"id": "queens", "emoji": "👑", "title": "Icon Queens",
     "kw": "AI queen portrait", "h1": "She's the icon of the story",
     "meta": "Rock queen, warrior princess or golden-age glam — turn a photo into an iconic AI queen portrait. Certified and provably yours. First 3 free.",
     "intro": "Rock queen, warrior princess, golden-age glam — GenieMade makes her the icon from a single photo, sealed and provably yours.",
     "looks": [("rock-queen", "Rockstar Queen"), ("warrior-princess", "Warrior Princess"), ("golden-glam", "Golden Age Glam")]},
    {"id": "game-on", "emoji": "🎮", "title": "Game On",
     "kw": "AI gamer portrait", "h1": "Drop them into the game",
     "meta": "Blocky builder worlds, battle-royale islands, retro arcades — turn a photo into an epic AI gamer portrait. Certified and provably yours. First 3 free.",
     "intro": "Blocky builder worlds, battle-royale islands and retro arcades — GenieMade drops them into the game from one photo, sealed and provably yours.",
     "looks": [("voxel", "Blocky Builder"), ("battle-royale", "Battle Royale"), ("arcade", "Retro Arcade Hero")]},
    {"id": "icons", "emoji": "🧠", "title": "Hall of Icons",
     "kw": "AI icon portrait", "h1": "Step into the shoes of a legend",
     "meta": "Mad genius, master painter or space pioneer — turn a photo into a Hall-of-Icons AI portrait. Certified and provably yours. First 3 free.",
     "intro": "Mad genius, master painter, space pioneer — GenieMade casts them as an original icon from one photo, sealed and provably yours.",
     "looks": [("genius", "Mad Genius"), ("painter", "Master Painter"), ("pioneer", "Space Pioneer")]},
    # Seasonal hubs — huge B2C search volume; reuse a fitting existing pack's imagery via "pack".
    {"id": "valentines-day", "emoji": "💝", "title": "Valentine's Day", "pack": "love",
     "kw": "AI Valentine's Day card", "h1": "Make a Valentine's Day card that melts them",
     "meta": "Turn a photo into a romantic AI Valentine's Day card — classic, retro or starry-eyed. Certified and provably yours. First 3 free.",
     "intro": "Skip the drugstore card. Upload one photo and GenieMade turns it into a Valentine's Day keepsake made just for them — sealed and provably yours.",
     "looks": [("classic-romance", "Classic Romance"), ("retro-valentine", "Retro Valentine"), ("starry-dance", "Starry Slow Dance")]},
    {"id": "graduation", "emoji": "🎓", "title": "Graduation", "pack": "congrats",
     "kw": "AI graduation card", "h1": "Celebrate the grad like the champion they are",
     "meta": "Turn a photo into a proud AI graduation card — trophy, cap-and-gown or confetti-cannon. Certified and provably yours. First 3 free.",
     "intro": "Cap, gown, and a moment worth framing. Upload one photo and GenieMade makes the grad the star of it — certified and provably theirs.",
     "looks": [("trophy", "Trophy Moment"), ("grad", "Graduation Glory"), ("confetti-cannon", "Confetti Cannon")]},
    {"id": "new-year", "emoji": "🎆", "title": "New Year", "pack": "dance",
     "kw": "AI New Year card", "h1": "Ring in the New Year on the dance floor",
     "meta": "Turn a photo into a New Year's party moment — disco, hip-hop or rockstar. Certified and provably yours. First 3 free.",
     "intro": "Cue the countdown. Upload one photo and GenieMade drops them into a New Year's party moment worth sharing — sealed and provably yours.",
     "looks": [("disco", "Disco Fever"), ("hiphop", "90s Hip-Hop"), ("rockstar", "Rockstar Encore")]},
    {"id": "mothers-day", "emoji": "👑", "title": "Mother's Day", "pack": "queens",
     "kw": "AI Mother's Day gift", "h1": "Make Mom the queen she already is",
     "meta": "Turn a photo into a regal AI Mother's Day portrait — rock queen, warrior princess or golden glam. Certified as provably hers. First 3 free.",
     "intro": "Give Mom more than a card. Upload one photo and GenieMade crowns her the icon of the story — a Mother's Day keepsake she'll want to frame.",
     "looks": [("rock-queen", "Rockstar Queen"), ("warrior-princess", "Warrior Princess"), ("golden-glam", "Golden Age Glam")]},
    {"id": "fathers-day", "emoji": "⚡", "title": "Father's Day", "pack": "legends",
     "kw": "AI Father's Day gift", "h1": "Make Dad the legend he thinks he is",
     "meta": "Turn a photo into a legendary AI Father's Day portrait — rockstar, outlaw or caped hero. Certified as provably his. First 3 free.",
     "intro": "Better than another tie. Upload one photo and GenieMade casts Dad as the legend of the story — a Father's Day gift he'll actually show his friends.",
     "looks": [("rock-legend", "Rockstar Legend"), ("outlaw", "Wild West Outlaw"), ("super-hero", "Caped Super Hero")]},
]

# Long-tail modifiers (the JibJab tail). Each is a distinct SEARCH INTENT with its own copy, applied only
# to occasions where it's a real query — so every page is genuinely unique, not a thin duplicate.
# {t}=Title, {tl}=title-lower. slug reads like the query. Pages reuse the occasion's real look tiles.
MODIFIERS = [
    {"key": "funny", "slug": "funny-{id}", "occ": ["birthday", "halloween", "congrats", "cheer-up"],
     "kw": "funny {tl} card",
     "h1": "Make a funny {tl} card they'll actually laugh at",
     "meta": "Turn any photo into a hilarious {tl} card in seconds — pick a look, we make the magic, and it's certified and provably yours. First 3 free.",
     "intro": "The card that gets the group-chat screenshot. Upload one photo and GenieMade turns them into a laugh-out-loud {tl} moment — no design skills, no awkward stock art.",
     "angle": "Funny lands best when it's personal. Because it's their face in the scene, a GenieMade {tl} card hits harder than any generic meme — and every one is sealed with a certificate that's provably yours.",
     "faq": "What makes a funny {tl} card work?"},
    {"key": "video", "slug": "{id}-video", "occ": ["birthday", "dance", "love", "congrats", "halloween"],
     "kw": "{tl} video",
     "h1": "Make a {tl} video from a single photo",
     "meta": "Turn one photo into a share-worthy {tl} video — motion, music and magic in seconds. Certified and provably yours. First 3 free.",
     "intro": "A moving, music-backed {tl} moment beats a flat card every time. Upload one photo and GenieMade brings it to life — ready to text, post or drop in the group chat.",
     "angle": "Video is what people actually share. A personalized {tl} video is inherently viral — every share carries your certified 'made with GenieMade' mark back to the source.",
     "faq": "How do I make a {tl} video from a photo?"},
    {"key": "for-mom", "slug": "{id}-for-mom", "occ": ["birthday", "thank-you", "congrats"],
     "kw": "{tl} for mom",
     "h1": "{an} {tl} gift for Mom she'll keep forever",
     "meta": "Turn a photo into a heartfelt {tl} portrait for Mom — thoughtful, personal, and certified as provably hers. First 3 free.",
     "intro": "Skip the generic card aisle. Upload one photo and GenieMade makes Mom the star of a {tl} keepsake she'll want to frame — thoughtful in a way a store-bought card can't be.",
     "angle": "The best gift for Mom is one that's unmistakably about her. Because it starts from your own photo, a GenieMade {tl} portrait is personal by design — and sealed with a certificate that's provably hers.",
     "faq": "What's a good personalized {tl} gift for Mom?"},
    {"key": "for-dad", "slug": "{id}-for-dad", "occ": ["birthday", "thank-you", "congrats"],
     "kw": "{tl} for dad",
     "h1": "{an} {tl} gift for Dad that isn't another tie",
     "meta": "Turn a photo into a {tl} portrait Dad will actually love — legendary, funny or heroic, and certified as provably his. First 3 free.",
     "intro": "Give Dad something he'll show his friends. Upload one photo and GenieMade casts him as the star of a {tl} moment — way better than another mug or tie.",
     "angle": "Dads are hard to shop for because they say they want nothing. A personalized {tl} portrait of him is the exception — memorable, a little funny, and provably his.",
     "faq": "What's a good personalized {tl} gift for Dad?"},
    {"key": "for-kids", "slug": "{id}-for-kids", "occ": ["birthday", "halloween", "game-on"],
     "kw": "{tl} for kids",
     "h1": "Make {tl} magic your kids will adore",
     "meta": "Turn your kid's photo into a magical {tl} creation they'll adore — playful, safe and certified as provably yours. First 3 free.",
     "intro": "Make your kid the hero of the story. Upload one photo and GenieMade turns them into a {tl} creation they'll ask to see again and again.",
     "angle": "Kids light up when it's actually them in the scene. A GenieMade {tl} creation is that magic on demand — and each one is sealed and provably yours to keep.",
     "faq": "Is a {tl} creation good for kids?"},
    {"key": "for-him", "slug": "{id}-for-him", "occ": ["love", "birthday"],
     "kw": "{tl} for him",
     "h1": "{an} {tl} gift for him that means something",
     "meta": "Turn a photo into a {tl} portrait made for him — romantic, epic or heartfelt, and certified as provably his. First 3 free.",
     "intro": "Say it in a way a text can't. Upload one photo and GenieMade makes him the star of a {tl} keepsake that actually means something.",
     "angle": "The gift that lands is the one that's clearly about him. A personalized {tl} portrait is personal by design — and provably his.",
     "faq": "What's a good personalized {tl} gift for him?"},
    {"key": "for-her", "slug": "{id}-for-her", "occ": ["love", "birthday"],
     "kw": "{tl} for her",
     "h1": "{an} {tl} gift for her she'll want to frame",
     "meta": "Turn a photo into a {tl} portrait made for her — romantic, glamorous or heartfelt, and certified as provably hers. First 3 free.",
     "intro": "More thoughtful than flowers, more personal than a card. Upload one photo and GenieMade makes her the star of a {tl} keepsake she'll treasure.",
     "angle": "A gift she keeps is one that's unmistakably about her. A personalized {tl} portrait is exactly that — and sealed as provably hers.",
     "faq": "What's a good personalized {tl} gift for her?"},
]

BRAND_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
:root{--night:#130a26;--night2:#1c1140;--panel:#231553;--panel2:#2b1b63;--line:#3a2a6b;
--ink:#f7f1ff;--mut:#c6b6ea;--faint:#8f7fbb;--gold:#f5c451;--gold2:#ffe390;--goldd:#c88f2c;--viol:#a06bff;
--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
body{background:radial-gradient(1200px 640px at 80% -6%,rgba(245,196,81,.13),transparent 60%),radial-gradient(900px 620px at 6% 40%,rgba(160,107,255,.08),transparent 55%),linear-gradient(178deg,var(--night2),var(--night));color:var(--ink);font:16px/1.65 var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden;min-height:100vh}
a{color:inherit;text-decoration:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 22px}
header{position:sticky;top:0;z-index:40;backdrop-filter:blur(10px);background:linear-gradient(180deg,rgba(19,10,38,.86),rgba(19,10,38,.5));border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;height:64px}
.wm{font-family:var(--serif);font-size:1.3rem;font-weight:600}.wm b{color:var(--gold)}
.links{display:flex;gap:22px;align-items:center}.links a{color:var(--mut);font-size:.92rem}.links a:hover{color:var(--ink)}
.btn{display:inline-block;border:none;border-radius:30px;padding:13px 26px;font:inherit;font-weight:700;cursor:pointer;transition:transform .15s}
.btn.gold{color:#2a1a05;background:linear-gradient(180deg,var(--gold2),var(--gold));box-shadow:0 10px 26px -8px rgba(245,196,81,.6)}
.btn.gold:hover{transform:translateY(-2px)}
.btn.ghost{background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--ink)}
.btn.ghost:hover{border-color:var(--gold)}
.eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold2);border:1px solid var(--goldd);background:rgba(245,196,81,.07);border-radius:30px;padding:5px 13px}
.eyebrow .spark{width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 10px var(--gold)}
.hero{padding:64px 0 34px;text-align:center}
h1{font-family:var(--serif);font-weight:600;font-size:clamp(2.4rem,6vw,4rem);line-height:1.04;letter-spacing:-.015em;margin:.45em 0 .3em;text-wrap:balance}
h1 em{font-style:italic;color:var(--gold)}
.lead{color:var(--mut);font-size:1.1rem;max-width:38rem;margin:0 auto 26px}
.cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.free{color:var(--faint);font-size:.85rem;margin-top:14px}
.looks{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:26px 0}
@media(max-width:720px){.looks{grid-template-columns:1fr}.links a.hide-sm{display:none}}
.look{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--panel);transition:transform .15s,border-color .15s}
.look:hover{transform:translateY(-4px);border-color:var(--goldd)}
.look img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:var(--panel2)}
.look .cap{padding:13px 15px;display:flex;align-items:center;justify-content:space-between;gap:8px}
.look .cap b{font-weight:600}.look .cap .go{color:var(--gold2);font-size:.8rem;font-weight:700}
.cert-strip{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--gold2);font-size:.82rem;border:1px solid var(--goldd);background:rgba(245,196,81,.06);border-radius:30px;padding:9px 18px;width:max-content;margin:6px auto 0}
h2{font-family:var(--serif);font-weight:600;font-size:clamp(1.7rem,4vw,2.4rem);text-align:center;margin:8px 0 6px}
h2 em{font-style:italic;color:var(--gold)}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:22px 0 8px}
@media(max-width:720px){.steps{grid-template-columns:1fr}}
.step{border:1px solid var(--line);border-radius:14px;padding:20px;background:rgba(35,21,83,.4)}
.step .n{color:var(--gold);font-family:var(--serif);font-size:1.4rem}.step h3{margin:6px 0 4px;font-size:1.05rem}
.step p{color:var(--mut);font-size:.92rem}
.sec{padding:34px 0}
.more{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:8px 0}
.more a{border:1px solid var(--line);border-radius:30px;padding:8px 15px;color:var(--mut);font-size:.9rem}
.more a:hover{border-color:var(--gold);color:var(--ink)}
.midcta{text-align:center;padding:40px 0}
footer{border-top:1px solid var(--line);margin-top:20px;padding:26px 0;color:var(--faint);font-size:.86rem}
.foot{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between}
.foot a{color:var(--mut)}.foot a:hover{color:var(--ink)}
.aff{color:var(--gold2);font-weight:600}
"""


def esc(s):
    return html.escape(str(s), quote=True)


def look_tile(occ_id, look_slug):
    return f"{SITE}/asset/packs/{occ_id}/{look_slug}.jpg"


def render(occ):
    oid = occ["id"]
    pk = occ.get("pack", oid)
    url = f"{SITE}/make/{oid}"
    cover = f"{SITE}/asset/packs/{pk}/cover.jpg"
    title = f"{occ['h1']} · {occ['kw']} | GenieMade"
    looks_html = "\n".join(
        f'''<a class="look" href="/app?pack={pk}&look={ls}">
        <img src="{look_tile(pk, ls)}" alt="{esc(ln)} — {esc(occ['kw'])} by GenieMade" loading="lazy" width="512" height="512">
        <div class="cap"><b>{esc(ln)}</b><span class="go">Make it →</span></div></a>'''
        for ls, ln in occ["looks"])
    # internal links to sibling occasions (SEO interlinking)
    more = "\n".join(
        f'<a href="/make/{o["id"]}">{o["emoji"]} {esc(o["title"])}</a>'
        for o in OCCASIONS if o["id"] != oid)
    mod_links = " ".join(f'<a href="/make/{s}">{esc(_mt(m["kw"], occ).title())}</a>'
                         for m, s in modifier_pages_for(occ))
    mod_sec = (f'<section class="sec"><h2>Popular <em>{esc(occ["title"])}</em> ideas</h2>'
               f'<div class="more">{mod_links}</div></section>') if mod_links else ""
    # JSON-LD: WebApplication offer + breadcrumb + FAQ (rich results)
    ld = f'''<script type="application/ld+json">{{
  "@context":"https://schema.org","@graph":[
   {{"@type":"WebApplication","name":"GenieMade — {esc(occ['title'])}","url":"{url}",
     "applicationCategory":"MultimediaApplication","operatingSystem":"Web",
     "description":{esc_json(occ['meta'])},
     "offers":{{"@type":"Offer","price":"0","priceCurrency":"USD","description":"3 free creations to start"}},
     "publisher":{{"@type":"Organization","name":"CyberHope AI","url":"https://cyberhopeai.com"}}}},
   {{"@type":"BreadcrumbList","itemListElement":[
     {{"@type":"ListItem","position":1,"name":"GenieMade","item":"{SITE}/"}},
     {{"@type":"ListItem","position":2,"name":"{esc(occ['title'])}","item":"{url}"}}]}},
   {{"@type":"FAQPage","mainEntity":[
     {{"@type":"Question","name":"How do I make a {esc(occ['kw'])}?","acceptedAnswer":{{"@type":"Answer","text":"Upload one photo, pick a look, and GenieMade generates it in seconds. Your first 3 creations are free."}}}},
     {{"@type":"Question","name":"Is the creation really mine?","acceptedAnswer":{{"@type":"Answer","text":"Yes — every creation is sealed with a certificate of authenticity that is provably yours."}}}}]}}
  ]}}</script>'''
    return f'''<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(occ['meta'])}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="GenieMade">
<meta property="og:title" content="{esc(occ['h1'])} | GenieMade">
<meta property="og:description" content="{esc(occ['meta'])}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{cover}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(occ['h1'])} | GenieMade">
<meta name="twitter:description" content="{esc(occ['meta'])}"><meta name="twitter:image" content="{cover}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
{TRACKING}
{ld}
<style>{BRAND_CSS}</style></head>
<body>
<header><div class="wrap nav">
  <a class="wm" href="/">Genie<b>Made</b></a>
  <nav class="links">
    <a class="hide-sm" href="/make/birthday">Occasions</a>
    <a class="hide-sm" href="/studio-you">Studio You</a>
    <a class="hide-sm" href="/#pricing">Pricing</a>
    <a class="btn gold" href="/app?pack={pk}" style="padding:9px 18px">Open the Studio</a>
  </nav></div></header>

<main class="wrap">
  <section class="hero">
    <span class="eyebrow"><span class="spark"></span>{occ['emoji']} {esc(occ['title'])}</span>
    <h1>{esc(occ['h1'])}</h1>
    <p class="lead">{esc(occ['intro'])}</p>
    <div class="cta-row">
      <a class="btn gold" href="/app?pack={pk}">Make your {esc(occ['title'].lower())} photo</a>
      <a class="btn ghost" href="#looks">See the looks</a>
    </div>
    <div class="free">✦ Your first 3 creations are free · no credit card to start</div>
    <div class="cert-strip">◈ Every creation sealed with a Certificate of Authenticity — provably yours</div>
  </section>

  <section id="looks" class="sec">
    <h2>Pick a <em>{esc(occ['title'])}</em> look</h2>
    <div class="looks">{looks_html}</div>
  </section>

  <section class="sec">
    <h2>How it <em>works</em></h2>
    <div class="steps">
      <div class="step"><div class="n">1</div><h3>Add your photo</h3><p>One clear photo of the star of the show is all it takes.</p></div>
      <div class="step"><div class="n">2</div><h3>We make the magic</h3><p>GenieMade renders your {esc(occ['title'].lower())} look in seconds.</p></div>
      <div class="step"><div class="n">3</div><h3>Certified &amp; yours</h3><p>Download it, share it — sealed with a certificate that's provably yours.</p></div>
    </div>
    <div class="midcta"><a class="btn gold" href="/app?pack={pk}">Start free →</a></div>
  </section>

  {mod_sec}
  <section class="sec">
    <h2>More <em>occasions</em></h2>
    <div class="more">{more}</div>
  </section>
</main>

<footer><div class="wrap foot">
  <div>© GenieMade · a CyberHope AI product</div>
  <div style="display:flex;gap:18px;flex-wrap:wrap">
    <a href="/studio-you">Studio You</a><a href="https://eververify.org/verify" target="_blank" rel="noopener">Verify a creation</a>
    <a class="aff" href="/affiliates">Earn with GenieMade →</a>
  </div>
</div></footer>
</body></html>'''


def esc_json(s):
    import json
    return json.dumps(str(s))


# Clean SEARCH NOUN per occasion (what people actually type) — used in modifier copy so keywords read
# naturally ("funny birthday card", not "funny birthday bash card").
NOUNS = {"birthday": "birthday", "love": "anniversary", "congrats": "congrats", "cheer-up": "cheer-up",
         "thank-you": "thank you", "dance": "dance", "halloween": "Halloween", "legends": "legend",
         "queens": "queen", "game-on": "gaming", "icons": "icon"}


def _mt(s, occ):
    noun = NOUNS.get(occ["id"], occ["title"].lower())
    an = "An" if noun[:1].lower() in "aeiou" else "A"
    return s.format(t=occ["title"], tl=noun, id=occ["id"], an=an)


def modifier_pages_for(occ):
    """The modifier long-tail slugs that apply to this occasion (for interlinking + sitemap)."""
    return [(m, m["slug"].format(id=occ["id"])) for m in MODIFIERS if occ["id"] in m["occ"]]


def render_modifier(occ, mod):
    oid = occ["id"]
    pk = occ.get("pack", oid)
    slug = mod["slug"].format(id=oid)
    url = f"{SITE}/make/{slug}"
    cover = f"{SITE}/asset/packs/{pk}/cover.jpg"
    h1 = _mt(mod["h1"], occ); meta = _mt(mod["meta"], occ); kw = _mt(mod["kw"], occ)
    intro = _mt(mod["intro"], occ); angle = _mt(mod["angle"], occ); faqq = _mt(mod["faq"], occ)
    title = f"{h1} | GenieMade"
    looks_html = "\n".join(
        f'''<a class="look" href="/app?pack={pk}&look={ls}">
        <img src="{look_tile(pk, ls)}" alt="{esc(ln)} — {esc(kw)} by GenieMade" loading="lazy" width="512" height="512">
        <div class="cap"><b>{esc(ln)}</b><span class="go">Make it →</span></div></a>'''
        for ls, ln in occ["looks"])
    # sibling modifiers of the SAME occasion + the parent hub (tight interlinking)
    sibs = [f'<a href="/make/{s}">{esc(_mt(m["kw"], occ).title())}</a>'
            for m, s in modifier_pages_for(occ) if s != slug]
    sibs.insert(0, f'<a href="/make/{oid}">{occ["emoji"]} All {esc(occ["title"])}</a>')
    ld = f'''<script type="application/ld+json">{{
  "@context":"https://schema.org","@graph":[
   {{"@type":"WebApplication","name":"GenieMade — {esc(h1)}","url":"{url}",
     "applicationCategory":"MultimediaApplication","operatingSystem":"Web","description":{esc_json(meta)},
     "offers":{{"@type":"Offer","price":"0","priceCurrency":"USD","description":"3 free creations to start"}},
     "publisher":{{"@type":"Organization","name":"CyberHope AI","url":"https://cyberhopeai.com"}}}},
   {{"@type":"BreadcrumbList","itemListElement":[
     {{"@type":"ListItem","position":1,"name":"GenieMade","item":"{SITE}/"}},
     {{"@type":"ListItem","position":2,"name":"{esc(occ['title'])}","item":"{SITE}/make/{oid}"}},
     {{"@type":"ListItem","position":3,"name":"{esc(kw.title())}","item":"{url}"}}]}},
   {{"@type":"FAQPage","mainEntity":[
     {{"@type":"Question","name":"{esc(faqq)}","acceptedAnswer":{{"@type":"Answer","text":{esc_json(angle)}}}}},
     {{"@type":"Question","name":"How much does it cost?","acceptedAnswer":{{"@type":"Answer","text":"Your first 3 creations are free — no credit card to start."}}}}]}}
  ]}}</script>'''
    return f'''<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(meta)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="GenieMade">
<meta property="og:title" content="{esc(h1)} | GenieMade"><meta property="og:description" content="{esc(meta)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{cover}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(h1)}">
<meta name="twitter:description" content="{esc(meta)}"><meta name="twitter:image" content="{cover}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
{TRACKING}
{ld}
<style>{BRAND_CSS}</style></head>
<body>
<header><div class="wrap nav">
  <a class="wm" href="/">Genie<b>Made</b></a>
  <nav class="links"><a class="hide-sm" href="/make/{oid}">{esc(occ['title'])}</a><a class="hide-sm" href="/studio-you">Studio You</a><a class="hide-sm" href="/#pricing">Pricing</a><a class="btn gold" href="/app?pack={pk}" style="padding:9px 18px">Open the Studio</a></nav>
</div></header>
<main class="wrap">
  <section class="hero">
    <span class="eyebrow"><span class="spark"></span>{occ['emoji']} {esc(kw.title())}</span>
    <h1>{esc(h1)}</h1>
    <p class="lead">{esc(intro)}</p>
    <div class="cta-row"><a class="btn gold" href="/app?pack={pk}">Make one free</a><a class="btn ghost" href="#looks">See the looks</a></div>
    <div class="free">✦ Your first 3 creations are free · no credit card to start</div>
    <div class="cert-strip">◈ Every creation sealed with a Certificate of Authenticity — provably yours</div>
  </section>
  <section class="sec"><p class="lead" style="text-align:center">{esc(angle)}</p></section>
  <section id="looks" class="sec">
    <h2>Pick a <em>{esc(occ['title'])}</em> look</h2>
    <div class="looks">{looks_html}</div>
    <div class="midcta"><a class="btn gold" href="/app?pack={pk}">Start free →</a></div>
  </section>
  <section class="sec">
    <h2>How it <em>works</em></h2>
    <div class="steps">
      <div class="step"><div class="n">1</div><h3>Add your photo</h3><p>One clear photo is all it takes.</p></div>
      <div class="step"><div class="n">2</div><h3>We make the magic</h3><p>GenieMade renders it in seconds.</p></div>
      <div class="step"><div class="n">3</div><h3>Certified &amp; yours</h3><p>Download, share — sealed and provably yours.</p></div>
    </div>
  </section>
  <section class="sec"><h2>More <em>ideas</em></h2><div class="more">{' '.join(sibs)}</div></section>
</main>
<footer><div class="wrap foot">
  <div>© GenieMade · a CyberHope AI product</div>
  <div style="display:flex;gap:18px;flex-wrap:wrap"><a href="/make/{oid}">{esc(occ['title'])}</a><a href="/studio-you">Studio You</a><a class="aff" href="/affiliates">Earn with GenieMade →</a></div>
</div></footer>
</body></html>'''


def render_index():
    cards = "".join(
        '<a class="look" href="/make/' + o["id"] + '">'
        '<img src="' + SITE + '/asset/packs/' + o.get("pack", o["id"]) + '/cover.jpg" '
        'alt="' + esc(o["kw"]) + ' — GenieMade" loading="lazy" width="512" height="512">'
        '<div class="cap"><b>' + o["emoji"] + ' ' + esc(o["title"]) + '</b>'
        '<span class="go">Make it →</span></div></a>'
        for o in OCCASIONS)
    url = SITE + "/make"
    ld = ('<script type="application/ld+json">'
          '{"@context":"https://schema.org","@type":"CollectionPage",'
          '"name":"Make AI photos & cards for any occasion — GenieMade","url":"' + url + '"}</script>')
    head = ('<!doctype html><html lang="en"><head>'
        '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>Make AI Photos &amp; Cards for Any Occasion | GenieMade</title>'
        '<meta name="description" content="Turn any photo into a personalized AI card, photo or video — '
        'birthdays, anniversaries, Halloween, graduations and more. Certified and provably yours. First 3 free.">'
        '<link rel="canonical" href="' + url + '">'
        '<meta name="robots" content="index, follow, max-image-preview:large">'
        '<meta property="og:type" content="website"><meta property="og:site_name" content="GenieMade">'
        '<meta property="og:title" content="Make AI photos &amp; cards for any occasion">'
        '<meta property="og:description" content="Personalized AI cards, photos and video — certified and provably yours. First 3 free.">'
        '<meta property="og:url" content="' + url + '"><meta property="og:image" content="' + SITE + '/assets/sample_1.png">'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">'
        + TRACKING + ld + "<style>" + BRAND_CSS + "</style></head>")
    body = ('<body><header><div class="wrap nav"><a class="wm" href="/">Genie<b>Made</b></a>'
        '<nav class="links"><a class="hide-sm" href="/studio-you">Studio You</a>'
        '<a class="hide-sm" href="/#pricing">Pricing</a>'
        '<a class="btn gold" href="/app" style="padding:9px 18px">Open the Studio</a></nav></div></header>'
        '<main class="wrap"><section class="hero">'
        '<span class="eyebrow"><span class="spark"></span>Any occasion</span>'
        "<h1>Make something they'll <em>never forget</em></h1>"
        '<p class="lead">Turn one photo into a personalized card, photo or video for any moment — '
        'certified and provably yours.</p>'
        '<div class="cta-row"><a class="btn gold" href="/app">Start free</a></div>'
        '<div class="free">✦ Your first 3 creations are free · no credit card to start</div></section>'
        '<section id="looks" class="sec"><h2>Pick an <em>occasion</em></h2>'
        '<div class="looks">' + cards + '</div></section></main>'
        '<footer><div class="wrap foot"><div>© GenieMade · a CyberHope AI product</div>'
        '<div style="display:flex;gap:18px;flex-wrap:wrap"><a href="/studio-you">Studio You</a>'
        '<a href="https://eververify.org/verify" target="_blank" rel="noopener">Verify a creation</a>'
        '<a class="aff" href="/affiliates">Earn with GenieMade →</a></div></div></footer></body></html>")
    return head + body


def build_sitemap():
    from datetime import date  # noqa
    # (date import kept minimal; lastmod omitted to avoid churn — Google recrawls on content change)
    core = ["/", "/make", "/app", "/studio-you", "/verify", "/import", "/affiliates"]
    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
             'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
    for p in core:
        parts.append(f"  <url><loc>{SITE}{p}</loc><changefreq>weekly</changefreq></url>")
    for occ in OCCASIONS:
        oid = occ["id"]; pk = occ.get("pack", oid); url = f"{SITE}/make/{oid}"
        imgs = "".join(
            f'<image:image><image:loc>{look_tile(pk, ls)}</image:loc>'
            f'<image:title>{esc(ln)} — {esc(occ["kw"])}</image:title>'
            f'<image:caption>{esc(occ["h1"])} with GenieMade. {esc(ln)} look.</image:caption></image:image>'
            for ls, ln in occ["looks"])
        parts.append(f"  <url><loc>{url}</loc><changefreq>weekly</changefreq><priority>0.8</priority>{imgs}</url>")
        # long-tail modifier pages share the occasion's tiles (image sitemap coverage)
        for mod, slug in modifier_pages_for(occ):
            kw = _mt(mod["kw"], occ)
            mimgs = "".join(
                f'<image:image><image:loc>{look_tile(pk, ls)}</image:loc>'
                f'<image:title>{esc(ln)} — {esc(kw)}</image:title></image:image>'
                for ls, ln in occ["looks"])
            parts.append(f"  <url><loc>{SITE}/make/{slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority>{mimgs}</url>")
    parts.append("</urlset>")
    return "\n".join(parts)


def main():
    mk = os.path.join(OUT, "make")
    os.makedirs(mk, exist_ok=True)
    written = set()
    with open(os.path.join(mk, "index.html"), "w", encoding="utf-8") as f:
        f.write(render_index())
    written.add("index.html")
    nmod = 0
    for occ in OCCASIONS:
        name = f"{occ['id']}.html"
        with open(os.path.join(mk, name), "w", encoding="utf-8") as f:
            f.write(render(occ))
        written.add(name)
        for mod, slug in modifier_pages_for(occ):
            name = f"{slug}.html"
            with open(os.path.join(mk, name), "w", encoding="utf-8") as f:
                f.write(render_modifier(occ, mod))
            written.add(name)
            nmod += 1
    # self-clean: drop any stale make/*.html no longer in the catalog (renamed/removed modifiers)
    removed = 0
    for fn in os.listdir(mk):
        if fn.endswith(".html") and fn not in written:
            os.remove(os.path.join(mk, fn)); removed += 1
    with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(build_sitemap())
    total = len(OCCASIONS) + nmod
    print(f"wrote {len(OCCASIONS)} occasion + {nmod} long-tail = {total} pages; removed {removed} stale")


if __name__ == "__main__":
    main()
