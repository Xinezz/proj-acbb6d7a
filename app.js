(function(){
"use strict";
var SELF_SRC = document.currentScript ? document.currentScript.textContent : "";

/* ===== Static template fragments (used to republish this artifact) ===== */
var PART_A = "__PART_A__";
var PART_B1 = "__PART_B1__";
var PART_B2 = "__PART_B2__";

/* ===== Card database: [id, set, num, name, rarity, type, color, product] ===== */
var CARDS = __CARDS_JSON__;
/* ===== Set metadata: [code, label, group] in release order ===== */
var SET_META = __SET_META_JSON__;

var RARITY_INFO = {
  C:   { name: "Common",             tier: "low" },
  U:   { name: "Uncommon",           tier: "low" },
  R:   { name: "Rare",               tier: "mid" },
  SR:  { name: "Super Rare",         tier: "mid" },
  UR:  { name: "Ultra Rare",         tier: "high" },
  SEC: { name: "Secret Rare",        tier: "high" },
  SSR: { name: "Secret Super Rare",  tier: "high" },
  SUR: { name: "Secret Ultra Rare",  tier: "high" },
  EXR: { name: "Extra Rare",         tier: "high" },
  GXR: { name: "Genesis Extra Rare", tier: "high" },
  P:   { name: "Promo",              tier: "mid" }
};
var RARITY_ORDER = ["C","U","R","SR","UR","SEC","SSR","SUR","EXR","GXR","P"];
var RARITY_RANK = {};
RARITY_ORDER.forEach(function(r, i){ RARITY_RANK[r] = i; });
var COLOR_ORDER = ["RED","YELLOW","GREEN","BLUE","PURPLE","BLACK","PURE","COLORLESS"];
var COLOR_NAME = { RED:"Red", YELLOW:"Yellow", GREEN:"Green", BLUE:"Blue", PURPLE:"Purple", BLACK:"Black", PURE:"Pure", COLORLESS:"Colorless" };
var COLOR_HEX = { RED:"var(--c-red)", YELLOW:"var(--c-yellow)", GREEN:"var(--c-green)", BLUE:"var(--c-blue)", PURPLE:"var(--c-purple)", BLACK:"var(--c-black)", PURE:"var(--c-pure)", COLORLESS:"var(--c-colorless)" };
var TYPE_ORDER = ["COOKIE","STAGE","TRAP","ITEM","FLIP","EXTRA","NPC"];
var TYPE_NAME = { COOKIE:"Cookie", STAGE:"Stage", TRAP:"Trap", ITEM:"Item", FLIP:"Flip", EXTRA:"Extra", NPC:"NPC" };
var GROUP_NAME = { Booster: "Booster Packs", Starter: "Starter Decks", Promo: "Promo & Events" };

/* What a purchase can be. Colors are the gold-to-bronze ramp the donut chart
   uses; the last two are deliberately quiet so the real spending stands out. */
var SPEND_KINDS = [
  { id: "box",     name: "Booster box",       color: "#b8862a" },
  { id: "packs",   name: "Booster packs",     color: "#e2c05f" },
  { id: "deck",    name: "Starter deck",      color: "#8a6a3a" },
  { id: "singles", name: "Single cards",      color: "#d4a191" },
  { id: "gear",    name: "Binders & sleeves", color: "#a59d88" },
  { id: "other",   name: "Other",             color: "#d9cfb4" }
];
var KIND_BY_ID = {};
SPEND_KINDS.forEach(function(k){ KIND_BY_ID[k.id] = k; });

var CHECK_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var WISH_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 13.6s-5.4-3.25-6.95-6.35C-.35 4.9 1 2.55 3.45 2.27c1.4-.16 2.75.55 3.55 1.75.8-1.2 2.15-1.91 3.55-1.75 2.45.28 3.8 2.63 2.4 5-1.55 3.1-6.95 6.33-6.95 6.33z"/></svg>';
var COMPLETE_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 13.6s-5.4-3.25-6.95-6.35C-.35 4.9 1 2.55 3.45 2.27c1.4-.16 2.75.55 3.55 1.75.8-1.2 2.15-1.91 3.55-1.75 2.45.28 3.8 2.63 2.4 5-1.55 3.1-6.95 6.33-6.95 6.33z"/></svg>';
/* Small gem glyph -- a quick-scan rarity signal next to the card number, so a
   glance at a row of cards tells you which are worth a second look without
   reading the rarity pill text. */
var GEM_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.2 1.6h7.6l2.9 4-7.2 8.8-7.2-8.8 2.9-4z"/></svg>';
var ZOOM_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="7" cy="7" r="4.3"/><path d="M10.4 10.4L14 14"/></svg>';
var CHEV_L_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEV_R_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var EDIT_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l.6-2.8L11 2.8a1.4 1.4 0 0 1 2 2l-7.4 7.4L3 13z"/></svg>';
var TRASH_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5"/></svg>';
var MEDAL_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.5l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.2z"/></svg>';

/* ===== Index cards by set ===== */
var CARDS_BY_SET = {};
var CARD_BY_ID = {};
for (var i = 0; i < CARDS.length; i++) {
  var c = CARDS[i];
  var setCode = c[1];
  if (!CARDS_BY_SET[setCode]) CARDS_BY_SET[setCode] = [];
  CARDS_BY_SET[setCode].push(c);
  CARD_BY_ID[c[0]] = c;
}
/* Show each set in binder order -- 001 first, each alt-art/promo version
   (@1, @2 ...) right after its base card -- the same order as the official
   card list and a physical binder. The source data happens to be stored
   newest-number-first, which used to put a set's commons at the very bottom
   of a long grid where they were easy to miss entirely. */
function cardOrderKey(id){
  var m = /[-_](\d+)(?:@(\d+))?$/.exec(id);
  return m ? [parseInt(m[1], 10), m[2] ? parseInt(m[2], 10) : 0] : [99999, 0];
}
function compareBinderOrder(a, b){
  var ka = cardOrderKey(a[0]), kb = cardOrderKey(b[0]);
  return (ka[0] - kb[0]) || (ka[1] - kb[1]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
}
Object.keys(CARDS_BY_SET).forEach(function(code){
  CARDS_BY_SET[code].sort(compareBinderOrder);
});
var SET_LABEL = {};
var SET_INDEX = {};
SET_META.forEach(function(s, idx){ SET_LABEL[s[0]] = s[1]; SET_INDEX[s[0]] = idx; });

function byId(id){ return document.getElementById(id); }

/* ===== State ===== */
function readDocState(){
  try {
    var el = byId("cr-state");
    var parsed = JSON.parse((el && el.textContent) || "{}");
    return (parsed && typeof parsed === "object") ? parsed : {};
  } catch(e){ return {}; }
}
function readLocalJson(key){
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}
var DOC_STATE = readDocState();

/* Where the starting state comes from.

   The page itself carries the last saved collection. This browser also keeps a
   full snapshot of the last thing it saved, stamped with the time, written just
   before each publish attempt.

   - In the shared artifact the page is the source of truth. The browser
     snapshot is used only when it is newer than the page, meaning a change
     that never finished publishing (which is then published again). Otherwise
     an edit or an unchecked card made on another device would be quietly
     undone by a stale snapshot here.
   - On a plain web host there is nothing shared to sync with, so this
     browser's own snapshot is the truth and the page only seeds a first
     visit. */
function readSnapshot(){
  var snap = {
    owned: readLocalJson("crb_owned_backup"),
    spending: readLocalJson("crb_spending_backup"),
    wishlist: readLocalJson("crb_wishlist_backup"),
    budget: readLocalJson("crb_budget_backup"),
    extras: readLocalJson("crb_extras_backup")
  };
  if (!Array.isArray(snap.owned) || !Array.isArray(snap.spending) || !Array.isArray(snap.wishlist)) return null;
  snap.budget = Number(snap.budget) > 0 ? Number(snap.budget) : 0;
  snap.savedAt = 0;
  try { snap.savedAt = Number(localStorage.getItem("crb_saved_at")) || 0; } catch(e){}
  return snap;
}

/* A purchase records when it happened, how much, which set it was for and
   what kind of thing it was. Older entries only had a date, amount and note;
   for those the set is read back out of the note ("... - BS11") so existing
   history lands in the right series without anyone re-entering it. */
function inferSeries(note){
  var m = /\b(BS\d{1,2}|ST\d{1,2})\b/i.exec(note || "");
  if (!m) return "";
  var code = m[1].toUpperCase();
  return SET_LABEL[code] ? code : "";
}

function normalizeSpendEntry(e){
  if (!e || typeof e !== "object") return null;
  var amount = Number(e.amount);
  if (!isFinite(amount) || amount < 0) return null;
  amount = Math.round(amount * 100) / 100;
  var date = (typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) ? e.date : todayLocalISO();
  var id = (typeof e.id === "string" && e.id) ? e.id : ("s_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7));
  var note = typeof e.note === "string" ? e.note.slice(0, 120) : "";
  var series = (typeof e.series === "string" && (e.series === "" || SET_LABEL[e.series])) ? e.series : "";
  if (!series && !("series" in e)) series = inferSeries(note);
  var kind = (typeof e.kind === "string" && KIND_BY_ID[e.kind]) ? e.kind : "other";
  return { id: id, date: date, amount: amount, note: note, series: series, kind: kind };
}

/* Extra copies: how many spares of a card you hold beyond the one that sits in
   the binder. Stored as { cardId: count } with counts of 1 or more. Spares
   only exist for a card you own, so a card with spares is always owned. */
var MAX_EXTRAS = 99;
function normalizeExtras(raw, owned){
  var out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  Object.keys(raw).forEach(function(id){
    var n = Math.floor(Number(raw[id]));
    if (!(n >= 1) || !CARD_BY_ID[id]) return;
    out[id] = Math.min(n, MAX_EXTRAS);
    if (owned) owned.add(id);
  });
  return out;
}

function loadInitialState(){
  var inArtifact = !!(window.claude && typeof window.claude.use === "function");
  var snap = readSnapshot();
  var docTs = Number(DOC_STATE.savedAt) || 0;
  var useSnap = !!snap && (inArtifact ? snap.savedAt > docTs : true);
  var src = useSnap ? snap : DOC_STATE;
  var spending = [];
  (Array.isArray(src.spending) ? src.spending : []).forEach(function(e){
    var n = normalizeSpendEntry(e);
    if (n) spending.push(n);
  });
  spending.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  var budget = Number(src.budget);
  var owned = new Set((Array.isArray(src.owned) ? src.owned : []).filter(function(id){ return typeof id === "string"; }));
  var extras = normalizeExtras(src.extras, owned);
  return {
    owned: owned,
    extras: extras,
    wishlist: new Set((Array.isArray(src.wishlist) ? src.wishlist : []).filter(function(id){ return typeof id === "string"; })),
    spending: spending,
    budget: budget > 0 ? Math.round(budget * 100) / 100 : 0,
    unpublished: useSnap && inArtifact
  };
}

/* Filled in by init() once the page (and, in the viewer, its runtime) is ready. */
var state = { owned: new Set(), extras: {}, spending: [], wishlist: new Set(), budget: 0 };
var filters = { q: "", color: "", rarity: "", type: "", view: "all", sort: "binder" };
var ui = {
  expanded: new Set(), tab: "overview", layout: "binder", binderPage: {},
  breakdown: "rarity", range: "all",
  histSeries: "", histKind: "", histSort: "new", editSpendId: null,
  extraSort: "most", extraSet: "", extraQuery: "", extraPickSet: "", extraShow: 24, extraOrder: []
};
var pendingScrollY = null;

/* Per-viewer preferences (layout, chart range, breakdown tab). These live in
   this browser's localStorage, not in the shared collection state. */
var PREFS_KEY = "crb_prefs";
(function loadPrefs(){
  var p = readLocalJson(PREFS_KEY);
  if (!p || typeof p !== "object") return;
  if (p.layout === "grid" || p.layout === "binder") ui.layout = p.layout;
  if (p.range === "all" || p.range === "12" || p.range === "6" || p.range === "3") ui.range = p.range;
  if (p.breakdown === "rarity" || p.breakdown === "color" || p.breakdown === "type") ui.breakdown = p.breakdown;
  if (p.sort === "binder" || p.sort === "rarity" || p.sort === "name" || p.sort === "color") filters.sort = p.sort;
  if (p.extraSort === "most" || p.extraSort === "new" || p.extraSort === "set" || p.extraSort === "name") ui.extraSort = p.extraSort;
})();
function savePrefs(){
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ layout: ui.layout, range: ui.range, breakdown: ui.breakdown, sort: filters.sort, extraSort: ui.extraSort }));
  } catch(e){}
}

/* ===== UI stash across the publish-triggered reload ===== */
function stashUiState(){
  try {
    sessionStorage.setItem("crb_ui_stash", JSON.stringify({
      q: filters.q, color: filters.color, rarity: filters.rarity, type: filters.type, view: filters.view,
      expanded: Array.from(ui.expanded), tab: ui.tab, binderPage: ui.binderPage,
      histSeries: ui.histSeries, histKind: ui.histKind, histSort: ui.histSort,
      scrollY: window.scrollY, ts: Date.now()
    }));
  } catch(e){}
}
function restoreUiStateIfAny(){
  try {
    var raw = sessionStorage.getItem("crb_ui_stash");
    if (!raw) return false;
    sessionStorage.removeItem("crb_ui_stash");
    var s = JSON.parse(raw);
    if (!s || (Date.now() - s.ts) > 20000) return false;
    filters.q = s.q || ""; filters.color = s.color || ""; filters.rarity = s.rarity || "";
    filters.type = s.type || ""; filters.view = s.view || "all";
    ui.expanded = new Set(s.expanded || []);
    ui.tab = s.tab || "overview";
    if (s.binderPage && typeof s.binderPage === "object") ui.binderPage = s.binderPage;
    ui.histSeries = s.histSeries || ""; ui.histKind = s.histKind || ""; ui.histSort = s.histSort || "new";
    pendingScrollY = (typeof s.scrollY === "number") ? s.scrollY : null;
    return true;
  } catch(e){}
  return false;
}


/* ===== Matching / stats ===== */
function cardMatches(c){
  if (filters.color && c[6] !== filters.color) return false;
  if (filters.rarity && c[4] !== filters.rarity) return false;
  if (filters.type && c[5] !== filters.type) return false;
  if (filters.view === "owned" && !state.owned.has(c[0])) return false;
  if (filters.view === "missing" && state.owned.has(c[0])) return false;
  if (filters.view === "wishlist" && !state.wishlist.has(c[0])) return false;
  if (filters.q) {
    var q = filters.q;
    var hay = (c[3] + " " + c[0] + " " + c[2] + " " + (c[7]||"") + " " + (SET_LABEL[c[1]]||"")).toLowerCase();
    if (hay.indexOf(q) === -1) return false;
  }
  return true;
}

/* Grid-layout ordering. The binder layout always uses plain number order,
   because that is the order cards sit in a physical binder. */
function sortCards(list){
  var s = filters.sort;
  if (s === "binder") return list;
  var out = list.slice();
  if (s === "rarity") out.sort(function(a, b){ return (RARITY_RANK[b[4]] - RARITY_RANK[a[4]]) || compareBinderOrder(a, b); });
  else if (s === "name") out.sort(function(a, b){ return a[3].localeCompare(b[3]) || compareBinderOrder(a, b); });
  else if (s === "color") out.sort(function(a, b){ return (COLOR_ORDER.indexOf(a[6]) - COLOR_ORDER.indexOf(b[6])) || compareBinderOrder(a, b); });
  return out;
}
function compareReleaseOrder(a, b){
  return ((SET_INDEX[a[1]] || 0) - (SET_INDEX[b[1]] || 0)) || compareBinderOrder(a, b);
}

function setStats(code){
  var list = CARDS_BY_SET[code] || [];
  var owned = 0;
  for (var i = 0; i < list.length; i++) if (state.owned.has(list[i][0])) owned++;
  return { total: list.length, owned: owned };
}
function ownedCount(){
  var n = 0;
  state.owned.forEach(function(id){ if (CARD_BY_ID[id]) n++; });
  return n;
}
function overallStats(){
  return { total: CARDS.length, owned: ownedCount() };
}
function groupStats(grp){
  var owned = 0, total = 0;
  SET_META.forEach(function(s){
    if (s[2] !== grp) return;
    var st = setStats(s[0]);
    owned += st.owned; total += st.total;
  });
  return { owned: owned, total: total };
}
function countCompleteSets(){
  var n = 0;
  SET_META.forEach(function(s){
    var st = setStats(s[0]);
    if (st.total > 0 && st.owned === st.total) n++;
  });
  return n;
}
function ownedTierCount(tier){
  var n = 0;
  state.owned.forEach(function(id){
    var c = CARD_BY_ID[id];
    if (c && (RARITY_INFO[c[4]] || {}).tier === tier) n++;
  });
  return n;
}

function fmtInt(n){
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function fmtPct(frac, digits){
  var v = (Number(frac) || 0) * 100;
  return v.toFixed(digits == null ? 0 : digits) + "%";
}

/* ===== Rendering ===== */
var RING_C = 2 * Math.PI * 15.5;

function renderTopProgress(){
  var s = overallStats();
  byId("ownedCount").textContent = fmtInt(s.owned);
  byId("totalCount").textContent = fmtInt(s.total);
  var foot = byId("footCardCount");
  if (foot) foot.textContent = fmtInt(s.total);
  var pct = s.total ? s.owned / s.total : 0;
  var ring = byId("ringFg");
  ring.style.strokeDasharray = RING_C.toFixed(2);
  ring.style.strokeDashoffset = (RING_C * (1 - pct)).toFixed(2);
  var pctLabel = byId("ringPct");
  if (pctLabel) pctLabel.textContent = Math.round(pct * 100) + "%";
}

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(m){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m];
  });
}
function cssEsc(s){ return String(s).replace(/"/g, '\\"'); }
function getSetEl(code){ return document.querySelector('.set[data-code="' + cssEsc(code) + '"]'); }

function artHtml(c){
  var img = c[8];
  if (img) return '<div class="tile-art"><img src="data:image/webp;base64,' + img + '" alt="" loading="lazy" decoding="async" width="80" height="111"></div>';
  var colorHex = COLOR_HEX[c[6]] || "var(--c-colorless)";
  return '<div class="tile-art tile-art-empty" style="background:' + colorHex + '"><span>' + esc(c[3].slice(0,1)) + '</span></div>';
}

/* One card, in one of two shapes: the default grid tile (art, number, name,
   tags) or a binder pocket (art and number only, like a sleeve in a real
   binder). Both use the same .card-tile button, so the click handling,
   ownership state and foil effects are shared. */
function tileHtml(c, variant){
  var owned = state.owned.has(c[0]);
  var wished = state.wishlist.has(c[0]);
  var extrasN = state.extras[c[0]] || 0;
  var rInfo = RARITY_INFO[c[4]] || { name: c[4], tier: "low" };
  var colorHex = COLOR_HEX[c[6]] || "var(--c-colorless)";
  var wishLabel = wished ? "Remove from wishlist" : "Add to wishlist";
  var dis = readOnly ? " disabled" : "";
  var pocket = variant === "pocket";
  var inner;
  if (pocket) {
    inner =
      artHtml(c) +
      '<span class="tile-check">' + CHECK_SVG + '</span>' +
      '<span class="pocket-num mono">' + esc(c[2]) + '</span>';
  } else {
    inner =
      artHtml(c) +
      '<span class="tile-check">' + CHECK_SVG + '</span>' +
      '<div class="tile-num mono">' +
        '<span>' + esc(c[0]) + '</span>' +
        '<span class="tile-rarity-glyph" data-tier="' + esc(rInfo.tier) + '" title="' + esc(rInfo.name) + '">' + GEM_SVG + '</span>' +
      '</div>' +
      '<div class="tile-name">' + esc(c[3]) + '</div>' +
      '<div class="tile-tags">' +
        '<span class="pip" style="background:' + colorHex + '" title="' + esc(COLOR_NAME[c[6]]||c[6]) + '"></span>' +
        '<span class="rarity-pill" data-tier="' + rInfo.tier + '" title="' + esc(rInfo.name) + '">' + esc(c[4]) + '</span>' +
        '<span class="type-tag">' + esc(TYPE_NAME[c[5]]||c[5]) + '</span>' +
      '</div>';
  }
  return (
    '<div class="card-tile-wrap' + (pocket ? ' pocket-wrap' : '') + (extrasN ? ' has-stack' : '') + '">' +
      '<button type="button" class="card-tile' + (pocket ? ' pocket' : '') + '" data-id="' + esc(c[0]) + '" data-owned="' + owned + '" data-tier="' + esc(rInfo.tier) + '" title="' + esc(c[3]) + ' (' + esc(c[0]) + ')"' + dis + '>' +
        inner +
      '</button>' +
      '<button type="button" class="tile-wish" data-wish-id="' + esc(c[0]) + '" data-wished="' + wished + '" aria-pressed="' + wished + '" aria-label="' + esc(wishLabel) + '" title="' + esc(wishLabel) + '"' + dis + '>' + WISH_SVG + '</button>' +
      '<button type="button" class="tile-zoom" data-zoom-id="' + esc(c[0]) + '" aria-label="Card details: ' + esc(c[3]) + '" title="Card details">' + ZOOM_SVG + '</button>' +
      stackPeekHtml(extrasN) +
    '</div>'
  );
}

/* A card with spares shows the edges of the copies behind it and a count of
   how many you hold in all, so a stack reads at a glance in the binder. */
function stackPeekHtml(extras){
  if (!(extras > 0)) return '';
  var layers = Math.min(extras, 3), h = '<span class="stack-peek" aria-hidden="true">';
  for (var i = layers; i >= 1; i--) h += '<i style="--i:' + i + '"></i>';
  return h + '</span><span class="stack-count mono" title="' + (extras + 1) + ' copies, ' + extras + ' extra">\u00d7' + (extras + 1) + '</span>';
}

function paintTileStacks(id){
  var extras = state.extras[id] || 0, html = stackPeekHtml(extras);
  document.querySelectorAll('.card-tile[data-id="' + cssEsc(id) + '"]').forEach(function(tile){
    var wrap = tile.parentNode;
    wrap.querySelectorAll(".stack-peek, .stack-count").forEach(function(n){ n.parentNode.removeChild(n); });
    if (html) wrap.insertAdjacentHTML("beforeend", html);
    wrap.classList.toggle("has-stack", extras > 0);
  });
}

/* ===== Binder pages ===== */
var BINDER_PAGE = 9; /* 3 x 3 pockets, like a standard trading card page */
var binderMQ = window.matchMedia ? window.matchMedia("(min-width: 880px)") : null;

function binderPerView(){ return binderMQ && binderMQ.matches ? 2 : 1; }

function binderMeta(code){
  var list = (CARDS_BY_SET[code] || []).filter(cardMatches);
  var per = binderPerView();
  var pages = Math.max(1, Math.ceil(list.length / BINDER_PAGE));
  return { list: list, per: per, pages: pages, lastFirst: Math.floor((pages - 1) / per) * per };
}

function binderPageLabel(first, per, pages){
  if (per === 2 && first + 1 < pages) return "Pages " + (first + 1) + "–" + (first + 2) + " of " + pages;
  return "Page " + (first + 1) + " of " + pages;
}

function binderPagerHtml(code, m, first){
  if (m.pages <= m.per) return '';
  return '<div class="binder-pager">' +
    '<button type="button" class="pager-btn" data-act="page-prev" data-code="' + esc(code) + '" aria-label="Previous pages"' + (first <= 0 ? ' disabled' : '') + '>' + CHEV_L_SVG + '</button>' +
    '<input type="range" class="pager-range" data-code="' + esc(code) + '" min="1" max="' + (m.lastFirst + 1) + '" step="' + m.per + '" value="' + (first + 1) + '" aria-label="Turn to page">' +
    '<button type="button" class="pager-btn" data-act="page-next" data-code="' + esc(code) + '" aria-label="Next pages"' + (first >= m.lastFirst ? ' disabled' : '') + '>' + CHEV_R_SVG + '</button>' +
    '<span class="pager-label mono"></span>' +
  '</div>';
}

function renderBinder(setEl, code, list, opts){
  opts = opts || {};
  finishActiveFlip();
  var host = setEl.querySelector(".binder");
  var m = binderMeta(code);
  var first = Math.min(ui.binderPage[code] || 0, m.lastFirst);
  first -= first % m.per;
  ui.binderPage[code] = first;

  /* The quick slide is only for slider scrubbing. A real turn (button, swipe
     or arrow key) gets the full page-turn instead. */
  var turnClass = (opts.turn && !opts.flip) ? ' ' + opts.turn : '';
  var html = '<div class="binder-spread' + (m.per === 2 ? ' two' : '') + turnClass + '">';
  for (var p = 0; p < m.per; p++) {
    var pi = first + p;
    if (pi >= m.pages) { html += '<div class="binder-page blank" aria-hidden="true"></div>'; continue; }
    var slice = m.list.slice(pi * BINDER_PAGE, pi * BINDER_PAGE + BINDER_PAGE);
    html += '<div class="binder-page ' + (p === 0 ? 'left' : 'right') + '"><div class="pocket-grid">';
    for (var k = 0; k < slice.length; k++) html += tileHtml(slice[k], "pocket");
    for (var e = slice.length; e < BINDER_PAGE; e++) html += '<div class="pocket-empty" aria-hidden="true"></div>';
    html += '</div><div class="page-foot"><span class="page-no mono">Page ' + (pi + 1) + '</span><span class="page-own mono"></span></div></div>';
  }
  html += '</div>';

  var pager = binderPagerHtml(code, m, first);
  var stage = host.querySelector(".binder-stage");
  var handled = false;
  if (stage && opts.keepPager) {
    stage.innerHTML = html;
    handled = true;
  } else if (stage && opts.flip && canFlip()) {
    if (flipBinder(stage, html, opts.flip === "next")) {
      var oldPager = host.querySelector(".binder-pager");
      if (oldPager) oldPager.parentNode.removeChild(oldPager);
      if (pager) host.insertAdjacentHTML("beforeend", pager);
      handled = true;
    }
  }
  if (!handled) host.innerHTML = '<div class="binder-stage" tabindex="-1">' + html + '</div>' + pager;

  var label = host.querySelector(".pager-label");
  if (label) label.textContent = binderPageLabel(first, m.per, m.pages);
  var prev = host.querySelector('[data-act="page-prev"]'), next = host.querySelector('[data-act="page-next"]');
  if (prev) prev.disabled = first <= 0;
  if (next) next.disabled = first >= m.lastFirst;
  refreshBinderCounts(setEl);
}

/* ===== Page-turn animation =====
   A turn is drawn as a real leaf. For two pages, the leaf is the right page
   (turning forward) or the left page (turning back); it pivots on the spine
   in 3D, showing the old page on its front and the page it lands on as its
   back. The pages underneath are the ones being uncovered and covered. The
   leaf darkens as it goes edge-on and throws a soft shadow on the pages it
   passes over. When it lands, the finished spread (already built and decoded
   out of sight) is swapped in, so there is no flicker and the controls are
   live again immediately. On a phone, with a single page, the page lifts off
   and swings away to the left, or swings back in from it. */
var activeFlip = null;

function canFlip(){
  if (!(window.Element && Element.prototype.animate)) return false;
  return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function finishActiveFlip(){
  if (!activeFlip) return;
  var f = activeFlip;
  activeFlip = null;
  f.finish();
}

function binderPages(spread){
  return Array.prototype.filter.call(spread.children, function(c){ return c.classList.contains("binder-page"); });
}

function flipBinder(stage, newHtml, next){
  var oldSpread = stage.querySelector(".binder-spread");
  if (!oldSpread) return false;
  var holder = document.createElement("div");
  holder.innerHTML = newHtml;
  var newSpread = holder.firstChild;
  var two = oldSpread.classList.contains("two");
  var oldPages = binderPages(oldSpread), newPages = binderPages(newSpread);
  if (!oldPages.length || oldPages.length !== newPages.length || two !== newSpread.classList.contains("two")) return false;
  var sr = oldSpread.getBoundingClientRect();
  if (!sr.width || !sr.height) return false;
  refreshBinderCounts(newSpread);

  function boxOf(el){
    var r = el.getBoundingClientRect();
    return { left: r.left - sr.left, top: r.top - sr.top, width: r.width, height: r.height };
  }
  function place(el, b){
    el.style.left = b.left + "px"; el.style.top = b.top + "px";
    el.style.width = b.width + "px"; el.style.height = b.height + "px";
  }
  function clone(el){ return el.cloneNode(true); }

  var bases, front, back = null, leafBox, hingeLeft, from, to, gap = 0, castL = null, castR = null;
  if (two) {
    var lBox = boxOf(oldPages[0]), rBox = boxOf(oldPages[1]);
    if (next) {
      bases = [clone(oldPages[0]), clone(newPages[1])];
      front = clone(oldPages[1]); back = clone(newPages[0]);
      leafBox = rBox; hingeLeft = true; from = 0; to = -180;
      gap = parseFloat(getComputedStyle(oldPages[1]).marginLeft) || 0;
    } else {
      bases = [clone(newPages[0]), clone(oldPages[1])];
      front = clone(oldPages[0]); back = clone(newPages[1]);
      leafBox = lBox; hingeLeft = false; from = 0; to = 180;
      gap = parseFloat(getComputedStyle(oldPages[0]).marginRight) || 0;
    }
    castL = document.createElement("div"); castL.className = "flip-cast cast-l"; place(castL, lBox);
    castR = document.createElement("div"); castR.className = "flip-cast cast-r"; place(castR, rBox);
  } else {
    leafBox = boxOf(oldPages[0]); hingeLeft = true;
    if (next) { bases = [clone(newPages[0])]; front = clone(oldPages[0]); from = 0; to = -180; }
    else { bases = [clone(oldPages[0])]; front = clone(newPages[0]); from = -180; to = 0; }
    castR = document.createElement("div"); castR.className = "flip-cast cast-r"; place(castR, leafBox);
  }

  function shade(){ var d = document.createElement("span"); d.className = "leaf-shade"; return d; }
  function face(cls, content){
    var f = document.createElement("div");
    f.className = "leaf-face " + cls + (content ? "" : " plain");
    if (content) f.appendChild(content);
    f.appendChild(shade());
    return f;
  }
  var leaf = document.createElement("div");
  leaf.className = "leaf " + (hingeLeft ? "hinge-l" : "hinge-r");
  place(leaf, leafBox);
  leaf.style.transformOrigin = (two ? (hingeLeft ? -gap : leafBox.width + gap) : 0) + "px 50%";
  leaf.appendChild(face("front", front));
  leaf.appendChild(face("back", back));

  var flipEl = document.createElement("div");
  flipEl.className = "binder-spread flipping" + (two ? " two" : "");
  flipEl.style.height = sr.height + "px";
  bases.forEach(function(b){ flipEl.appendChild(b); });
  if (castL) flipEl.appendChild(castL);
  if (castR) flipEl.appendChild(castR);
  flipEl.appendChild(leaf);

  stage.style.minHeight = sr.height + "px";
  newSpread.classList.add("flip-final");
  stage.replaceChild(flipEl, oldSpread);
  stage.appendChild(newSpread);

  var dur = two ? 980 : 780, ease = "cubic-bezier(.55,.05,.25,1)", mid = (from + to) / 2;
  var anims = [];
  anims.push(leaf.animate([
    { transform: "rotateY(" + from + "deg) translateZ(0px)" },
    { transform: "rotateY(" + mid + "deg) translateZ(14px)", offset: 0.5 },
    { transform: "rotateY(" + to + "deg) translateZ(0px)" }
  ], { duration: dur, easing: ease, fill: "forwards" }));
  var shadeFrames = [{ opacity: 0.04 }, { opacity: 0.62, offset: 0.5 }, { opacity: 0.04 }];
  Array.prototype.forEach.call(leaf.querySelectorAll(".leaf-shade"), function(el){
    anims.push(el.animate(shadeFrames, { duration: dur, easing: ease, fill: "forwards" }));
  });
  /* Shadow on the page the leaf is leaving, strongest as it lifts, and on the
     page it lands on, strongest as it comes down. */
  var leaveFrames = [{ opacity: 0 }, { opacity: 0.45, offset: 0.26 }, { opacity: 0.12, offset: 0.5 }, { opacity: 0, offset: 0.64 }, { opacity: 0 }];
  var landFrames = [{ opacity: 0 }, { opacity: 0, offset: 0.36 }, { opacity: 0.14, offset: 0.52 }, { opacity: 0.5, offset: 0.82 }, { opacity: 0 }];
  function cast(el, frames){ if (el) anims.push(el.animate(frames, { duration: dur, easing: ease, fill: "forwards" })); }
  if (two) {
    cast(hingeLeft ? castR : castL, leaveFrames);
    cast(hingeLeft ? castL : castR, landFrames);
  } else {
    cast(castR, next ? leaveFrames : landFrames);
  }

  var done = false;
  function finish(){
    if (done) return;
    done = true;
    if (activeFlip && activeFlip.finish === finish) activeFlip = null;
    anims.forEach(function(a){ try { a.cancel(); } catch(e){} });
    if (flipEl.parentNode === stage) stage.replaceChild(newSpread, flipEl);
    newSpread.classList.remove("flip-final");
    stage.style.minHeight = "";
  }
  activeFlip = { finish: finish };
  anims[0].finished.then(finish, finish);
  return true;
}

/* Each visible page shows how many of its pockets are filled, so you can see
   at a glance which page still has gaps. */
function refreshBinderCounts(root){
  (root || document).querySelectorAll(".binder-page").forEach(function(page){
    var tiles = page.querySelectorAll(".pocket");
    if (!tiles.length) return;
    var own = 0;
    for (var i = 0; i < tiles.length; i++) if (tiles[i].getAttribute("data-owned") === "true") own++;
    var out = page.querySelector(".page-own");
    if (out) {
      out.textContent = own + " / " + tiles.length;
      out.classList.toggle("full", own === tiles.length);
    }
  });
}

function turnBinder(code, target, opts){
  var m = binderMeta(code);
  var cur = ui.binderPage[code] || 0;
  var first = Math.max(0, Math.min(m.lastFirst, target));
  first -= first % m.per;
  if (first === cur && !(opts && opts.force)) return;
  var forward = first > cur;
  var scrubbing = !!(opts && opts.keepPager);
  ui.binderPage[code] = first;
  if (!scrubbing) playFlip();
  renderSetBody(code, { turn: forward ? "turn-next" : "turn-prev", keepPager: scrubbing, flip: scrubbing ? null : (forward ? "next" : "prev") });
}

function renderSetBody(code, opts){
  var setEl = getSetEl(code);
  if (!setEl) return;
  var grid = setEl.querySelector(".card-grid");
  var binder = setEl.querySelector(".binder");
  var isBinder = ui.layout === "binder";
  grid.hidden = isBinder;
  binder.hidden = !isBinder;
  var list = (CARDS_BY_SET[code] || []).filter(cardMatches);
  var target = isBinder ? binder : grid;
  if (!list.length) {
    target.innerHTML = '<div class="empty-note">No cards match the current filters in this set.</div>';
    return;
  }
  if (isBinder) {
    renderBinder(setEl, code, list, opts);
    return;
  }
  var sorted = sortCards(list);
  var html = "";
  for (var i = 0; i < sorted.length; i++) html += tileHtml(sorted[i]);
  grid.innerHTML = html;
}

/* Tracks each set's last-known completion state so we can tell a genuine
   "just finished this set" transition (worth a celebration) apart from a
   page-load render of a set that was already complete (not worth one). A
   set starts out absent from this map, so the very first refresh -- on
   init -- can never look like a fresh completion. */
var setCompletionKnown = {};

function refreshSetHead(code){
  var el = getSetEl(code);
  if (!el) return;
  var st = setStats(code);
  var pct = st.total ? st.owned / st.total : 0;
  el.querySelector(".set-bar > span").style.width = (pct * 100).toFixed(1) + "%";
  el.querySelector(".set-count").textContent = st.owned + " / " + st.total;
  var isComplete = st.total > 0 && st.owned === st.total;
  el.classList.toggle("complete", isComplete);
  if (isComplete && setCompletionKnown[code] === false) celebrateSetComplete(el);
  setCompletionKnown[code] = isComplete;
}

function refreshGroupHeads(){
  document.querySelectorAll(".group-label").forEach(function(lbl){
    var st = groupStats(lbl.getAttribute("data-group"));
    var out = lbl.querySelector(".group-count");
    if (out) out.textContent = fmtInt(st.owned) + " / " + fmtInt(st.total);
  });
}

function renderAllSetHeads(){
  SET_META.forEach(function(s){ refreshSetHead(s[0]); });
  refreshGroupHeads();
}


/* A brief, one-time gold/rose spark burst over a set's completion badge the
   moment its last card is checked off. Rendered fixed-position on <body> so
   it isn't clipped by the set card's rounded-corner overflow:hidden, and
   skipped entirely under reduced-motion rather than just shortened. */
function celebrateSetComplete(setEl){
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var anchor = setEl.querySelector(".set-complete-badge") || setEl.querySelector(".set-title");
  if (!anchor) return;
  var r = anchor.getBoundingClientRect();
  var originX = r.left + r.width / 2;
  var originY = r.top + r.height / 2;
  var colors = ["var(--accent)", "var(--accent-2)", "var(--owned)"];
  var burst = document.createElement("div");
  burst.className = "confetti-burst";
  burst.style.left = originX + "px";
  burst.style.top = originY + "px";
  for (var i = 0; i < 16; i++) {
    var ang = Math.random() * Math.PI * 2;
    var dist = 26 + Math.random() * 38;
    var piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(0) + "px");
    piece.style.setProperty("--dy", (Math.sin(ang) * dist - 18).toFixed(0) + "px");
    piece.style.setProperty("--dr", (Math.random() * 420 - 210).toFixed(0) + "deg");
    piece.style.setProperty("--delay", (Math.random() * 90).toFixed(0) + "ms");
    piece.style.background = colors[i % colors.length];
    burst.appendChild(piece);
  }
  document.body.appendChild(burst);
  setTimeout(function(){ burst.remove(); }, 950);
}

/* Cursor-tracked holo highlight for the top rarity tiers: a soft light spot
   that follows the pointer over the art, like tilting a real foil card in
   the light. Delegated on the document so it works for tiles inside any
   open set body and inside the wishlist summary grid alike, without needing
   a listener re-attached on every re-render. */
function wireFoilTracking(){
  document.addEventListener("pointermove", function(e){
    if (e.pointerType === "touch") return;
    var tile = e.target.closest ? e.target.closest('.card-tile[data-tier="high"]') : null;
    if (!tile) return;
    var r = tile.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var px = (e.clientX - r.left) / r.width;
    var py = (e.clientY - r.top) / r.height;
    var art = tile.querySelector(".tile-art");
    if (art) {
      art.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      art.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    }
    /* A gentle tilt toward the pointer -- capped small so it reads as
       "handling a card," not a spinning gimmick. */
    tile.style.setProperty("--rx", ((0.5 - py) * 8).toFixed(2) + "deg");
    tile.style.setProperty("--ry", ((px - 0.5) * 8).toFixed(2) + "deg");
  });
  /* Settle the card back flat once the pointer leaves it. pointerout bubbles
     (pointerleave doesn't), so it works with the single delegated listener
     pattern used above instead of attaching one per tile. */
  document.addEventListener("pointerout", function(e){
    var tile = e.target.closest ? e.target.closest('.card-tile[data-tier="high"]') : null;
    if (!tile) return;
    if (e.relatedTarget && tile.contains(e.relatedTarget)) return;
    tile.style.setProperty("--rx", "0deg");
    tile.style.setProperty("--ry", "0deg");
  });
}

/* ===== Wishlist page: everything on the list, flattened ===== */
function renderWishlistSummary(){
  var wrap = byId("wishlistSummary");
  if (!wrap) return;
  if (filters.view !== "wishlist") { wrap.hidden = true; return; }
  wrap.hidden = false;
  var list = CARDS.filter(cardMatches).sort(compareReleaseOrder);
  var countEl = byId("wishlistSummaryCount");
  if (countEl) countEl.textContent = list.length + (list.length === 1 ? " card" : " cards");
  var grid = byId("wishlistSummaryGrid");
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = state.wishlist.size
      ? '<div class="empty-note">No wishlist cards match the current filters.</div>'
      : '<div class="empty-note">Your wishlist is empty. Tap the heart on any card to add it.</div>';
    return;
  }
  var html = "";
  for (var i = 0; i < list.length; i++) html += tileHtml(list[i]);
  grid.innerHTML = html;
}

function anyFilterActive(){
  return !!(filters.q || filters.color || filters.rarity || filters.type || filters.view === "owned" || filters.view === "missing");
}

/* The line under the toolbar: how many cards the current filters match, and a
   one-click way back to everything. Hidden when nothing is filtered. */
function updateToolbarNote(){
  var note = byId("toolbarNote");
  if (!note) return;
  var active = anyFilterActive();
  note.hidden = !active;
  if (!active) return;
  var matches = CARDS.filter(cardMatches).length;
  var base = filters.view === "wishlist" ? state.wishlist.size : CARDS.length;
  byId("resultNote").textContent = fmtInt(matches) + " of " + fmtInt(base) + " cards match";
}

function applySearchVisibility(){
  var active = !!filters.q;
  document.querySelectorAll(".set").forEach(function(el){
    var code = el.getAttribute("data-code");
    var list = CARDS_BY_SET[code] || [];
    var matchCount = active ? list.filter(cardMatches).length : list.length;
    if (active && matchCount === 0) {
      el.hidden = true;
    } else {
      el.hidden = false;
      var shouldOpen = active ? matchCount > 0 : ui.expanded.has(code);
      setOpen(el, shouldOpen, true);
    }
  });
  document.querySelectorAll(".group-label").forEach(function(lbl){
    var grp = lbl.getAttribute("data-group");
    var anyVisible = false;
    document.querySelectorAll('.set[data-group="' + grp + '"]').forEach(function(el){
      if (!el.hidden) anyVisible = true;
    });
    lbl.hidden = !anyVisible;
  });
  updateToolbarNote();
  renderWishlistSummary();
}

function setOpen(el, open, skipManualTrack){
  var code = el.getAttribute("data-code");
  el.classList.toggle("open", open);
  el.querySelector(".set-head").setAttribute("aria-expanded", open ? "true" : "false");
  if (open) renderSetBody(code);
  if (!skipManualTrack) {
    if (open) ui.expanded.add(code); else ui.expanded.delete(code);
  }
}

function refreshOpenGrids(){
  document.querySelectorAll(".set.open").forEach(function(el){
    renderSetBody(el.getAttribute("data-code"));
  });
}

function buildSetsSkeleton(){
  var container = byId("sets");
  var groups = ["Booster", "Starter", "Promo"];
  var html = "";
  groups.forEach(function(grp){
    var setsInGroup = SET_META.filter(function(s){ return s[2] === grp; });
    if (!setsInGroup.length) return;
    html += '<div class="group-label" data-group="' + grp + '"><span class="group-name">' + GROUP_NAME[grp] + '</span><span class="group-count mono"></span></div>';
    setsInGroup.forEach(function(s){
      var code = s[0], label = s[1];
      var total = (CARDS_BY_SET[code] || []).length;
      html +=
        '<div class="set" data-code="' + esc(code) + '" data-group="' + grp + '">' +
          '<div class="set-head" role="button" tabindex="0" aria-expanded="false">' +
            '<svg class="chevron" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '<div class="set-titles"><span class="set-title">' + esc(label) + '</span><span class="set-code mono">' + esc(code) + '</span><span class="set-complete-badge">' + COMPLETE_SVG + 'Complete</span></div>' +
            '<div class="set-bar-wrap"><div class="set-bar"><span style="width:0%"></span></div></div>' +
            '<div class="set-count mono">0 / ' + total + '</div>' +
            '<div class="set-actions">' +
              '<button type="button" data-act="view-owned" data-code="' + esc(code) + '">Show owned</button>' +
              '<button type="button" data-act="view-missing" data-code="' + esc(code) + '">Show missing</button>' +
            '</div>' +
          '</div>' +
          '<div class="set-body"><div class="card-grid" hidden></div><div class="binder" hidden></div></div>' +
        '</div>';
    });
  });
  container.innerHTML = html;
}

function populateFilterOptions(){
  var colorsPresent = {}, raritiesPresent = {}, typesPresent = {};
  CARDS.forEach(function(c){ colorsPresent[c[6]] = true; raritiesPresent[c[4]] = true; typesPresent[c[5]] = true; });
  fillSelect("filterColor", COLOR_ORDER.filter(function(x){ return colorsPresent[x]; }), COLOR_NAME);
  fillSelect("filterRarity", RARITY_ORDER.filter(function(x){ return raritiesPresent[x]; }), null, RARITY_INFO);
  fillSelect("filterType", TYPE_ORDER.filter(function(x){ return typesPresent[x]; }), TYPE_NAME);
}
function fillSelect(id, values, nameMap, rarityMap){
  var sel = byId(id);
  values.forEach(function(v){
    var opt = document.createElement("option");
    opt.value = v;
    opt.textContent = rarityMap ? (v + " — " + rarityMap[v].name) : ((nameMap && nameMap[v]) || v);
    sel.appendChild(opt);
  });
}



/* ===== Save / publish ===== */
var saveTimer = null;
var artifactNS = null;
var capabilityChecked = false;
var readOnly = false;

function setSyncState(mode){
  var pill = byId("syncPill");
  var label = byId("syncLabel");
  if (!pill) return;
  pill.setAttribute("data-state", mode);
  label.textContent = mode === "saved" ? "Synced" : mode === "saving" ? "Saving…" : mode === "viewonly" ? "View only" : "Local only";
  pill.title = mode === "viewonly"
    ? "You can browse this collection, but only editors can check off cards, log spending, or edit the wishlist here."
    : mode === "local" ? "Changes are kept in this browser only." : "";
}

/* A shared artifact can be opened by someone who can view it but not write to
   it. The platform only tells us this the first time a save is attempted, so
   we treat that first rejection as permanent for this session: switch into a
   read-only view and disable the controls that would otherwise silently fail. */
function enterReadOnlyMode(){
  if (readOnly) return;
  readOnly = true;
  clearTimeout(saveTimer);
  setSyncState("viewonly");
  disableWriteControls();
}

function disableWriteControls(){
  /* .set-actions buttons are view-only filters now (Show owned/Show missing),
     not edits, so a read-only viewer keeps using them. */
  var sel = ".card-tile, .tile-wish, #spendForm button, #spendForm input, #spendForm select, " +
            ".spend-row-del, .spend-row-edit, #importBtn, #budgetBody input, #budgetBody button, .cm-own, .cm-wish, .stepper button";
  document.querySelectorAll(sel).forEach(function(el){ el.disabled = true; });
}

function ensureArtifact(){
  if (capabilityChecked) return Promise.resolve(artifactNS);
  capabilityChecked = true;
  if (!(window.claude && typeof window.claude.use === "function")) return Promise.resolve(null);
  return window.claude.use("artifact").then(function(ns){ artifactNS = ns; return ns; }).catch(function(){ return null; });
}

var SAVE_IDLE_MS = 5000;

function scheduleSave(){
  setSyncState("saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, SAVE_IDLE_MS);
}

function buildDocument(ownedArr, spendingArr, wishlistArr, budget, savedAt, extras){
  var stateJson = JSON.stringify({ owned: ownedArr, spending: spendingArr, wishlist: wishlistArr, budget: budget, extras: extras, savedAt: savedAt });
  return PART_A + stateJson + PART_B1 + SELF_SRC + PART_B2;
}

function doSave(){
  var ownedArr = Array.from(state.owned);
  var spendingArr = state.spending;
  var wishlistArr = Array.from(state.wishlist);
  var budget = state.budget || 0;
  var extras = state.extras;
  var savedAt = Date.now();
  try { localStorage.setItem("crb_saved_at", String(savedAt)); } catch(e){}
  try { localStorage.setItem("crb_owned_backup", JSON.stringify(ownedArr)); } catch(e){}
  try { localStorage.setItem("crb_spending_backup", JSON.stringify(spendingArr)); } catch(e){}
  try { localStorage.setItem("crb_wishlist_backup", JSON.stringify(wishlistArr)); } catch(e){}
  try { localStorage.setItem("crb_budget_backup", JSON.stringify(budget)); } catch(e){}
  try { localStorage.setItem("crb_extras_backup", JSON.stringify(extras)); } catch(e){}
  ensureArtifact().then(function(ns){
    if (!ns) { setSyncState("local"); return; }
    stashUiState();
    var html = buildDocument(ownedArr, spendingArr, wishlistArr, budget, savedAt, extras);
    ns.publish(html).then(function(){
      /* success reloads this view */
    }).catch(function(err){
      var code = err && err.code;
      if (code === "conflict") return; /* runtime is already reloading */
      if (code === "rate_limited") {
        setSyncState("local");
        clearTimeout(saveTimer);
        saveTimer = setTimeout(doSave, 6000);
        return;
      }
      if (code === "not_writer" || code === "not_granted" || code === "not_declared" ||
          code === "capability_disabled" || code === "capability_removed") {
        enterReadOnlyMode();
        return;
      }
      setSyncState("local");
      if (window.console) console.warn("Braverse Binder: save failed", err);
    });
  });
}


/* ===== Sound ===== */
/* A soft "pop" when a card goes into the binder, synthesized with the Web
   Audio API rather than shipped as an audio file -- no extra download, and
   nothing for the 16MB artifact cap to worry about. The tone sweeps upward
   (a bright, bubbly pop) when a card is added and a little downward, quieter,
   when it's taken out, so the two read differently without looking. A few
   cents of random detune keeps a run of quick clicks from sounding robotic.
   The on/off choice is a per-viewer convenience, so it lives in this
   browser's localStorage, not in the shared collection state. */
var SOUND_KEY = "crb_sound_on";
var soundOn = true;
try { soundOn = localStorage.getItem(SOUND_KEY) !== "0"; } catch(e){}
var audioCtx = null;

function getAudioCtx(){
  if (audioCtx) return audioCtx;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { audioCtx = new AC(); } catch(e){ return null; }
  return audioCtx;
}

function popVoice(ctx, t, type, f0, f1, sweep, peak, decay, detune){
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + sweep);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + decay + 0.02);
}

function playPop(adding){
  if (!soundOn) return;
  var ctx = getAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();
    var t = ctx.currentTime + 0.005;
    var detune = (Math.random() - 0.5) * 80;
    if (adding) {
      popVoice(ctx, t, "sine", 320, 820, 0.05, 0.22, 0.14, detune);        /* the pop body */
      popVoice(ctx, t, "triangle", 1650, 1100, 0.04, 0.035, 0.06, detune); /* a little sparkle on top */
    } else {
      popVoice(ctx, t, "sine", 540, 250, 0.07, 0.11, 0.11, detune);
    }
  } catch(e){}
}

/* The "pulled down" sound for opening a set: a breathy slide of filtered
   noise whose pitch falls as the list drops open, finished by a soft low
   thud as it settles -- like a drawer or a binder page dropping into place.
   Closing plays the same slide rising and shorter, with no thud, so it reads
   as tucking the list back up. Expand all / Collapse all use a slightly
   longer, fuller version (one sound for the whole batch, not one per set). */
var noiseBuf = null;
function getNoiseBuffer(ctx){
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  var len = Math.floor(ctx.sampleRate * 0.6);
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  var d = noiseBuf.getChannelData(0);
  for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function playSlide(opening, big){
  if (!soundOn) return;
  var ctx = getAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();
    var t = ctx.currentTime + 0.005;
    var dur = opening ? (big ? 0.34 : 0.24) : (big ? 0.22 : 0.16);
    var src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    var fHi = 2600, fLo = 420;
    bp.frequency.setValueAtTime(opening ? fHi : fLo, t);
    bp.frequency.exponentialRampToValueAtTime(opening ? fLo : fHi, t + dur);
    var g = ctx.createGain();
    var peak = opening ? (big ? 0.2 : 0.16) : (big ? 0.11 : 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
    if (opening) {
      /* the soft landing as the list settles open */
      popVoice(ctx, t + dur * 0.8, "sine", 170, 95, 0.09, big ? 0.16 : 0.12, 0.14, 0);
    }
  } catch(e){}
}

/* A page turning: a breathy rush of filtered noise that rises as the leaf
   lifts and falls as it lands, then a soft low settle. It follows the same
   mute switch as the other sounds. */
function playFlip(){
  if (!soundOn) return;
  var ctx = getAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();
    var t = ctx.currentTime + 0.005, dur = 0.55;
    var src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(3400, t + dur * 0.42);
    bp.frequency.exponentialRampToValueAtTime(1300, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
    popVoice(ctx, t + dur * 0.8, "sine", 200, 110, 0.07, 0.07, 0.1, 0);
  } catch(e){}
}

function renderSoundToggle(){
  var btn = document.getElementById("soundToggle");
  if (!btn) return;
  btn.setAttribute("aria-pressed", soundOn ? "true" : "false");
  btn.title = soundOn ? "Sound on — click to mute" : "Sound off — click to unmute";
  btn.setAttribute("aria-label", soundOn ? "Mute card sounds" : "Unmute card sounds");
}

function wireSoundToggle(){
  var btn = document.getElementById("soundToggle");
  if (!btn) return;
  renderSoundToggle();
  btn.addEventListener("click", function(){
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0"); } catch(e){}
    renderSoundToggle();
    if (soundOn) playPop(true); /* a preview, so unmuting confirms itself */
  });
}


/* ===== Toasts ===== */
/* A short message at the bottom of the screen, optionally with one action
   (used for "Undo"). Browsers never show confirm() dialogs inside an
   artifact, so reversible actions get an undo toast instead. */
function showToast(msg, opts){
  opts = opts || {};
  var host = byId("toastHost");
  if (!host) return;
  while (host.children.length >= 3) host.removeChild(host.firstChild);
  var el = document.createElement("div");
  el.className = "toast" + (opts.kind ? " toast-" + opts.kind : "");
  var text = document.createElement("span");
  text.className = "toast-msg";
  text.textContent = msg;
  el.appendChild(text);
  var timer = null;
  function close(){
    clearTimeout(timer);
    if (el.parentNode) el.parentNode.removeChild(el);
  }
  if (opts.actionLabel && opts.onAction) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-act";
    btn.textContent = opts.actionLabel;
    btn.addEventListener("click", function(){ close(); opts.onAction(); });
    el.appendChild(btn);
  }
  host.appendChild(el);
  timer = setTimeout(close, opts.ms || (opts.onAction ? 7000 : 3800));
}

/* ===== Milestones =====
   Computed from the collection every time, never stored, so they can't drift
   out of sync with the cards that earn them. */
function milestoneList(){
  var owned = ownedCount(), total = CARDS.length;
  var sets = countCompleteSets();
  var foil = ownedTierCount("high");
  function m(id, name, cur, goal, unit){
    return { id: id, name: name, cur: cur, goal: goal, unit: unit, done: goal > 0 && cur >= goal };
  }
  return [
    m("c1",    "First card",      owned, 1,    "cards"),
    m("c100",  "100 cards",       owned, 100,  "cards"),
    m("c250",  "250 cards",       owned, 250,  "cards"),
    m("c500",  "500 cards",       owned, 500,  "cards"),
    m("c1000", "1,000 cards",     owned, 1000, "cards"),
    m("c1500", "1,500 cards",     owned, 1500, "cards"),
    m("all",   "Full collection", owned, total, "cards"),
    m("s1",    "First set",       sets,  1,    "sets"),
    m("s5",    "5 sets",          sets,  5,    "sets"),
    m("s10",   "10 sets",         sets,  10,   "sets"),
    m("f1",    "First foil",      foil,  1,    "foil cards"),
    m("f25",   "Foil hunter",     foil,  25,   "foil cards")
  ];
}
function milestoneSnapshot(){
  var out = {};
  milestoneList().forEach(function(x){ out[x.id] = x; });
  return out;
}
function announceMilestones(before){
  var fresh = [];
  milestoneList().forEach(function(x){
    if (x.done && before[x.id] && !before[x.id].done) fresh.push(x.name);
  });
  if (fresh.length) showToast("Milestone unlocked: " + fresh.join(", "), { kind: "gold", ms: 5200 });
}

/* ===== Ownership and wishlist changes ===== */
function toggleCard(id){
  if (state.owned.has(id)) state.owned.delete(id); else state.owned.add(id);
}

function toggleWishlist(id){
  if (state.wishlist.has(id)) state.wishlist.delete(id); else state.wishlist.add(id);
}

function updateWishlistBadge(){
  var out = byId("wishlistCount");
  if (out) out.textContent = state.wishlist.size;
}

/* Switches the ownership view (All/Owned/Missing/Wishlist) -- shared by the
   top segmented control and each set's "Show owned"/"Show missing" shortcut
   buttons, so both stay in sync and only ever filter what's displayed.
   Nothing here ever changes state.owned/state.wishlist. */
function setOwnershipView(view){
  filters.view = view;
  ui.binderPage = {};
  document.querySelectorAll(".ownership-seg button").forEach(function(b){
    b.setAttribute("aria-pressed", b.getAttribute("data-view") === view ? "true" : "false");
  });
  refreshOpenGrids();
  applySearchVisibility();
}

/* Every place a card can appear (set grid, binder pocket, wishlist list,
   detail view) is updated from here, so a change made anywhere shows up
   everywhere without re-rendering whole pages. */
function applyOwnedToggle(id){
  var before = milestoneSnapshot();
  var hadExtras = state.extras[id] || 0;
  toggleCard(id);
  var nowOwned = state.owned.has(id);
  playPop(nowOwned);
  if (!nowOwned && hadExtras) delete state.extras[id]; /* spares go with the card that holds them */
  document.querySelectorAll('.card-tile[data-id="' + cssEsc(id) + '"]').forEach(function(el){
    el.setAttribute("data-owned", nowOwned);
  });
  var card = CARD_BY_ID[id];
  if (card) refreshSetHead(card[1]);
  refreshGroupHeads();
  renderTopProgress();
  refreshBinderCounts();
  if (nowOwned) announceMilestones(before);
  if (ui.tab === "extras") { renderExtraKpis(); refreshExtraPickSet(); renderExtraResults(); }
  if (!nowOwned && hadExtras) {
    applyExtrasEverywhere(id, "down");
    showToast("Removed " + (card ? card[3] : "card") + " and its " + hadExtras + (hadExtras === 1 ? " extra" : " extras"), {
      actionLabel: "Undo",
      onAction: function(){ applyOwnedToggle(id); setExtras(id, hadExtras, true); }
    });
  }
  paintCardModal();
  scheduleSave();
  return nowOwned;
}

function applyWishToggle(id){
  toggleWishlist(id);
  var nowWished = state.wishlist.has(id);
  var label = nowWished ? "Remove from wishlist" : "Add to wishlist";
  /* A card can appear twice at once -- once in its set body, once in the
     flat wishlist list -- so mirror the change onto every copy rather than
     just the button that was clicked. */
  document.querySelectorAll('.tile-wish[data-wish-id="' + cssEsc(id) + '"]').forEach(function(b){
    b.setAttribute("data-wished", nowWished);
    b.setAttribute("aria-pressed", nowWished);
    b.setAttribute("aria-label", label);
    b.title = label;
  });
  updateWishlistBadge();
  if (filters.view === "wishlist") {
    /* Membership itself changed, so re-render rather than patch: the card
       needs to disappear from (or reappear in) the list. */
    renderWishlistSummary();
    updateToolbarNote();
    if (!nowWished) {
      var c = CARD_BY_ID[id];
      showToast("Removed " + (c ? c[3] : "card") + " from your wishlist", {
        actionLabel: "Undo",
        onAction: function(){ applyWishToggle(id); }
      });
    }
  }
  paintCardModal();
  scheduleSave();
  return nowWished;
}

function onWishClick(e){
  var btn = e.target.closest ? e.target.closest(".tile-wish") : null;
  if (!btn) return false;
  e.stopPropagation();
  applyWishToggle(btn.getAttribute("data-wish-id"));
  return true;
}

function onZoomClick(e){
  var btn = e.target.closest ? e.target.closest(".tile-zoom") : null;
  if (!btn) return false;
  e.stopPropagation();
  openCardModal(btn.getAttribute("data-zoom-id"), contextIdsFor(btn), btn);
  return true;
}

/* A swipe that turns a binder page can end on a pocket; the browser would
   then also fire a click and toggle that card. Swipes set this to swallow it. */
var suppressClickUntil = 0;

function onGridClick(e){
  if (Date.now() < suppressClickUntil) return;
  var tile = e.target.closest ? e.target.closest(".card-tile") : null;
  if (!tile) return;
  applyOwnedToggle(tile.getAttribute("data-id"));
}

function onPagerClick(e){
  var btn = e.target.closest ? e.target.closest("[data-act]") : null;
  if (!btn) return false;
  var act = btn.getAttribute("data-act");
  if (act !== "page-prev" && act !== "page-next") return false;
  e.stopPropagation();
  var code = btn.getAttribute("data-code");
  var per = binderPerView();
  turnBinder(code, (ui.binderPage[code] || 0) + (act === "page-next" ? per : -per));
  return true;
}

function onSetsClick(e){
  var actBtn = e.target.closest ? e.target.closest("[data-act]") : null;
  if (actBtn) {
    e.stopPropagation();
    var act = actBtn.getAttribute("data-act");
    var code = actBtn.getAttribute("data-code");
    if (act !== "view-owned" && act !== "view-missing") return;
    setOwnershipView(act === "view-owned" ? "owned" : "missing");
    var setEl = getSetEl(code);
    if (setEl) {
      if (!setEl.classList.contains("open")) playSlide(true);
      setOpen(setEl, true);
    }
    return;
  }
  var head = e.target.closest ? e.target.closest(".set-head") : null;
  if (head) {
    var setEl2 = head.closest(".set");
    var willOpen2 = !setEl2.classList.contains("open");
    playSlide(willOpen2);
    setOpen(setEl2, willOpen2);
  }
}

function onSetsKeydown(e){
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    var binder = e.target.closest ? e.target.closest(".binder") : null;
    var isRange = e.target.classList && e.target.classList.contains("pager-range");
    if (binder && !isRange) {
      e.preventDefault();
      var code = binder.closest(".set").getAttribute("data-code");
      var per = binderPerView();
      turnBinder(code, (ui.binderPage[code] || 0) + (e.key === "ArrowRight" ? per : -per));
      var stage = binder.querySelector(".binder-stage");
      if (stage) stage.focus({ preventScroll: true });
      return;
    }
  }
  if (e.key !== "Enter" && e.key !== " ") return;
  var head = e.target.closest ? e.target.closest(".set-head") : null;
  if (!head) return;
  e.preventDefault();
  var setEl = head.closest(".set");
  var willOpen = !setEl.classList.contains("open");
  playSlide(willOpen);
  setOpen(setEl, willOpen);
}

/* Touch swipe to turn binder pages. Mouse users have the pager buttons, the
   slider and the arrow keys. */
var swipe = null;
function wireBinderSwipe(){
  var host = byId("sets");
  host.addEventListener("pointerdown", function(e){
    var stage = e.target.closest ? e.target.closest(".binder-stage") : null;
    if (!stage || e.pointerType === "mouse") { swipe = null; return; }
    swipe = { x: e.clientX, y: e.clientY, code: stage.closest(".set").getAttribute("data-code") };
  });
  host.addEventListener("pointerup", function(e){
    if (!swipe) return;
    var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    var s = swipe;
    swipe = null;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      suppressClickUntil = Date.now() + 400;
      turnBinder(s.code, (ui.binderPage[s.code] || 0) + (dx < 0 ? 1 : -1) * binderPerView());
    }
  });
  host.addEventListener("pointercancel", function(){ swipe = null; });
  host.addEventListener("input", function(e){
    var t = e.target;
    if (t.classList && t.classList.contains("pager-range")) {
      turnBinder(t.getAttribute("data-code"), parseInt(t.value, 10) - 1, { keepPager: true });
    }
  });
}

function debounce(fn, ms){
  var t = null;
  return function(){
    var args = arguments;
    clearTimeout(t);
    t = setTimeout(function(){ fn.apply(null, args); }, ms);
  };
}

/* ===== Card detail view ===== */
var cardModal = { ids: [], idx: 0, trigger: null };

/* The cards "around" a tile, in the order the person is looking at them, so
   the arrows in the detail view step through the same list. */
function contextIdsFor(el){
  var list = null;
  var setEl = el.closest ? el.closest(".set") : null;
  if (setEl) {
    list = (CARDS_BY_SET[setEl.getAttribute("data-code")] || []).filter(cardMatches);
    if (ui.layout === "grid") list = sortCards(list);
  } else if (el.closest && el.closest("#wishlistSummaryGrid")) {
    list = CARDS.filter(cardMatches).sort(compareReleaseOrder);
  }
  return list ? list.map(function(c){ return c[0]; }) : null;
}

function cardModalOpen(){ return !byId("cardOverlay").hidden; }

function openCardModal(id, ids, trigger){
  if (!CARD_BY_ID[id]) return;
  var list = (ids && ids.length) ? ids : [id];
  var idx = list.indexOf(id);
  if (idx < 0) { list = [id]; idx = 0; }
  cardModal.ids = list;
  cardModal.idx = idx;
  cardModal.trigger = trigger || document.activeElement;
  byId("cardOverlay").hidden = false;
  renderCardModal();
  document.body.classList.add("modal-open");
  var closeBtn = byId("cmClose");
  if (closeBtn) closeBtn.focus();
}

function closeCardModal(){
  byId("cardOverlay").hidden = true;
  document.body.classList.remove("modal-open");
  if (ui.tab === "overview") renderOverview(); /* anything changed in the detail view shows up behind it */
  var t = cardModal.trigger;
  cardModal.trigger = null;
  if (t && t.focus && document.body.contains(t)) { try { t.focus({ preventScroll: true }); } catch(e){} }
}

function stepCardModal(dir){
  var next = cardModal.idx + dir;
  if (next < 0 || next >= cardModal.ids.length) return;
  cardModal.idx = next;
  renderCardModal();
  var focusTarget = byId(dir > 0 ? "cmNext" : "cmPrev");
  if (focusTarget && !focusTarget.disabled) focusTarget.focus();
  else if (byId("cmClose")) byId("cmClose").focus();
}

function renderCardModal(){
  var id = cardModal.ids[cardModal.idx];
  var c = CARD_BY_ID[id];
  if (!c) return;
  var rInfo = RARITY_INFO[c[4]] || { name: c[4], tier: "low" };
  var colorHex = COLOR_HEX[c[6]] || "var(--c-colorless)";
  var art = c[8]
    ? '<img src="data:image/webp;base64,' + c[8] + '" alt="' + esc(c[3]) + '" width="80" height="111">'
    : '<div class="cm-art-empty" style="background:' + colorHex + '">' + esc(c[3].slice(0, 1)) + '</div>';
  var multi = cardModal.ids.length > 1;
  var html =
    '<button type="button" class="modal-close cm-close" id="cmClose" data-cm="close" aria-label="Close card details">&times;</button>' +
    '<div class="cm-stage">' +
      '<button type="button" class="cm-nav" id="cmPrev" data-cm="prev" aria-label="Previous card"' + (cardModal.idx <= 0 ? ' disabled' : '') + (multi ? '' : ' hidden') + '>' + CHEV_L_SVG + '</button>' +
      '<div class="cm-artwrap"><span class="cm-pile" id="cmPile" aria-hidden="true"></span><div class="cm-art" id="cmArt" data-tier="' + esc(rInfo.tier) + '" data-owned="false">' + art + '</div></div>' +
      '<button type="button" class="cm-nav" id="cmNext" data-cm="next" aria-label="Next card"' + (cardModal.idx >= cardModal.ids.length - 1 ? ' disabled' : '') + (multi ? '' : ' hidden') + '>' + CHEV_R_SVG + '</button>' +
    '</div>' +
    '<div class="cm-info">' +
      '<p class="cm-set"><span class="mono">' + esc(c[1]) + '</span>' + esc(SET_LABEL[c[1]] || c[7] || "") + '</p>' +
      '<h2 class="cm-name">' + esc(c[3]) + '</h2>' +
      '<dl class="cm-facts">' +
        '<div><dt>Number</dt><dd class="mono">' + esc(c[0]) + '</dd></div>' +
        '<div><dt>Rarity</dt><dd><span class="rarity-pill" data-tier="' + esc(rInfo.tier) + '">' + esc(c[4]) + '</span> ' + esc(rInfo.name) + '</dd></div>' +
        '<div><dt>Color</dt><dd><span class="pip" style="background:' + colorHex + '"></span>' + esc(COLOR_NAME[c[6]] || c[6]) + '</dd></div>' +
        '<div><dt>Type</dt><dd>' + esc(TYPE_NAME[c[5]] || c[5]) + '</dd></div>' +
        (c[7] && c[7] !== SET_LABEL[c[1]] ? '<div class="cm-wide"><dt>Product</dt><dd>' + esc(c[7]) + '</dd></div>' : '') +
      '</dl>' +
      '<div class="cm-actions">' +
        '<button type="button" class="iconbtn cm-own" id="cmOwn" data-cm="own"></button>' +
        '<button type="button" class="iconbtn cm-wish" id="cmWish" data-cm="wish"></button>' +
      '</div>' +
      '<div class="cm-copies">' +
        '<div class="cm-copies-head"><span class="cm-copies-label">Copies</span><span class="cm-copies-note" id="cmCopiesNote"></span></div>' +
        '<div class="stepper big" role="group" aria-label="Copies of ' + esc(c[3]) + '">' +
          '<button type="button" id="cmDec" data-cm="copy-dec" aria-label="Remove a copy">\u2212</button>' +
          '<output class="mono" id="cmCopyCount" aria-live="polite">0</output>' +
          '<button type="button" id="cmInc" data-cm="copy-inc" aria-label="Add a copy">+</button>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="linkbtn cm-goto" data-cm="goto">Show in the binder</button>' +
      '<p class="cm-pos mono">' + (cardModal.idx + 1) + ' of ' + cardModal.ids.length + '</p>' +
    '</div>';
  byId("cardModal").innerHTML = html;
  paintCardModal();
}

/* Updates only the ownership and wishlist buttons, so toggling a card from
   inside the detail view doesn't rebuild it and lose keyboard focus. */
function paintCardModal(dropped){
  if (!cardModalOpen()) return;
  var id = cardModal.ids[cardModal.idx];
  var own = byId("cmOwn"), wish = byId("cmWish"), art = byId("cmArt");
  if (!own || !wish) return;
  var owned = state.owned.has(id), wished = state.wishlist.has(id);
  if (art) art.setAttribute("data-owned", owned);
  own.setAttribute("aria-pressed", owned);
  own.classList.toggle("is-on", owned);
  own.innerHTML = CHECK_SVG + '<span>' + (owned ? "In your collection" : "Add to collection") + '</span>';
  wish.setAttribute("aria-pressed", wished);
  wish.classList.toggle("is-on", wished);
  wish.innerHTML = WISH_SVG + '<span>' + (wished ? "On your wishlist" : "Add to wishlist") + '</span>';
  own.disabled = readOnly;
  wish.disabled = readOnly;

  var copies = copiesOf(id), extras = state.extras[id] || 0;
  var count = byId("cmCopyCount"), note = byId("cmCopiesNote"), inc = byId("cmInc"), dec = byId("cmDec"), pile = byId("cmPile");
  if (note) note.textContent = copies === 0 ? "Not in your binder yet" : extras ? "1 in the binder, " + extras + " extra" : "1 in the binder";
  syncStepper(dec, inc, count, copies);
  if (pile) {
    var h = "";
    for (var i = Math.min(copies, 6) - 1; i >= 1; i--) h += '<i style="--i:' + i + ';--r:' + jitter(id, i).toFixed(2) + '"></i>';
    pile.innerHTML = h;
    if (dropped === "up" && art) bumpPile(art.parentNode);
  }
}

function onCardModalClick(e){
  if (e.target === byId("cardOverlay")) { closeCardModal(); return; }
  var btn = e.target.closest ? e.target.closest("[data-cm]") : null;
  if (!btn) return;
  var act = btn.getAttribute("data-cm");
  var id = cardModal.ids[cardModal.idx];
  if (act === "close") closeCardModal();
  else if (act === "prev") stepCardModal(-1);
  else if (act === "next") stepCardModal(1);
  else if (act === "own") applyOwnedToggle(id);
  else if (act === "wish") applyWishToggle(id);
  else if (act === "copy-inc") changeCopies(id, 1);
  else if (act === "copy-dec") changeCopies(id, -1);
  else if (act === "goto") { closeCardModal(); jumpToCard(id); }
}

function onCardModalKey(e){
  if (!cardModalOpen()) return false;
  if (e.key === "Escape") { closeCardModal(); return true; }
  if (e.key === "ArrowLeft") { stepCardModal(-1); return true; }
  if (e.key === "ArrowRight") { stepCardModal(1); return true; }
  if (e.key === "Tab") {
    var f = byId("cardModal").querySelectorAll("button:not([disabled]):not([hidden])");
    if (!f.length) return false;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    return true;
  }
  return false;
}

/* The same light-catching tilt the foil tiles have, on the large card. */
function wireCardModalTilt(){
  var modal = byId("cardModal");
  modal.addEventListener("pointermove", function(e){
    if (e.pointerType === "touch") return;
    var art = e.target.closest ? e.target.closest('.cm-art[data-tier="high"]') : null;
    if (!art) return;
    var r = art.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    art.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
    art.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    art.style.setProperty("--rx", ((0.5 - py) * 10).toFixed(2) + "deg");
    art.style.setProperty("--ry", ((px - 0.5) * 10).toFixed(2) + "deg");
  });
  modal.addEventListener("pointerout", function(e){
    var art = e.target.closest ? e.target.closest(".cm-art") : null;
    if (!art || (e.relatedTarget && art.contains(e.relatedTarget))) return;
    art.style.setProperty("--rx", "0deg");
    art.style.setProperty("--ry", "0deg");
  });
}

/* ===== Jumping around: from the overview or a card's detail into the binder ===== */
function jumpToSet(code, opts){
  opts = opts || {};
  setTab("collection");
  if (opts.missing) setOwnershipView("missing");
  ui.expanded.add(code);
  var setEl = getSetEl(code);
  if (!setEl) return;
  setEl.hidden = false;
  setOpen(setEl, true);
  setEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function jumpToCard(id){
  var c = CARD_BY_ID[id];
  if (!c) return;
  clearFilters(true);
  setTab("collection");
  var code = c[1];
  ui.expanded.add(code);
  var list = CARDS_BY_SET[code] || [];
  ui.binderPage[code] = Math.floor(list.indexOf(c) / BINDER_PAGE);
  var setEl = getSetEl(code);
  if (!setEl) return;
  setEl.hidden = false;
  setOpen(setEl, true);
  requestAnimationFrame(function(){
    var tile = setEl.querySelector('.card-tile[data-id="' + cssEsc(id) + '"]');
    if (!tile) { setEl.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    tile.scrollIntoView({ behavior: "smooth", block: "center" });
    tile.classList.add("flash");
    setTimeout(function(){ tile.classList.remove("flash"); }, 1800);
  });
}



/* ===== Overview ===== */
var shelfIds = [];

function ovPanel(cls, title, sub, body, aside){
  return '<section class="panel ' + cls + '">' +
    '<div class="panel-head' + (aside ? ' panel-head-split' : '') + '"><div><h3>' + title + '</h3>' + (sub ? '<p class="panel-sub">' + sub + '</p>' : '') + '</div>' + (aside || '') + '</div>' +
    body + '</section>';
}

function pctLabel(frac){
  var v = frac * 100;
  return (v > 0 && v < 10) ? v.toFixed(1) + "%" : Math.round(v) + "%";
}

function ovHeroHtml(){
  var s = overallStats();
  var pct = s.total ? s.owned / s.total : 0;
  var circ = 2 * Math.PI * 52;
  var spent = totalSpent();
  var foilTotal = CARDS.filter(function(c){ return (RARITY_INFO[c[4]] || {}).tier === "high"; }).length;
  var next = null;
  milestoneList().forEach(function(x){ if (!next && !x.done && x.unit === "cards") next = x; });
  var nextLine = next
    ? fmtInt(next.goal - next.cur) + " more " + (next.goal - next.cur === 1 ? "card" : "cards") + " to reach " + next.name.toLowerCase() + "."
    : "Every card is in the binder.";
  var ring =
    '<div class="ov-ring">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
        '<defs><linearGradient id="ovRingGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecd079"/><stop offset="1" stop-color="#b8862a"/></linearGradient></defs>' +
        '<circle cx="60" cy="60" r="52" fill="none" stroke="#f1e6c6" stroke-width="10"/>' +
        '<circle cx="60" cy="60" r="52" fill="none" stroke="url(#ovRingGrad)" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + circ.toFixed(2) + '" stroke-dashoffset="' + (circ * (1 - pct)).toFixed(2) + '" transform="rotate(-90 60 60)"/>' +
      '</svg>' +
      '<div class="ov-ring-label"><span class="ov-ring-pct">' + pctLabel(pct) + '</span><span class="ov-ring-cap">complete</span></div>' +
    '</div>';
  var stats =
    '<div class="ov-stats">' +
      '<div class="ov-stat"><span class="ov-stat-val">' + countCompleteSets() + '<small> / ' + SET_META.length + '</small></span><span class="ov-stat-lbl">Sets complete</span></div>' +
      '<div class="ov-stat"><span class="ov-stat-val">' + fmtInt(ownedTierCount("high")) + '<small> / ' + fmtInt(foilTotal) + '</small></span><span class="ov-stat-lbl">Foil cards</span></div>' +
      '<div class="ov-stat"><span class="ov-stat-val">' + fmtInt(state.wishlist.size) + '</span><span class="ov-stat-lbl">On wishlist</span></div>' +
      '<div class="ov-stat"><span class="ov-stat-val">' + fmtMoneyShort(spent) + '</span><span class="ov-stat-lbl">Invested</span></div>' +
    '</div>';
  return '<section class="ov-hero">' + ring +
    '<div class="ov-hero-text">' +
      '<p class="eyebrow">Your collection</p>' +
      '<h2 class="ov-count"><span class="ov-count-num">' + fmtInt(s.owned) + '</span><span class="ov-count-of"> of ' + fmtInt(s.total) + ' cards</span></h2>' +
      '<p class="ov-next">' + esc(nextLine) + '</p>' +
      stats +
    '</div></section>';
}

function ovSetsHtml(){
  var html = "";
  ["Booster", "Starter", "Promo"].forEach(function(grp){
    var sets = SET_META.filter(function(s){ return s[2] === grp; });
    if (!sets.length) return;
    var g = groupStats(grp);
    html += '<div class="ov-group"><span>' + GROUP_NAME[grp] + '</span><span class="mono">' + fmtInt(g.owned) + ' / ' + fmtInt(g.total) + '</span></div><div class="ov-set-list">';
    sets.forEach(function(s){
      var st = setStats(s[0]);
      var frac = st.total ? st.owned / st.total : 0;
      var done = st.total > 0 && st.owned === st.total;
      html +=
        '<button type="button" class="ov-set' + (done ? ' done' : '') + '" data-jump="' + esc(s[0]) + '" title="Open ' + esc(s[1]) + ' in the binder">' +
          '<span class="ov-set-code mono">' + esc(s[0]) + '</span>' +
          '<span class="ov-set-name">' + esc(s[1]) + '</span>' +
          '<span class="ov-bar"><i style="width:' + (frac * 100).toFixed(1) + '%"></i></span>' +
          '<span class="ov-set-count mono">' + (done ? COMPLETE_SVG : '') + st.owned + ' / ' + st.total + '</span>' +
        '</button>';
    });
    html += '</div>';
  });
  return html;
}

function ovClosestHtml(){
  var rows = [];
  SET_META.forEach(function(s){
    var st = setStats(s[0]);
    if (st.owned > 0 && st.owned < st.total) rows.push({ code: s[0], label: s[1], owned: st.owned, total: st.total, left: st.total - st.owned });
  });
  rows.sort(function(a, b){ return (a.left - b.left) || (b.owned / b.total - a.owned / a.total); });
  rows = rows.slice(0, 4);
  if (!rows.length) {
    return '<p class="empty-note">' + (countCompleteSets() ? 'Every set you have started is complete.' : 'Check off a few cards and the sets you are closest to finishing will show up here.') + '</p>';
  }
  var html = '<div class="ov-close-list">';
  rows.forEach(function(r){
    html +=
      '<button type="button" class="ov-close" data-jump-missing="' + esc(r.code) + '" title="Show the cards still missing from ' + esc(r.label) + '">' +
        '<span class="ov-close-top"><span class="ov-set-code mono">' + esc(r.code) + '</span><span class="ov-close-name">' + esc(r.label) + '</span><span class="ov-close-left mono">' + r.left + ' to go</span></span>' +
        '<span class="ov-bar"><i style="width:' + (r.owned / r.total * 100).toFixed(1) + '%"></i></span>' +
      '</button>';
  });
  return html + '</div>';
}

function breakdownRows(kind){
  var keys, label, swatch, pick;
  if (kind === "color") {
    keys = COLOR_ORDER; pick = function(c){ return c[6]; };
    label = function(k){ return COLOR_NAME[k] || k; };
    swatch = function(k){ return COLOR_HEX[k]; };
  } else if (kind === "type") {
    keys = TYPE_ORDER; pick = function(c){ return c[5]; };
    label = function(k){ return TYPE_NAME[k] || k; };
  } else {
    keys = RARITY_ORDER; pick = function(c){ return c[4]; };
    label = function(k){ return k + ' <em>' + esc((RARITY_INFO[k] || {}).name || k) + '</em>'; };
  }
  var total = {}, own = {};
  CARDS.forEach(function(c){
    var k = pick(c);
    total[k] = (total[k] || 0) + 1;
    if (state.owned.has(c[0])) own[k] = (own[k] || 0) + 1;
  });
  var html = "";
  keys.forEach(function(k){
    if (!total[k]) return;
    var o = own[k] || 0, frac = o / total[k];
    var name = (kind === "rarity") ? label(k) : esc(label(k));
    html +=
      '<div class="bd-row">' +
        '<span class="bd-label">' + (swatch ? '<i class="pip" style="background:' + swatch(k) + '"></i>' : '') + name + '</span>' +
        '<span class="ov-bar"><i style="width:' + (frac * 100).toFixed(1) + '%"></i></span>' +
        '<span class="bd-count mono">' + o + ' / ' + total[k] + '</span>' +
        '<span class="bd-pct mono">' + Math.round(frac * 100) + '%</span>' +
      '</div>';
  });
  return html;
}

function renderBreakdown(){
  var body = byId("breakdownBody");
  if (!body) return;
  body.innerHTML = breakdownRows(ui.breakdown);
  document.querySelectorAll("#breakdownSeg button").forEach(function(b){
    b.setAttribute("aria-pressed", b.getAttribute("data-bd") === ui.breakdown ? "true" : "false");
  });
}

function ovShelfHtml(){
  var shelf = [];
  state.owned.forEach(function(id){
    var c = CARD_BY_ID[id];
    if (c && (RARITY_INFO[c[4]] || {}).tier === "high") shelf.push(c);
  });
  shelf.sort(function(a, b){
    return (RARITY_RANK[b[4]] - RARITY_RANK[a[4]]) || ((SET_INDEX[b[1]] || 0) - (SET_INDEX[a[1]] || 0)) || compareBinderOrder(a, b);
  });
  shelfIds = shelf.map(function(c){ return c[0]; });
  if (!shelf.length) return '<p class="empty-note">Foil cards you own will be displayed here, rarest first.</p>';
  var shown = shelf.slice(0, 14);
  var html = '<div class="shelf">';
  shown.forEach(function(c){
    html +=
      '<button type="button" class="shelf-card" data-shelf="' + esc(c[0]) + '" data-tier="high" title="' + esc(c[3]) + ' (' + esc(c[0]) + ')">' +
        '<span class="shelf-art">' + (c[8] ? '<img src="data:image/webp;base64,' + c[8] + '" alt="" width="80" height="111">' : '') + '</span>' +
        '<span class="shelf-code mono">' + esc(c[4]) + '</span>' +
      '</button>';
  });
  html += '</div>';
  if (shelf.length > shown.length) html += '<p class="panel-foot">Showing the ' + shown.length + ' rarest of ' + shelf.length + '.</p>';
  return html;
}

var extraShelfIds = [];
function ovExtrasHtml(){
  var ids = extraSorted(extraIdsAll(), "most", "");
  extraShelfIds = ids;
  if (!ids.length) return '<p class="empty-note">Spare copies you add will stack up here, one pile per card.</p>';
  var html =
    '<div class="ov-extras-top">' +
      '<div><span class="ov-stat-val">' + fmtInt(extraTotal()) + '</span><span class="ov-stat-lbl">Extra cards</span></div>' +
      '<div><span class="ov-stat-val">' + fmtInt(ids.length) + '</span><span class="ov-stat-lbl">Cards with spares</span></div>' +
    '</div><div class="ov-piles">';
  ids.slice(0, 4).forEach(function(id){
    var c = CARD_BY_ID[id];
    html += '<button type="button" class="ov-pile" data-xshelf="' + esc(id) + '" title="' + esc(c[3]) + ', ' + (1 + state.extras[id]) + ' copies">' + pileHtml(c, 1 + state.extras[id]) + '<span class="ov-pile-name">' + esc(c[3]) + '</span></button>';
  });
  return html + '</div>';
}

function ovMilestonesHtml(){
  var html = '<div class="medals">';
  milestoneList().forEach(function(x){
    var frac = Math.min(1, x.goal ? x.cur / x.goal : 0);
    html +=
      '<div class="medal' + (x.done ? ' done' : '') + '">' +
        '<span class="medal-icon" aria-hidden="true">' + MEDAL_SVG + '</span>' +
        '<span class="medal-name">' + esc(x.name) + '</span>' +
        (x.done ? '<span class="medal-sub">Unlocked</span>' : '<span class="medal-sub mono">' + fmtInt(Math.min(x.cur, x.goal)) + ' / ' + fmtInt(x.goal) + '</span><span class="ov-bar slim"><i style="width:' + (frac * 100).toFixed(1) + '%"></i></span>') +
      '</div>';
  });
  return html + '</div>';
}

function sparklineSvg(points, w, h){
  if (!points.length) return "";
  var pad = 4;
  var t0 = dayNum(points[0].date), t1 = Math.max(dayNum(points[points.length - 1].date), dayNum(todayLocalISO()));
  if (t1 === t0) t1 = t0 + 1;
  var maxV = points[points.length - 1].total || 1;
  var x = function(t){ return pad + (w - pad * 2) * (t - t0) / (t1 - t0); };
  var y = function(v){ return h - pad - (h - pad * 2) * v / maxV; };
  var d = "M" + x(t0).toFixed(1) + "," + y(0).toFixed(1), prev = 0;
  points.forEach(function(p){
    var px = x(dayNum(p.date));
    d += " L" + px.toFixed(1) + "," + y(prev).toFixed(1) + " L" + px.toFixed(1) + "," + y(p.total).toFixed(1);
    prev = p.total;
  });
  d += " L" + x(t1).toFixed(1) + "," + y(prev).toFixed(1);
  var area = d + " L" + x(t1).toFixed(1) + "," + (h - pad) + " L" + x(t0).toFixed(1) + "," + (h - pad) + " Z";
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="Running total of spending">' +
    '<defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b24a" stop-opacity=".38"/><stop offset="1" stop-color="#d9b24a" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="' + area + '" fill="url(#sparkFill)" stroke="none"/>' +
    '<path d="' + d + '" fill="none" stroke="#b8862a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
  '</svg>';
}

function ovSpendHtml(){
  var pts = computeCumulativeSeries();
  if (!pts.length) {
    return '<p class="empty-note">No purchases logged yet. Log what you spend and it will be tracked by series and by month.</p>';
  }
  var spent = totalSpent();
  var month = monthTotal(todayLocalISO().slice(0, 7));
  var recent = state.spending.slice().sort(function(a, b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }).slice(0, 3);
  var html =
    '<div class="ov-spend-top">' +
      '<div><span class="ov-stat-val">' + fmtMoney(spent) + '</span><span class="ov-stat-lbl">Total spent</span></div>' +
      '<div><span class="ov-stat-val">' + fmtMoney(month) + '</span><span class="ov-stat-lbl">This month</span></div>' +
    '</div>' +
    (pts.length >= 2 ? sparklineSvg(pts, 320, 64) : '') +
    '<ul class="ov-recent">';
  recent.forEach(function(en){
    html += '<li><span class="mono">' + esc(fmtDateShort(en.date)) + '</span><span class="ov-recent-what">' + esc(en.note || (en.series ? SET_LABEL[en.series] : "Purchase")) + (en.series ? ' <b class="chip mono">' + esc(en.series) + '</b>' : '') + '</span><span class="mono">' + fmtMoney(en.amount) + '</span></li>';
  });
  return html + '</ul>';
}

function renderOverview(){
  var host = byId("overviewView");
  var html = ovHeroHtml();
  html += '<div class="ov-grid">';
  html += '<div class="ov-main">' + ovPanel("", "Set progress", "Tap a set to open it in the binder.", ovSetsHtml()) + '</div>';
  html += '<div class="ov-side">' +
    ovPanel("", "Closest to complete", "The sets that need the fewest more cards.", ovClosestHtml()) +
    ovPanel("", "Breakdown", "How much of each group you own.",
      '<div class="seg" id="breakdownSeg" role="group" aria-label="Breakdown by">' +
        '<button type="button" data-bd="rarity" aria-pressed="false">Rarity</button>' +
        '<button type="button" data-bd="color" aria-pressed="false">Color</button>' +
        '<button type="button" data-bd="type" aria-pressed="false">Type</button>' +
      '</div><div id="breakdownBody" class="bd-list"></div>') +
    ovPanel("", "Foil shelf", "Your ultra and secret cards, rarest first.", ovShelfHtml()) +
    ovPanel("", "Extras", "Spare copies, stacked like the real thing.", ovExtrasHtml(), '<button type="button" class="linkbtn" data-goto="extras">Open extras</button>') +
  '</div>';
  html += '</div>';
  html += '<div class="ov-grid ov-grid-even">' +
    ovPanel("", "Milestones", "Computed from your collection as you go.", ovMilestonesHtml()) +
    ovPanel("", "Spending", "", ovSpendHtml(), '<button type="button" class="linkbtn" data-goto="spending">Open spending</button>') +
  '</div>';
  host.innerHTML = html;
  renderBreakdown();
}

function onOverviewClick(e){
  var t = e.target.closest ? e.target.closest("[data-jump],[data-jump-missing],[data-bd],[data-shelf],[data-xshelf],[data-goto]") : null;
  if (!t) return;
  if (t.hasAttribute("data-jump")) jumpToSet(t.getAttribute("data-jump"));
  else if (t.hasAttribute("data-jump-missing")) jumpToSet(t.getAttribute("data-jump-missing"), { missing: true });
  else if (t.hasAttribute("data-bd")) { ui.breakdown = t.getAttribute("data-bd"); savePrefs(); renderBreakdown(); }
  else if (t.hasAttribute("data-shelf")) openCardModal(t.getAttribute("data-shelf"), shelfIds, t);
  else if (t.hasAttribute("data-xshelf")) openCardModal(t.getAttribute("data-xshelf"), extraShelfIds, t);
  else if (t.hasAttribute("data-goto")) setTab(t.getAttribute("data-goto"));
}



/* ===== Spending: formatting helpers ===== */
var MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function todayLocalISO(){
  var d = new Date();
  var tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function fmtMoney(n){
  n = Number(n) || 0;
  var neg = n < 0;
  n = Math.abs(n);
  var parts = n.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + "$" + parts[0] + "." + parts[1];
}

function fmtMoneyShort(n){
  return fmtMoney(n).replace(/\.00$/, "");
}

/* Whole dollars, for tight spots like the middle of the donut. */
function fmtWholeMoney(n){
  return "$" + fmtInt(n);
}

function fmtMonthLabel(ym){
  var parts = ym.split("-");
  return MONTH_ABBR[parseInt(parts[1], 10) - 1] + " '" + parts[0].slice(2);
}

function fmtMonthLabelFull(ym){
  var parts = ym.split("-");
  return MONTH_FULL[parseInt(parts[1], 10) - 1] + " " + parts[0];
}

function fmtDateShort(iso){
  var parts = iso.split("-");
  return MONTH_ABBR[parseInt(parts[1], 10) - 1] + " " + parseInt(parts[2], 10) + ", " + parts[0];
}

function fmtDayMonth(iso){
  var parts = iso.split("-");
  return MONTH_ABBR[parseInt(parts[1], 10) - 1] + " " + parseInt(parts[2], 10);
}

function niceMax(v){
  if (!(v > 0)) return 10;
  var exp = Math.floor(Math.log(v) / Math.LN10);
  var base = Math.pow(10, exp);
  var mult = v / base;
  var nice = mult <= 1 ? 1 : mult <= 2 ? 2 : mult <= 5 ? 5 : 10;
  return nice * base;
}

/* Whole days since 1970 for a YYYY-MM-DD date, so a time axis can place each
   purchase at its true position instead of spacing them evenly. */
function dayNum(iso){
  var p = iso.split("-");
  return Math.round(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)) / 86400000);
}
function isoFromDay(n){ return new Date(n * 86400000).toISOString().slice(0, 10); }

function addMonths(ym, delta){
  var y = parseInt(ym.slice(0, 4), 10), m = parseInt(ym.slice(5, 7), 10) - 1 + delta;
  y += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return y + "-" + (m < 9 ? "0" : "") + (m + 1);
}

function seriesName(code){ return code ? (SET_LABEL[code] || code) : "No specific series"; }

/* ===== Spending: aggregation ===== */
function totalSpent(){
  var t = 0;
  state.spending.forEach(function(en){ t += en.amount; });
  return t;
}
function monthTotal(ym){
  var t = 0;
  state.spending.forEach(function(en){ if (en.date.slice(0, 7) === ym) t += en.amount; });
  return t;
}

/* "All time", "12 mo", "6 mo", "3 mo": the first day of the window, counting
   the current month as the last month of it. */
function rangeStartISO(){
  if (ui.range === "all") return null;
  var n = parseInt(ui.range, 10);
  return addMonths(todayLocalISO().slice(0, 7), -(n - 1)) + "-01";
}

function computeCumulativeSeries(){
  var byDate = {};
  state.spending.forEach(function(en){
    if (!byDate[en.date]) byDate[en.date] = { date: en.date, sum: 0, items: [] };
    byDate[en.date].sum += en.amount;
    byDate[en.date].items.push(en);
  });
  var dates = Object.keys(byDate).sort();
  var running = 0, points = [];
  dates.forEach(function(d){
    running += byDate[d].sum;
    points.push({ date: d, total: running, items: byDate[d].items });
  });
  return points;
}

function computeMonthlySeries(){
  var startISO = rangeStartISO();
  var byMonth = {};
  state.spending.forEach(function(en){
    if (startISO && en.date < startISO) return;
    var ym = en.date.slice(0, 7);
    if (!byMonth[ym]) byMonth[ym] = { total: 0, series: {} };
    byMonth[ym].total += en.amount;
    byMonth[ym].series[en.series] = (byMonth[ym].series[en.series] || 0) + en.amount;
  });
  var months = Object.keys(byMonth).sort();
  if (!months.length) return [];
  var firstYm = startISO ? startISO.slice(0, 7) : months[0];
  var lastYm = todayLocalISO().slice(0, 7);
  if (months[months.length - 1] > lastYm) lastYm = months[months.length - 1];
  var out = [], ym = firstYm, guard = 0;
  while (ym <= lastYm && guard++ < 600) {
    var m = byMonth[ym] || { total: 0, series: {} };
    out.push({ ym: ym, total: m.total, series: m.series });
    ym = addMonths(ym, 1);
  }
  return out;
}

function spendBySeries(){
  var map = {};
  state.spending.forEach(function(en){
    var k = en.series || "";
    if (!map[k]) map[k] = { code: k, total: 0, count: 0 };
    map[k].total += en.amount;
    map[k].count++;
  });
  var out = [];
  for (var k in map) if (map.hasOwnProperty(k)) out.push(map[k]);
  out.sort(function(a, b){ return b.total - a.total; });
  return out;
}

function spendByKind(){
  var map = {};
  state.spending.forEach(function(en){ map[en.kind] = (map[en.kind] || 0) + en.amount; });
  var out = [];
  SPEND_KINDS.forEach(function(k){ if (map[k.id]) out.push({ kind: k, total: map[k.id] }); });
  return out;
}

/* ===== Spending: chart plumbing ===== */
/* Charts are drawn at the width of the box they sit in (one SVG unit is one
   CSS pixel), so axis text stays the same readable size on a phone and on a
   wide desktop instead of shrinking with a fixed-size drawing. */
var CM = { top: 14, right: 16, bottom: 28, left: 52 };

function chartWidth(wrap){
  var w = Math.floor(wrap.clientWidth || 0);
  return w < 240 ? 240 : w;
}

function yGridHtml(W, yAt, maxY, ticks){
  var grid = "", labels = "";
  for (var t = 0; t <= ticks; t++) {
    var v = maxY * t / ticks, y = yAt(v);
    grid += '<line x1="' + CM.left + '" y1="' + y.toFixed(1) + '" x2="' + (W - CM.right) + '" y2="' + y.toFixed(1) + '"></line>';
    labels += '<text class="chart-axis-label mono" x="' + (CM.left - 8) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + esc(fmtMoneyShort(v)) + '</text>';
  }
  return '<g class="chart-grid">' + grid + '</g>' + labels;
}

/* Tick positions along a time axis: months when the span is long, otherwise
   evenly spaced days. */
function timeTicks(t0, t1, maxTicks){
  var span = t1 - t0, ticks = [], i;
  if (span <= 62) {
    var steps = [1, 2, 3, 5, 7, 10, 14, 15, 30];
    var step = steps[steps.length - 1];
    for (i = 0; i < steps.length; i++) { if (span / steps[i] <= maxTicks - 1) { step = steps[i]; break; } }
    for (var t = t0; t <= t1; t += step) ticks.push({ t: t, label: fmtDayMonth(isoFromDay(t)) });
  } else {
    var d = new Date(t0 * 86400000);
    var y = d.getUTCFullYear(), m = d.getUTCMonth() + (d.getUTCDate() > 1 ? 1 : 0), all = [];
    while (true) {
      var tt = Math.round(Date.UTC(y, m, 1) / 86400000);
      if (tt > t1) break;
      var dd = new Date(tt * 86400000);
      all.push({ t: tt, label: MONTH_ABBR[dd.getUTCMonth()] + (dd.getUTCMonth() === 0 || !all.length ? " '" + String(dd.getUTCFullYear()).slice(2) : "") });
      m++;
    }
    var stride = Math.max(1, Math.ceil(all.length / maxTicks));
    for (i = 0; i < all.length; i += stride) ticks.push(all[i]);
  }
  return ticks;
}

function renderTooltip(tooltip, content){
  tooltip.innerHTML = "";
  var title = document.createElement("div");
  title.className = "chart-tooltip-title";
  title.textContent = content.title;
  tooltip.appendChild(title);
  content.rows.forEach(function(r){
    var row = document.createElement("div");
    row.className = "chart-tooltip-row" + (r.strong ? " strong" : "");
    var label = document.createElement("span");
    label.className = "chart-tooltip-label";
    label.textContent = r.label;
    var value = document.createElement("span");
    value.className = "chart-tooltip-value";
    value.textContent = r.value;
    row.appendChild(label);
    row.appendChild(value);
    tooltip.appendChild(row);
  });
}

function placeTooltip(tooltip, wrap, pxX, pxY){
  var half = Math.max(70, tooltip.offsetWidth / 2 + 6);
  tooltip.style.left = Math.min(Math.max(pxX, half), Math.max(half, wrap.clientWidth - half)) + "px";
  tooltip.style.top = Math.max(pxY - 12, 4) + "px";
  tooltip.classList.add("visible");
}

function wireChartHover(wrap, xPositions, getContent, getPoint){
  var svg = wrap.querySelector("svg");
  var hitRect = wrap.querySelector(".chart-hit");
  var crosshair = wrap.querySelector(".chart-crosshair");
  var hoverDot = wrap.querySelector(".chart-hover-dot");
  if (!svg || !hitRect || !xPositions.length) return;
  var tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  wrap.appendChild(tooltip);

  function nearestIdx(vx){
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < xPositions.length; i++) {
      var d = Math.abs(xPositions[i] - vx);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }
  function show(clientX){
    var rect = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var idx = nearestIdx((clientX - rect.left) * (vb.width / rect.width));
    var p = getPoint(idx);
    crosshair.setAttribute("x1", p.x); crosshair.setAttribute("x2", p.x);
    crosshair.style.opacity = 1;
    hoverDot.setAttribute("cx", p.x); hoverDot.setAttribute("cy", p.y);
    hoverDot.style.opacity = 1;
    renderTooltip(tooltip, getContent(idx));
    placeTooltip(tooltip, wrap, p.x * (rect.width / vb.width), p.y * (rect.height / vb.height));
  }
  function hide(){
    crosshair.style.opacity = 0;
    hoverDot.style.opacity = 0;
    tooltip.classList.remove("visible");
  }
  hitRect.addEventListener("pointermove", function(e){ show(e.clientX); });
  hitRect.addEventListener("pointerdown", function(e){ show(e.clientX); });
  hitRect.addEventListener("pointerleave", hide);
}

function wireBarHover(wrap, getContent){
  var svg = wrap.querySelector("svg");
  if (!svg) return;
  var tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  wrap.appendChild(tooltip);

  function clearHover(){
    var hovered = svg.querySelectorAll(".chart-bar.hovered");
    for (var i = 0; i < hovered.length; i++) hovered[i].classList.remove("hovered");
  }
  function onMove(e){
    var target = e.target.closest ? e.target.closest("[data-idx]") : null;
    clearHover();
    if (!target) { tooltip.classList.remove("visible"); return; }
    var idx = parseInt(target.getAttribute("data-idx"), 10);
    var bar = svg.querySelector('.chart-bar[data-idx="' + idx + '"]');
    if (bar) bar.classList.add("hovered");
    renderTooltip(tooltip, getContent(idx));
    var svgRect = svg.getBoundingClientRect(), tRect = target.getBoundingClientRect();
    var barTop = bar ? bar.getBoundingClientRect().top - svgRect.top : CM.top;
    placeTooltip(tooltip, wrap, tRect.left - svgRect.left + tRect.width / 2, barTop);
  }
  function onLeave(){ clearHover(); tooltip.classList.remove("visible"); }
  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerdown", onMove);
  svg.addEventListener("pointerleave", onLeave);
}

function roundedTopBarPath(x, yTop, w, h, r){
  if (h <= 0.5) return "";
  r = Math.min(r, w / 2, h);
  var yBottom = yTop + h;
  return "M" + x + "," + yBottom +
    " L" + x + "," + (yTop + r) +
    " Q" + x + "," + yTop + " " + (x + r) + "," + yTop +
    " L" + (x + w - r) + "," + yTop +
    " Q" + (x + w) + "," + yTop + " " + (x + w) + "," + (yTop + r) +
    " L" + (x + w) + "," + yBottom +
    " Z";
}

function shortLabel(s, n){ s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

/* ===== Spending: summary tiles and notes ===== */
function renderSpendingKPIs(){
  var total = totalSpent(), count = state.spending.length;
  var avg = count ? total / count : 0;
  var curYm = todayLocalISO().slice(0, 7);
  var thisM = monthTotal(curYm), lastM = monthTotal(addMonths(curYm, -1));
  var owned = ownedCount();
  var perCard = owned ? total / owned : 0;
  var top = null;
  spendBySeries().forEach(function(s){ if (!top && s.code) top = s; });

  var delta;
  if (lastM > 0 && thisM === 0) {
    delta = "Nothing yet. Last month was " + fmtMoney(lastM) + ".";
  } else if (lastM > 0) {
    var pct = Math.round(Math.abs(thisM - lastM) / lastM * 100);
    delta = pct === 0 ? "Same as last month" : (thisM > lastM ? "Up " : "Down ") + pct + "% from " + fmtMoney(lastM) + " last month";
  } else {
    delta = thisM > 0 ? "Nothing spent last month" : "No spending yet this month";
  }
  var tiles = [
    { label: "Total spent", value: fmtMoney(total), sub: count ? count + (count === 1 ? " purchase" : " purchases") + ", " + fmtMoney(avg) + " each" : "No purchases logged yet" },
    { label: "This month", value: fmtMoney(thisM), sub: delta },
    { label: "Per card owned", value: owned && total ? fmtMoney(perCard) : "—", sub: owned ? "Across " + fmtInt(owned) + " cards in the binder" : "Check off cards to see this" },
    { label: "Top series", value: top ? top.code : "—", sub: top ? fmtMoney(top.total) + ", " + Math.round(top.total / total * 100) + "% of spending" : "Log a purchase with a series" }
  ];
  var html = "";
  tiles.forEach(function(t){
    html += '<div class="kpi"><span class="kpi-label">' + esc(t.label) + '</span><span class="kpi-value">' + esc(t.value) + '</span><span class="kpi-sub">' + esc(t.sub) + '</span></div>';
  });
  byId("spendKpis").innerHTML = html;
}

function renderSpendInsights(){
  var list = byId("spendInsights");
  var items = [];
  var count = state.spending.length;
  if (count) {
    var total = totalSpent();
    var big = state.spending.reduce(function(a, b){ return b.amount > a.amount ? b : a; });
    items.push("Your biggest purchase was " + fmtMoney(big.amount) + " on " + fmtDateShort(big.date) + (big.series ? " (" + big.series + ")" : "") + ".");
    var firstYm = state.spending[0].date.slice(0, 7), nowYm = todayLocalISO().slice(0, 7), months = 1;
    while (firstYm < nowYm && months < 1200) { firstYm = addMonths(firstYm, 1); months++; }
    if (months >= 2) items.push("You spend about " + fmtMoney(total / months) + " a month on average, over " + months + " months.");
    var bySeries = spendBySeries().filter(function(s){ return s.code; });
    if (bySeries.length >= 2) items.push(bySeries[0].code + " has taken the biggest share, " + fmtMoney(bySeries[0].total) + " (" + Math.round(bySeries[0].total / total * 100) + "%).");
    var lastDate = state.spending.reduce(function(a, b){ return b.date > a ? b.date : a; }, "0000-00-00");
    var ago = dayNum(todayLocalISO()) - dayNum(lastDate);
    if (items.length < 3) items.push("Your last purchase was " + (ago <= 0 ? "today" : ago === 1 ? "yesterday" : ago + " days ago") + ".");
  }
  list.innerHTML = items.slice(0, 3).map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("");
  list.hidden = !items.length;
}

/* ===== Spending: charts ===== */
function renderCumulativeChart(){
  var wrap = byId("cumulativeChartWrap");
  var all = computeCumulativeSeries();
  if (!all.length) {
    wrap.innerHTML = '<div class="chart-empty">Log a purchase to start tracking your spending over time.</div>';
    return;
  }
  var startISO = rangeStartISO();
  var before = 0, pts = [];
  all.forEach(function(p){
    if (startISO && p.date < startISO) before = p.total; else pts.push(p);
  });
  var firstDay = startISO ? dayNum(startISO) : dayNum(all[0].date);
  var lastDay = Math.max(dayNum(todayLocalISO()), dayNum(all[all.length - 1].date));
  var pad = Math.max(1, Math.round((lastDay - firstDay) * 0.025));
  var t0 = firstDay - pad, t1 = lastDay + pad;
  var W = chartWidth(wrap), H = 232;
  var innerW = W - CM.left - CM.right, innerH = H - CM.top - CM.bottom;
  var finalTotal = all[all.length - 1].total;
  var maxY = niceMax(finalTotal);
  var x = function(t){ return CM.left + innerW * (t - t0) / (t1 - t0); };
  var y = function(v){ return CM.top + innerH - innerH * v / maxY; };
  var baseline = CM.top + innerH;

  var d = "M" + x(t0).toFixed(1) + "," + y(before).toFixed(1), prev = before, xs = [], dots = "";
  pts.forEach(function(p){
    var px = x(dayNum(p.date));
    d += " L" + px.toFixed(1) + "," + y(prev).toFixed(1) + " L" + px.toFixed(1) + "," + y(p.total).toFixed(1);
    prev = p.total;
    xs.push(px);
  });
  d += " L" + x(t1).toFixed(1) + "," + y(prev).toFixed(1);
  var area = d + " L" + x(t1).toFixed(1) + "," + baseline + " L" + x(t0).toFixed(1) + "," + baseline + " Z";
  pts.forEach(function(p, i){
    var last = i === pts.length - 1;
    dots += '<circle class="chart-dot' + (last ? ' last' : '') + '" cx="' + xs[i].toFixed(1) + '" cy="' + y(p.total).toFixed(1) + '" r="' + (last ? 5 : 3.5) + '" fill="#b8862a"></circle>';
  });

  var xLabels = "";
  timeTicks(t0, t1, Math.max(3, Math.floor(innerW / 84))).forEach(function(tk){
    var tx = x(tk.t);
    xLabels += '<line class="chart-tick" x1="' + tx.toFixed(1) + '" y1="' + baseline + '" x2="' + tx.toFixed(1) + '" y2="' + (baseline + 4) + '"></line>' +
      '<text class="chart-axis-label" x="' + tx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(tk.label) + '</text>';
  });

  var svg =
    '<svg class="chart-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Running total of spending over time">' +
      '<defs><linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b24a" stop-opacity=".34"/><stop offset="1" stop-color="#d9b24a" stop-opacity="0"/></linearGradient></defs>' +
      yGridHtml(W, y, maxY, 4) +
      '<line class="chart-baseline" x1="' + CM.left + '" y1="' + baseline + '" x2="' + (W - CM.right) + '" y2="' + baseline + '"></line>' +
      '<path class="chart-area" d="' + area + '" fill="url(#cumFill)" stroke="none"></path>' +
      '<path class="chart-line" d="' + d + '" fill="none" stroke="#b8862a" stroke-width="2.25"></path>' +
      dots +
      '<text class="chart-end-label" x="' + (W - CM.right - 2) + '" y="' + Math.max(y(prev) - 9, 12).toFixed(1) + '" text-anchor="end">' + esc(fmtMoney(prev)) + '</text>' +
      xLabels +
      '<line class="chart-crosshair" x1="0" y1="' + CM.top + '" x2="0" y2="' + baseline + '"></line>' +
      '<circle class="chart-hover-dot" cx="0" cy="0" r="6" fill="#fff" stroke="#b8862a" stroke-width="2.5"></circle>' +
      '<rect class="chart-hit" x="' + CM.left + '" y="0" width="' + innerW + '" height="' + H + '" fill="transparent"></rect>' +
    '</svg>';
  wrap.innerHTML = svg;

  wireChartHover(wrap, xs, function(idx){
    var p = pts[idx];
    var rows = p.items.slice(0, 3).map(function(en){
      return { label: (en.series ? en.series + " " : "") + shortLabel(en.note || KIND_BY_ID[en.kind].name, 20), value: fmtMoney(en.amount) };
    });
    if (p.items.length > 3) rows.push({ label: "and " + (p.items.length - 3) + " more", value: "" });
    rows.push({ label: "Total so far", value: fmtMoney(p.total), strong: true });
    return { title: fmtDateShort(p.date), rows: rows };
  }, function(idx){ return { x: xs[idx], y: y(pts[idx].total) }; });
}

function renderMonthlyChart(){
  var wrap = byId("monthlyChartWrap");
  var series = computeMonthlySeries();
  if (!series.length) {
    wrap.innerHTML = '<div class="chart-empty">' + (state.spending.length ? 'No purchases in this range.' : 'Log a purchase to see your monthly totals.') + '</div>';
    return;
  }
  var W = chartWidth(wrap), H = 232;
  var innerW = W - CM.left - CM.right, innerH = H - CM.top - CM.bottom;
  var n = series.length, maxVal = state.budget || 0;
  series.forEach(function(s){ if (s.total > maxVal) maxVal = s.total; });
  var maxY = niceMax(maxVal || 1);
  var slot = innerW / n, barW = Math.min(40, Math.max(3, slot * 0.62));
  var baseline = CM.top + innerH;
  var y = function(v){ return CM.top + innerH - innerH * v / maxY; };
  var labelEvery = Math.max(1, Math.ceil(n / Math.max(3, Math.floor(innerW / 64))));
  var curYm = todayLocalISO().slice(0, 7);
  var bars = "", hits = "", xLabels = "";
  for (var i = 0; i < n; i++) {
    var cx = CM.left + slot * (i + 0.5), val = series[i].total, top = y(val);
    var h = Math.max(0, baseline - top);
    bars += '<path class="chart-bar' + (series[i].ym === curYm ? ' current' : '') + '" data-idx="' + i + '" d="' + roundedTopBarPath(cx - barW / 2, top, barW, h, Math.min(5, barW / 2)) + '" fill="url(#barFill)"></path>';
    hits += '<rect class="chart-bar-hit" data-idx="' + i + '" x="' + (cx - slot / 2).toFixed(1) + '" y="' + CM.top + '" width="' + slot.toFixed(1) + '" height="' + innerH + '" fill="transparent"></rect>';
    if (i % labelEvery === 0 || i === n - 1) {
      xLabels += '<text class="chart-axis-label" x="' + cx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(fmtMonthLabel(series[i].ym)) + '</text>';
    }
  }
  var budgetLine = state.budget
    ? '<line class="chart-budget" x1="' + CM.left + '" y1="' + y(state.budget).toFixed(1) + '" x2="' + (W - CM.right) + '" y2="' + y(state.budget).toFixed(1) + '"></line>' +
      '<text class="chart-budget-label" x="' + (W - CM.right - 2) + '" y="' + (y(state.budget) - 5).toFixed(1) + '" text-anchor="end">Budget ' + esc(fmtMoneyShort(state.budget)) + '</text>'
    : '';
  wrap.innerHTML =
    '<svg class="chart-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Spending by month">' +
      '<defs><linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6c65f"/><stop offset="1" stop-color="#b8862a"/></linearGradient></defs>' +
      yGridHtml(W, y, maxY, 4) +
      '<line class="chart-baseline" x1="' + CM.left + '" y1="' + baseline + '" x2="' + (W - CM.right) + '" y2="' + baseline + '"></line>' +
      bars + budgetLine + xLabels + hits +
    '</svg>';

  wireBarHover(wrap, function(idx){
    var s = series[idx];
    var rows = Object.keys(s.series).map(function(code){ return { code: code, v: s.series[code] }; })
      .sort(function(a, b){ return b.v - a.v; }).slice(0, 3)
      .map(function(r){ return { label: r.code || "No series", value: fmtMoney(r.v) }; });
    rows.push({ label: "Total", value: fmtMoney(s.total), strong: true });
    return { title: fmtMonthLabelFull(s.ym), rows: rows };
  });
}

function renderKindDonut(){
  var wrap = byId("kindDonutWrap");
  var kinds = spendByKind();
  var total = totalSpent();
  if (!total) {
    wrap.innerHTML = '<div class="chart-empty">Choose a type when you log a purchase to see the split.</div>';
    return;
  }
  var R = 56, C = 2 * Math.PI * R, acc = 0, segs = "", legend = "";
  kinds.forEach(function(k){
    var frac = k.total / total, len = Math.max(0, frac * C - (kinds.length > 1 ? 2.5 : 0));
    segs += '<circle class="donut-seg" data-kind="' + k.kind.id + '" cx="80" cy="80" r="' + R + '" fill="none" stroke="' + k.kind.color + '" stroke-width="22" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-acc * C).toFixed(2) + '" transform="rotate(-90 80 80)"></circle>';
    acc += frac;
    legend += '<li class="donut-row" data-kind="' + k.kind.id + '"><i class="swatch" style="background:' + k.kind.color + '"></i><span class="donut-name">' + esc(k.kind.name) + '</span><span class="donut-amt mono">' + fmtMoney(k.total) + '</span><span class="donut-pct mono">' + Math.round(frac * 100) + '%</span></li>';
  });
  wrap.innerHTML =
    '<div class="donut">' +
      '<div class="donut-fig">' +
        '<svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Spending split by type"><circle cx="80" cy="80" r="' + R + '" fill="none" stroke="#f1e6c6" stroke-width="22"></circle>' + segs + '</svg>' +
        '<div class="donut-center"><span class="donut-total" id="donutTotal">' + esc(fmtWholeMoney(total)) + '</span><span class="donut-cap" id="donutCap">total</span></div>' +
      '</div>' +
      '<ul class="donut-legend">' + legend + '</ul>' +
    '</div>';
  var totalEl = byId("donutTotal"), capEl = byId("donutCap");
  function focusKind(id){
    var k = id ? KIND_BY_ID[id] : null, amt = 0;
    kinds.forEach(function(x){ if (k && x.kind.id === id) amt = x.total; });
    totalEl.textContent = fmtWholeMoney(k ? amt : total);
    capEl.textContent = k ? k.name.toLowerCase() : "total";
    wrap.querySelectorAll("[data-kind]").forEach(function(el){
      el.classList.toggle("dim", !!k && el.getAttribute("data-kind") !== id);
    });
  }
  wrap.onpointerover = function(e){
    var t = e.target.closest ? e.target.closest("[data-kind]") : null;
    focusKind(t ? t.getAttribute("data-kind") : null);
  };
  wrap.onpointerleave = function(){ focusKind(null); };
}

function renderSeriesBars(){
  var wrap = byId("seriesBars");
  var rows = spendBySeries();
  if (!rows.length) {
    wrap.innerHTML = '<p class="empty-note">Choose a series when you log a purchase and each set’s cost will be listed here.</p>';
    return;
  }
  var max = rows[0].total || 1;
  var html = "";
  rows.forEach(function(r){
    var st = r.code ? setStats(r.code) : null;
    var sub = r.count + (r.count === 1 ? " purchase" : " purchases");
    if (st && st.total) {
      sub += ", " + st.owned + " of " + st.total + " cards (" + Math.round(st.owned / st.total * 100) + "%)";
      sub += st.owned ? ", " + fmtMoney(r.total / st.owned) + " per card" : "";
    }
    html +=
      '<div class="sb-row">' +
        '<div class="sb-head">' + (r.code ? '<span class="chip mono">' + esc(r.code) + '</span>' : '') + '<span class="sb-name">' + esc(seriesName(r.code)) + '</span><span class="sb-amt mono">' + fmtMoney(r.total) + '</span></div>' +
        '<div class="ov-bar tall"><i style="width:' + (r.total / max * 100).toFixed(1) + '%"></i></div>' +
        '<div class="sb-sub">' + esc(sub) + '</div>' +
      '</div>';
  });
  wrap.innerHTML = html;
}

/* ===== Spending: budget ===== */
function renderBudget(){
  var body = byId("budgetBody");
  var curYm = todayLocalISO().slice(0, 7);
  var spent = monthTotal(curYm), b = state.budget || 0;
  var dis = readOnly ? " disabled" : "";
  var html = "";
  if (b > 0) {
    var ratio = spent / b, cls = ratio > 1 ? "over" : ratio >= 0.8 ? "warn" : "ok";
    var left = b - spent;
    html +=
      '<div class="budget-state ' + cls + '">' +
        '<div class="budget-line"><strong class="mono">' + fmtMoney(spent) + '</strong> of <span class="mono">' + fmtMoney(b) + '</span> spent in ' + esc(fmtMonthLabelFull(curYm)) + '</div>' +
        '<div class="budget-track" role="progressbar" aria-valuemin="0" aria-valuemax="' + b + '" aria-valuenow="' + Math.min(spent, b).toFixed(2) + '" aria-label="Monthly budget used"><i style="width:' + Math.min(100, ratio * 100).toFixed(1) + '%"></i></div>' +
        '<div class="budget-note">' + (left >= 0 ? fmtMoney(left) + ' left this month.' : fmtMoney(-left) + ' over budget this month.') + '</div>' +
      '</div>';
  }
  html +=
    '<div class="budget-form">' +
      '<div class="field"><label for="budgetInput">Monthly budget ($)</label><input type="number" id="budgetInput" min="0" step="1" inputmode="decimal" placeholder="e.g. 50" value="' + (b > 0 ? b : '') + '"' + dis + '></div>' +
      '<button type="button" class="iconbtn" id="budgetSave"' + dis + '>' + (b > 0 ? 'Update' : 'Set budget') + '</button>' +
      (b > 0 ? '<button type="button" class="iconbtn" id="budgetClear"' + dis + '>Remove</button>' : '') +
    '</div>';
  body.innerHTML = html;
}

function setBudget(v){
  v = Number(v);
  state.budget = (v > 0 && isFinite(v)) ? Math.round(v * 100) / 100 : 0;
  renderBudget();
  renderMonthlyChart();
  scheduleSave();
  showToast(state.budget ? "Monthly budget set to " + fmtMoney(state.budget) : "Budget removed");
}

/* ===== Spending: form and history ===== */
function populateSpendSelects(){
  var sel = byId("spendSeries");
  var html = '<option value="" disabled selected>Choose a series</option><option value="none">No specific series</option>';
  var groups = [["Booster", "Booster packs", true], ["Starter", "Starter decks", false], ["Promo", "Promo & events", false]];
  groups.forEach(function(g){
    var sets = SET_META.filter(function(s){ return s[2] === g[0]; });
    if (g[2]) sets = sets.slice().reverse();
    if (!sets.length) return;
    html += '<optgroup label="' + g[1] + '">';
    sets.forEach(function(s){ html += '<option value="' + esc(s[0]) + '">' + esc(s[0]) + ' · ' + esc(s[1]) + '</option>'; });
    html += '</optgroup>';
  });
  sel.innerHTML = html;
  sel.required = true;
  var kind = byId("spendKind");
  kind.innerHTML = SPEND_KINDS.map(function(k){ return '<option value="' + k.id + '">' + esc(k.name) + '</option>'; }).join("");
}

function filteredSpending(){
  var list = state.spending.filter(function(en){
    if (ui.histSeries === "__none") { if (en.series) return false; }
    else if (ui.histSeries && en.series !== ui.histSeries) return false;
    if (ui.histKind && en.kind !== ui.histKind) return false;
    return true;
  });
  list.sort(function(a, b){
    if (ui.histSort === "high") return (b.amount - a.amount) || (a.date < b.date ? 1 : -1);
    var cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    return ui.histSort === "old" ? cmp : -cmp;
  });
  return list;
}

function refreshHistoryFilters(){
  var sSel = byId("histSeries"), kSel = byId("histKind");
  var seriesSeen = {}, noSeries = false, kindsSeen = {};
  state.spending.forEach(function(en){ if (en.series) seriesSeen[en.series] = true; else noSeries = true; kindsSeen[en.kind] = true; });
  var sHtml = '<option value="">All series</option>';
  SET_META.forEach(function(s){ if (seriesSeen[s[0]]) sHtml += '<option value="' + esc(s[0]) + '">' + esc(s[0]) + '</option>'; });
  if (noSeries) sHtml += '<option value="__none">No series</option>';
  sSel.innerHTML = sHtml;
  var kHtml = '<option value="">All types</option>';
  SPEND_KINDS.forEach(function(k){ if (kindsSeen[k.id]) kHtml += '<option value="' + k.id + '">' + esc(k.name) + '</option>'; });
  kSel.innerHTML = kHtml;
  if (!sSel.querySelector('option[value="' + cssEsc(ui.histSeries) + '"]')) ui.histSeries = "";
  if (!kSel.querySelector('option[value="' + cssEsc(ui.histKind) + '"]')) ui.histKind = "";
  sSel.value = ui.histSeries;
  kSel.value = ui.histKind;
  byId("histSort").value = ui.histSort;
}

function spendRowHtml(en, showYear){
  var kind = KIND_BY_ID[en.kind] || KIND_BY_ID.other;
  var title = en.note || (en.series ? seriesName(en.series) : kind.name);
  var dis = readOnly ? " disabled" : "";
  return '<div class="spend-row' + (ui.editSpendId === en.id ? ' editing' : '') + '" data-id="' + esc(en.id) + '">' +
    '<div class="sr-date mono">' + esc(showYear ? fmtDateShort(en.date) : fmtDayMonth(en.date)) + '</div>' +
    '<div class="sr-main"><div class="sr-title">' + esc(title) + '</div>' +
      '<div class="sr-meta">' + (en.series ? '<span class="chip mono">' + esc(en.series) + '</span>' : '') + '<span class="chip kind"><i class="swatch" style="background:' + kind.color + '"></i>' + esc(kind.name) + '</span></div></div>' +
    '<div class="sr-amt mono">' + fmtMoney(en.amount) + '</div>' +
    '<div class="sr-actions">' +
      '<button type="button" class="spend-row-edit" data-id="' + esc(en.id) + '" aria-label="Edit this purchase" title="Edit"' + dis + '>' + EDIT_SVG + '</button>' +
      '<button type="button" class="spend-row-del" data-id="' + esc(en.id) + '" aria-label="Delete this purchase" title="Delete"' + dis + '>' + TRASH_SVG + '</button>' +
    '</div></div>';
}

function renderSpendList(){
  var container = byId("spendList");
  refreshHistoryFilters();
  var all = state.spending.length;
  var list = filteredSpending();
  var sum = 0;
  list.forEach(function(en){ sum += en.amount; });
  byId("histCount").textContent = all
    ? (list.length === all ? all + (all === 1 ? " purchase, " : " purchases, ") : list.length + " of " + all + " purchases, ") + fmtMoney(sum)
    : "Nothing logged yet";
  if (!all) {
    container.innerHTML = '<div class="empty-note">No purchases logged yet. Add one above and it will appear here.</div>';
    return;
  }
  if (!list.length) {
    container.innerHTML = '<div class="empty-note">No purchases match those filters.</div>';
    return;
  }
  var html = "";
  if (ui.histSort === "high") {
    list.forEach(function(en){ html += spendRowHtml(en, true); });
  } else {
    var ym = "", subtotal = {}, counts = {};
    list.forEach(function(en){ var k = en.date.slice(0, 7); subtotal[k] = (subtotal[k] || 0) + en.amount; counts[k] = (counts[k] || 0) + 1; });
    list.forEach(function(en){
      var k = en.date.slice(0, 7);
      if (k !== ym) {
        if (ym) html += '</div>';
        ym = k;
        html += '<div class="spend-month"><div class="spend-month-head"><span>' + esc(fmtMonthLabelFull(k)) + '</span><span class="mono">' + fmtMoney(subtotal[k]) + ' · ' + counts[k] + (counts[k] === 1 ? ' purchase' : ' purchases') + '</span></div>';
      }
      html += spendRowHtml(en, false);
    });
    html += '</div>';
  }
  container.innerHTML = html;
}

function updateRangeSeg(){
  document.querySelectorAll("#rangeSeg button").forEach(function(b){
    b.setAttribute("aria-pressed", b.getAttribute("data-range") === ui.range ? "true" : "false");
  });
}

function renderSpendCharts(){
  renderCumulativeChart();
  renderMonthlyChart();
}

function renderSpendingView(){
  renderSpendingKPIs();
  renderSpendInsights();
  updateRangeSeg();
  renderSpendCharts();
  renderKindDonut();
  renderSeriesBars();
  renderBudget();
  renderSpendList();
}

function addSpendEntry(fields){
  var entry = normalizeSpendEntry(fields);
  if (!entry) return null;
  state.spending.push(entry);
  state.spending.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  renderSpendingView();
  scheduleSave();
  return entry;
}

function updateSpendEntry(id, fields){
  for (var i = 0; i < state.spending.length; i++) {
    if (state.spending[i].id !== id) continue;
    var merged = normalizeSpendEntry({ id: id, date: fields.date, amount: fields.amount, note: fields.note, series: fields.series, kind: fields.kind });
    if (!merged) return false;
    state.spending[i] = merged;
    state.spending.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    renderSpendingView();
    scheduleSave();
    return true;
  }
  return false;
}

function deleteSpendEntry(id){
  var idx = -1;
  for (var i = 0; i < state.spending.length; i++) { if (state.spending[i].id === id) { idx = i; break; } }
  if (idx === -1) return;
  var removed = state.spending.splice(idx, 1)[0];
  if (ui.editSpendId === id) endEditSpend();
  renderSpendingView();
  scheduleSave();
  showToast("Deleted " + fmtMoney(removed.amount) + " purchase", {
    actionLabel: "Undo",
    onAction: function(){
      state.spending.push(removed);
      state.spending.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      renderSpendingView();
      scheduleSave();
    }
  });
}

function startEditSpend(id){
  var en = null;
  state.spending.forEach(function(x){ if (x.id === id) en = x; });
  if (!en) return;
  ui.editSpendId = id;
  byId("spendDate").value = en.date;
  byId("spendAmount").value = en.amount;
  byId("spendSeries").value = en.series || "none";
  byId("spendKind").value = en.kind;
  byId("spendNote").value = en.note;
  byId("spendSubmit").textContent = "Save changes";
  byId("spendCancel").hidden = false;
  byId("logTitle").textContent = "Edit purchase";
  byId("logPanel").classList.add("editing");
  renderSpendList();
  byId("logPanel").scrollIntoView({ behavior: "smooth", block: "center" });
  byId("spendAmount").focus();
}

function endEditSpend(){
  ui.editSpendId = null;
  byId("spendAmount").value = "";
  byId("spendNote").value = "";
  byId("spendSubmit").textContent = "Add purchase";
  byId("spendCancel").hidden = true;
  byId("logTitle").textContent = "Log a purchase";
  byId("logPanel").classList.remove("editing");
}

function csvCell(v){
  v = String(v == null ? "" : v);
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function spendingCsv(){
  var rows = ["date,amount,series,series_name,type,note"];
  state.spending.slice().sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }).forEach(function(en){
    rows.push([en.date, en.amount.toFixed(2), en.series, en.series ? seriesName(en.series) : "", (KIND_BY_ID[en.kind] || KIND_BY_ID.other).name, en.note].map(csvCell).join(","));
  });
  return rows.join("\n");
}

function wireSpendingControls(){
  populateSpendSelects();
  var form = byId("spendForm");
  var dateInput = byId("spendDate");
  var today = todayLocalISO();
  dateInput.value = today;
  dateInput.max = today;
  form.addEventListener("submit", function(e){
    e.preventDefault();
    if (readOnly) return;
    var date = dateInput.value || todayLocalISO();
    var amount = parseFloat(byId("spendAmount").value);
    var seriesVal = byId("spendSeries").value;
    if (!seriesVal) { byId("spendSeries").focus(); return; }
    var fields = {
      date: date, amount: amount,
      series: seriesVal === "none" ? "" : seriesVal,
      kind: byId("spendKind").value,
      note: byId("spendNote").value.trim()
    };
    if (!isFinite(amount) || amount < 0) return;
    if (ui.editSpendId) {
      var id = ui.editSpendId;
      if (updateSpendEntry(id, fields)) { endEditSpend(); renderSpendList(); showToast("Purchase updated"); }
      return;
    }
    var entry = addSpendEntry(fields);
    if (entry) {
      byId("spendAmount").value = "";
      byId("spendNote").value = "";
      byId("spendAmount").focus();
      showToast("Logged " + fmtMoney(entry.amount) + (entry.series ? " for " + entry.series : ""), {
        actionLabel: "Undo",
        onAction: function(){
          for (var i = 0; i < state.spending.length; i++) { if (state.spending[i].id === entry.id) { state.spending.splice(i, 1); break; } }
          renderSpendingView();
          scheduleSave();
        }
      });
    }
  });
  byId("spendCancel").addEventListener("click", function(){ endEditSpend(); renderSpendList(); });

  byId("spendList").addEventListener("click", function(e){
    var del = e.target.closest ? e.target.closest(".spend-row-del") : null;
    if (del) { deleteSpendEntry(del.getAttribute("data-id")); return; }
    var edit = e.target.closest ? e.target.closest(".spend-row-edit") : null;
    if (edit) startEditSpend(edit.getAttribute("data-id"));
  });

  byId("histSeries").addEventListener("change", function(){ ui.histSeries = this.value; renderSpendList(); });
  byId("histKind").addEventListener("change", function(){ ui.histKind = this.value; renderSpendList(); });
  byId("histSort").addEventListener("change", function(){ ui.histSort = this.value; renderSpendList(); });
  byId("csvBtn").addEventListener("click", function(){
    openTextModal({ title: "Spending as CSV", sub: "Copy this into a spreadsheet such as Google Sheets or Excel. Each purchase is one row.", text: spendingCsv(), primaryLabel: "Copy CSV" });
  });

  document.querySelectorAll("#rangeSeg button").forEach(function(btn){
    btn.addEventListener("click", function(){
      ui.range = btn.getAttribute("data-range");
      savePrefs();
      updateRangeSeg();
      renderSpendCharts();
    });
  });

  byId("budgetBody").addEventListener("click", function(e){
    if (readOnly) return;
    if (e.target.id === "budgetSave") setBudget(byId("budgetInput").value);
    else if (e.target.id === "budgetClear") setBudget(0);
  });
  byId("budgetBody").addEventListener("keydown", function(e){
    if (e.key === "Enter" && e.target.id === "budgetInput") { e.preventDefault(); if (!readOnly) setBudget(e.target.value); }
  });
}



/* ===== Extras: spare copies, stacked like real cards =====
   A card in the binder counts once toward progress. Extras are the copies you
   hold on top of that. They are edited with a copies stepper (total copies, so
   "3" means one in the binder and two extra) in the detail view and here, and
   drawn as a pile: each extra copy adds a card edge behind the top card. */
function copiesOf(id){ return state.owned.has(id) ? 1 + (state.extras[id] || 0) : 0; }

function extraTotal(){
  var t = 0;
  Object.keys(state.extras).forEach(function(id){ t += state.extras[id]; });
  return t;
}

function extraIdsAll(){
  return Object.keys(state.extras).filter(function(id){ return state.extras[id] > 0 && CARD_BY_ID[id] && state.owned.has(id); });
}

function updateExtrasBadge(){
  var out = byId("extrasCount");
  if (out) out.textContent = extraTotal();
}

/* A few degrees of repeatable wobble per card and layer, so a pile looks like
   it was stacked by hand and every pile is not a copy of the last. */
function jitter(id, i){
  var h = 0, str = id + ":" + i;
  for (var k = 0; k < str.length; k++) h = (h * 31 + str.charCodeAt(k)) | 0;
  return ((Math.abs(h) % 1000) / 1000 * 2 - 1) * 1.7;
}

function bumpPile(el){
  if (!el) return;
  el.classList.remove("drop");
  void el.offsetWidth;
  el.classList.add("drop");
}

function pileHtml(c, copies){
  var n = Math.min(copies, 9) - 1;
  var h = '<span class="pile" style="--n:' + n + '" data-copies="' + copies + '">';
  for (var i = n; i >= 1; i--) h += '<span class="pile-card back" style="--i:' + i + ';--r:' + jitter(c[0], i).toFixed(2) + '"></span>';
  h += '<span class="pile-card top">' + (c[8]
    ? '<img src="data:image/webp;base64,' + c[8] + '" alt="" width="80" height="111">'
    : '<span class="pile-empty">' + esc(c[3].slice(0, 1)) + '</span>') + '</span>';
  return h + '<span class="pile-count mono">\u00d7' + copies + '</span></span>';
}

function stepperHtml(id, copies, name){
  var dis = readOnly ? " disabled" : "";
  return '<div class="stepper" role="group" aria-label="Copies of ' + esc(name) + '">' +
    '<button type="button" data-extra-dec="' + esc(id) + '" aria-label="Remove a copy of ' + esc(name) + '"' + dis + (copies <= 1 ? ' hidden' : '') + '>\u2212</button>' +
    '<output class="mono" aria-live="polite">' + copies + '</output>' +
    '<button type="button" data-extra-inc="' + esc(id) + '" aria-label="Add a copy of ' + esc(name) + '"' + (dis || (copies > MAX_EXTRAS ? ' disabled' : '')) + '>+</button>' +
  '</div>';
}

/* The count and buttons of a stepper. A card with one copy has no spare to
   take away, so its minus button is hidden until it has one. */
function syncStepper(dec, inc, count, copies){
  if (count) count.textContent = copies;
  if (dec) {
    var hide = copies <= 1;
    if (hide && !dec.hidden && document.activeElement === dec && inc && !inc.disabled) inc.focus();
    dec.hidden = hide;
    dec.disabled = readOnly;
  }
  if (inc) inc.disabled = readOnly || copies > MAX_EXTRAS;
}

/* Sets the number of extra copies, the one place that count changes. */
function setExtras(id, n, silent){
  n = Math.max(0, Math.min(MAX_EXTRAS, Math.floor(Number(n) || 0)));
  var prev = state.extras[id] || 0;
  if (n === prev) return;
  if (n > 0) state.extras[id] = n; else delete state.extras[id];
  if (!silent) playPop(n > prev);
  applyExtrasEverywhere(id, n > prev ? "up" : "down");
  scheduleSave();
}

/* The stepper counts copies in total. The first copy is the binder's, so + on
   a card you do not have yet puts it in the binder. - only ever takes a spare
   away: the card itself leaves the binder through its own button. */
function changeCopies(id, delta){
  if (readOnly) return;
  var owned = state.owned.has(id), extras = state.extras[id] || 0;
  if (delta > 0) {
    if (!owned) { applyOwnedToggle(id); return; }
    if (extras < MAX_EXTRAS) setExtras(id, extras + 1);
  } else if (extras > 0) {
    setExtras(id, extras - 1);
  }
}

/* Everything that shows a card's count is refreshed from here. */
function applyExtrasEverywhere(id, dir){
  paintTileStacks(id);
  paintCardModal(dir);
  updateExtrasBadge();
  if (ui.tab === "extras") refreshExtrasView(id, dir);
}

function extraSorted(ids, sort, setCode){
  var list = ids.map(function(id){ return CARD_BY_ID[id]; });
  if (setCode) list = list.filter(function(c){ return c[1] === setCode; });
  list.sort(function(a, b){
    if (sort === "name") return a[3].localeCompare(b[3]) || compareReleaseOrder(a, b);
    if (sort === "new") return ((SET_INDEX[b[1]] || 0) - (SET_INDEX[a[1]] || 0)) || compareBinderOrder(a, b);
    if (sort === "set") return compareReleaseOrder(a, b);
    return ((state.extras[b[0]] || 0) - (state.extras[a[0]] || 0)) || compareReleaseOrder(a, b);
  });
  return list.map(function(c){ return c[0]; });
}

function renderExtraKpis(){
  var ids = extraIdsAll(), total = extraTotal(), sets = {}, top = null;
  ids.forEach(function(id){
    sets[CARD_BY_ID[id][1]] = true;
    if (!top || state.extras[id] > state.extras[top]) top = id;
  });
  var tiles = [
    { label: "Extra cards", value: fmtInt(total), sub: total ? "On top of the " + fmtInt(ownedCount()) + " in the binder" : "No spares yet" },
    { label: "Cards with spares", value: fmtInt(ids.length), sub: ids.length ? "Each one has its own pile" : "Add some below" },
    { label: "Biggest stack", times: !!top, value: top ? String(1 + state.extras[top]) : "\u2014", sub: top ? CARD_BY_ID[top][3] : "Nothing stacked yet" },
    { label: "Sets with spares", value: fmtInt(Object.keys(sets).length), sub: Object.keys(sets).length ? "Out of " + SET_META.length + " sets" : "None yet" }
  ];
  byId("extraKpis").innerHTML = tiles.map(function(t){
    return '<div class="kpi"><span class="kpi-label">' + esc(t.label) + '</span><span class="kpi-value">' + (t.times ? '<span class="times">×</span>' : "") + esc(t.value) + '</span><span class="kpi-sub">' + esc(t.sub) + '</span></div>';
  }).join("");
}

function refreshExtraSetFilter(){
  var sel = byId("extraSet");
  var present = {};
  extraIdsAll().forEach(function(id){ present[CARD_BY_ID[id][1]] = true; });
  var html = '<option value="">All sets</option>';
  SET_META.forEach(function(s){ if (present[s[0]]) html += '<option value="' + esc(s[0]) + '">' + esc(s[0]) + ' \u00b7 ' + esc(s[1]) + '</option>'; });
  sel.innerHTML = html;
  if (!present[ui.extraSet]) ui.extraSet = "";
  sel.value = ui.extraSet;
  byId("extraSort").value = ui.extraSort;
}

function stackCardHtml(id){
  var c = CARD_BY_ID[id], extras = state.extras[id] || 0, copies = 1 + extras;
  var rInfo = RARITY_INFO[c[4]] || { name: c[4], tier: "low" };
  return '<div class="stack-card" data-extra-id="' + esc(id) + '">' +
    '<button type="button" class="stack-open" data-extra-open="' + esc(id) + '" aria-label="' + esc(c[3]) + ', ' + copies + ' copies. Open details">' + pileHtml(c, copies) + '</button>' +
    '<div class="stack-meta"><div class="stack-name">' + esc(c[3]) + '</div>' +
      '<div class="stack-sub"><span class="mono">' + esc(id) + '</span><span class="rarity-pill" data-tier="' + esc(rInfo.tier) + '" title="' + esc(rInfo.name) + '">' + esc(c[4]) + '</span></div>' +
      '<div class="stack-extra"><b class="mono">+' + extras + '</b> extra</div></div>' +
    stepperHtml(id, copies, c[3]) +
  '</div>';
}

function extraEmptyHtml(){
  return state.extras && Object.keys(state.extras).length
    ? '<p class="empty-note">No stacks in that set.</p>'
    : '<p class="empty-note">No extras yet. Press + on one of your cards above to add a spare copy.</p>';
}

function renderExtraStacks(){
  var host = byId("extraStacks");
  host.innerHTML = ui.extraOrder.length ? ui.extraOrder.map(stackCardHtml).join("") : extraEmptyHtml();
}

var extraResultIds = [];
function extraRowHtml(c){
  var id = c[0], copies = copiesOf(id);
  var rInfo = RARITY_INFO[c[4]] || { name: c[4], tier: "low" };
  return '<div class="extra-row" data-extra-row="' + esc(id) + '">' +
    '<button type="button" class="extra-thumb" data-extra-peek="' + esc(id) + '" aria-label="Open ' + esc(c[3]) + '">' + (c[8] ? '<img src="data:image/webp;base64,' + c[8] + '" alt="" width="80" height="111">' : '') + '</button>' +
    '<div class="extra-info"><div class="extra-name">' + esc(c[3]) + '</div>' +
      '<div class="extra-sub"><span class="mono">' + esc(id) + '</span><span class="rarity-pill" data-tier="' + esc(rInfo.tier) + '">' + esc(c[4]) + '</span><span class="extra-own">' + extraOwnText(id) + '</span></div></div>' +
    stepperHtml(id, copies, c[3]) +
  '</div>';
}

function extraOwnText(id){
  var copies = copiesOf(id);
  return copies === 0 ? "Not in your binder" : copies === 1 ? "In your binder" : (copies - 1) + " extra";
}

/* The cards in the binder, filtered by set and search, newest set first. Spares
   only exist for cards you hold, so this is the list the + buttons live on. */
var EXTRA_PAGE = 24;
function ownedCardsFor(setCode, q){
  return CARDS.filter(function(c){
    if (!state.owned.has(c[0])) return false;
    if (setCode && c[1] !== setCode) return false;
    return !q || (c[3] + " " + c[0] + " " + c[2] + " " + (SET_LABEL[c[1]] || "")).toLowerCase().indexOf(q) !== -1;
  }).sort(function(a, b){
    return ((SET_INDEX[b[1]] || 0) - (SET_INDEX[a[1]] || 0)) || compareBinderOrder(a, b);
  });
}

function refreshExtraPickSet(){
  var sel = byId("extraPickSet");
  var counts = {};
  state.owned.forEach(function(id){ var c = CARD_BY_ID[id]; if (c) counts[c[1]] = (counts[c[1]] || 0) + 1; });
  var html = '<option value="">All sets (' + fmtInt(ownedCount()) + ' cards)</option>';
  SET_META.forEach(function(s){
    if (counts[s[0]]) html += '<option value="' + esc(s[0]) + '">' + esc(s[0]) + ' \u00b7 ' + esc(s[1]) + ' (' + counts[s[0]] + ')</option>';
  });
  sel.innerHTML = html;
  if (!counts[ui.extraPickSet]) ui.extraPickSet = "";
  sel.value = ui.extraPickSet;
}

function renderExtraResults(){
  var host = byId("extraResults");
  var q = (ui.extraQuery || "").trim().toLowerCase();
  var matches = ownedCardsFor(ui.extraPickSet, q);
  extraResultIds = matches.map(function(c){ return c[0]; });
  if (!state.owned.size) {
    host.innerHTML = '<p class="empty-note">Your binder is empty. Mark the cards you own in the Collection first, and they will show up here.</p>';
    return;
  }
  if (!matches.length) {
    host.innerHTML = '<p class="empty-note">None of your cards match that. Try part of the name, or the card number.</p>';
    return;
  }
  var shown = matches.slice(0, ui.extraShow);
  host.innerHTML = shown.map(extraRowHtml).join("") +
    (matches.length > shown.length
      ? '<div class="extra-more"><button type="button" class="iconbtn" data-extra-more>Show ' + Math.min(EXTRA_PAGE, matches.length - shown.length) + ' more</button><span class="panel-foot">Showing ' + shown.length + ' of ' + fmtInt(matches.length) + '</span></div>'
      : '');
}

function updateExtraRow(id){
  var row = document.querySelector('.extra-row[data-extra-row="' + cssEsc(id) + '"]');
  if (!row) return;
  syncStepper(row.querySelector("[data-extra-dec]"), row.querySelector("[data-extra-inc]"), row.querySelector(".stepper output"), copiesOf(id));
  row.querySelector(".extra-own").textContent = extraOwnText(id);
}

function renderExtrasView(){
  renderExtraKpis();
  refreshExtraSetFilter();
  refreshExtraPickSet();
  ui.extraOrder = extraSorted(extraIdsAll(), ui.extraSort, ui.extraSet);
  renderExtraStacks();
  renderExtraResults();
}

/* A change to one card updates just that card's stack, so the page does not
   jump or reshuffle under the person's finger while they press + or -. */
function refreshExtrasView(id, dir){
  renderExtraKpis();
  updateExtraRow(id);
  var host = byId("extraStacks");
  var el = host.querySelector('.stack-card[data-extra-id="' + cssEsc(id) + '"]');
  var extras = state.extras[id] || 0;
  if (!extras) {
    ui.extraOrder = ui.extraOrder.filter(function(x){ return x !== id; });
    refreshExtraSetFilter();
    if (el) {
      el.classList.add("leaving");
      setTimeout(function(){
        if (el.parentNode) el.parentNode.removeChild(el);
        if (!host.querySelector(".stack-card")) renderExtraStacks();
      }, 240);
    }
    return;
  }
  var c = CARD_BY_ID[id];
  if (!el) {
    if (ui.extraSet && c[1] !== ui.extraSet) return;
    ui.extraOrder.unshift(id);
    if (!host.querySelector(".stack-card")) host.innerHTML = "";
    host.insertAdjacentHTML("afterbegin", stackCardHtml(id));
    refreshExtraSetFilter();
    if (dir === "up") bumpPile(host.querySelector(".stack-card .pile"));
    return;
  }
  el.querySelector(".stack-open").innerHTML = pileHtml(c, 1 + extras);
  el.querySelector(".stack-extra b").textContent = "+" + extras;
  syncStepper(el.querySelector("[data-extra-dec]"), el.querySelector("[data-extra-inc]"), el.querySelector(".stepper output"), 1 + extras);
  if (dir === "up") bumpPile(el.querySelector(".pile"));
}

function openExtraListModal(){
  var ids = extraSorted(extraIdsAll(), "set", "");
  if (!ids.length) { showToast("No extras to list yet."); return; }
  var lines = ids.map(function(id){ return state.extras[id] + "x " + CARD_BY_ID[id][3] + " (" + id + ")"; });
  openTextModal({
    title: "Extras list",
    sub: "Copy this list to share what you have spare, for trading or for a friend.",
    text: "Extra cards: " + fmtInt(extraTotal()) + " spare copies across " + ids.length + (ids.length === 1 ? " card" : " cards") + "\n\n" + lines.join("\n"),
    primaryLabel: "Copy list"
  });
}

function onExtrasClick(e){
  var t = e.target.closest ? e.target.closest("[data-extra-inc],[data-extra-dec],[data-extra-open],[data-extra-peek],[data-extra-more]") : null;
  if (!t) return;
  if (t.hasAttribute("data-extra-more")) {
    var had = byId("extraResults").querySelectorAll(".extra-row").length;
    ui.extraShow += EXTRA_PAGE;
    renderExtraResults();
    var fresh = byId("extraResults").querySelectorAll(".extra-row")[had];
    var firstBtn = fresh && fresh.querySelector("[data-extra-inc]");
    if (firstBtn) firstBtn.focus({ preventScroll: true });
  }
  else if (t.hasAttribute("data-extra-inc")) changeCopies(t.getAttribute("data-extra-inc"), 1);
  else if (t.hasAttribute("data-extra-dec")) changeCopies(t.getAttribute("data-extra-dec"), -1);
  else if (t.hasAttribute("data-extra-open")) openCardModal(t.getAttribute("data-extra-open"), ui.extraOrder.slice(), t);
  else openCardModal(t.getAttribute("data-extra-peek"), extraResultIds.slice(), t);
}

function wireExtrasControls(){
  byId("extrasView").addEventListener("click", onExtrasClick);
  var search = byId("extraSearch");
  search.addEventListener("input", debounce(function(){ ui.extraQuery = search.value; ui.extraShow = EXTRA_PAGE; renderExtraResults(); }, 120));
  byId("extraPickSet").addEventListener("change", function(){
    ui.extraPickSet = this.value;
    ui.extraShow = EXTRA_PAGE;
    renderExtraResults();
  });
  byId("extraSort").addEventListener("change", function(){
    ui.extraSort = this.value;
    savePrefs();
    ui.extraOrder = extraSorted(extraIdsAll(), ui.extraSort, ui.extraSet);
    renderExtraStacks();
  });
  byId("extraSet").addEventListener("change", function(){
    ui.extraSet = this.value;
    ui.extraOrder = extraSorted(extraIdsAll(), ui.extraSort, ui.extraSet);
    renderExtraStacks();
  });
  byId("extraCopy").addEventListener("click", openExtraListModal);
}

/* ===== Page routing =====
   Overview / Collection / Wishlist / Spending are real, addressable pages: the
   URL hash reflects whichever is current (a bare token, so a shared link like
   ...#spending opens straight to it), and browser back/forward moves between
   them. Wishlist reuses the collection markup as a forced "wishlist"
   ownership view; nothing about card state or the save/sync path changes. */
var TABS = ["overview", "collection", "wishlist", "extras", "spending"];

function tabFromHash(){
  var h = location.hash.replace(/^#\/?/, "");
  return TABS.indexOf(h) !== -1 ? h : null;
}

function updateHashForTab(tab, replace){
  var hash = "#" + tab;
  if (location.hash === hash) return;
  /* Some embedded frames refuse to touch the URL; the page works the same
     without it, so a refusal is ignored. */
  try {
    if (replace && history.replaceState) history.replaceState(null, "", hash);
    else location.hash = hash;
  } catch(e){}
}

function playPageTransition(el){
  if (!el) return;
  el.classList.remove("page-enter");
  void el.offsetWidth; /* force reflow so the animation restarts */
  el.classList.add("page-enter");
}

function setTab(tab, opts){
  opts = opts || {};
  var prevTab = ui.tab;
  var next = TABS.indexOf(tab) !== -1 ? tab : "overview";
  ui.tab = next;
  var isWishlist = next === "wishlist";
  var inCollection = next === "collection" || isWishlist;

  byId("overviewView").hidden = next !== "overview";
  byId("collectionView").hidden = !inCollection;
  byId("extrasView").hidden = next !== "extras";
  byId("spendingView").hidden = next !== "spending";

  /* In the wishlist page the set accordions give way to one flat list, and
     the controls that only make sense for sets are tucked away. */
  byId("sets").hidden = isWishlist;
  var ownershipSeg = document.querySelector(".ownership-seg");
  if (ownershipSeg) ownershipSeg.hidden = isWishlist;
  document.querySelectorAll(".toolbar-sets-only").forEach(function(el){ el.hidden = isWishlist; });

  if (isWishlist) {
    if (filters.view !== "wishlist") setOwnershipView("wishlist");
  } else if (next === "collection" && filters.view === "wishlist") {
    setOwnershipView("all");
  }

  document.querySelectorAll("#viewTabs button").forEach(function(btn){
    btn.setAttribute("aria-selected", btn.getAttribute("data-tab") === next ? "true" : "false");
  });

  if (!opts.skipPush) updateHashForTab(next, opts.replace);
  if (next === "overview") renderOverview();
  if (next === "spending") renderSpendingView();
  if (next === "extras") renderExtrasView();
  if (isWishlist) renderWishlistSummary();
  updateToolbarNote();
  if (prevTab !== next) {
    if (!opts.skipAnim) {
      playPageTransition(byId(next === "overview" ? "overviewView" : next === "spending" ? "spendingView" : next === "extras" ? "extrasView" : "collectionView"));
    }
    if (!opts.keepScroll) window.scrollTo(0, 0);
  }
}

function wireViewTabs(){
  document.querySelectorAll("#viewTabs button").forEach(function(btn){
    btn.addEventListener("click", function(){ setTab(btn.getAttribute("data-tab")); });
  });
  window.addEventListener("hashchange", function(){
    var t = tabFromHash();
    if (t && t !== ui.tab) setTab(t, { skipPush: true });
  });
}

/* ===== Filters, layout and sorting ===== */
function resetBinderPages(){ ui.binderPage = {}; }

function clearFilters(){
  filters.q = ""; filters.color = ""; filters.rarity = ""; filters.type = "";
  filters.view = ui.tab === "wishlist" ? "wishlist" : "all";
  byId("search").value = "";
  byId("filterColor").value = "";
  byId("filterRarity").value = "";
  byId("filterType").value = "";
  document.querySelectorAll(".ownership-seg button").forEach(function(b){
    b.setAttribute("aria-pressed", b.getAttribute("data-view") === filters.view ? "true" : "false");
  });
  resetBinderPages();
  applySearchVisibility();
}

function setLayout(layout){
  ui.layout = layout === "grid" ? "grid" : "binder";
  savePrefs();
  document.querySelectorAll("#layoutSeg button").forEach(function(b){
    b.setAttribute("aria-pressed", b.getAttribute("data-layout") === ui.layout ? "true" : "false");
  });
  var sortSel = byId("filterSort");
  sortSel.disabled = ui.layout === "binder";
  sortSel.title = ui.layout === "binder" ? "Binder pages always follow card number order. Switch to Grid to sort." : "";
  refreshOpenGrids();
}

/* ===== Backup, restore and copy-out ===== */
var textModal = { onPrimary: null, copyMode: true, primaryLabel: "Copy to clipboard" };

function openTextModal(o){
  textModal.onPrimary = o.onPrimary || null;
  textModal.copyMode = !o.onPrimary;
  textModal.primaryLabel = o.primaryLabel || "Copy to clipboard";
  byId("backupModalTitle").textContent = o.title;
  byId("backupModalSub").innerHTML = o.sub;
  var ta = byId("backupText");
  ta.readOnly = !o.editable;
  ta.value = o.text || "";
  ta.placeholder = o.placeholder || "";
  byId("backupCopyBtn").textContent = textModal.primaryLabel;
  byId("backupDoneBtn").textContent = o.editable ? "Cancel" : "Done";
  byId("backupOverlay").hidden = false;
  document.body.classList.add("modal-open");
  ta.focus();
  if (!o.editable) ta.select();
}

function closeTextModal(){
  byId("backupOverlay").hidden = true;
  document.body.classList.remove("modal-open");
}

/* Merges a backup (from a file or pasted text) into the collection. It only
   ever adds: nothing already in the binder is removed by a restore. */
function importState(data){
  if (!data || typeof data !== "object") return false;
  var added = 0;
  if (Array.isArray(data.owned)) {
    data.owned.forEach(function(id){ if (typeof id === "string" && CARD_BY_ID[id] && !state.owned.has(id)) { state.owned.add(id); added++; } });
  }
  if (Array.isArray(data.spending)) {
    var existingIds = {};
    state.spending.forEach(function(en){ existingIds[en.id] = true; });
    data.spending.forEach(function(raw){
      var n = normalizeSpendEntry(raw);
      if (n && !existingIds[n.id]) { state.spending.push(n); existingIds[n.id] = true; added++; }
    });
    state.spending.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }
  if (Array.isArray(data.wishlist)) {
    data.wishlist.forEach(function(id){ if (typeof id === "string" && CARD_BY_ID[id] && !state.wishlist.has(id)) { state.wishlist.add(id); added++; } });
  }
  if (Number(data.budget) > 0 && !state.budget) { state.budget = Math.round(Number(data.budget) * 100) / 100; added++; }
  if (data.extras && typeof data.extras === "object" && !Array.isArray(data.extras)) {
    var incoming = normalizeExtras(data.extras, state.owned);
    Object.keys(incoming).forEach(function(id){
      if (incoming[id] > (state.extras[id] || 0)) { state.extras[id] = incoming[id]; added++; }
    });
  }
  if (added) {
    updateExtrasBadge();
    if (ui.tab === "extras") renderExtrasView();
    renderAllSetHeads();
    renderTopProgress();
    refreshOpenGrids();
    updateWishlistBadge();
    renderWishlistSummary();
    if (ui.tab === "overview") renderOverview();
    if (ui.tab === "spending") renderSpendingView();
    scheduleSave();
  }
  return added;
}

function restoreFromText(text){
  var data;
  try { data = JSON.parse(String(text)); } catch(err){ data = null; }
  if (!data || typeof data !== "object") {
    showToast("That doesn't look like a Braverse Binder backup.", { kind: "error" });
    return false;
  }
  var added = importState(data);
  showToast(added ? "Restored " + fmtInt(added) + (added === 1 ? " item" : " items") + " from the backup." : "Nothing new to restore. Everything in that backup is already here.");
  return true;
}

function wireBackup(){
  function currentPayload(){
    return JSON.stringify({ owned: Array.from(state.owned), extras: state.extras, spending: state.spending, wishlist: Array.from(state.wishlist), budget: state.budget || 0, exportedAt: new Date().toISOString() }, null, 2);
  }
  byId("exportBtn").addEventListener("click", function(){
    openTextModal({
      title: "Backup your collection",
      sub: 'Copy this and keep it somewhere safe, like a note or an email to yourself. Paste it back in later with <strong>Restore JSON</strong>.',
      text: currentPayload()
    });
  });
  byId("importBtn").addEventListener("click", function(){
    openTextModal({
      title: "Restore a backup",
      sub: 'Paste a backup here, or <button type="button" class="linkbtn" id="pickBackupFile">choose a .json file</button>. Restoring only adds to your collection. It never removes anything.',
      editable: true,
      placeholder: "Paste backup JSON here",
      primaryLabel: "Restore",
      onPrimary: function(){
        var text = byId("backupText").value;
        if (!text.trim()) { showToast("Paste a backup first.", { kind: "error" }); return; }
        if (restoreFromText(text)) closeTextModal();
      }
    });
    var pick = byId("pickBackupFile");
    if (pick) pick.addEventListener("click", function(){ byId("importFile").click(); });
  });
  byId("backupCloseBtn").addEventListener("click", closeTextModal);
  byId("backupDoneBtn").addEventListener("click", closeTextModal);
  byId("backupOverlay").addEventListener("click", function(e){
    if (e.target === this) closeTextModal();
  });
  byId("backupCopyBtn").addEventListener("click", function(){
    if (textModal.onPrimary) { textModal.onPrimary(); return; }
    var ta = byId("backupText");
    var btn = this;
    function showCopied(){
      btn.textContent = "Copied";
      setTimeout(function(){ btn.textContent = textModal.primaryLabel; }, 1600);
    }
    function fallback(){
      ta.focus(); ta.select();
      try { document.execCommand("copy"); showCopied(); }
      catch(e){ btn.textContent = "Select all, then Ctrl/Cmd+C"; setTimeout(function(){ btn.textContent = textModal.primaryLabel; }, 2200); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(showCopied).catch(fallback);
    } else {
      fallback();
    }
  });
  byId("importFile").addEventListener("change", function(e){
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      if (restoreFromText(reader.result)) closeTextModal();
      e.target.value = "";
    };
    reader.readAsText(file);
  });
}

/* ===== Controls ===== */
function wireControls(){
  byId("sets").addEventListener("click", function(e){
    if (onWishClick(e)) return;
    if (onZoomClick(e)) return;
    if (onPagerClick(e)) return;
    onGridClick(e);
    onSetsClick(e);
  });
  byId("sets").addEventListener("keydown", onSetsKeydown);
  wireBinderSwipe();

  byId("wishlistSummaryGrid").addEventListener("click", function(e){
    if (onWishClick(e)) return;
    if (onZoomClick(e)) return;
    onGridClick(e);
  });
  byId("overviewView").addEventListener("click", onOverviewClick);
  wireExtrasControls();

  var searchInput = byId("search");
  searchInput.value = filters.q;
  searchInput.addEventListener("input", debounce(function(){
    filters.q = searchInput.value.trim().toLowerCase();
    resetBinderPages();
    applySearchVisibility();
  }, 150));

  ["filterColor","filterRarity","filterType"].forEach(function(id, idx){
    var key = ["color","rarity","type"][idx];
    var el = byId(id);
    el.value = filters[key];
    el.addEventListener("change", function(){
      filters[key] = el.value;
      resetBinderPages();
      applySearchVisibility();
    });
  });

  var sortSel = byId("filterSort");
  sortSel.value = filters.sort;
  sortSel.addEventListener("change", function(){
    filters.sort = sortSel.value;
    savePrefs();
    refreshOpenGrids();
  });

  document.querySelectorAll("#layoutSeg button").forEach(function(btn){
    btn.addEventListener("click", function(){ setLayout(btn.getAttribute("data-layout")); });
  });

  document.querySelectorAll(".ownership-seg button").forEach(function(btn){
    btn.setAttribute("aria-pressed", btn.getAttribute("data-view") === filters.view ? "true" : "false");
    btn.addEventListener("click", function(){ resetBinderPages(); setOwnershipView(btn.getAttribute("data-view")); });
  });

  byId("clearFiltersBtn").addEventListener("click", clearFilters);

  byId("expandAllBtn").addEventListener("click", function(){
    if (document.querySelector(".set:not(.open)")) playSlide(true, true);
    document.querySelectorAll(".set").forEach(function(el){ if (!el.hidden) setOpen(el, true); });
  });
  byId("collapseAllBtn").addEventListener("click", function(){
    if (document.querySelector(".set.open")) playSlide(false, true);
    document.querySelectorAll(".set").forEach(function(el){ setOpen(el, false); });
  });

  wireBackup();

  var cardOverlay = byId("cardOverlay");
  cardOverlay.addEventListener("click", onCardModalClick);

  document.addEventListener("keydown", function(e){
    if (onCardModalKey(e)) return;
    if (e.key === "Escape" && !byId("backupOverlay").hidden) { closeTextModal(); return; }
    var tag = e.target && e.target.tagName;
    if (e.key === "/" && (ui.tab === "collection" || ui.tab === "wishlist") && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      byId("search").focus();
    }
  });

  /* Back to top, once the page is long enough to want it. */
  var toTop = byId("toTop"), ticking = false;
  window.addEventListener("scroll", function(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ ticking = false; toTop.hidden = window.scrollY < 700; });
  }, { passive: true });
  toTop.addEventListener("click", function(){ window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* Re-flow what depends on width: binder spreads, and charts (which are
     drawn at the width of their box). */
  if (binderMQ) {
    var onMQ = function(){ if (ui.layout === "binder") refreshOpenGrids(); };
    if (binderMQ.addEventListener) binderMQ.addEventListener("change", onMQ);
    else if (binderMQ.addListener) binderMQ.addListener(onMQ);
  }
  var lastW = window.innerWidth;
  window.addEventListener("resize", debounce(function(){
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    if (ui.tab === "spending") renderSpendCharts();
  }, 180));
}

/* ===== Init ===== */
function init(){
  var loaded = loadInitialState();
  state.owned = loaded.owned;
  state.extras = loaded.extras;
  state.wishlist = loaded.wishlist;
  state.spending = loaded.spending;
  state.budget = loaded.budget;
  var restoredFromStash = restoreUiStateIfAny();
  populateFilterOptions();
  buildSetsSkeleton();
  wireControls();
  wireSpendingControls();
  wireViewTabs();
  wireCardModalTilt();
  updateWishlistBadge();
  updateExtrasBadge();
  renderAllSetHeads();
  renderTopProgress();
  setLayout(ui.layout);
  ui.expanded.forEach(function(code){
    var el = getSetEl(code);
    if (el) setOpen(el, true, true);
  });
  byId("search").value = filters.q;
  byId("filterColor").value = filters.color;
  byId("filterRarity").value = filters.rarity;
  byId("filterType").value = filters.type;
  if (ui.histSeries || ui.histKind || ui.histSort !== "new") byId("histSort").value = ui.histSort;
  if (filters.q) applySearchVisibility();
  renderWishlistSummary();
  wireFoilTracking();
  wireSoundToggle();
  /* A reload right after a save (the artifact's own publish-and-reload
     cycle) restores whichever tab the stash remembers -- that continuity
     matters more than the URL. Otherwise, a hash from a shared link or the
     browser's own back/forward takes over. */
  var initialTab = restoredFromStash ? (ui.tab || "overview") : (tabFromHash() || "overview");
  setTab(initialTab, { replace: true, skipAnim: true, keepScroll: true });
  var boot = byId("bootNote");
  if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
  document.documentElement.classList.add("ready");
  ensureArtifact().then(function(ns){ setSyncState(ns ? "saved" : "local"); });
  /* This browser holds changes newer than the page: publish them again. */
  if (loaded.unpublished) scheduleSave();
  if (pendingScrollY != null) {
    requestAnimationFrame(function(){ window.scrollTo(0, pendingScrollY); });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
})();
