/* The site navigation, in one place.
 *
 * Every page used to carry its own hand-written header: the marketing header was
 * duplicated byte-for-byte across six pages, /app, /director and /films each had a
 * bespoke one, and privacy/terms had a stub. Twelve copies meant a new feature landed
 * in whichever one you remembered — which is why the Director shipped into /app and
 * /director only, and was invisible from the other ten.
 *
 * Edit this file, run `node build-nav.mjs`, and every page changes together.
 *
 * Top level is single words; the detail lives in the dropdown. That keeps the bar on
 * ONE line — the old /app header carried twelve items and wrapped, which is what made
 * "My Vault" render as a two-line button.
 */

// The creation tools. This group is why the Director is now reachable from every page.
export const STUDIO = {
  label: "Studio", href: "/app",
  items: [
    ["/app", "\u{1FA84} Make a wish"],
    ["/director", "\u{1F3A5} Director"],
    ["/films", "\u{1F3AC} Films"],
    ["/studio-you", "\u2728 Studio You"],
    ["/people", "\u{1F465} My People"],
    ["/import", "\u2B06 Import"],
  ],
};

export const HOLIDAYS = {
    "href": "/holidays",
    "items": [
      [
        "/holidays/new-year",
        "🎆 New Year"
      ],
      [
        "/holidays/valentines",
        "💝 Valentine&#x27;s Day"
      ],
      [
        "/holidays/st-patricks",
        "☘️ St. Patrick&#x27;s Day"
      ],
      [
        "/holidays/easter",
        "🐰 Easter"
      ],
      [
        "/holidays/cinco-de-mayo",
        "🌮 Cinco de Mayo"
      ],
      [
        "/holidays/mothers-day",
        "💐 Mother&#x27;s Day"
      ],
      [
        "/holidays/fathers-day",
        "👔 Father&#x27;s Day"
      ],
      [
        "/holidays/july-4th",
        "🎆 Independence Day"
      ],
      [
        "/holidays/halloween",
        "🎃 Halloween"
      ],
      [
        "/holidays/thanksgiving",
        "🦃 Thanksgiving"
      ],
      [
        "/holidays/hanukkah",
        "🕎 Hanukkah"
      ],
      [
        "/holidays/christmas",
        "🎄 Christmas"
      ]
    ]
  };

export const OCCASIONS = {
    "href": "/make",
    "items": [
      [
        "/make/birthday",
        "🎂 Birthday"
      ],
      [
        "/make/love",
        "💘 Love &amp; Anniversary"
      ],
      [
        "/make/congrats",
        "🏆 Congrats"
      ],
      [
        "/make/graduation",
        "🎓 Graduation"
      ],
      [
        "/make/cheer-up",
        "☀️ Cheer Up"
      ],
      [
        "/make/thank-you",
        "🙏 Thank You"
      ],
      [
        "/make/dance",
        "🕺 Dance Floor"
      ],
      [
        "/make/game-on",
        "🎮 Game On"
      ],
      [
        "/make/icons",
        "🧠 Hall of Icons"
      ],
      [
        "/make/legends",
        "⚡ Epic Legends"
      ],
      [
        "/make/queens",
        "👑 Icon Queens"
      ]
    ]
  };

export const INVITATIONS = {
    "href": "/invitations",
    "items": [
      [
        "/invitations/birthday-party",
        "🎂 Birthday Party"
      ],
      [
        "/invitations/wedding",
        "💍 Wedding"
      ],
      [
        "/invitations/engagement",
        "💞 Engagement"
      ],
      [
        "/invitations/anniversary",
        "🥂 Anniversary"
      ],
      [
        "/invitations/baby-shower",
        "👶 Baby Shower"
      ],
      [
        "/invitations/graduation-party",
        "🎓 Graduation Party"
      ],
      [
        "/invitations/halloween-party",
        "🎃 Halloween Party"
      ],
      [
        "/invitations/holiday-party",
        "🎉 Holiday Party"
      ],
      [
        "/invitations/dinner-party",
        "🍷 Dinner Party"
      ],
      [
        "/invitations/cookout",
        "🍔 BBQ &amp; Cookout"
      ],
      [
        "/invitations/retirement",
        "🏆 Retirement"
      ],
      [
        "/invitations/housewarming",
        "🏡 Housewarming"
      ]
    ]
  };

/* Proof — the one thing no competitor offers, so it gets its own group.
 *
 * This is a dropdown rather than a seventh top-level word because the bar must stay on ONE
 * line (see the note at the top of this file). A caret costs nothing; "Guides" costs ~60px.
 *
 * It also fixes an orphan: /guides shipped 2026-08-31 with five articles that nothing on the
 * site linked to. They were in the sitemap, so Google could crawl them, but no visitor could
 * reach them and no internal link equity flowed to them. /import appears here as well as in
 * Studio on purpose — a nav is for finding things, not for describing the file tree once. */
export const PROOF = {
  label: "Verify", href: "/verify",
  items: [
    ["/verify", "\u{1F50E} Verify a file"],
    ["/import", "⬆ Register your work"],
    ["/guides/", "\u{1F4D6} Guides"],
  ],
};

// Left-hand bar, in order. Dropdowns carry `items`; plain links do not.
export const MAIN = [
  STUDIO,
  { label: "Holidays", href: HOLIDAYS.href, items: HOLIDAYS.items },
  { label: "Occasions", href: OCCASIONS.href, items: OCCASIONS.items },
  { label: "Invitations", href: INVITATIONS.href, items: INVITATIONS.items },
  { label: "Pricing", href: "/#pricing" },
  PROOF,
];
