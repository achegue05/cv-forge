
(function () {
"use strict";

var CVF = window.CVF;
var U = CVF.util, $ = U.$, $$ = U.$$;
var D = CVF.data, LS = U.LS;
var t = function (k) { return CVF.i18n.t(k); };

var K_INDEX = "cvforge.v2.index";
var K_DOC   = "cvforge.v2.doc.";
var K_SNAP  = "cvforge.v2.snaps.";
var K_THEME = "cvforge.theme";
var K_V1     = "cvforge.v1";

var state = null;
var index = null;
var view = { zoom: 1, autoZoom: true, tab: "content", panelDirty: false };
var history = { stack: [], at: -1, max: 90 };




var LINE = {}, RICH = { block: true }, LIST = { block: true, lists: true };
function cl(v, mode) { return U.clean(v == null ? "" : String(v), mode); }

function normalize(d) {
  d = d || {};
  d.v = 2;
  d.title = U.htmlToText(String(d.title || ""), " ").slice(0, 120) || t("untitled");
  d.template = String(d.template || "").replace(/[^\w-]/g, "");
  d.design = Object.assign({}, D.DEFAULT_DESIGN, d.design || {});
  d.header = Object.assign({ name: "", tagline: "", photo: "", contacts: [] }, d.header || {});

  d.header.name = cl(d.header.name, LINE);
  d.header.tagline = cl(d.header.tagline, LINE);
  if (!/^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,/i.test(String(d.header.photo || ""))) {
    d.header.photo = "";
  }

  d.header.contacts = (d.header.contacts || []).map(function (c) {
    if (typeof c === "string") return { text: U.mdToHtml(c), link: "", icon: "" };
    return {
      text: cl(c.text, LINE),
      link: U.safeHref(c.link || ""),
      icon: String(c.icon || "").replace(/[^a-z]/g, "")
    };
  });

  (d.sections || []).forEach(function (s) {
    s.title = cl(s.title, LINE);
    (s.items || []).forEach(function (it) {
      if (s.type === "entries") {
        it.left = cl(it.left, LINE);
        it.right = cl(it.right, LINE);
        it.text = cl(it.text, RICH);
        (it.subs || []).forEach(function (x) {
          x.left = cl(x.left, LINE);
          x.right = cl(x.right, LINE);
        });
        it.bullets = (it.bullets || []).map(function (b) { return cl(b, LIST); });
      } else if (s.type === "rows") {
        it.label = cl(it.label, LINE);
        it.content = cl(it.content, RICH);
      } else if (s.type === "bars") {
        it.label = cl(it.label, LINE);
        it.note = cl(it.note, LINE);
        it.level = U.clamp(parseInt(it.level, 10) || 0, 0, 5);
      } else if (s.type === "tags") {
        it.text = cl(it.text, LINE);
      } else {
        it.text = cl(it.text, s.type === "list" ? LIST : RICH);
      }
    });
  });

  (d.sections || []).forEach(function (s) {
    if (!s.id) s.id = U.uid("s");
    if (s.visible === undefined) s.visible = true;
    if (s.rule === undefined) s.rule = true;
    if (!s.columns) s.columns = 1;
    if (!s.col) s.col = "main";
    if (s.accent === undefined) s.accent = "";
    if (!Array.isArray(s.items)) s.items = [];
    if (s.type === "entries") {
      s.items.forEach(function (it) {
        if (!Array.isArray(it.subs)) it.subs = [];
        if (!Array.isArray(it.bullets)) it.bullets = [];
      });
    }
  });
  if (!Array.isArray(d.sections)) d.sections = [];
  return d;
}


function fromV1(old) {
  var md = U.mdToHtml;
  var d = {
    v: 2, title: t("untitled"), template: "",
    design: Object.assign({}, D.DEFAULT_DESIGN, old.design || {}),
    header: {
      name: md(old.header && old.header.name),
      tagline: md(old.header && old.header.tagline),
      photo: "",
      contacts: ((old.header && old.header.contacts) || []).map(function (c) {
        return { text: md(c), link: "", icon: "" };
      })
    },
    sections: (old.sections || []).map(function (s) {
      var out = {
        id: s.id || U.uid("s"), type: s.type, title: U.htmlToText(md(s.title), " "),
        visible: s.visible !== false, rule: s.rule !== false,
        columns: s.columns || 1, col: "main", marked: !!s.marked, accent: "",
        items: []
      };
      out.items = (s.items || []).map(function (it) {
        if (s.type === "entries") {
          return {
            left: md(it.left), right: md(it.right),
            subs: (it.subs || []).map(function (x) { return { left: md(x.left), right: md(x.right) }; }),
            text: md(it.text),
            bullets: (it.bullets || []).map(md)
          };
        }
        if (s.type === "rows") return { label: md(it.label), content: md(it.content) };
        return { text: md(it.text) };
      });
      return out;
    })
  };
  return normalize(d);
}



function loadIndex() {
  var idx = LS.get(K_INDEX, null);
  if (idx && idx.docs && idx.docs.length) return idx;

  var docs = [], activeId;
  var old = LS.get(K_V1, null);
  if (old && old.sections) {
    var conv = fromV1(old);
    activeId = U.uid("d");
    conv.title = t("untitled");
    LS.set(K_DOC + activeId, conv);
    docs.push({ id: activeId, title: conv.title, updated: Date.now() });
  } else {
    var ex = D.EXAMPLE(CVF.i18n.lang);
    activeId = U.uid("d");
    LS.set(K_DOC + activeId, ex);
    docs.push({ id: activeId, title: ex.title, updated: Date.now() });
  }
  idx = { activeId: activeId, docs: docs };
  LS.set(K_INDEX, idx);
  return idx;
}

function loadDoc(id) {
  var d = LS.get(K_DOC + id, null);
  if (!d) return normalize(D.EXAMPLE(CVF.i18n.lang));
  return d.v === 2 ? normalize(d) : fromV1(d);
}

var saveTimer, statusTimer;
function save(now) {
  setStatus("saving");
  clearTimeout(saveTimer);
  var go = function () {
    LS.set(K_DOC + index.activeId, state);
    var row = index.docs.filter(function (x) { return x.id === index.activeId; })[0];
    if (row) { row.title = state.title; row.updated = Date.now(); }
    LS.set(K_INDEX, index);
    setStatus("saved");
  };
  if (now) go(); else saveTimer = setTimeout(go, 420);
}

function setStatus(kind) {
  var el = $("#save-status");
  if (!el) return;
  el.textContent = kind === "saving" ? t("saving") : t("saved");
  el.className = "save-status is-" + kind;
  clearTimeout(statusTimer);
  if (kind === "saved") statusTimer = setTimeout(function () { el.className = "save-status"; }, 1800);
}



var histTimer = null;
var histLock = false;   

function pushHistory(immediate) {
  if (histLock) return;
  clearTimeout(histTimer);
  var go = function () {
    histTimer = null;
    var snap = JSON.stringify(state);
    if (history.stack[history.at] === snap) return;
    history.stack = history.stack.slice(0, history.at + 1);
    history.stack.push(snap);
    if (history.stack.length > history.max) history.stack.shift();
    history.at = history.stack.length - 1;
    refreshHistoryButtons();
  };
  if (immediate) { histTimer = null; go(); }
  else histTimer = setTimeout(go, 650);
}


function flushHistory() {
  if (!histTimer) return;
  clearTimeout(histTimer);
  histTimer = null;
  pushHistory(true);
}

function travel(delta) {
  flushHistory();
  var target = history.at + delta;
  if (target < 0) { U.toast(t("msgNothingUndo")); return; }
  if (target > history.stack.length - 1) { U.toast(t("msgNothingRedo")); return; }
  history.at = target;
  state = JSON.parse(history.stack[history.at]);
  histLock = true;
  try { renderAll(); } finally { histLock = false; }
  save();
  refreshHistoryButtons();
}

function undo() { travel(-1); }
function redo() { travel(1); }

function refreshHistoryButtons() {
  var u = $('[data-cmd="undoDoc"]'), r = $('[data-cmd="redoDoc"]');
  if (u) u.disabled = history.at <= 0;
  if (r) r.disabled = history.at >= history.stack.length - 1;
}



var paperTimer;
function schedulePaper() {
  clearTimeout(paperTimer);
  paperTimer = setTimeout(function () { CVF.render.renderCV(state); }, 240);
}

function setField(path, value, source) {
  U.setPath(state, path, value);
  if (source === "panel") {
    if (!CVF.render.patchField(path, typeof value === "string" ? value : null)) schedulePaper();
  } else {
    view.panelDirty = true;
  }
  afterChange();
}

function setProp(path, value) {
  U.setPath(state, path, value);
  CVF.render.renderCV(state);
  afterChange(true);
}

function setDesign(key, value) {
  state.design[key] = value;
  CVF.render.applyDesign(state);
  if (REDRAW[key]) CVF.render.renderCV(state);
  if (key === "twoCol") CVF.panel.renderContent();
  afterChange();
}

var REDRAW = {
  contactSep: 1, contactIcons: 1, showGuides: 1, headerRule: 1,
  twoCol: 1, photoShow: 1, showPageNumbers: 1, rowsLayout: 1
};

function afterChange(structural) {
  save();
  pushHistory(!!structural);
  updateMeta();
  if (view.tab === "review") CVF.panel.renderReview();
}

function updateMeta() {
  var n = CVF.render.pageCount(state);
  var fill = CVF.render.lastPageFill(state);
  var el = $("#page-count");
  if (el) el.textContent = n + " " + (n === 1 ? (CVF.i18n.lang === "en" ? "page" : "página") : t("pages"));
  var m = $("#fill-meter i");
  if (m) m.style.width = U.clamp(fill, 0, 100) + "%";
}



function reorder(kind, ctx, from, to) {
  var arr;
  if (kind === "sections") arr = state.sections;
  else if (kind === "contacts") arr = state.header.contacts;
  else if (kind === "items") arr = state.sections[ctx.si].items;
  else if (kind === "bullets") arr = state.sections[ctx.si].items[ctx.ii].bullets;
  if (!arr) return;
  arr.splice(to, 0, arr.splice(from, 1)[0]);
  renderStructure();
}

function renderStructure() {
  CVF.render.renderCV(state);
  CVF.panel.renderContent();
  view.panelDirty = false;
  afterChange(true);
}

function panelAction(a, btn) {
  var si = parseInt(btn.getAttribute("data-si"), 10);
  var ii = parseInt(btn.getAttribute("data-ii"), 10);
  var k = parseInt(btn.getAttribute("data-k"), 10);
  var secs = state.sections;
  var keep = $(".panel-scroll").scrollTop;

  switch (a) {
    case "collapse":
      CVF.panel.ui.collapsed[secs[si].id] = !CVF.panel.ui.collapsed[secs[si].id];
      break;
    case "move-sec": {
      var dir = parseInt(btn.getAttribute("data-dir"), 10), to = si + dir;
      if (to < 0 || to >= secs.length) return;
      secs.splice(to, 0, secs.splice(si, 1)[0]);
      break;
    }
    case "dup-sec": {
      var c = U.copy(secs[si]); c.id = U.uid("s");
      c.title = c.title + t("copySuffix");
      secs.splice(si + 1, 0, c);
      break;
    }
    case "hide-sec": secs[si].visible = !secs[si].visible; break;
    case "del-sec":
      U.confirmBox({ title: t("delete"), body: t("confirmDelSec"), ok: t("delete"), cancel: t("cancel") })
        .then(function (yes) { if (yes) { secs.splice(si, 1); renderStructure(); } });
      return;
    case "add-sec":
      secs.push(D.newSection(btn.getAttribute("data-type"), t("newSection")));
      break;
    case "add-item": secs[si].items.push(D.newItem(secs[si].type)); break;
    case "del-item": secs[si].items.splice(ii, 1); break;
    case "dup-item": secs[si].items.splice(ii + 1, 0, U.copy(secs[si].items[ii])); break;
    case "move-item": {
      var d2 = parseInt(btn.getAttribute("data-dir"), 10);
      var arr = secs[si].items, to2 = ii + d2;
      if (to2 < 0 || to2 >= arr.length) return;
      arr.splice(to2, 0, arr.splice(ii, 1)[0]);
      break;
    }
    case "add-sub": secs[si].items[ii].subs.push({ left: "", right: "" }); break;
    case "del-sub": secs[si].items[ii].subs.splice(k, 1); break;
    case "add-bullet": secs[si].items[ii].bullets.push(""); break;
    case "del-bullet": secs[si].items[ii].bullets.splice(k, 1); break;
    case "add-contact":
      state.header.contacts.push({ text: "", link: "", icon: "" });
      break;
    case "del-contact": state.header.contacts.splice(k, 1); break;
    case "pick-photo": $("#photo-input").click(); return;
    case "drop-photo": state.header.photo = ""; break;

    case "fit": {
      var n = parseInt(btn.getAttribute("data-n"), 10) || 1;
      var ok = CVF.render.fitToPages(state, n, function () { CVF.render.applyDesign(state); });
      CVF.panel.renderDesign();
      afterChange(true);
      U.toast(ok ? t("msgFits") : t("msgNoFit"), ok ? "" : "err");
      return;
    }
    case "reset-design":
      state.design = U.copy(D.DEFAULT_DESIGN);
      state.template = "";
      CVF.render.applyDesign(state); CVF.render.renderCV(state);
      CVF.panel.renderDesign(); CVF.panel.renderTemplates();
      afterChange(true);
      U.toast(t("msgDesignReset"));
      return;
    case "palette": {
      var p = D.PALETTES[parseInt(btn.getAttribute("data-i"), 10)];
      Object.assign(state.design, {
        textColor: p[1], accent: p[2], titleColor: p[2], nameColor: p[1],
        ruleColor: p[3], pageBg: p[4], titleBandBg: p[5], linkColor: p[2]
      });
      CVF.render.applyDesign(state);
      CVF.panel.refreshDesignValues();
      afterChange(true);
      return;
    }
    case "clear-color": {
      var key = btn.getAttribute("data-k");
      state.design[key] = "transparent";
      CVF.render.applyDesign(state);
      CVF.panel.renderDesign();
      afterChange(true);
      return;
    }
    case "template": applyTemplate(btn.getAttribute("data-id")); return;
    case "match": {
      var box = $(".job-box");
      var text = box ? box.value : "";
      CVF.panel.ui.job = text;
      if (!text.trim()) { U.toast(t("noJobText"), "err"); return; }
      CVF.panel.ui.jobResult = CVF.review.match(state, text);
      CVF.panel.renderReview();
      return;
    }
    default: return;
  }

  renderStructure();
  $(".panel-scroll").scrollTop = keep;
}



function applyTemplate(id) {
  var tpl = D.TEMPLATES.filter(function (x) { return x.id === id; })[0];
  if (!tpl) return;
  Object.assign(state.design, U.copy(tpl.design));
  state.template = id;

  if (tpl.layout && tpl.layout.twoCol) {
    var side = tpl.layout.sideKeys || [];
    state.sections.forEach(function (s) {
      s.col = side.indexOf(s.key) > -1 ? "side" : "main";
    });
  } else {
    state.sections.forEach(function (s) { s.col = "main"; });
  }

  CVF.render.applyDesign(state);
  CVF.render.renderCV(state);
  CVF.panel.renderDesign();
  CVF.panel.renderTemplates();
  CVF.panel.renderContent();
  afterChange(true);
  U.toast(t("templateApplied"));
}



function docsMenuHTML() {
  var snaps = LS.get(K_SNAP + index.activeId, []);
  var out = '<div class="menu-sec"><p class="eyebrow">' + U.esc(t("docs")) + "</p>";
  index.docs.forEach(function (d) {
    out += '<button class="menu-row' + (d.id === index.activeId ? " is-on" : "") +
      '" data-a="open-doc" data-id="' + d.id + '">' +
      '<span class="menu-row-name">' + U.esc(d.title || t("untitled")) + "</span>" +
      '<span class="menu-row-date">' + when(d.updated) + "</span></button>";
  });
  out += '<div class="menu-actions">' +
    '<button class="btn-ghost" data-a="new-doc">' + U.esc(t("newDoc")) + "</button>" +
    '<button class="btn-ghost neutral" data-a="dup-doc">' + U.esc(t("duplicate")) + "</button>" +
    '<button class="btn-ghost neutral" data-a="rename-doc">' + U.esc(t("rename")) + "</button>" +
    '<button class="btn-ghost neutral" data-a="del-doc">' + U.esc(t("delete")) + "</button>" +
    "</div></div>";

  out += '<div class="menu-sec"><p class="eyebrow">' + U.esc(t("history")) + "</p>";
  if (!snaps.length) out += '<p class="hint">' + U.esc(t("noSnapshots")) + "</p>";
  snaps.slice().reverse().forEach(function (s, i) {
    var realIndex = snaps.length - 1 - i;
    out += '<div class="menu-row static"><span class="menu-row-name">' + U.esc(s.label) + "</span>" +
      '<span class="menu-row-date">' + when(s.t) + "</span>" +
      '<button class="mini-btn" data-a="restore-snap" data-i="' + realIndex + '">' +
        U.esc(t("restore")) + "</button>" +
      '<button class="mini-btn danger" data-a="del-snap" data-i="' + realIndex + '">✕</button></div>';
  });
  out += '<div class="menu-actions"><button class="btn-ghost" data-a="save-snap">' +
    U.esc(t("snapshot")) + "</button></div></div>";
  return out;
}

function when(ts) {
  if (!ts) return "";
  var d = new Date(ts);
  return d.toLocaleDateString(CVF.i18n.lang === "en" ? "en-GB" : "es", { day: "2-digit", month: "short" }) +
    " " + d.toLocaleTimeString(CVF.i18n.lang === "en" ? "en-GB" : "es", { hour: "2-digit", minute: "2-digit" });
}

function switchDoc(id) {
  save(true);
  index.activeId = id;
  LS.set(K_INDEX, index);
  state = loadDoc(id);
  history.stack = []; history.at = -1;
  pushHistory(true);
  CVF.panel.ui.collapsed = {};
  renderAll();
}

function newDoc(doc, title) {
  save(true);
  var id = U.uid("d");
  var d = normalize(doc);
  d.title = title || d.title;
  LS.set(K_DOC + id, d);
  index.docs.push({ id: id, title: d.title, updated: Date.now() });
  index.activeId = id;
  LS.set(K_INDEX, index);
  state = d;
  history.stack = []; history.at = -1;
  pushHistory(true);
  CVF.panel.ui.collapsed = {};
  renderAll();
}

function docsAction(a, btn) {
  var id = btn.getAttribute("data-id");
  var i = parseInt(btn.getAttribute("data-i"), 10);

  if (a === "open-doc") { switchDoc(id); closeMenus(); return; }
  if (a === "new-doc") { newDoc(D.BLANK(CVF.i18n.lang)); closeMenus(); U.toast(t("msgBlank")); return; }
  if (a === "dup-doc") {
    var c = U.copy(state);
    c.title = state.title + t("copySuffix");
    newDoc(c); closeMenus(); return;
  }
  if (a === "rename-doc") {
    U.confirmBox({ title: t("rename"), body: "", input: state.title, ok: t("ok"), cancel: t("cancel") })
      .then(function (val) {
        if (val === false) return;
        state.title = String(val).trim() || t("untitled");
        save(true); renderDocsMenu(); updateDocName();
      });
    return;
  }
  if (a === "del-doc") {
    U.confirmBox({ title: t("delete"), body: t("confirmDelDoc"), ok: t("delete"), cancel: t("cancel") })
      .then(function (yes) {
        if (!yes) return;
        var gone = index.activeId;
        LS.del(K_DOC + gone); LS.del(K_SNAP + gone);
        index.docs = index.docs.filter(function (x) { return x.id !== gone; });
        if (!index.docs.length) {
          LS.set(K_INDEX, { activeId: "", docs: [] });
          index = loadIndex();
        } else {
          index.activeId = index.docs[0].id;
          LS.set(K_INDEX, index);
        }
        switchDoc(index.activeId);
        closeMenus();
        U.toast(t("msgDeleted"));
      });
    return;
  }
  if (a === "save-snap") {
    U.confirmBox({
      title: t("snapshot"), body: "", ok: t("ok"), cancel: t("cancel"),
      input: new Date().toLocaleString(CVF.i18n.lang === "en" ? "en-GB" : "es")
    }).then(function (val) {
      if (val === false) return;
      var snaps = LS.get(K_SNAP + index.activeId, []);
      snaps.push({ t: Date.now(), label: String(val).trim() || when(Date.now()), data: U.copy(state) });
      while (snaps.length > 25) snaps.shift();
      LS.set(K_SNAP + index.activeId, snaps);
      renderDocsMenu();
      U.toast(t("snapshotSaved"));
    });
    return;
  }
  if (a === "restore-snap") {
    var snaps = LS.get(K_SNAP + index.activeId, []);
    if (!snaps[i]) return;
    state = normalize(U.copy(snaps[i].data));
    pushHistory(true);
    renderAll(); save(true); closeMenus();
    U.toast(t("msgLoaded"));
    return;
  }
  if (a === "del-snap") {
    var s2 = LS.get(K_SNAP + index.activeId, []);
    s2.splice(i, 1);
    LS.set(K_SNAP + index.activeId, s2);
    renderDocsMenu();
    return;
  }
}

function renderDocsMenu() { $("#docs-menu").innerHTML = docsMenuHTML(); }
function updateDocName() { $("#doc-name").textContent = state.title || t("untitled"); }



function applyZoom() {
  var scaler = $("#paper-scaler"), rootEl = CVF.render.root;
  scaler.style.transform = "scale(" + view.zoom + ")";
  scaler.style.width = rootEl.offsetWidth * view.zoom + "px";
  scaler.style.height = rootEl.offsetHeight * view.zoom + "px";
  $("#zoom-value").textContent = Math.round(view.zoom * 100) + "%";
}
function fitZoom() {
  var avail = $("#stage-scroll").clientWidth - 52;
  var natural = CVF.render.root.offsetWidth || 1;
  view.zoom = U.clamp(avail / natural, 0.25, 1.6);
  applyZoom();
}
function setZoom(z) { view.autoZoom = false; view.zoom = U.clamp(z, 0.2, 2.5); applyZoom(); }



function closeMenus() { $$(".dropdown.is-open").forEach(function (m) { m.classList.remove("is-open"); }); }

function toggleMenu(name) {
  var el = $("#" + name);
  var open = el.classList.contains("is-open");
  closeMenus();
  if (!open) {
    el.classList.add("is-open");
    if (name === "docs-drop") renderDocsMenu();
  }
}



function importJSON(file) {
  var fr = new FileReader();
  fr.onload = function () {
    try {
      var d = JSON.parse(fr.result);
      if (!d || !d.sections) throw new Error("format");
      newDoc(d.v === 2 ? d : fromV1(d));
      U.toast(t("msgLoaded"));
    } catch (e) {
      U.toast(t("msgBadFile"), "err");
    }
  };
  fr.readAsText(file);
}

function importPhoto(file) {
  if (file.size > 2 * 1024 * 1024) { U.toast(t("msgImgTooBig"), "err"); return; }
  var fr = new FileReader();
  fr.onload = function () {
    state.header.photo = String(fr.result);
    state.design.photoShow = true;
    renderStructure();
    CVF.panel.renderDesign();
  };
  fr.readAsDataURL(file);
}



function setTheme(name) {
  document.documentElement.setAttribute("data-theme", name);
  LS.set(K_THEME, name);
  var b = $('[data-action="theme"] .swap');
  if (b) b.textContent = name === "dark" ? "☾" : "☀";
}

function setLang(l) {
  CVF.i18n.set(l);
  $$("[data-lang-btn]").forEach(function (b) {
    b.classList.toggle("is-on", b.getAttribute("data-lang-btn") === l);
  });
  buildStaticText();
  CVF.rt.buildRibbon($("#ribbon"));
  renderAll();
}

function buildStaticText() {
  $("#brand-sub").textContent = t("tagline");
  $$("[data-tab]").forEach(function (b) {
    b.textContent = t("tab" + b.getAttribute("data-tab").replace(/^./, function (c) { return c.toUpperCase(); }));
  });
  $$("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    if (el.hasAttribute("data-i18n-title")) el.title = t(key);
    else el.textContent = t(key);
  });
  $$("[data-i18n-title]").forEach(function (el) {
    el.title = t(el.getAttribute("data-i18n-title"));
  });
  updateDocName();
}



function renderAll() {
  CVF.render.applyDesign(state);
  CVF.render.renderCV(state);
  CVF.panel.renderContent();
  CVF.panel.renderDesign();
  CVF.panel.renderTemplates();
  CVF.panel.renderHelp();
  if (view.tab === "review") CVF.panel.renderReview();
  view.panelDirty = false;
  updateDocName();
  updateMeta();
  refreshHistoryButtons();
  setTimeout(function () { if (view.autoZoom) fitZoom(); else applyZoom(); }, 40);
}



function init() {
  CVF.render.init($("#cv-root"));
  setTheme(LS.get(K_THEME, "dark"));

  index = loadIndex();
  state = loadDoc(index.activeId);

  CVF.render.setEditHandler(function (path, value, structural) {
    if (structural) { U.setPath(state, path, value); renderStructure(); return; }
    setField(path, value, "paper");
  });

  CVF.rt.buildRibbon($("#ribbon"));
  buildStaticText();
  renderAll();
  pushHistory(true);

  
  var panel = $("#panel");
  panel.addEventListener("input", onPanelInput);
  panel.addEventListener("change", onPanelInput);
  panel.addEventListener("click", function (e) {
    var sum = e.target.closest("details.group > summary");
    if (sum) {
      var det = sum.parentNode;
      setTimeout(function () { CVF.panel.ui.groups[det.getAttribute("data-g")] = det.open; }, 0);
    }
    var btn = e.target.closest("[data-a]");
    if (btn) panelAction(btn.getAttribute("data-a"), btn);
  });

  
  $$(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = tab.getAttribute("data-tab");
      view.tab = name;
      $$(".tab").forEach(function (x) { x.classList.remove("is-active"); });
      $$(".tabpane").forEach(function (x) { x.classList.remove("is-active"); });
      tab.classList.add("is-active");
      $("#pane-" + name).classList.add("is-active");
      if (name === "review") CVF.panel.renderReview();
      if (name === "content" && view.panelDirty) {
        CVF.panel.renderContent();
        view.panelDirty = false;
      }
    });
  });

  
  document.addEventListener("click", function (e) {
    var drop = e.target.closest("[data-drop]");
    if (drop) { toggleMenu(drop.getAttribute("data-drop")); return; }
    if (!e.target.closest(".dropdown")) closeMenus();

    var da = e.target.closest("[data-a]");
    if (da && da.closest(".dropdown")) { docsAction(da.getAttribute("data-a"), da); return; }

    var b = e.target.closest("[data-action]");
    if (!b) return;
    var a = b.getAttribute("data-action");

    if (a === "print") { CVF.rt.blur(); setTimeout(function () { window.print(); }, 60); }
    else if (a === "export-json") { CVF.exporter.json(state); closeMenus(); }
    else if (a === "export-html") { CVF.exporter.html(state); closeMenus(); }
    else if (a === "export-docx") { CVF.exporter.docx(state); closeMenus(); }
    else if (a === "export-txt") { CVF.exporter.txt(state); closeMenus(); }
    else if (a === "export-md") { CVF.exporter.md(state); closeMenus(); }
    else if (a === "import") $("#file-input").click();
    else if (a === "theme") setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    else if (a === "lang") setLang(b.getAttribute("data-lang-btn"));
    else if (a === "load-example") {
      U.confirmBox({ title: t("example"), body: t("confirmExample"), ok: t("ok"), cancel: t("cancel") })
        .then(function (yes) {
          if (!yes) return;
          state = normalize(D.EXAMPLE(CVF.i18n.lang));
          CVF.panel.ui.collapsed = {};
          pushHistory(true); renderAll(); save(true);
          U.toast(t("msgExample"));
        });
    }
    else if (a === "new-cv") {
      U.confirmBox({ title: t("blank"), body: t("confirmBlank"), ok: t("ok"), cancel: t("cancel") })
        .then(function (yes) {
          if (!yes) return;
          var keep = state.title;
          state = normalize(D.BLANK(CVF.i18n.lang));
          state.title = keep;
          CVF.panel.ui.collapsed = {};
          pushHistory(true); renderAll(); save(true);
          U.toast(t("msgBlank"));
        });
    }
    else if (a === "zoom-in") setZoom(view.zoom + 0.1);
    else if (a === "zoom-out") setZoom(view.zoom - 0.1);
    else if (a === "zoom-fit") { view.autoZoom = true; fitZoom(); }
    else if (a === "toggle-panel") $("#app").classList.toggle("preview-only");
  });

  $("#file-input").addEventListener("change", function (e) {
    if (e.target.files && e.target.files[0]) importJSON(e.target.files[0]);
    e.target.value = "";
  });
  $("#photo-input").addEventListener("change", function (e) {
    if (e.target.files && e.target.files[0]) importPhoto(e.target.files[0]);
    e.target.value = "";
  });

  window.addEventListener("resize", U.debounce(function () {
    if (view.autoZoom) fitZoom();
  }, 120));

  document.addEventListener("keydown", function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    var k = e.key.toLowerCase();
    var inEditable = document.activeElement && document.activeElement.hasAttribute &&
      document.activeElement.hasAttribute("data-rt");

    if (k === "s") { e.preventDefault(); CVF.exporter.json(state); return; }
    if (e.altKey && e.key === "]") { e.preventDefault(); setZoom(view.zoom + 0.1); return; }
    if (e.altKey && e.key === "[") { e.preventDefault(); setZoom(view.zoom - 0.1); return; }
    if (inEditable) return;                       
    if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); return; }
  });

  window.addEventListener("beforeunload", function () { save(true); });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      updateMeta();
      if (view.autoZoom) fitZoom();
    });
  }
}



CVF.app = {
  get state() { return state; },
  setField: setField,
  setProp: setProp,
  setDesign: setDesign,
  reorder: reorder,
  undo: undo,
  redo: redo,
  applyTemplate: applyTemplate,
  renderAll: renderAll
};

function onPanelInput(e) {
  var el = e.target;

  if (el.hasAttribute && el.hasAttribute("data-d")) {
    var key = el.getAttribute("data-d");
    var val = el.type === "checkbox" ? el.checked : el.value;
    if (el.getAttribute("data-num")) val = parseFloat(val);
    var out = document.querySelector('[data-val-for="' + key + '"]');
    if (out) out.textContent = val + (el.getAttribute("data-unit") || "");

    if (state.design.linkMargins && /^margin(Top|Right|Bottom|Left)$/.test(key)) {
      ["marginTop", "marginRight", "marginBottom", "marginLeft"].forEach(function (m) {
        state.design[m] = val;
      });
      CVF.render.applyDesign(state);
      CVF.panel.refreshDesignValues();
      afterChange();
      return;
    }
    if (el.type === "color" && el.parentNode.classList) el.parentNode.classList.remove("is-transparent");
    setDesign(key, val);
    return;
  }

  if (el.hasAttribute && el.hasAttribute("data-p")) {
    var path = el.getAttribute("data-p");
    var v;
    if (el.type === "checkbox") v = el.checked;
    else if (el.getAttribute("data-num")) v = parseFloat(el.value);
    else v = el.value;

    if (/\.(columns|col)$/.test(path)) {
      U.setPath(state, path, v);
      renderStructure();
      return;
    }
    if (/\.level$/.test(path)) {
      var head = el.parentNode.querySelector(".field-val");
      if (head) head.textContent = v + "/5";
    }
    setProp(path, v);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

})();
