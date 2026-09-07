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
var COLOR_ORDER = ["RED","YELLOW","GREEN","BLUE","PURPLE","BLACK","PURE","COLORLESS"];
var COLOR_NAME = { RED:"Red", YELLOW:"Yellow", GREEN:"Green", BLUE:"Blue", PURPLE:"Purple", BLACK:"Black", PURE:"Pure", COLORLESS:"Colorless" };
var COLOR_HEX = { RED:"var(--c-red)", YELLOW:"var(--c-yellow)", GREEN:"var(--c-green)", BLUE:"var(--c-blue)", PURPLE:"var(--c-purple)", BLACK:"var(--c-black)", PURE:"var(--c-pure)", COLORLESS:"var(--c-colorless)" };
var TYPE_ORDER = ["COOKIE","STAGE","TRAP","ITEM","FLIP","EXTRA","NPC"];
var TYPE_NAME = { COOKIE:"Cookie", STAGE:"Stage", TRAP:"Trap", ITEM:"Item", FLIP:"Flip", EXTRA:"Extra", NPC:"NPC" };
var GROUP_NAME = { Booster: "Booster Packs", Starter: "Starter Decks", Promo: "Promo & Events" };

var CHECK_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var WISH_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 13.6s-5.4-3.25-6.95-6.35C-.35 4.9 1 2.55 3.45 2.27c1.4-.16 2.75.55 3.55 1.75.8-1.2 2.15-1.91 3.55-1.75 2.45.28 3.8 2.63 2.4 5-1.55 3.1-6.95 6.33-6.95 6.33z"/></svg>';
var COMPLETE_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 13.6s-5.4-3.25-6.95-6.35C-.35 4.9 1 2.55 3.45 2.27c1.4-.16 2.75.55 3.55 1.75.8-1.2 2.15-1.91 3.55-1.75 2.45.28 3.8 2.63 2.4 5-1.55 3.1-6.95 6.33-6.95 6.33z"/></svg>';
/* Small gem glyph -- a quick-scan rarity signal next to the card number, so a
   glance at a row of cards tells you which are worth a second look without
   reading the rarity pill text. */
var GEM_SVG = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.2 1.6h7.6l2.9 4-7.2 8.8-7.2-8.8 2.9-4z"/></svg>';

/* ===== Index cards by set ===== */
var CARDS_BY_SET = {};
for (var i = 0; i < CARDS.length; i++) {
  var c = CARDS[i];
  var setCode = c[1];
  if (!CARDS_BY_SET[setCode]) CARDS_BY_SET[setCode] = [];
  CARDS_BY_SET[setCode].push(c);
}
var SET_LABEL = {};
SET_META.forEach(function(s){ SET_LABEL[s[0]] = s[1]; });

/* ===== State ===== */
function readInitialOwned(){
  var fromDoc = [];
  try {
    var el = document.getElementById("cr-state");
    var parsed = JSON.parse((el && el.textContent) || "{}");
    if (Array.isArray(parsed.owned)) fromDoc = parsed.owned;
  } catch(e){}
  var fromLocal = [];
  try {
    var raw = localStorage.getItem("crb_owned_backup");
    if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) fromLocal = arr; }
  } catch(e){}
  var merged = new Set(fromDoc);
  fromLocal.forEach(function(id){ merged.add(id); });
  return merged;
}

function normalizeSpendEntry(e){
  if (!e || typeof e !== "object") return null;
  var amount = Number(e.amount);
  if (!isFinite(amount) || amount < 0) return null;
  var date = (typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) ? e.date : todayLocalISO();
  var id = (typeof e.id === "string" && e.id) ? e.id : ("s_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7));
  var note = typeof e.note === "string" ? e.note.slice(0, 120) : "";
  return { id: id, date: date, amount: amount, note: note };
}

function readInitialSpending(){
  var fromDoc = [];
  try {
    var el = document.getElementById("cr-state");
    var parsed = JSON.parse((el && el.textContent) || "{}");
    if (Array.isArray(parsed.spending)) fromDoc = parsed.spending;
  } catch(e){}
  var fromLocal = [];
  try {
    var raw = localStorage.getItem("crb_spending_backup");
    if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) fromLocal = arr; }
  } catch(e){}
  var map = {};
  fromDoc.forEach(function(e){ var n = normalizeSpendEntry(e); if (n) map[n.id] = n; });
  fromLocal.forEach(function(e){ var n = normalizeSpendEntry(e); if (n) map[n.id] = n; });
  var out = [];
  for (var k in map) if (map.hasOwnProperty(k)) out.push(map[k]);
  out.sort(function(a,b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  return out;
}

function readInitialWishlist(){
  var fromDoc = [];
  try {
    var el = document.getElementById("cr-state");
    var parsed = JSON.parse((el && el.textContent) || "{}");
    if (Array.isArray(parsed.wishlist)) fromDoc = parsed.wishlist;
  } catch(e){}
  var fromLocal = [];
  try {
    var raw = localStorage.getItem("crb_wishlist_backup");
    if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) fromLocal = arr; }
  } catch(e){}
  var merged = new Set(fromDoc);
  fromLocal.forEach(function(id){ merged.add(id); });
  return merged;
}

var state = { owned: readInitialOwned(), spending: readInitialSpending(), wishlist: readInitialWishlist() };
var filters = { q: "", color: "", rarity: "", type: "", view: "all" };
var ui = { expanded: new Set(), tab: "collection" };
var pendingScrollY = null;

/* ===== UI stash across the publish-triggered reload ===== */
function stashUiState(){
  try {
    sessionStorage.setItem("crb_ui_stash", JSON.stringify({
      q: filters.q, color: filters.color, rarity: filters.rarity, type: filters.type, view: filters.view,
      expanded: Array.from(ui.expanded), tab: ui.tab, scrollY: window.scrollY, ts: Date.now()
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
    ui.tab = s.tab || "collection";
    pendingScrollY = (typeof s.scrollY === "number") ? s.scrollY : null;
    return true;
  } catch(e){}
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
function setStats(code){
  var list = CARDS_BY_SET[code] || [];
  var owned = 0;
  for (var i = 0; i < list.length; i++) if (state.owned.has(list[i][0])) owned++;
  return { total: list.length, owned: owned };
}
function overallStats(){
  return { total: CARDS.length, owned: state.owned.size };
}

/* ===== Rendering ===== */
var RING_C = 2 * Math.PI * 15.5;

function renderTopProgress(){
  var s = overallStats();
  document.getElementById("ownedCount").textContent = s.owned;
  document.getElementById("totalCount").textContent = s.total;
  var pct = s.total ? s.owned / s.total : 0;
  var ring = document.getElementById("ringFg");
  ring.style.strokeDasharray = RING_C.toFixed(2);
  ring.style.strokeDashoffset = (RING_C * (1 - pct)).toFixed(2);
  var pctLabel = document.getElementById("ringPct");
  if (pctLabel) pctLabel.textContent = Math.round(pct * 100) + "%";
}

function tileHtml(c){
  var owned = state.owned.has(c[0]);
  var wished = state.wishlist.has(c[0]);
  var rInfo = RARITY_INFO[c[4]] || { name: c[4], tier: "low" };
  var colorHex = COLOR_HEX[c[6]] || "var(--c-colorless)";
  var img = c[8];
  var art = img
    ? '<div class="tile-art"><img src="data:image/webp;base64,' + img + '" alt="" loading="lazy" width="80" height="111"></div>'
    : '<div class="tile-art tile-art-empty" style="background:' + colorHex + '"><span>' + esc(c[3].slice(0,1)) + '</span></div>';
  var wishLabel = wished ? "Remove from wishlist" : "Add to wishlist";
  var dis = readOnly ? " disabled" : "";
  return (
    '<div class="card-tile-wrap">' +
      '<button type="button" class="card-tile" data-id="' + esc(c[0]) + '" data-owned="' + owned + '" data-tier="' + esc(rInfo.tier) + '" title="' + esc(c[3]) + ' (' + esc(c[0]) + ')"' + dis + '>' +
        art +
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
        '</div>' +
      '</button>' +
      '<button type="button" class="tile-wish" data-wish-id="' + esc(c[0]) + '" data-wished="' + wished + '" aria-pressed="' + wished + '" aria-label="' + esc(wishLabel) + '" title="' + esc(wishLabel) + '"' + dis + '>' + WISH_SVG + '</button>' +
    '</div>'
  );
}

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(m){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m];
  });
}

function renderSetBody(code){
  var body = document.querySelector('.set[data-code="' + cssEsc(code) + '"] .card-grid');
  if (!body) return;
  var list = (CARDS_BY_SET[code] || []).filter(cardMatches);
  if (!list.length) {
    body.innerHTML = '<div class="empty-note">No cards match the current filters in this set.</div>';
    return;
  }
  var html = "";
  for (var i = 0; i < list.length; i++) html += tileHtml(list[i]);
  body.innerHTML = html;
}

function cssEsc(s){ return String(s).replace(/"/g, '\\"'); }

/* Tracks each set's last-known completion state so we can tell a genuine
   "just finished this set" transition (worth a celebration) apart from a
   page-load render of a set that was already complete (not worth one). A
   set starts out absent from this map, so the very first refresh -- on
   init -- can never look like a fresh completion. */
var setCompletionKnown = {};

function refreshSetHead(code){
  var el = document.querySelector('.set[data-code="' + cssEsc(code) + '"]');
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

function renderAllSetHeads(){
  SET_META.forEach(function(s){ refreshSetHead(s[0]); });
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

/* ===== Wishlist summary: everything on the list, flattened ===== */
function renderWishlistSummary(){
  var wrap = document.getElementById("wishlistSummary");
  if (!wrap) return;
  if (filters.view !== "wishlist") { wrap.hidden = true; return; }
  wrap.hidden = false;
  var list = CARDS.filter(cardMatches);
  var countEl = document.getElementById("wishlistSummaryCount");
  if (countEl) countEl.textContent = list.length + (list.length === 1 ? " card" : " cards");
  var grid = document.getElementById("wishlistSummaryGrid");
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = '<div class="empty-note">No wishlist cards match the current filters.</div>';
    return;
  }
  var html = "";
  for (var i = 0; i < list.length; i++) html += tileHtml(list[i]);
  grid.innerHTML = html;
}

function applySearchVisibility(){
  var active = !!filters.q;
  document.querySelectorAll(".set").forEach(function(el){
    var code = el.getAttribute("data-code");
    var list = CARDS_BY_SET[code] || [];
    var matchCount = active ? list.filter(cardMatches).length : list.length;
    if (active && matchCount === 0) {
      el.style.display = "none";
    } else {
      el.style.display = "";
      var shouldOpen = active ? matchCount > 0 : ui.expanded.has(code);
      setOpen(el, shouldOpen, true);
    }
  });
  document.querySelectorAll(".group-label").forEach(function(lbl){
    var grp = lbl.getAttribute("data-group");
    var anyVisible = false;
    document.querySelectorAll('.set[data-group="' + grp + '"]').forEach(function(el){
      if (el.style.display !== "none") anyVisible = true;
    });
    lbl.style.display = anyVisible ? "" : "none";
  });
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
  var container = document.getElementById("sets");
  var groups = ["Booster", "Starter", "Promo"];
  var html = "";
  groups.forEach(function(grp){
    var setsInGroup = SET_META.filter(function(s){ return s[2] === grp; });
    if (!setsInGroup.length) return;
    html += '<div class="group-label" data-group="' + grp + '">' + GROUP_NAME[grp] + '</div>';
    setsInGroup.forEach(function(s){
      var code = s[0], label = s[1];
      var total = (CARDS_BY_SET[code] || []).length;
      html +=
        '<div class="set" data-code="' + esc(code) + '" data-group="' + grp + '">' +
          '<div class="set-head" role="button" tabindex="0" aria-expanded="false">' +
            '<svg class="chevron" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '<div><span class="set-title">' + esc(label) + '</span><span class="set-code mono">' + esc(code) + '</span><span class="set-complete-badge">' + COMPLETE_SVG + 'Complete</span></div>' +
            '<div class="set-bar-wrap"><div class="set-bar"><span style="width:0%"></span></div></div>' +
            '<div class="set-count mono">0 / ' + total + '</div>' +
            '<div class="set-actions">' +
              '<button type="button" data-act="view-owned" data-code="' + esc(code) + '">Show owned</button>' +
              '<button type="button" data-act="view-missing" data-code="' + esc(code) + '">Show missing</button>' +
            '</div>' +
          '</div>' +
          '<div class="set-body"><div class="card-grid"></div></div>' +
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
  var sel = document.getElementById(id);
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
  var pill = document.getElementById("syncPill");
  var label = document.getElementById("syncLabel");
  if (!pill) return;
  pill.setAttribute("data-state", mode);
  label.textContent = mode === "saved" ? "Synced" : mode === "saving" ? "Saving…" : mode === "viewonly" ? "View only" : "Local only";
  pill.title = mode === "viewonly" ? "You can browse this collection, but only editors can check off cards, log spending, or edit the wishlist here." : "";
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
  var sel = ".card-tile, .tile-wish, #spendForm button, #spendForm input, .spend-row-del, #importBtn";
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

function buildDocument(ownedArr, spendingArr, wishlistArr){
  var stateJson = JSON.stringify({ owned: ownedArr, spending: spendingArr, wishlist: wishlistArr });
  return PART_A + stateJson + PART_B1 + SELF_SRC + PART_B2;
}

function doSave(){
  var ownedArr = Array.from(state.owned);
  var spendingArr = state.spending;
  var wishlistArr = Array.from(state.wishlist);
  try { localStorage.setItem("crb_owned_backup", JSON.stringify(ownedArr)); } catch(e){}
  try { localStorage.setItem("crb_spending_backup", JSON.stringify(spendingArr)); } catch(e){}
  try { localStorage.setItem("crb_wishlist_backup", JSON.stringify(wishlistArr)); } catch(e){}
  ensureArtifact().then(function(ns){
    if (!ns) { setSyncState("local"); return; }
    stashUiState();
    var html = buildDocument(ownedArr, spendingArr, wishlistArr);
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

/* ===== Interactions ===== */
function toggleCard(id){
  if (state.owned.has(id)) state.owned.delete(id); else state.owned.add(id);
}

function toggleWishlist(id){
  if (state.wishlist.has(id)) state.wishlist.delete(id); else state.wishlist.add(id);
}

function updateWishlistBadge(){
  var btn = document.getElementById("navWishlistTab");
  if (btn) btn.textContent = "Wishlist (" + state.wishlist.size + ")";
}

/* Switches the ownership view (All/Owned/Missing/Wishlist) -- shared by the
   top segmented control and each set's "Show owned"/"Show missing" shortcut
   buttons, so both stay in sync and only ever filter what's displayed.
   Nothing here ever changes state.owned/state.wishlist. */
function setOwnershipView(view){
  filters.view = view;
  document.querySelectorAll(".ownership-seg button").forEach(function(b){
    b.setAttribute("aria-pressed", b.getAttribute("data-view") === view ? "true" : "false");
  });
  refreshOpenGrids();
  applySearchVisibility();
}

function onWishClick(e){
  var btn = e.target.closest ? e.target.closest(".tile-wish") : null;
  if (!btn) return false;
  e.stopPropagation();
  var id = btn.getAttribute("data-wish-id");
  toggleWishlist(id);
  var nowWished = state.wishlist.has(id);
  var label = nowWished ? "Remove from wishlist" : "Add to wishlist";
  /* A card can appear twice at once -- once in its set body, once in the
     flat wishlist summary below -- so mirror the change onto every copy
     rather than just the button that was clicked. */
  document.querySelectorAll('.tile-wish[data-wish-id="' + cssEsc(id) + '"]').forEach(function(b){
    b.setAttribute("data-wished", nowWished);
    b.setAttribute("aria-pressed", nowWished);
    b.setAttribute("aria-label", label);
    b.title = label;
  });
  updateWishlistBadge();
  if (filters.view === "wishlist") {
    /* Membership itself changed, so re-render rather than patch: the card
       needs to disappear from (or reappear in) both the open set body and
       the summary grid. */
    refreshOpenGrids();
    renderWishlistSummary();
  }
  scheduleSave();
  return true;
}

function onGridClick(e){
  var tile = e.target.closest ? e.target.closest(".card-tile") : null;
  if (!tile) return;
  var id = tile.getAttribute("data-id");
  toggleCard(id);
  var nowOwned = state.owned.has(id);
  document.querySelectorAll('.card-tile[data-id="' + cssEsc(id) + '"]').forEach(function(el){
    el.setAttribute("data-owned", nowOwned);
  });
  var setEl = tile.closest(".set");
  if (setEl) refreshSetHead(setEl.getAttribute("data-code"));
  else renderAllSetHeads(); /* toggled from the wishlist summary, which has no .set ancestor */
  renderTopProgress();
  scheduleSave();
}

function onSetsClick(e){
  var actBtn = e.target.closest ? e.target.closest("[data-act]") : null;
  if (actBtn) {
    e.stopPropagation();
    var act = actBtn.getAttribute("data-act");
    var code = actBtn.getAttribute("data-code");
    setOwnershipView(act === "view-owned" ? "owned" : "missing");
    var setEl = document.querySelector('.set[data-code="' + cssEsc(code) + '"]');
    if (setEl) setOpen(setEl, true);
    return;
  }
  var head = e.target.closest ? e.target.closest(".set-head") : null;
  if (head) {
    var setEl2 = head.closest(".set");
    setOpen(setEl2, !setEl2.classList.contains("open"));
  }
}

function onSetsKeydown(e){
  if (e.key !== "Enter" && e.key !== " ") return;
  var head = e.target.closest ? e.target.closest(".set-head") : null;
  if (!head) return;
  e.preventDefault();
  var setEl = head.closest(".set");
  setOpen(setEl, !setEl.classList.contains("open"));
}

function debounce(fn, ms){
  var t = null;
  return function(){
    var args = arguments;
    clearTimeout(t);
    t = setTimeout(function(){ fn.apply(null, args); }, ms);
  };
}

/* ===== Spending: formatting helpers ===== */
var MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

function fmtMonthLabel(ym){
  var parts = ym.split("-");
  var mi = parseInt(parts[1], 10) - 1;
  return MONTH_ABBR[mi] + " '" + parts[0].slice(2);
}

function fmtMonthLabelFull(ym){
  var parts = ym.split("-");
  var mi = parseInt(parts[1], 10) - 1;
  return MONTH_ABBR[mi] + " " + parts[0];
}

function fmtDateShort(iso){
  var parts = iso.split("-");
  var mi = parseInt(parts[1], 10) - 1;
  return MONTH_ABBR[mi] + " " + parseInt(parts[2], 10) + ", " + parts[0];
}

function niceMax(v){
  if (!(v > 0)) return 10;
  var exp = Math.floor(Math.log(v) / Math.LN10);
  var base = Math.pow(10, exp);
  var mult = v / base;
  var nice = mult <= 1 ? 1 : mult <= 2 ? 2 : mult <= 5 ? 5 : 10;
  return nice * base;
}

/* ===== Spending: series computation ===== */
function computeCumulativeSeries(){
  var byDate = {};
  state.spending.forEach(function(en){ byDate[en.date] = (byDate[en.date] || 0) + en.amount; });
  var dates = Object.keys(byDate).sort();
  var running = 0;
  var points = [];
  dates.forEach(function(d){
    running += byDate[d];
    points.push({ date: d, total: running });
  });
  return points;
}

function computeMonthlySeries(){
  var byMonth = {};
  state.spending.forEach(function(en){
    var ym = en.date.slice(0, 7);
    byMonth[ym] = (byMonth[ym] || 0) + en.amount;
  });
  var months = Object.keys(byMonth);
  if (!months.length) return [];
  months.sort();
  var start = months[0], end = months[months.length - 1];
  var y = parseInt(start.slice(0, 4), 10), m = parseInt(start.slice(5, 7), 10);
  var ey = parseInt(end.slice(0, 4), 10), em = parseInt(end.slice(5, 7), 10);
  var out = [];
  while (y < ey || (y === ey && m <= em)) {
    var ym = y + "-" + (m < 10 ? "0" + m : "" + m);
    out.push({ ym: ym, total: byMonth[ym] || 0 });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

/* ===== Spending: chart geometry ===== */
var CHART_VB_W = 640, CHART_VB_H = 240;
var CHART_MARGIN = { top: 16, right: 20, bottom: 30, left: 58 };

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

function renderTooltip(tooltip, content){
  tooltip.innerHTML = "";
  var title = document.createElement("div");
  title.className = "chart-tooltip-title";
  title.textContent = content.title;
  tooltip.appendChild(title);
  content.rows.forEach(function(r){
    var row = document.createElement("div");
    row.className = "chart-tooltip-row";
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

  function toViewBoxX(clientX){
    var rect = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    return (clientX - rect.left) * (vb.width / rect.width);
  }

  function show(clientX){
    var vx = toViewBoxX(clientX);
    var idx = nearestIdx(vx);
    var p = getPoint(idx);
    crosshair.setAttribute("x1", p.x); crosshair.setAttribute("x2", p.x);
    crosshair.style.opacity = 1;
    hoverDot.setAttribute("cx", p.x); hoverDot.setAttribute("cy", p.y);
    hoverDot.style.opacity = 1;
    renderTooltip(tooltip, getContent(idx));
    var rect = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var pxX = p.x * (rect.width / vb.width);
    var pxY = p.y * (rect.height / vb.height);
    tooltip.style.left = pxX + "px";
    tooltip.style.top = Math.max(pxY - 12, 4) + "px";
    tooltip.classList.add("visible");
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
    var svgRect = svg.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var topPx = CHART_MARGIN.top * (svgRect.height / vb.height);
    tooltip.style.left = (targetRect.left - svgRect.left + targetRect.width / 2) + "px";
    tooltip.style.top = Math.max(topPx - 8, 4) + "px";
    tooltip.classList.add("visible");
  }
  function onLeave(){ clearHover(); tooltip.classList.remove("visible"); }

  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerleave", onLeave);
}

/* ===== Spending: rendering ===== */
function renderSpendingKPIs(){
  var total = 0;
  state.spending.forEach(function(en){ total += en.amount; });
  var count = state.spending.length;
  var avg = count ? total / count : 0;
  document.getElementById("spendTotal").textContent = fmtMoney(total);
  document.getElementById("spendCount").textContent = count;
  document.getElementById("spendAvg").textContent = fmtMoney(avg);
}

function renderCumulativeChart(){
  var wrap = document.getElementById("cumulativeChartWrap");
  var points = computeCumulativeSeries();
  if (points.length < 2) {
    wrap.innerHTML = '<div class="chart-empty">' +
      (points.length === 1 ? "Log one more purchase to see a trend line." : "Log a purchase to start tracking your spending over time.") +
      '</div>';
    return;
  }
  var innerW = CHART_VB_W - CHART_MARGIN.left - CHART_MARGIN.right;
  var innerH = CHART_VB_H - CHART_MARGIN.top - CHART_MARGIN.bottom;
  var n = points.length;
  var maxY = niceMax(points[n - 1].total);
  var xAt = function(i){ return CHART_MARGIN.left + (n === 1 ? 0 : (innerW * i / (n - 1))); };
  var yAt = function(v){ return CHART_MARGIN.top + innerH - (innerH * v / maxY); };

  var yTicks = 4, gridLines = "", axisLabelsY = "";
  for (var t = 0; t <= yTicks; t++) {
    var v = maxY * t / yTicks;
    var y = yAt(v);
    gridLines += '<line x1="' + CHART_MARGIN.left + '" y1="' + y.toFixed(1) + '" x2="' + (CHART_VB_W - CHART_MARGIN.right) + '" y2="' + y.toFixed(1) + '"></line>';
    axisLabelsY += '<text class="chart-axis-label mono" x="' + (CHART_MARGIN.left - 8) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + esc(fmtMoneyShort(v)) + '</text>';
  }

  var linePath = "", xPositions = [];
  for (var i = 0; i < n; i++) {
    var x = xAt(i), yy = yAt(points[i].total);
    xPositions.push(x);
    linePath += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + yy.toFixed(1) + " ";
  }
  var baseline = CHART_MARGIN.top + innerH;
  var areaPath = linePath + "L" + xAt(n - 1).toFixed(1) + "," + baseline.toFixed(1) +
    " L" + xAt(0).toFixed(1) + "," + baseline.toFixed(1) + " Z";

  var xLabelCount = Math.min(5, n);
  var axisLabelsX = "";
  for (var li = 0; li < xLabelCount; li++) {
    var idx = xLabelCount === 1 ? 0 : Math.round(li * (n - 1) / (xLabelCount - 1));
    var anchor = idx === 0 ? "start" : (idx === n - 1 ? "end" : "middle");
    var dParts = points[idx].date.split("-");
    var shortLabel = parseInt(dParts[1], 10) + "/" + parseInt(dParts[2], 10);
    axisLabelsX += '<text class="chart-axis-label" x="' + xAt(idx).toFixed(1) + '" y="' + (CHART_VB_H - 8) + '" text-anchor="' + anchor + '">' + esc(shortLabel) + '</text>';
  }

  var lastX = xAt(n - 1), lastY = yAt(points[n - 1].total);

  var svg =
    '<svg class="chart-svg" viewBox="0 0 ' + CHART_VB_W + ' ' + CHART_VB_H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cumulative spending over time">' +
      '<g class="chart-grid">' + gridLines + '</g>' +
      '<path class="chart-area" d="' + areaPath + '"></path>' +
      '<path class="chart-line" d="' + linePath.trim() + '"></path>' +
      '<circle class="chart-dot" cx="' + lastX.toFixed(1) + '" cy="' + lastY.toFixed(1) + '" r="4"></circle>' +
      '<text class="chart-end-label" x="' + Math.max(lastX - 4, CHART_MARGIN.left + 4).toFixed(1) + '" y="' + Math.max(lastY - 10, 12).toFixed(1) + '" text-anchor="end">' + esc(fmtMoney(points[n - 1].total)) + '</text>' +
      axisLabelsY + axisLabelsX +
      '<line class="chart-crosshair" x1="0" y1="' + CHART_MARGIN.top + '" x2="0" y2="' + baseline + '"></line>' +
      '<circle class="chart-hover-dot" cx="0" cy="0" r="5"></circle>' +
      '<rect class="chart-hit" x="' + CHART_MARGIN.left + '" y="0" width="' + innerW + '" height="' + CHART_VB_H + '"></rect>' +
    '</svg>';
  wrap.innerHTML = svg;

  wireChartHover(wrap, xPositions, function(idx){
    return { title: fmtDateShort(points[idx].date), rows: [{ label: "Running total", value: fmtMoney(points[idx].total) }] };
  }, function(idx){ return { x: xAt(idx), y: yAt(points[idx].total) }; });
}

function renderMonthlyChart(){
  var wrap = document.getElementById("monthlyChartWrap");
  var series = computeMonthlySeries();
  if (!series.length) {
    wrap.innerHTML = '<div class="chart-empty">Log a purchase to see your monthly totals.</div>';
    return;
  }
  var innerW = CHART_VB_W - CHART_MARGIN.left - CHART_MARGIN.right;
  var innerH = CHART_VB_H - CHART_MARGIN.top - CHART_MARGIN.bottom;
  var n = series.length;
  var maxVal = 0;
  series.forEach(function(s){ if (s.total > maxVal) maxVal = s.total; });
  var maxY = niceMax(maxVal || 1);
  var slot = innerW / n;
  var barW = Math.min(24, slot * 0.56);
  var baseline = CHART_MARGIN.top + innerH;
  var yAt = function(v){ return CHART_MARGIN.top + innerH - (innerH * v / maxY); };
  var xCenterAt = function(i){ return CHART_MARGIN.left + slot * (i + 0.5); };

  var yTicks = 4, gridLines = "", axisLabelsY = "";
  for (var t = 0; t <= yTicks; t++) {
    var v = maxY * t / yTicks;
    var y = yAt(v);
    gridLines += '<line x1="' + CHART_MARGIN.left + '" y1="' + y.toFixed(1) + '" x2="' + (CHART_VB_W - CHART_MARGIN.right) + '" y2="' + y.toFixed(1) + '"></line>';
    axisLabelsY += '<text class="chart-axis-label mono" x="' + (CHART_MARGIN.left - 8) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + esc(fmtMoneyShort(v)) + '</text>';
  }

  var maxXLabels = 6;
  var labelEvery = Math.max(1, Math.ceil(n / maxXLabels));
  var bars = "", hits = "", axisLabelsX = "";
  for (var i = 0; i < n; i++) {
    var cx = xCenterAt(i);
    var val = series[i].total;
    var barTop = yAt(val);
    var h = Math.max(0, baseline - barTop);
    var x = cx - barW / 2;
    bars += '<path class="chart-bar" data-idx="' + i + '" d="' + roundedTopBarPath(x, barTop, barW, h, 4) + '"></path>';
    hits += '<rect class="chart-bar-hit" data-idx="' + i + '" x="' + (cx - slot / 2).toFixed(1) + '" y="' + CHART_MARGIN.top + '" width="' + slot.toFixed(1) + '" height="' + innerH + '"></rect>';
    if (i % labelEvery === 0 || i === n - 1) {
      axisLabelsX += '<text class="chart-axis-label" x="' + cx.toFixed(1) + '" y="' + (CHART_VB_H - 8) + '" text-anchor="middle">' + esc(fmtMonthLabel(series[i].ym)) + '</text>';
    }
  }

  var svg =
    '<svg class="chart-svg" viewBox="0 0 ' + CHART_VB_W + ' ' + CHART_VB_H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Spending by month">' +
      '<g class="chart-grid">' + gridLines + '</g>' +
      '<line class="chart-baseline" x1="' + CHART_MARGIN.left + '" y1="' + baseline + '" x2="' + (CHART_VB_W - CHART_MARGIN.right) + '" y2="' + baseline + '"></line>' +
      bars + axisLabelsY + axisLabelsX + hits +
    '</svg>';
  wrap.innerHTML = svg;

  wireBarHover(wrap, function(idx){
    return { title: fmtMonthLabelFull(series[idx].ym), rows: [{ label: "Spent", value: fmtMoney(series[idx].total) }] };
  });
}

function renderSpendList(){
  var container = document.getElementById("spendList");
  if (!state.spending.length) {
    container.innerHTML = '<div class="empty-note">No purchases logged yet — add one above.</div>';
    return;
  }
  var sorted = state.spending.slice().sort(function(a, b){
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return 0;
  });
  container.innerHTML = "";
  sorted.forEach(function(en){
    var row = document.createElement("div");
    row.className = "spend-row";
    var date = document.createElement("div");
    date.className = "spend-row-date mono";
    date.textContent = fmtDateShort(en.date);
    var note = document.createElement("div");
    note.className = "spend-row-note";
    note.textContent = en.note || "Purchase";
    var amount = document.createElement("div");
    amount.className = "spend-row-amount mono";
    amount.textContent = fmtMoney(en.amount);
    var del = document.createElement("button");
    del.type = "button";
    del.className = "spend-row-del";
    del.setAttribute("aria-label", "Delete this purchase");
    del.setAttribute("data-id", en.id);
    del.disabled = readOnly;
    del.textContent = "✕";
    row.appendChild(date);
    row.appendChild(note);
    row.appendChild(amount);
    row.appendChild(del);
    container.appendChild(row);
  });
}

function renderSpendingView(){
  renderSpendingKPIs();
  renderCumulativeChart();
  renderMonthlyChart();
  renderSpendList();
}

function addSpendEntry(date, amount, note){
  var entry = normalizeSpendEntry({ date: date, amount: amount, note: note });
  if (!entry) return false;
  state.spending.push(entry);
  renderSpendingView();
  scheduleSave();
  return true;
}

function deleteSpendEntry(id){
  var idx = -1;
  for (var i = 0; i < state.spending.length; i++) { if (state.spending[i].id === id) { idx = i; break; } }
  if (idx === -1) return;
  state.spending.splice(idx, 1);
  renderSpendingView();
  scheduleSave();
}

function wireSpendingControls(){
  var form = document.getElementById("spendForm");
  var dateInput = document.getElementById("spendDate");
  var today = todayLocalISO();
  dateInput.value = today;
  dateInput.max = today;
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var date = dateInput.value || todayLocalISO();
    var amount = parseFloat(document.getElementById("spendAmount").value);
    var note = document.getElementById("spendNote").value.trim();
    if (!isFinite(amount) || amount < 0) return;
    if (addSpendEntry(date, amount, note)) {
      form.reset();
      dateInput.value = todayLocalISO();
      document.getElementById("spendAmount").focus();
    }
  });

  document.getElementById("spendList").addEventListener("click", function(e){
    var btn = e.target.closest ? e.target.closest(".spend-row-del") : null;
    if (!btn) return;
    deleteSpendEntry(btn.getAttribute("data-id"));
  });
}

/* ===== Page routing =====
   Collection / Wishlist / Spending are real, addressable pages: the URL
   hash reflects whichever is current, and browser back/forward moves
   between them, so the site behaves like an app with pages rather than a
   set of toggles that forget where you were. Wishlist reuses the same
   collection markup and rendering as a forced "wishlist" ownership view --
   nothing about card state or the save/sync path changes, only which page
   chrome and animation wrap it. */
var TAB_HASH = { collection: "#/collection", wishlist: "#/wishlist", spending: "#/spending" };
var HASH_TAB = { "#/collection": "collection", "#/wishlist": "wishlist", "#/spending": "spending" };

function tabFromHash(){
  return HASH_TAB[location.hash] || null;
}

function updateHashForTab(tab, replace){
  var hash = TAB_HASH[tab] || TAB_HASH.collection;
  if (location.hash === hash) return;
  if (replace && history.replaceState) history.replaceState(null, "", hash);
  else location.hash = hash;
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
  var next = (tab === "spending") ? "spending" : (tab === "wishlist") ? "wishlist" : "collection";
  ui.tab = next;
  var isSpending = next === "spending";
  var isWishlist = next === "wishlist";

  var collectionControls = document.querySelector(".controls");
  if (collectionControls) collectionControls.style.display = isSpending ? "none" : "";
  document.getElementById("collectionView").hidden = isSpending;
  document.getElementById("spendingView").hidden = !isSpending;

  var ownershipSeg = document.querySelector(".ownership-seg");
  if (ownershipSeg) ownershipSeg.hidden = isWishlist;

  if (isWishlist) {
    if (filters.view !== "wishlist") setOwnershipView("wishlist");
  } else if (next === "collection" && filters.view === "wishlist") {
    setOwnershipView("all");
  }

  document.querySelectorAll("#viewTabs button").forEach(function(btn){
    btn.setAttribute("aria-pressed", btn.getAttribute("data-tab") === next ? "true" : "false");
  });

  if (!opts.skipPush) updateHashForTab(next, opts.replace);
  if (isSpending) renderSpendingView();
  if (!opts.skipAnim && prevTab !== next) {
    playPageTransition(document.getElementById(isSpending ? "spendingView" : "collectionView"));
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

function wireControls(){
  document.getElementById("sets").addEventListener("click", function(e){
    if (onWishClick(e)) return;
    onGridClick(e);
    onSetsClick(e);
  });
  document.getElementById("sets").addEventListener("keydown", onSetsKeydown);

  document.getElementById("wishlistSummaryGrid").addEventListener("click", function(e){
    if (onWishClick(e)) return;
    onGridClick(e);
  });

  var searchInput = document.getElementById("search");
  searchInput.value = filters.q;
  searchInput.addEventListener("input", debounce(function(){
    filters.q = searchInput.value.trim().toLowerCase();
    applySearchVisibility();
    refreshOpenGrids();
  }, 150));

  ["filterColor","filterRarity","filterType"].forEach(function(id, idx){
    var key = ["color","rarity","type"][idx];
    var el = document.getElementById(id);
    el.value = filters[key];
    el.addEventListener("change", function(){
      filters[key] = el.value;
      refreshOpenGrids();
      applySearchVisibility();
    });
  });

  document.querySelectorAll(".ownership-seg button").forEach(function(btn){
    btn.setAttribute("aria-pressed", btn.getAttribute("data-view") === filters.view ? "true" : "false");
    btn.addEventListener("click", function(){ setOwnershipView(btn.getAttribute("data-view")); });
  });

  document.getElementById("expandAllBtn").addEventListener("click", function(){
    document.querySelectorAll(".set").forEach(function(el){ setOpen(el, true); });
  });
  document.getElementById("collapseAllBtn").addEventListener("click", function(){
    document.querySelectorAll(".set").forEach(function(el){ setOpen(el, false); });
  });

  function openBackupModal(){
    var payload = JSON.stringify({ owned: Array.from(state.owned), spending: state.spending, wishlist: Array.from(state.wishlist), exportedAt: new Date().toISOString() }, null, 2);
    var ta = document.getElementById("backupText");
    ta.value = payload;
    document.getElementById("backupCopyBtn").textContent = "Copy to clipboard";
    document.getElementById("backupOverlay").hidden = false;
    ta.focus();
    ta.select();
  }
  function closeBackupModal(){
    document.getElementById("backupOverlay").hidden = true;
  }
  document.getElementById("exportBtn").addEventListener("click", openBackupModal);
  document.getElementById("backupCloseBtn").addEventListener("click", closeBackupModal);
  document.getElementById("backupDoneBtn").addEventListener("click", closeBackupModal);
  document.getElementById("backupOverlay").addEventListener("click", function(e){
    if (e.target === this) closeBackupModal();
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && !document.getElementById("backupOverlay").hidden) closeBackupModal();
  });
  document.getElementById("backupCopyBtn").addEventListener("click", function(){
    var ta = document.getElementById("backupText");
    var btn = this;
    function showCopied(){
      btn.textContent = "Copied!";
      setTimeout(function(){ btn.textContent = "Copy to clipboard"; }, 1600);
    }
    function fallback(){
      ta.focus(); ta.select();
      try { document.execCommand("copy"); showCopied(); }
      catch(e){ btn.textContent = "Select all + Ctrl/Cmd+C"; setTimeout(function(){ btn.textContent = "Copy to clipboard"; }, 2200); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(showCopied).catch(fallback);
    } else {
      fallback();
    }
  });

  document.getElementById("importBtn").addEventListener("click", function(){
    document.getElementById("importFile").click();
  });
  document.getElementById("importFile").addEventListener("change", function(e){
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      try {
        var data = JSON.parse(String(reader.result));
        var changed = false;
        if (Array.isArray(data.owned)) {
          data.owned.forEach(function(id){ state.owned.add(id); });
          changed = true;
        }
        if (Array.isArray(data.spending)) {
          var existingIds = {};
          state.spending.forEach(function(en){ existingIds[en.id] = true; });
          data.spending.forEach(function(raw){
            var n = normalizeSpendEntry(raw);
            if (n && !existingIds[n.id]) { state.spending.push(n); existingIds[n.id] = true; }
          });
          changed = true;
        }
        if (Array.isArray(data.wishlist)) {
          data.wishlist.forEach(function(id){ if (typeof id === "string") state.wishlist.add(id); });
          updateWishlistBadge();
          changed = true;
        }
        if (changed) {
          renderAllSetHeads();
          renderTopProgress();
          refreshOpenGrids();
          renderWishlistSummary();
          if (ui.tab === "spending") renderSpendingView();
          scheduleSave();
        }
      } catch(err) { if (window.console) console.warn("Braverse Binder: import failed", err); }
      e.target.value = "";
    };
    reader.readAsText(file);
  });
}

/* ===== Init ===== */
function init(){
  var restoredFromStash = restoreUiStateIfAny();
  populateFilterOptions();
  buildSetsSkeleton();
  wireControls();
  wireSpendingControls();
  wireViewTabs();
  updateWishlistBadge();
  renderAllSetHeads();
  renderTopProgress();
  ui.expanded.forEach(function(code){
    var el = document.querySelector('.set[data-code="' + cssEsc(code) + '"]');
    if (el) setOpen(el, true, true);
  });
  document.getElementById("search").value = filters.q;
  if (filters.q) applySearchVisibility();
  renderWishlistSummary();
  wireFoilTracking();
  /* A reload right after a save (the artifact's own publish-and-reload
     cycle) restores whichever tab the stash remembers -- that continuity
     matters more than the URL. Otherwise, a hash from a shared link or the
     browser's own back/forward takes over. */
  var initialTab = restoredFromStash ? (ui.tab || "collection") : (tabFromHash() || ui.tab || "collection");
  setTab(initialTab, { replace: true, skipAnim: true });
  ensureArtifact().then(function(ns){ setSyncState(ns ? "saved" : "local"); });
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
