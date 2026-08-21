(function () {
"use strict";

var CVF = window.CVF;
var U = CVF.util, $ = U.$, $$ = U.$$;
var D = CVF.data;
var t = function (k) { return CVF.i18n.t(k); };
function A() { return CVF.app; }
function st() { return CVF.app.state; }

var ui = { collapsed: {}, groups: {}, job: "", jobResult: null };

function field(label, control, hint) {
  return '<div class="field"><div class="field-head"><span>' + U.esc(label) + "</span></div>" +
    control + (hint ? '<p class="hint">' + hint + "</p>" : "") + "</div>";
}

function rich(path, mode, ph, value) {
  return '<div class="pf" data-path="' + U.attr(path) + '" data-mode="' + (mode || "line") +
    '" data-ph="' + U.attr(ph || "") + '">' + (value || "") + "</div>";
}

function plain(path, value, ph, type) {
  return '<input class="pi" type="' + (type || "text") + '" data-p="' + U.attr(path) +
    '" value="' + U.attr(value == null ? "" : value) + '" placeholder="' + U.attr(ph || "") + '">';
}

function sel(attrName, key, opts, val, num) {
  return '<select data-' + attrName + '="' + U.attr(key) + '"' + (num ? ' data-num="1"' : "") + ">" +
    opts.map(function (o) {
      if (o[1] === null) return '<option disabled>' + U.esc(o[0]) + "</option>";
      return '<option value="' + U.attr(o[0]) + '"' +
        (String(o[0]) === String(val) ? " selected" : "") + ">" + U.esc(o[1]) + "</option>";
    }).join("") + "</select>";
}

function check(attrName, key, val, label) {
  return '<label class="check"><input type="checkbox" data-' + attrName + '="' + U.attr(key) + '"' +
    (val ? " checked" : "") + "><span>" + U.esc(label) + "</span></label>";
}

function iconBtn(action, glyph, title, data) {
  var extra = "";
  for (var k in (data || {})) extra += " data-" + k + '="' + U.attr(data[k]) + '"';
  return '<button class="icon-btn" data-a="' + action + '" title="' + U.attr(title) + '"' + extra + ">" +
    glyph + "</button>";
}

var GRIP = '<span class="grip" title="' + 0 + '"><svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true">' +
  '<circle cx="3" cy="3" r="1.1"/><circle cx="7" cy="3" r="1.1"/>' +
  '<circle cx="3" cy="8" r="1.1"/><circle cx="7" cy="8" r="1.1"/>' +
  '<circle cx="3" cy="13" r="1.1"/><circle cx="7" cy="13" r="1.1"/></svg></span>';

function grip() { return GRIP.replace('title="0"', 'title="' + U.attr(t("dragHint")) + '"'); }

var TYPE_WORD = {
  entries: "entryN", rows: "rowN", list: "listN",
  text: "textN", tags: "tagN", bars: "barN"
};

function renderContent() {
  var s = st(), h = s.header, out = "";

  out += '<details class="group"' + (ui.groups.head === false ? "" : " open") + ' data-g="head">' +
    "<summary>" + U.esc(t("header")) + '</summary><div class="group-body">';

  out += field(t("fullName"), rich("header.name", "line", t("fullName"), h.name));

  out += '<div class="field"><div class="field-head"><span>' + U.esc(t("contacts")) + "</span></div>";
  out += '<div class="sortable" data-sort="contacts">';
  (h.contacts || []).forEach(function (c, i) {
    out += '<div class="ct-row" data-k="' + i + '">' + grip() +
      sel("p", "header.contacts." + i + ".icon", D.ICON_LIST, c.icon || "") +
      rich("header.contacts." + i + ".text", "line", "—", c.text) +
      plain("header.contacts." + i + ".link", c.link || "", t("contactLink"), "url") +
      iconBtn("del-contact", "✕", t("delete"), { k: i }) +
      "</div>";
  });
  out += "</div>";
  out += '<button class="btn-ghost" data-a="add-contact">' + U.esc(t("addContact")) + "</button></div>";

  out += field(t("taglineField"), rich("header.tagline", "line", t("taglinePh"), h.tagline));

  out += '<div class="field"><div class="field-head"><span>' + U.esc(t("photo")) + "</span></div>" +
    check("d", "photoShow", s.design.photoShow, t("photoUse")) +
    '<div class="add-row" style="margin-top:8px">' +
      '<button class="btn-ghost" data-a="pick-photo">' + U.esc(t("photoPick")) + "</button>" +
      (h.photo ? '<button class="btn-ghost neutral" data-a="drop-photo">' + U.esc(t("photoRemove")) + "</button>" : "") +
    "</div>" +
    (h.photo ? '<img class="photo-preview" src="' + U.attr(h.photo) + '" alt="">' : "") +
    '<p class="hint">' + U.esc(t("photoNote")) + "</p></div>";

  out += "</div></details>";

  out += '<p class="eyebrow">' + U.esc(t("sections")) + "</p>";
  out += '<div class="sortable" data-sort="sections">';

  s.sections.forEach(function (sec, si) {
    out += sectionCard(s, sec, si);
  });
  out += "</div>";

  out += '<p class="eyebrow" style="margin-top:16px">' + U.esc(t("addSection")) + "</p>" +
    '<div class="add-row">' +
    ["entries:secEntries", "rows:secRows", "list:secList", "text:secText", "tags:secTags", "bars:secBars"]
      .map(function (pair) {
        var p = pair.split(":");
        return '<button class="btn-ghost" data-a="add-sec" data-type="' + p[0] + '">' + U.esc(t(p[1])) + "</button>";
      }).join("") +
    '</div><p class="hint">' + U.esc(t("secTypesHint")) + "</p>";

  $("#pane-content").innerHTML = out;
  bindPanelFields($("#pane-content"));
  makeSortable($("#pane-content"));
}

function sectionCard(s, sec, si) {
  var collapsed = ui.collapsed[sec.id];
  var out = '<div class="ed-section' + (sec.visible ? "" : " is-hidden") + '" data-si="' + si + '" data-sortitem="1">';

  out += '<div class="ed-sec-head">' + grip() +
    iconBtn("collapse", collapsed ? "▸" : "▾", t("collapse"), { si: si }) +
    rich("sections." + si + ".title", "line", "—", sec.title) +
    '<span class="ed-tools">' +
      iconBtn("move-sec", "↑", t("moveUp"), { si: si, dir: -1 }) +
      iconBtn("move-sec", "↓", t("moveDown"), { si: si, dir: 1 }) +
      iconBtn("dup-sec", "⧉", t("duplicate"), { si: si }) +
      iconBtn("hide-sec", sec.visible ? "◉" : "◌", t("hideShow"), { si: si }) +
      '<button class="icon-btn danger" data-a="del-sec" data-si="' + si + '" title="' +
        U.attr(t("delete")) + '">✕</button>' +
    "</span></div>";

  out += '<div class="ed-sec-body"' + (collapsed ? ' style="display:none"' : "") + ">";

  out += '<div class="row-2">' +
    field(t("ruleUnderTitle"), check("p", "sections." + si + ".rule", sec.rule, t("show"))) +
    field(t("columns"), sel("p", "sections." + si + ".columns",
      [[1, t("oneCol")], [2, t("twoColOpt")], [3, t("threeCol")]], sec.columns, true)) +
    "</div>";

  if (s.design.twoCol) {
    out += field(t("placeIn"), sel("p", "sections." + si + ".col",
      [["main", t("mainCol")], ["side", t("sideCol")]], sec.col || "main"));
  }
  if (sec.type === "list") {
    out += field(" ", check("p", "sections." + si + ".marked", !!sec.marked, t("showBullet")));
  }

  out += '<div class="sortable" data-sort="items" data-si="' + si + '">';
  sec.items.forEach(function (it, ii) { out += itemCard(sec, si, it, ii); });
  out += "</div>";

  out += '<div class="add-row"><button class="btn-ghost" data-a="add-item" data-si="' + si + '">+ ' +
    U.esc(t(TYPE_WORD[sec.type] || "listN")) + "</button></div>";
  out += "</div></div>";
  return out;
}

function itemCard(sec, si, it, ii) {
  var base = "sections." + si + ".items." + ii + ".";
  var out = '<div class="ed-item" data-si="' + si + '" data-ii="' + ii + '" data-sortitem="1">';

  out += '<div class="ed-item-head">' + grip() +
    '<span class="ed-item-num">' + U.esc(t(TYPE_WORD[sec.type] || "listN")) + " " + (ii + 1) + "</span>" +
    '<span class="ed-tools">' +
      iconBtn("move-item", "↑", t("moveUp"), { si: si, ii: ii, dir: -1 }) +
      iconBtn("move-item", "↓", t("moveDown"), { si: si, ii: ii, dir: 1 }) +
      iconBtn("dup-item", "⧉", t("duplicate"), { si: si, ii: ii }) +
      '<button class="icon-btn danger" data-a="del-item" data-si="' + si + '" data-ii="' + ii +
        '" title="' + U.attr(t("delete")) + '">✕</button>' +
    "</span></div>";

  if (sec.type === "entries") {
    out += '<div class="row-2">' +
      field(t("titleLeft"), rich(base + "left", "line", t("phOrg"), it.left)) +
      field(t("rightCol"), rich(base + "right", "line", t("phWhen"), it.right)) +
      "</div>";

    out += '<div class="field"><div class="field-head"><span>' + U.esc(t("subtitles")) + "</span></div>";
    (it.subs || []).forEach(function (sub, k) {
      out += '<div class="sub-row">' +
        rich(base + "subs." + k + ".left", "line", t("phRole"), sub.left) +
        rich(base + "subs." + k + ".right", "line", t("phWhen"), sub.right) +
        '<button class="icon-btn danger" data-a="del-sub" data-si="' + si + '" data-ii="' + ii +
          '" data-k="' + k + '">✕</button></div>';
    });
    out += '<button class="btn-ghost neutral" data-a="add-sub" data-si="' + si + '" data-ii="' + ii + '">' +
      U.esc(t("addSub")) + "</button></div>";

    out += field(t("descParagraph"), rich(base + "text", "rich", "—", it.text));

    out += '<div class="field"><div class="field-head"><span>' + U.esc(t("bullets")) + "</span></div>";
    out += '<div class="sortable" data-sort="bullets" data-si="' + si + '" data-ii="' + ii + '">';
    (it.bullets || []).forEach(function (b, k) {
      out += '<div class="sub-row bullet-row" data-sortitem="1">' + grip() +
        rich(base + "bullets." + k, "rich", "—", b) +
        '<button class="icon-btn danger" data-a="del-bullet" data-si="' + si + '" data-ii="' + ii +
          '" data-k="' + k + '">✕</button></div>';
    });
    out += "</div>";
    out += '<button class="btn-ghost neutral" data-a="add-bullet" data-si="' + si + '" data-ii="' + ii + '">' +
      U.esc(t("addBullet")) + "</button></div>";

  } else if (sec.type === "rows") {
    out += field(t("label"), rich(base + "label", "line", "—", it.label));
    out += field(t("content"), rich(base + "content", "rich", "—", it.content));

  } else if (sec.type === "bars") {
    out += '<div class="row-2">' +
      field(t("label"), rich(base + "label", "line", "—", it.label)) +
      field(t("content"), rich(base + "note", "line", "—", it.note)) + "</div>";
    out += '<div class="field"><div class="field-head"><span>' + U.esc(t("level")) +
      '</span><span class="field-val">' + (it.level || 0) + "/5</span></div>" +
      '<input type="range" data-p="' + base + 'level" data-num="1" min="0" max="5" step="1" value="' +
      (it.level || 0) + '"></div>';

  } else if (sec.type === "tags") {
    out += field(t("content"), rich(base + "text", "line", "—", it.text), U.esc(t("tagsHint")));

  } else {
    out += field(t("text"), rich(base + "text", "rich", "—", it.text));
  }

  out += "</div>";
  return out;
}

function fontOpts() {
  return [["inherit", t("sameAsBody")]].concat(D.FONTS);
}

function DESIGN_GROUPS() {
  var weights = [[300, t("light")], [400, t("normal")], [600, t("semibold")], [700, t("bold")]];
  var cases = [["uppercase", t("upperAll")], ["none", t("asTyped")],
               ["capitalize", t("eachWord")], ["smallcaps", t("smallCaps")]];
  return [
    ["gPage", "page", [
      ["pageSize", "select", t("pageSize"), [["letter", t("letter")], ["a4", t("a4")], ["legal", t("legal")]]],
      ["linkMargins", "check", t("marginsLinked")],
      ["marginTop", "range", t("marginTop"), 0, 45, 0.5, "mm"],
      ["marginBottom", "range", t("marginBottom"), 0, 45, 0.5, "mm"],
      ["marginLeft", "range", t("marginLeft"), 0, 45, 0.5, "mm"],
      ["marginRight", "range", t("marginRight"), 0, 45, 0.5, "mm"],
      ["avoidBreak", "check", t("avoidBreak")],
      ["showGuides", "check", t("showGuides")],
      ["showPageNumbers", "check", t("pageNumbers")],
      ["hyphenate", "check", t("hyphenate")]
    ]],
    ["gLayout", "layout", [
      ["twoCol", "check", t("twoColumn")],
      ["sidePos", "select", t("sidePos"), [["right", t("right")], ["left", t("left")]]],
      ["sideWidth", "range", t("sideWidth"), 20, 50, 1, "%"],
      ["colGap", "range", t("colGap"), 6, 48, 1, "px"],
      ["sideBg", "color", t("sideBg")],
      ["sidePad", "range", t("sidePad"), 0, 28, 1, "px"]
    ]],
    ["gType", "type", [
      ["fontFamily", "select", t("bodyFont"), D.FONTS],
      ["headingFont", "select", t("headingFont"), fontOpts()],
      ["fontSize", "range", t("fontSize"), 7, 18, 0.1, "px"],
      ["lineHeight", "range", t("lineHeight"), 1, 2.2, 0.01, ""],
      ["letterSpacing", "range", t("letterSpacing"), -0.03, 0.14, 0.002, "em"],
      ["wordSpacing", "range", t("wordSpacing"), -0.05, 0.4, 0.01, "em"],
      ["textAlign", "select", t("textAlign"), [["left", t("left")], ["justify", t("justify")]]],
      ["paraGap", "range", t("paraGap"), 0, 20, 0.5, "px"],
      ["paraIndent", "range", t("paraIndent"), 0, 40, 1, "px"]
    ]],
    ["gHeader", "header", [
      ["headerLayout", "select", t("headerLayout"),
        [["stacked", t("hlStacked")], ["split", t("hlSplit")], ["banner", t("hlBanner")]]],
      ["headerAlign", "select", t("headerAlignL"),
        [["center", t("center")], ["left", t("left")], ["right", t("right")]]],
      ["nameFont", "select", t("nameFont"), fontOpts()],
      ["nameSize", "range", t("nameSize"), 12, 54, 0.5, "px"],
      ["nameWeight", "select", t("nameWeight"), weights],
      ["nameCase", "select", t("nameCase"), cases],
      ["nameSpacing", "range", t("nameSpacing"), -0.05, 0.35, 0.005, "em"],
      ["contactSize", "range", t("contactSize"), 6, 18, 0.25, "px"],
      ["contactSep", "text", t("contactSep")],
      ["contactIcons", "check", t("contactIcons")],
      ["headerBg", "color", t("headerBg")],
      ["headerPad", "range", t("headerPad"), 0, 40, 1, "px"],
      ["headerGap", "range", t("headerGap"), 0, 48, 1, "px"],
      ["headerRule", "check", t("headerRule")],
      ["photoSize", "range", t("photoSize"), 48, 180, 2, "px"],
      ["photoShape", "select", t("photoShape"),
        [["circle", t("shapeCircle")], ["rounded", t("shapeRounded")], ["square", t("shapeSquare")]]]
    ]],
    ["gTitles", "titles", [
      ["titleFont", "select", t("headingFont"), fontOpts()],
      ["titleDeco", "select", t("titleDeco"),
        [["rule", t("decoRule")], ["short", t("decoShort")], ["band", t("decoBand")],
         ["leftbar", t("decoBar")], ["boxed", t("decoBox")], ["none", t("decoNone")]]],
      ["titleSize", "range", t("titleSize"), 7, 24, 0.25, "px"],
      ["titleWeight", "select", t("titleWeight"), weights],
      ["titleCase", "select", t("titleCase"), cases],
      ["titleSpacing", "range", t("letterSpacing"), 0, 0.35, 0.005, "em"],
      ["titleAlign", "select", t("headerAlignL"),
        [["left", t("left")], ["center", t("center")], ["right", t("right")]]],
      ["titleBandBg", "color", t("bandBg")],
      ["titlePad", "range", t("headerPad"), 0, 16, 0.5, "px"],
      ["ruleWidth", "range", t("ruleWidth"), 0, 6, 0.25, "px"],
      ["ruleStyle", "select", t("ruleStyle"),
        [["solid", t("solid")], ["double", t("doubleLine")], ["dashed", t("dashed")], ["dotted", t("dotted")]]],
      ["ruleGap", "range", t("ruleGap"), 0, 16, 0.5, "px"],
      ["titleGap", "range", t("titleGap"), 0, 28, 0.5, "px"]
    ]],
    ["gSpacing", "space", [
      ["sectionGap", "range", t("sectionGap"), 0, 48, 0.5, "px"],
      ["itemGap", "range", t("itemGap"), 0, 34, 0.5, "px"],
      ["bulletGap", "range", t("bulletGap"), 0, 16, 0.5, "px"],
      ["bulletChar", "select", t("bulletChar"),
        [["disc", t("bDisc")], ["circle", t("bCircle")], ["square", t("bSquare")],
         ['"– "', t("bDash")], ['"— "', t("bEmDash")], ['"▪ "', t("bSmallSq")],
         ['"› "', t("bArrow")], ["none", t("bNone")]]],
      ["bulletIndent", "range", t("bulletIndent"), 0, 48, 1, "px"],
      ["bulletColor", "color", t("bulletColor")],
      ["labelWidth", "range", t("labelWidth"), 50, 300, 2, "px"],
      ["labelWeight", "select", t("labelWeight"), weights],
      ["rowsLayout", "select", t("rowsLayout"),
        [["inline", t("rowsInline")], ["stacked", t("rowsStacked")]]]
    ]],
    ["gEntries", "items", [
      ["mainWeight", "select", t("mainWeight"), weights],
      ["dateStyle", "select", t("dateStyle"), [["normal", t("normal")], ["italic", t("italic")]]],
      ["dateWeight", "select", t("dateWeight"),
        [["inherit", t("sameAsRow")], ["400", t("normal")], ["600", t("semibold")], ["700", t("bold")]]],
      ["subStyle", "select", t("subStyle"), [["italic", t("italic")], ["normal", t("normal")]]],
      ["subWeight", "select", t("subWeight"), weights]
    ]],
    ["gColor", "color", [
      ["textColor", "color", t("textColor")],
      ["pageBg", "color", t("pageBg")],
      ["accent", "color", t("accentColor")],
      ["nameColor", "color", t("nameColor")],
      ["titleColor", "color", t("titleColor")],
      ["ruleColor", "color", t("ruleColor")],
      ["linkColor", "color", t("linkColor")],
      ["linkUnderline", "check", t("linkUnderline")]
    ]]
  ];
}

function renderDesign() {
  var d = st().design, out = "";

  out += '<div class="group pad">' +
    '<p class="eyebrow">' + U.esc(t("autoFit")) + "</p>" +
    '<div class="add-row">' +
      '<button class="btn-ghost grow" data-a="fit" data-n="1">' + U.esc(t("fitOnePage")) + "</button>" +
      '<button class="btn-ghost grow" data-a="fit" data-n="2">' + U.esc(t("fitTwoPages")) + "</button>" +
    "</div>" +
    '<p class="hint">' + U.esc(t("fitHint")) + "</p>" +
    '<div class="add-row"><button class="btn-ghost neutral grow" data-a="reset-design">' +
      U.esc(t("resetDesign")) + "</button></div></div>";

  out += '<div class="group pad"><p class="eyebrow">' + U.esc(t("palettes")) + "</p>" +
    '<div class="palettes">' + D.PALETTES.map(function (p, i) {
      return '<button class="pal" data-a="palette" data-i="' + i + '" title="' + U.attr(p[0]) + '">' +
        '<i style="background:' + p[1] + '"></i><i style="background:' + p[2] + '"></i>' +
        '<i style="background:' + p[5] + '"></i><span>' + U.esc(p[0]) + "</span></button>";
    }).join("") + "</div></div>";

  DESIGN_GROUPS().forEach(function (g) {
    var name = t(g[0]), key = g[1], ctrls = g[2];
    var open = ui.groups[key] === undefined ? (key === "type") : ui.groups[key];
    out += '<details class="group"' + (open ? " open" : "") + ' data-g="' + key + '"><summary>' +
      U.esc(name) + '</summary><div class="group-body">';

    ctrls.forEach(function (c) {
      var k = c[0], type = c[1], label = c[2], val = d[k];
      if (type === "range") {
        out += '<div class="field"><div class="field-head"><span>' + U.esc(label) +
          '</span><span class="field-val" data-val-for="' + k + '">' + val + c[6] + "</span></div>" +
          '<input type="range" data-d="' + k + '" data-num="1" data-unit="' + c[6] + '" min="' + c[3] +
          '" max="' + c[4] + '" step="' + c[5] + '" value="' + val + '"></div>';
      } else if (type === "select") {
        out += field(label, sel("d", k, c[3], val, typeof val === "number"));
      } else if (type === "color") {
        var isT = String(val) === "transparent" || val === "";
        out += '<div class="field"><div class="field-head"><span>' + U.esc(label) + "</span>" +
          '<button class="mini-btn" data-a="clear-color" data-k="' + k + '">' + U.esc(t("transparent")) +
          "</button></div>" +
          '<div class="color-wrap' + (isT ? " is-transparent" : "") + '">' +
          '<input type="color" data-d="' + k + '" value="' + U.attr(isT ? "#ffffff" : val) + '"></div></div>';
      } else if (type === "check") {
        out += '<div class="field">' + check("d", k, val, label) + "</div>";
      } else if (type === "text") {
        out += field(label, '<input class="pi" type="text" data-d="' + k + '" value="' + U.attr(val) + '">');
      }
    });
    out += "</div></details>";
  });

  $("#pane-design").innerHTML = out;
}

function refreshDesignValues() {
  var d = st().design;
  $$("[data-d]").forEach(function (el) {
    var k = el.getAttribute("data-d");
    if (el.type === "checkbox") el.checked = !!d[k];
    else if (el.type === "color") {
      var isT = String(d[k]) === "transparent" || d[k] === "";
      el.value = isT ? "#ffffff" : d[k];
      if (el.parentNode.classList) el.parentNode.classList.toggle("is-transparent", isT);
    } else el.value = d[k];
    var out = document.querySelector('[data-val-for="' + k + '"]');
    if (out) out.textContent = d[k] + (el.getAttribute("data-unit") || "");
  });
}

function renderTemplates() {
  var cur = st().template || "";
  var lang = CVF.i18n.lang === "en" ? 1 : 0;
  var out = '<p class="eyebrow">' + U.esc(t("templatesTitle")) + "</p>" +
    '<p class="hint" style="margin-bottom:12px">' + U.esc(t("templatesHint")) + "</p>" +
    '<div class="tpl-grid">';

  D.TEMPLATES.forEach(function (tp) {
    var sw = tp.swatch;
    out += '<button class="tpl' + (cur === tp.id ? " is-on" : "") + '" data-a="template" data-id="' +
      tp.id + '">' +
      '<span class="tpl-prev" style="background:' + sw[0] + '">' +
        '<i class="tp-name" style="background:' + sw[1] + '"></i>' +
        '<i class="tp-line" style="background:' + sw[2] + '"></i>' +
        '<i class="tp-row"></i><i class="tp-row short"></i>' +
        '<i class="tp-line" style="background:' + sw[2] + '"></i>' +
        '<i class="tp-row"></i><i class="tp-row"></i><i class="tp-row short"></i>' +
      "</span>" +
      '<span class="tpl-name">' + U.esc(tp.name[lang]) + "</span>" +
      '<small>' + U.esc(tp.desc[lang]) + "</small></button>";
  });

  out += "</div>";
  $("#pane-templates").innerHTML = out;
}

function renderReview() {
  var r = CVF.review.checks(st());
  var s = r.stats;
  var badge = { ok: "✓", warn: "!", bad: "✕" };

  var out = '<div class="stat-grid">' +
    stat(s.words, t("words")) +
    stat(s.pages, t("pages")) +
    stat(s.bullets, t("bulletsCount")) +
    stat(s.chars, t("chars")) +
    "</div>";

  out += '<div class="group pad"><div class="field-head"><span>' + U.esc(t("pageFill")) +
    '</span><span class="field-val">' + s.fill + "%</span></div>" +
    '<div class="meter"><i style="width:' + U.clamp(s.fill, 0, 100) + '%"></i></div></div>';

  out += '<p class="eyebrow">' + U.esc(t("checks")) + '</p><ul class="checks">';
  r.list.forEach(function (c) {
    out += '<li class="chk ' + c.level + '"><span class="chk-dot">' + badge[c.level] + "</span>" +
      "<span>" + U.esc(c.msg) + (c.detail ? ' <em>' + U.esc(c.detail) + "</em>" : "") + "</span></li>";
  });
  out += "</ul>";

  out += '<div class="group pad" style="margin-top:14px"><p class="eyebrow">' + U.esc(t("jobMatch")) + "</p>" +
    '<p class="hint">' + U.esc(t("jobMatchHint")) + "</p>" +
    '<textarea class="pi job-box" rows="6" placeholder="' + U.attr(t("jobPlaceholder")) + '">' +
      U.esc(ui.job) + "</textarea>" +
    '<div class="add-row"><button class="btn-ghost grow" data-a="match">' + U.esc(t("analyze")) + "</button></div>";

  if (ui.jobResult) {
    var m = ui.jobResult;
    out += '<div class="match-head"><span>' + U.esc(t("matchScore")) + "</span>" +
      '<strong>' + m.score + "%</strong></div>" +
      '<div class="meter"><i style="width:' + m.score + '%"></i></div>' +
      '<p class="eyebrow" style="margin-top:12px">' + U.esc(t("present")) + " · " + m.present.length + "</p>" +
      '<div class="kw">' + m.present.map(function (k) {
        return '<span class="kw-tag ok">' + U.esc(k.term) + "</span>";
      }).join("") + "</div>" +
      '<p class="eyebrow" style="margin-top:10px">' + U.esc(t("missing")) + " · " + m.missing.length + "</p>" +
      '<div class="kw">' + m.missing.map(function (k) {
        return '<span class="kw-tag">' + U.esc(k.term) + "</span>";
      }).join("") + "</div>";
  }
  out += "</div>";

  $("#pane-review").innerHTML = out;
}

function stat(n, label) {
  return '<div class="stat"><b>' + U.esc(String(n)) + "</b><span>" + U.esc(label) + "</span></div>";
}

function renderHelp() {
  var blocks = [
    ["helpEditorT", "helpEditorB"],
    ["helpPrivacyT", "helpPrivacyB"],
    ["helpPdfT", "helpPdfB"],
    ["helpFitT", "helpFitB"],
    ["helpDocsT", "helpDocsB"],
    ["helpAtsT", "helpAtsB"]
  ];
  var out = blocks.map(function (b) {
    return '<div class="help-block"><h3>' + U.esc(t(b[0])) + "</h3><p>" + U.esc(t(b[1])) + "</p></div>";
  }).join("");

  var keys = [
    ["Ctrl / Cmd + B", t("fmtBold")], ["Ctrl / Cmd + I", t("fmtItalic")],
    ["Ctrl / Cmd + U", t("fmtUnderline")], ["Ctrl / Cmd + Shift + X", t("fmtStrike")],
    ["Ctrl / Cmd + K", t("fmtLink")], ["Ctrl / Cmd + \\", t("fmtClear")],
    ["Ctrl / Cmd + Z", t("undo")], ["Ctrl / Cmd + Shift + Z", t("redo")],
    ["Ctrl / Cmd + S", t("saveFile")], ["Ctrl / Cmd + P", t("downloadPdf")],
    ["Ctrl / Cmd + Alt + [ ]", "zoom"], ["Tab", t("fmtBullets")]
  ];
  out += '<div class="help-block"><h3>' + U.esc(t("helpKeysT")) + "</h3><table class=\"keys\">" +
    keys.map(function (k) {
      return "<tr><td><code>" + U.esc(k[0]) + "</code></td><td>" + U.esc(k[1]) + "</td></tr>";
    }).join("") + "</table></div>";

  $("#pane-help").innerHTML = out;
}

function bindPanelFields(scope) {
  $$(".pf", scope).forEach(function (el) {
    var path = el.getAttribute("data-path");
    var mode = el.getAttribute("data-mode") || "line";
    CVF.rt.bind(el, {
      mode: mode,
      placeholder: el.getAttribute("data-ph") || "",
      onChange: function (html) { A().setField(path, html, "panel"); }
    });
  });
}

function makeSortable(scope) {
  $$(".sortable", scope).forEach(function (list) {
    $$(":scope > [data-sortitem]", list).forEach(function (item) {
      var handle = item.querySelector(":scope > * > .grip, :scope > .grip");
      if (!handle) return;
      handle.addEventListener("mousedown", function () { item.draggable = true; });
      handle.addEventListener("touchstart", function () { item.draggable = true; }, { passive: true });
      item.addEventListener("dragend", function () {
        item.draggable = false;
        list.classList.remove("is-dragging");
        $$(".drop-mark", list).forEach(function (m) { m.classList.remove("drop-mark", "after"); });
      });
      item.addEventListener("dragstart", function (e) {
        list.classList.add("is-dragging");
        item.classList.add("is-ghost");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", "cvf"); } catch (err) {}
        list.__from = index(list, item);
      });
    });

    list.addEventListener("dragover", function (e) {
      if (!list.classList.contains("is-dragging")) return;
      e.preventDefault();
      var over = e.target.closest("[data-sortitem]");
      $$("[data-sortitem]", list).forEach(function (m) { m.classList.remove("drop-mark", "after"); });
      if (!over || over.parentNode !== list) return;
      var box = over.getBoundingClientRect();
      var after = e.clientY > box.top + box.height / 2;
      over.classList.add("drop-mark");
      if (after) over.classList.add("after");
    });

    list.addEventListener("drop", function (e) {
      if (!list.classList.contains("is-dragging")) return;
      e.preventDefault();
      var over = e.target.closest("[data-sortitem]");
      var from = list.__from;
      var to = from;
      if (over && over.parentNode === list) {
        var box = over.getBoundingClientRect();
        to = index(list, over) + (e.clientY > box.top + box.height / 2 ? 1 : 0);
        if (to > from) to--;
      }
      $$("[data-sortitem]", list).forEach(function (m) { m.classList.remove("drop-mark", "after", "is-ghost"); });
      list.classList.remove("is-dragging");
      if (to === from || from == null) return;
      A().reorder(list.getAttribute("data-sort"), {
        si: parseInt(list.getAttribute("data-si"), 10),
        ii: parseInt(list.getAttribute("data-ii"), 10)
      }, from, to);
    });
  });
}

function index(list, item) {
  return $$(":scope > [data-sortitem]", list).indexOf(item);
}

CVF.panel = {
  ui: ui,
  renderContent: renderContent,
  renderDesign: renderDesign,
  renderTemplates: renderTemplates,
  renderReview: renderReview,
  renderHelp: renderHelp,
  refreshDesignValues: refreshDesignValues,
  bindPanelFields: bindPanelFields
};

})();
