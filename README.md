# Braverse Binder — source

This is the source for **Braverse Binder**, a CookieRun: Braverse TCG
collection tracker. The live, shared copy is published as a Claude Artifact
(a self-contained page hosted on claude.ai) — this folder is the actual
source you edit; the artifact is just where the finished page ends up.

## How it fits together

- `app.js` — all runtime JS (rendering, filters, wishlist, spending charts,
  the foil/tilt/rainbow-border hover effects).
- `style.css` — all styles.
- `shell.html` — the static HTML shell (header, controls, page markup) that
  wraps around the JS-rendered content.
- `set_meta.json` — booster set / starter deck metadata (names, codes,
  group labels).
- `cards_with_img_v2.json` — **all 2,244 cards**, each as a
  `[id, setCode, cardNumber, name, rarityLetter, cardType, color, setName,
  base64WebP]` tuple. The card art is embedded directly as base64 WEBP
  (104×145px, ~5–7KB each) — there is no external image loading. This file
  is ~15.6MB and is the bulk of the built page's size.
- `build.py` — assembles all of the above into the single deployable file,
  `braverse-binder.html`.
- `verify_roundtrip.py` — sanity-checks that build.

Run `python3 build.py` after any change to regenerate `braverse-binder.html`.
Always run `python3 verify_roundtrip.py` afterward before treating a build
as good — see "The self-publishing quine" below for why this matters.

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
- After any change, `python3 verify_roundtrip.py` checks that a page built
  from the output can regenerate byte-identical output a second time
  (simulating a real in-browser republish). If this fails after an edit,
  something about the quine mechanism broke — don't publish until it
  passes.

## The 16MB hard cap

Claude Artifacts have a **16MB (16,777,216 byte) hard size limit** — the
publish is refused above that. The current build is ~15.75MB, so there's
only a little headroom left, almost entirely eaten by card art. Keep this
in mind before adding more embedded images or bulking up the card data.
There's also no way to hotlink external images from a published Artifact —
everything has to be embedded as a data URI, which is why the card art is
base64-encoded directly into `cards_with_img_v2.json`.

## Publishing a change back to the live artifact

This repo doesn't have a CLI publish command — publishing happens through
whichever Claude surface has the Artifact tool (this session's Cowork/chat
environment). The general flow, if you're working here in Claude Code and
want a change to go live:

1. Edit `app.js` / `style.css` / etc.
2. `python3 build.py`
3. `node --check app.js` and `python3 verify_roundtrip.py` — both must pass.
4. Hand `braverse-binder.html` back to the Claude session that has artifact
   publish access (or ask it to re-read the source files here and rebuild),
   so it can re-read the *live* artifact's current `cr-state` first (to
   avoid overwriting collection progress saved since this copy was made)
   and then publish.

## Data & attribution

Card data and art credit: cookierun.gg. Not affiliated with Devsisters.
