# Braverse Binder — source

This is the source for **Braverse Binder**, a CookieRun: Braverse TCG
collection tracker. The live, shared copy is published as a Claude Artifact
(a self-contained page hosted on claude.ai) — this folder is the actual
source you edit; the artifact is just where the finished page ends up. A
copy is also served from GitHub Pages; it works the same but keeps progress
only in each browser.

## What the page does

Four pages, addressed by a bare hash (`#overview`, `#collection`,
`#wishlist`, `#spending`) so a shared link can open straight to one:

- **Overview** — progress ring and next goal, per-set progress (tap a set to
  open it), breakdown by rarity / color / type, the sets closest to
  completion, a foil shelf of owned UR+ cards, milestones, and a spending
  snapshot. Everything is computed from the collection; nothing extra is
  stored.
- **Collection** — every set as an accordion, shown either as **Binder**
  (3×3 pocket pages, two-page spreads on wide screens, page slider, swipe and
  arrow keys) or as a **Grid** (names, tags, sortable). Search, color /
  rarity / type filters, owned / missing view. Each card has a detail view
  (the magnifier on a tile).
- **Wishlist** — one flat list of wanted cards in release order.
- **Spending** — log a purchase (date, amount, series, type, note), then see
  totals, a time-accurate running-total chart, monthly bars, a by-type donut,
  by-series bars with cost per card, a monthly budget, and a history that can
  be filtered, edited, deleted (with undo) and copied as CSV.

On a phone the page navigation moves to a bottom tab bar.

## How it fits together

- `app.js` — all runtime JS, in sections: data and state, rendering (tiles,
  binder pages, sets), save/publish, sound, interactions, card detail,
  overview, spending, routing and wiring. Plain ES5-style, one IIFE.
- `style.css` — all styles. White-and-gold design tokens are at the top; gold
  is the single accent and green is reserved for "owned".
- `shell.html` — the static HTML shell. Most views are filled in by JS, but
  the form controls live here so their ids stay stable across republishes.
- `set_meta.json` — booster set / starter deck metadata (names, codes,
  group labels).
- `cards_with_img_v2.json` — **all 2,274 cards**, each as a
  `[id, setCode, cardNumber, name, rarityLetter, cardType, color, setName,
  base64WebP]` tuple. The card art is embedded directly as base64 WEBP
  (104×145px, ~5–7KB each) — there is no external image loading. This file
  is ~15.6MB and is the bulk of the built page's size.
- `initial_state.json` — the collection state baked into the page on first
  load: `{ owned, spending, wishlist, budget }`. See "Syncing state" below.
- `build.py` — assembles all of the above into the single deployable file,
  `braverse-binder.html`.
- `verify_roundtrip.py` — sanity-checks that build.
- `index.html` — a one-line redirect so GitHub Pages serves the app at the
  site root.

Run `python3 build.py` after any change to regenerate `braverse-binder.html`.
Always run `python3 verify_roundtrip.py` afterward before treating a build
as good — see "The self-publishing quine" below for why this matters.

## State shape

`cr-state` (and `initial_state.json`) holds:

- `owned` — array of card ids (e.g. `BS11-089`, `BS11-089@1` for alt art)
- `wishlist` — array of card ids
- `spending` — array of `{ id, date: "YYYY-MM-DD", amount, note, series,
  kind }`. `series` is a set code (`BS11`, `ST3`, `P`) or `""` for none;
  `kind` is one of `box`, `packs`, `deck`, `singles`, `gear`, `other`.
  Older entries without `series` get it read back out of the note on load.
- `budget` — monthly budget in dollars, `0` for none
- `savedAt` — when the page last saved (ms since 1970). In the artifact, a
  browser's own snapshot is only used on load if it is newer than this, so a
  stale snapshot never undoes a change made on another device. When you
  publish a deliberately merged state, set `savedAt` in `initial_state.json`
  to the current time so it beats any older snapshots. On a plain web host the
  browser's snapshot always wins and the baked state only seeds a first visit.

Per-viewer preferences (layout, chart range, sort, sound) are not part of the
shared state; they live in each browser's localStorage.

## The self-publishing quine (important — read before editing `app.js`)

`braverse-binder.html` is not just a static export — it's a page that can
**republish itself**. When you check off cards, add to the wishlist, or log
a purchase inside the running page, `app.js` regenerates its own complete
HTML (via `buildDocument()`) using the exact same
`PART_A + stateJson + PART_B1 + SELF_SRC + PART_B2` formula that `build.py`
uses, and republishes that as the new Claude Artifact version. This is how
your collection progress gets saved without any backend.

What this means practically:

- **The page must stay a single self-contained HTML file with no build
  step at runtime.** Introducing React/Vue/a bundler/an `import` would break
  the self-republish mechanism, since the running page has to be able to
  reproduce its own exact source as a string.
- `app.js` contains the literal placeholder tokens `"__PART_A__"`,
  `"__PART_B1__"`, `"__PART_B2__"`, `__CARDS_JSON__`, and
  `__SET_META_JSON__`. Don't remove these — `build.py` substitutes real
  values into them.
- Anything the running page adds to the DOM or `<html>` (the `ready` class,
  the removed loading note) is not part of the template, so it never leaks
  into a republish. Keep it that way.
- After any change, `python3 verify_roundtrip.py` checks that a page built
  from the output can regenerate byte-identical output a second time
  (simulating a real in-browser republish). If this fails after an edit,
  something about the quine mechanism broke — don't publish until it
  passes.
- When adding a field to the state, add it to `buildDocument()`, `doSave()`,
  the localStorage backups, backup/restore (`importState`), and
  `initial_state.json`.

On GitHub Pages (or any host without the artifact capability) the sync pill
reads "Local only": progress is kept in that browser's localStorage and is
not shared.

## The 16MB hard cap

Claude Artifacts have a **16MB (16,777,216 byte) hard size limit** — the
publish is refused above that. The current build is ~16.2MB, so there is
roughly 0.6MB of headroom, almost entirely eaten by card art. The CSS and
the shell are each included twice (once live, once inside the `PART_A` /
`PART_B1` strings the quine republishes from), so every byte of CSS or
markup costs two. There's also no way to hotlink external images from a
published Artifact — everything has to be embedded as a data URI, which is
why the card art is base64-encoded directly into `cards_with_img_v2.json`.

## Syncing state before you publish

The live artifact keeps saving progress while you work here, so a build made
from stale state would overwrite it. Before publishing:

1. Read the live artifact's `cr-state` (the Artifact tool's `read` action with
   `path: "index.html"` saves the page without printing it).
2. Make `initial_state.json` match it, or the union of it and anything newer
   that should be kept. Compare `owned` and `wishlist` as sets.
3. `python3 build.py`, `node --check app.js`, `python3 verify_roundtrip.py`.
4. Publish `braverse-binder.html` to the same artifact URL, keeping the
   `artifact` capability declared.

## Publishing a change back to the live artifact

This repo doesn't have a CLI publish command — publishing happens through
whichever Claude surface has the Artifact tool. The general flow, if you're
working here and want a change to go live:

1. Edit `app.js` / `style.css` / `shell.html` etc.
2. Sync state (above), then `python3 build.py`.
3. `node --check app.js` and `python3 verify_roundtrip.py` — both must pass.
4. Publish `braverse-binder.html` to the artifact (same URL).
5. Commit and push: GitHub Pages rebuilds from the repo's root.

On Windows the `python` on the PATH may be the Microsoft Store stub; use the
real interpreter directly (for example `C:\Python314\python.exe`).

## Testing locally

Serve the folder (`python -m http.server 8347`) and open
`braverse-binder.html`. Use a cache-busting query (`?v=2`) when reloading,
because changing only the hash does not reload the page. To exercise the
self-publish path, load a copy with a stub defined before the app runs:
`window.claude = { use: () => Promise.resolve({ publish: html => { window.__published = html; return Promise.resolve(); } }) }`
and compare `window.__published` with the original document; they should
differ only in the `cr-state` JSON.

## Data & attribution

Card data and art credit: cookierun.gg and the official card list. Not
affiliated with Devsisters.
