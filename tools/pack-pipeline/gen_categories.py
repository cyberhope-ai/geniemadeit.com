#!/usr/bin/env python3
# Generates the Holidays + Invitations sections (hub + per-item pages) and the shared 3-dropdown nav.
import os, html as H
SITE = os.path.expanduser("~/Documents/geniemadeit.com")
CDN = "https://geniemadeit.com"
def img(u): return f"{CDN}/asset/packs/{u}.jpg"

# ---------- data ----------
HOLIDAYS = [
 ("new-year","New Year","🎆","holiday-magic",["holiday-magic/new-year"],"Ring it in — you as the star of the countdown."),
 ("valentines","Valentine's Day","💝","love",["love/classic-romance","holiday-magic/valentine","love/retro-valentine"],"Say it with a Valentine only you could send."),
 ("st-patricks","St. Patrick's Day","☘️","st-patricks",["st-patricks/parade","st-patricks/pub-cheers","st-patricks/lucky"],"Luck of the Irish — go green and celebrate."),
 ("easter","Easter","🐰","easter",["easter/bunny","easter/egg-hunt","easter/spring-bonnet"],"Hoppy Easter cards for the whole family."),
 ("cinco-de-mayo","Cinco de Mayo","🌮","cinco-de-mayo",["cinco-de-mayo/fiesta","cinco-de-mayo/mariachi","cinco-de-mayo/celebration"],"¡Fiesta! Colorful cards worth celebrating."),
 ("mothers-day","Mother's Day","💐","queens",["thank-you/bouquet","queens/golden-glam","cheer-up/rainbow"],"Make Mom's day with a card she'll keep."),
 ("fathers-day","Father's Day","👔","legends",["legends/super-hero","legends/rock-legend","celebrity-chef/bbq-king"],"For the hero of the house."),
 ("july-4th","Independence Day","🎆","july-4th",["july-4th/fireworks","july-4th/bbq","july-4th/parade"],"Red, white and boom — 4th of July."),
 ("halloween","Halloween","🎃","halloween",["halloween/monster","halloween/witch","halloween/neon-haunt"],"Spooky-fun cards and party invites."),
 ("thanksgiving","Thanksgiving","🦃","holiday-magic",["holiday-magic/thanksgiving"],"Give thanks with a warm, personal card."),
 ("hanukkah","Hanukkah","🕎","hanukkah",["hanukkah/menorah","hanukkah/dreidel","hanukkah/festive"],"Festival of Lights — eight nights of joy."),
 ("christmas","Christmas","🎄","christmas",["christmas/christmas-card","christmas/winter-wonderland","christmas/santa-workshop"],"Send a Christmas card they'll treasure."),
]
INVITATIONS = [
 ("birthday-party","Birthday Party","🎂","birthday",["birthday/confetti","birthday/cake-smash","birthday/neon"],"Send a birthday e-invite that pops."),
 ("wedding","Wedding","💍","wedding-romance",["wedding-romance/wedding-glam","wedding-romance/first-dance","wedding-romance/vows"],"Elegant wedding invitations, you as the stars."),
 ("engagement","Engagement","💞","wedding-romance",["wedding-romance/engagement","wedding-romance/honeymoon","wedding-romance/first-dance"],"Announce the big news in style."),
 ("anniversary","Anniversary","🥂","love",["love/classic-romance","love/starry-dance","love/retro-valentine"],"Celebrate the years together."),
 ("baby-shower","Baby Shower","👶","cheer-up",["cheer-up/sunshine","cheer-up/cozy","cheer-up/rainbow"],"Sweet, sunny baby-shower invites."),
 ("graduation-party","Graduation Party","🎓","graduation",["graduation/cap-and-gown","graduation/cap-toss","graduation/honor-portrait"],"Invite the crew to the grad party."),
 ("halloween-party","Halloween Party","🎃","halloween",["halloween/monster","halloween/witch","halloween/neon-haunt"],"Spooky party invites with a wink."),
 ("holiday-party","Holiday Party","🎉","holiday-magic",["holiday-magic/christmas","holiday-magic/new-year","holiday-magic/halloween"],"Deck the halls — holiday party invites."),
 ("dinner-party","Dinner Party","🍷","celebrity-chef",["celebrity-chef/tv-chef","celebrity-chef/michelin","celebrity-chef/bbq-king"],"Set the table — you host in style."),
 ("cookout","BBQ & Cookout","🍔","july-4th",["july-4th/bbq","celebrity-chef/bbq-king","july-4th/parade"],"Fire up the grill — cookout invites."),
 ("retirement","Retirement","🏆","congrats",["congrats/trophy","congrats/confetti-cannon","congrats/grad"],"Toast a great career."),
 ("housewarming","Housewarming","🏡","dance",["dance/disco","cheer-up/cozy","birthday/confetti"],"Welcome them to the new place."),
]
OCCASIONS_DD = [  # link to existing /make/<slug> pages
 ("birthday","Birthday","🎂"),("love","Love & Anniversary","💘"),("congrats","Congrats","🏆"),
 ("graduation","Graduation","🎓"),("cheer-up","Cheer Up","☀️"),("thank-you","Thank You","🙏"),
 ("dance","Dance Floor","🕺"),("game-on","Game On","🎮"),("icons","Hall of Icons","🧠"),
 ("legends","Epic Legends","⚡"),("queens","Icon Queens","👑"),
]

# ---------- nav (3 dropdowns) ----------
def dd_menu(items, base):
    lis = "".join(f'<a href="{base}/{s}">{e} {H.escape(n)}</a>' for s,n,e in items)
    return lis
def nav(active=""):
    hol = "".join(f'<a href="/holidays/{s}">{e} {H.escape(n)}</a>' for s,n,e,*_ in HOLIDAYS)
    inv = "".join(f'<a href="/invitations/{s}">{e} {H.escape(n)}</a>' for s,n,e,*_ in INVITATIONS)
    occ = "".join(f'<a href="/make/{s}">{e} {H.escape(n)}</a>' for s,n,e in OCCASIONS_DD)
    def dd(label, href, menu, key):
        a = ' aria-current="page"' if key==active else ''
        return (f'<div class="gm-dd"><a class="gm-dd-t" href="{href}"{a}>{label} <span class="gm-caret">▾</span></a>'
                f'<div class="gm-dd-menu">{menu}</div></div>')
    return ('<nav class="gm-nav" aria-label="Main navigation">'
            '<a href="/studio-you">Studio You</a>'
            + dd("Holidays","/holidays",hol,"holidays")
            + dd("Occasions","/make",occ,"occasions")
            + dd("Invitations","/invitations",inv,"invitations")
            + '<a href="/#pricing">Pricing</a>'
            '<a class="gm-hide-sm" href="/verify">Verify</a></nav>')

NAV_CSS = """
.gm-dd{position:relative}
.gm-dd-t{display:inline-flex;align-items:center;gap:5px}
.gm-caret{font-size:.7em;opacity:.8}
.gm-dd-menu{position:absolute;top:100%;left:0;min-width:230px;background:#1c1140;border:1px solid #3a2a6b;border-radius:12px;
  padding:8px;display:grid;gap:2px;box-shadow:0 18px 44px -12px rgba(0,0,0,.6);opacity:0;visibility:hidden;transform:translateY(6px);
  transition:opacity .16s,transform .16s,visibility .16s;z-index:60;max-height:70vh;overflow:auto}
.gm-dd:hover .gm-dd-menu,.gm-dd:focus-within .gm-dd-menu{opacity:1;visibility:visible;transform:translateY(4px)}
.gm-dd-menu a{display:block;padding:8px 12px;border-radius:8px;color:#d9ccf5;font-size:14px;white-space:nowrap}
.gm-dd-menu a:hover{background:#2b1b63;color:#fff}
@media(max-width:860px){.gm-dd-menu{position:static;opacity:1;visibility:visible;transform:none;box-shadow:none;display:none;border:none;padding:4px 0 4px 14px;background:transparent}
  .gm-dd:focus-within .gm-dd-menu{display:grid}}
"""

# ---------- shared page chrome (reuses the /make design tokens) ----------
HEAD_CSS = """*{box-sizing:border-box;margin:0;padding:0}
:root{--night:#130a26;--night2:#1c1140;--panel:#231553;--panel2:#2b1b63;--line:#3a2a6b;--ink:#f7f1ff;--mut:#c6b6ea;--faint:#8f7fbb;--gold:#f5c451;--gold2:#ffe390;--goldd:#c88f2c;--viol:#a06bff;--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
body{background:radial-gradient(1200px 640px at 80% -6%,rgba(245,196,81,.13),transparent 60%),radial-gradient(900px 620px at 6% 40%,rgba(160,107,255,.08),transparent 55%),linear-gradient(178deg,var(--night2),var(--night));color:var(--ink);font:16px/1.65 var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden;min-height:100vh}
a{color:inherit;text-decoration:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 22px}
.btn{display:inline-block;border:none;border-radius:30px;padding:13px 26px;font:inherit;font-weight:700;cursor:pointer;transition:transform .15s}
.btn.gold{color:#2a1a05;background:linear-gradient(180deg,var(--gold2),var(--gold));box-shadow:0 10px 26px -8px rgba(245,196,81,.6)}
.btn.gold:hover{transform:translateY(-2px)}.btn.ghost{background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--ink)}.btn.ghost:hover{border-color:var(--gold)}
.eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold2);border:1px solid var(--goldd);background:rgba(245,196,81,.07);border-radius:30px;padding:5px 13px}
.hero{padding:56px 0 26px;text-align:center}
h1{font-family:var(--serif);font-weight:600;font-size:clamp(2.2rem,5.5vw,3.6rem);line-height:1.05;letter-spacing:-.015em;margin:.4em 0 .28em;text-wrap:balance}
h1 em{font-style:italic;color:var(--gold)}
.lead{color:var(--mut);font-size:1.08rem;max-width:40rem;margin:0 auto 24px}
.cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.free{color:var(--faint);font-size:.85rem;margin-top:14px}
.looks{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:26px 0}
@media(max-width:720px){.looks{grid-template-columns:1fr}}
.look{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--panel);transition:transform .15s,border-color .15s}
.look:hover{transform:translateY(-4px);border-color:var(--goldd)}
.look img{width:100%;aspect-ratio:1/1;object-fit:cover;object-position:center top;display:block;background:var(--panel2)}
.look .cap{padding:13px 15px;display:flex;align-items:center;justify-content:space-between;gap:8px}
.look .cap b{font-weight:600}.look .cap .go{color:var(--gold2);font-size:.8rem;font-weight:700}
.cert-strip{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--gold2);font-size:.82rem;border:1px solid var(--goldd);background:rgba(245,196,81,.06);border-radius:30px;padding:9px 18px;width:max-content;margin:6px auto 0}
h2{font-family:var(--serif);font-weight:600;font-size:clamp(1.7rem,4vw,2.4rem);text-align:center;margin:8px 0 6px}h2 em{font-style:italic;color:var(--gold)}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:22px 0 8px}@media(max-width:720px){.steps{grid-template-columns:1fr}}
.step{border:1px solid var(--line);border-radius:14px;padding:20px;background:rgba(35,21,83,.4)}
.step .n{color:var(--gold);font-family:var(--serif);font-size:1.4rem}.step h3{margin:6px 0 4px;font-size:1.05rem}.step p{color:var(--mut);font-size:.92rem}
.sec{padding:30px 0}.midcta{text-align:center;padding:36px 0}
footer{border-top:1px solid var(--line);margin-top:20px;padding:26px 0;color:var(--faint);font-size:.86rem}
.foot{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between}.foot a{color:var(--mut)}.foot a:hover{color:var(--ink)}
.gm-header{position:sticky;top:0;z-index:50;background:rgba(19,10,38,.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid #3a2a6b}
.gm-bar{max-width:1120px;margin:0 auto;padding:12px 22px;display:flex;align-items:center;gap:18px}
.gm-brand{display:flex;align-items:center;gap:9px;color:#f7f1ff;font-family:var(--serif);font-size:20px;font-weight:600;white-space:nowrap}.gm-brand b{color:#ffe390}
.gm-nav{display:flex;align-items:center;gap:20px;margin-left:8px;flex-wrap:wrap}
.gm-nav>a,.gm-dd-t{color:#c6b6ea;font-size:14px;transition:color .18s;padding:4px 0;cursor:pointer}.gm-nav>a:hover,.gm-dd-t:hover{color:#fff}
.gm-nav [aria-current=page]{color:#fff}
.gm-spacer{flex:1}
.gm-cta{background:linear-gradient(180deg,#ffe390,#f5c451);color:#2a1c04;font-weight:800;font-size:14px;padding:9px 20px;border-radius:999px;white-space:nowrap;cursor:pointer;transition:transform .18s}.gm-cta:hover{transform:translateY(-1px)}
@media(max-width:860px){.gm-nav{gap:12px}.gm-hide-sm{display:none}}
""" + NAV_CSS

BRAND = ('<a class="gm-brand" href="/"><svg width="28" height="28" viewBox="0 0 48 48" aria-hidden="true"><defs>'
 '<linearGradient id="gmlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe390"/><stop offset="1" stop-color="#e0a52f"/></linearGradient></defs>'
 '<path d="M6 30c0-4 6-7 15-7 3 0 5 .3 7 .8l7-3.5c1.4-.7 2.6.9 1.7 2.2l-2.3 3.2c2 1.3 3.2 2.8 3.2 4.3 0 4-7 7-16.5 7S6 34 6 30Z" fill="url(#gmlg)"/></svg>'
 '<span>Genie<b>Made</b></span></a>')

def header(active): return f'<header class="gm-header"><div class="gm-bar">{BRAND}{nav(active)}<span class="gm-spacer"></span><a class="gm-cta" href="/app">Open the Studio</a></div></header>'
FOOTER = ('<footer><div class="wrap foot"><div>© GenieMade · a CyberHope AI product</div>'
 '<div style="display:flex;gap:18px;flex-wrap:wrap"><a href="/holidays">Holidays</a><a href="/make">Occasions</a><a href="/invitations">Invitations</a>'
 '<a href="https://eververify.org/verify" target="_blank" rel="noopener">Verify a creation</a></div></div></footer>')

def page(title, desc, canonical, active, body):
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
     f'<title>{H.escape(title)}</title><meta name="description" content="{H.escape(desc)}"><link rel="canonical" href="{canonical}">'
     f'<meta name="robots" content="index, follow, max-image-preview:large"><meta property="og:title" content="{H.escape(title)}">'
     f'<meta property="og:description" content="{H.escape(desc)}"><meta property="og:url" content="{canonical}">'
     f'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
     f'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">'
     f'<style>{HEAD_CSS}</style></head><body>{header(active)}<main class="wrap">{body}</main>{FOOTER}</body></html>')

# ---------- hub page ----------
def hub(cat, items, title_word, lead, active):
    cards=""
    for slug,name,emoji,pack,imgs,blurb in items:
        cards+=(f'<a class="look" href="/{cat}/{slug}"><img src="{img(imgs[0])}" alt="{H.escape(name)} — GenieMade" loading="lazy" width="512" height="512">'
                f'<div class="cap"><b>{emoji} {H.escape(name)}</b><span class="go">Open →</span></div></a>')
    body=(f'<section class="hero"><span class="eyebrow">GenieMade {title_word}</span>'
          f'<h1>{lead[0]}</h1><p class="lead">{lead[1]}</p>'
          f'<div class="cta-row"><a class="btn gold" href="/app">Start free</a></div>'
          f'<div class="free">✦ Your first 3 creations are free · turn any into a card or e-invite</div></section>'
          f'<section class="sec"><div class="looks">{cards}</div></section>')
    return page(lead[2], lead[3], f"{CDN}/{cat}", active, body)

# ---------- item page ----------
def item_page(cat, item, active, kind):
    slug,name,emoji,pack,imgs,blurb=item
    verb = "Send a card or e-invite" if kind=="holiday" else "Make an invitation"
    tiles=""
    for u in imgs:
        look=u.split("/")[-1].replace("-"," ").title()
        tiles+=(f'<a class="look" href="/app?pack={pack}"><img src="{img(u)}" alt="{H.escape(name)} — {H.escape(look)} — GenieMade" loading="lazy" width="512" height="512">'
                f'<div class="cap"><b>{H.escape(look)}</b><span class="go">Star in it →</span></div></a>')
    steps=('<div class="steps">'
           '<div class="step"><div class="n">1</div><h3>Pick a look</h3><p>Choose a scene below — you’ll be the star of it.</p></div>'
           '<div class="step"><div class="n">2</div><h3>Add your photo</h3><p>Upload one selfie. We put your face in the scene, beautifully.</p></div>'
           f'<div class="step"><div class="n">3</div><h3>Card or e-invite</h3><p>Add your message, then download or share your {H.escape(name)} card.</p></div></div>')
    body=(f'<section class="hero"><span class="eyebrow">{emoji} {H.escape(name)}</span>'
          f'<h1>{H.escape(name)} — <em>starring you</em></h1><p class="lead">{H.escape(blurb)} {verb} in seconds — certified and provably yours.</p>'
          f'<div class="cta-row"><a class="btn gold" href="/app?pack={pack}">Make my {H.escape(name)} card</a>'
          f'<a class="btn ghost" href="/app?pack={pack}">Send an e-invite</a></div>'
          f'<div class="free">✦ First 3 free · no card to start</div></section>'
          f'<section class="sec"><h2>Pick your <em>{H.escape(name)}</em> look</h2><div class="looks">{tiles}</div>'
          f'<div class="cert-strip">◈ Every creation ships with a certificate of authenticity</div></section>'
          f'<section class="sec">{steps}</section>'
          f'<div class="midcta"><a class="btn gold" href="/app?pack={pack}">Start my {H.escape(name)} creation →</a></div>')
    title=f"{name} Cards & E-Invites — Put Your Face In It | GenieMade"
    desc=f"{blurb} Make a personalized {name} card or e-invite starring you — certified and provably yours. First 3 free."
    return page(title, desc, f"{CDN}/{cat}/{slug}", active, body)

# ---------- write files ----------
os.makedirs(f"{SITE}/holidays", exist_ok=True)
os.makedirs(f"{SITE}/invitations", exist_ok=True)
open(f"{SITE}/holidays/index.html","w").write(hub("holidays", HOLIDAYS, "Holidays",
  ("Make a card for <em>every holiday</em>","New Year to Christmas — put your face in the scene and send a card or e-invite they’ll never forget.",
   "Holiday Cards & E-Invites — Starring You | GenieMade","Personalized AI holiday cards and e-invites for every holiday — certified and provably yours. First 3 free."), "holidays"))
for it in HOLIDAYS: open(f"{SITE}/holidays/{it[0]}.html","w").write(item_page("holidays", it, "holidays","holiday"))
open(f"{SITE}/invitations/index.html","w").write(hub("invitations", INVITATIONS, "Invitations",
  ("Send an <em>e-invite</em> they’ll show off","Birthday to wedding — you’re on the invitation. Personalized, certified, and ready to text or email.",
   "E-Invitations — Put Yourself On The Invite | GenieMade","Personalized AI e-invitations for parties, weddings, showers and more — starring you. First 3 free."), "invitations"))
for it in INVITATIONS: open(f"{SITE}/invitations/{it[0]}.html","w").write(item_page("invitations", it, "invitations","invite"))

print("holidays: index +", len(HOLIDAYS), "pages")
print("invitations: index +", len(INVITATIONS), "pages")
# emit the nav+css snippets for patching index.html & make/index.html
open("/tmp/claude-1000/-home-cyberhope-Documents-pcos-agent/ed382083-46c7-4b2d-8dde-91a4065bac24/scratchpad/_nav_home.html","w").write(nav(""))
open("/tmp/claude-1000/-home-cyberhope-Documents-pcos-agent/ed382083-46c7-4b2d-8dde-91a4065bac24/scratchpad/_nav_occ.html","w").write(nav("occasions"))
open("/tmp/claude-1000/-home-cyberhope-Documents-pcos-agent/ed382083-46c7-4b2d-8dde-91a4065bac24/scratchpad/_nav_css.txt","w").write(NAV_CSS)
print("wrote nav snippets")
PY = None
