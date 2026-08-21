(function () {
"use strict";

var CVF = window.CVF;
var U = CVF.util, $ = U.$, $$ = U.$$;
var D = CVF.data;
var MM_PX = 96 / 25.4;

var root = null, body = null;

function page(st) { return D.PAGE_MM[st.design.pageSize] || D.PAGE_MM.letter; }

function usableHeightPx(st) {
  var p = page(st);
  return Math.max(80, (p.h - st.design.marginTop - st.design.marginBottom) * MM_PX);
}

function contentHeightPx() { return body ? body.scrollHeight : 0; }

function pageCount(st) {
  return Math.max(1, Math.ceil((contentHeightPx() - 3) / usableHeightPx(st)));
}

function lastPageFill(st) {
  var u = usableHeightPx(st), h = contentHeightPx();
  if (h <= 0) return 0;
  var rest = h % u;
  return Math.round((rest === 0 ? 1 : rest / u) * 100);
}

function ed(tag, cls, path, mode, ph, html) {
  return "<" + tag + ' class="' + cls + ' ed"' +
    ' data-path="' + U.attr(path) + '"' +
    ' data-mode="' + (mode || "line") + '"' +
    (ph ? ' data-ph="' + U.attr(ph) + '"' : "") + ">" + (html || "") + "</" + tag + ">";
}

function icon(name) {
  var d = D.ICONS[name];
  if (!d) return "";
  return '<svg class="cv-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
    'stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' +
    d.split(" M").map(function (p, i) { return '<path d="' + (i ? "M" + p : p) + '"/>'; }).join("") +
    "</svg>";
}

function headerHTML(st) {
  var h = st.header, d = st.design, out = "";
  var t = CVF.i18n.t;

  var photo = "";
  if (d.photoShow && h.photo) {
    photo = '<div class="cv-photo"><img src="' + U.attr(h.photo) + '" alt=""></div>';
  }

  var contactBits = (h.contacts || []).map(function (c, i) {
    if (!c || (U.isEmptyHTML(c.text) && !c.link)) return null;
    var inner = ed("span", "cv-contact-text", "header.contacts." + i + ".text", "line", "—", c.text);
    return '<span class="cv-contact-item">' + (d.contactIcons && c.icon ? icon(c.icon) : "") + inner + "</span>";
  }).filter(Boolean);

  var sep = '<span class="cv-sep">' + U.esc(d.contactSep) + "</span>";

  var main =
    ed("h1", "cv-name", "header.name", "line", t("fullName"), h.name) +
    (contactBits.length ? '<p class="cv-contact">' + contactBits.join(sep) + "</p>" : "") +
    (U.isEmptyHTML(h.tagline)
      ? ""
      : ed("p", "cv-tagline", "header.tagline", "line", t("taglinePh"), h.tagline));

  out += '<header class="cv-header">' + photo + '<div class="cv-head-main">' + main + "</div></header>";
  if (d.headerRule) out += '<hr class="cv-header-rule">';
  return out;
}

function sectionHTML(st, sec, si) {
  if (!sec.visible) return "";
  var d = st.design;
  var accent = sec.accent ? ' style="--sec-accent:' + U.attr(sec.accent) + '"' : "";
  var out = '<section class="cv-section' + (sec.rule ? "" : " no-rule") +
            '" data-si="' + si + '"' + accent + ">";

  out += ed("h2", "cv-section-title", "sections." + si + ".title", "line", "—", sec.title);

  var cols = sec.columns === 3 ? " cols-3" : (sec.columns === 2 ? " cols-2" : "");
  out += '<div class="cv-sec-body' + cols + '">';

  var base = "sections." + si + ".items.";

  if (sec.type === "entries") {
    sec.items.forEach(function (it, ii) {
      var p = base + ii + ".";
      out += '<div class="cv-item" data-ii="' + ii + '">';
      out += '<div class="cv-row cv-row-main">' +
        ed("span", "cv-main-left", p + "left", "line", "—", it.left) +
        ed("span", "cv-side", p + "right", "line", "—", it.right) + "</div>";
      (it.subs || []).forEach(function (s, k) {
        out += '<div class="cv-row cv-row-sub">' +
          ed("span", "cv-sub-left", p + "subs." + k + ".left", "line", "—", s.left) +
          ed("span", "cv-side", p + "subs." + k + ".right", "line", "—", s.right) + "</div>";
      });
      if (!U.isEmptyHTML(it.text)) {
        out += ed("div", "cv-text", p + "text", "rich", "—", it.text);
      }
      var bl = (it.bullets || []);
      if (bl.length) {
        out += '<ul class="cv-bullets ed" data-region="bullets" data-path="' + U.attr(p + "bullets") +
          '" data-mode="list">' + bl.map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>";
      }
      out += "</div>";
    });

  } else if (sec.type === "rows") {
    sec.items.forEach(function (it, ii) {
      var p = base + ii + ".";
      out += '<div class="cv-info">' +
        ed("div", "cv-info-label", p + "label", "line", "—", it.label) +
        ed("div", "cv-info-content", p + "content", "line", "—", it.content) + "</div>";
    });

  } else if (sec.type === "list") {
    out += '<ul class="cv-list ed' + (sec.marked ? " marked" : "") + '" data-region="list" data-path="' +
      U.attr("sections." + si + ".items") + '" data-mode="list">' +
      sec.items.map(function (it) { return "<li>" + (it.text || "") + "</li>"; }).join("") + "</ul>";

  } else if (sec.type === "text") {
    sec.items.forEach(function (it, ii) {
      out += ed("div", "cv-text", base + ii + ".text", "rich", "—", it.text);
    });

  } else if (sec.type === "tags") {
    var raw = (sec.items[0] && sec.items[0].text) || "";
    var chips = U.htmlToText(raw, ", ").split(/\s*[,;·]\s*/).filter(Boolean);
    out += '<div class="cv-tags ed" data-region="tags" data-path="' + U.attr(base + "0.text") +
      '" data-mode="line">' +
      (chips.length ? chips.map(function (c) { return '<span class="cv-tag">' + U.esc(c) + "</span>"; }).join("")
                    : '<span class="cv-tag cv-tag-empty">—</span>') + "</div>";

  } else if (sec.type === "bars") {
    sec.items.forEach(function (it, ii) {
      var p = base + ii + ".";
      var lvl = U.clamp(parseInt(it.level, 10) || 0, 0, 5);
      var pips = "";
      for (var k = 1; k <= 5; k++) {
        pips += '<i class="cv-pip' + (k <= lvl ? " on" : "") + '" data-lvl="' + k +
          '" data-lvl-path="' + U.attr(p + "level") + '"></i>';
      }
      out += '<div class="cv-bar">' +
        ed("span", "cv-bar-label", p + "label", "line", "—", it.label) +
        '<span class="cv-bar-pips">' + pips + "</span>" +
        ed("span", "cv-bar-note", p + "note", "line", "", it.note) + "</div>";
    });
  }

  out += "</div></section>";
  return out;
}

function renderCV(st) {
  var d = st.design;
  var main = [], side = [];

  st.sections.forEach(function (sec, si) {
    var html = sectionHTML(st, sec, si);
    if (!html) return;
    if (d.twoCol && sec.col === "side") side.push(html);
    else main.push(html);
  });

  var inner = headerHTML(st);
  if (d.twoCol) {
    inner += '<div class="cv-cols">' +
      '<div class="cv-col cv-col-main">' + main.join("") + "</div>" +
      '<div class="cv-col cv-col-side">' + side.join("") + "</div>" +
      "</div>";
  } else {
    inner += main.join("") + side.join("");
  }

  root.innerHTML =
    (d.showGuides ? '<div class="cv-guides" aria-hidden="true"></div>' : "") +
    '<div class="cv-body">' + inner + "</div>";

  body = $(".cv-body", root);
  bindAll(st);
  layoutPageMarks(st);
}

var onEdit = function () {};
function setEditHandler(fn) { onEdit = fn; }

function bindAll(st) {
  var rt = CVF.rt;

  $$("[data-region]", root).forEach(function (el) {
    var kind = el.getAttribute("data-region");
    var path = el.getAttribute("data-path");

    if (kind === "bullets" || kind === "list") {
      rt.bind(el, {
        mode: "list",
        onChange: function () {
          var items = $$(":scope > li", el).map(function (li) {
            return U.clean(li.innerHTML, { block: true, lists: true });
          });
          if (kind === "bullets") onEdit(path, items);
          else onEdit(path, items.map(function (h) { return { text: h }; }));
        },
        onEmptyList: function () { onEdit(path, kind === "bullets" ? [] : []); }
      });
    } else if (kind === "tags") {
      rt.bind(el, {
        mode: "line",
        onChange: function () {
          var txt = (el.textContent || "").replace(/\s*[,;·]\s*/g, ", ").replace(/\s+/g, " ").trim();
          onEdit(path, U.esc(txt));
        },
        onBlur: function () { onEdit.rerender && onEdit.rerender(); }
      });
    }
  });

  $$("[data-path]:not([data-region])", root).forEach(function (el) {
    var path = el.getAttribute("data-path");
    var mode = el.getAttribute("data-mode") || "line";
    CVF.rt.bind(el, {
      mode: mode,
      placeholder: el.getAttribute("data-ph") || "",
      onChange: function (html) { onEdit(path, html); }
    });
  });

  $$(".cv-pip", root).forEach(function (pip) {
    pip.addEventListener("click", function () {
      onEdit(pip.getAttribute("data-lvl-path"), parseInt(pip.getAttribute("data-lvl"), 10), true);
    });
  });
}

function patchField(path, html) {
  var el = root.querySelector('[data-path="' + CSS.escape(path) + '"]:not([data-region])');
  if (!el || el === CVF.rt.active) return false;
  el.innerHTML = html || "";
  el.classList.toggle("is-empty", U.isEmptyHTML(html));
  return true;
}

function applyDesign(st) {
  var d = st.design, p = page(st), s = root.style;
  function v(k, val) { s.setProperty(k, val); }

  v("--page-w", p.w + "mm");
  v("--page-h", p.h + "mm");
  v("--usable-h", (p.h - d.marginTop - d.marginBottom) + "mm");
  v("--mt", d.marginTop + "mm"); v("--mr", d.marginRight + "mm");
  v("--mb", d.marginBottom + "mm"); v("--ml", d.marginLeft + "mm");

  v("--page-bg", d.pageBg);
  v("--text", d.textColor);
  v("--accent", d.accent);
  v("--rule", d.ruleColor);
  v("--link", d.linkColor);
  v("--link-deco", d.linkUnderline ? "underline" : "none");

  v("--font", d.fontFamily);
  v("--heading-font", d.headingFont === "inherit" ? d.fontFamily : d.headingFont);
  v("--name-font", d.nameFont === "inherit" ? "var(--heading-font)" : d.nameFont);
  v("--title-font", d.titleFont === "inherit" ? "var(--heading-font)" : d.titleFont);
  v("--fs", d.fontSize + "px");
  v("--lh", d.lineHeight);
  v("--ls", d.letterSpacing + "em");
  v("--ws", d.wordSpacing + "em");
  v("--text-align", d.textAlign);
  v("--para-gap", d.paraGap + "px");
  v("--para-indent", d.paraIndent + "px");

  v("--header-align", d.headerAlign);
  v("--header-bg", d.headerBg);
  v("--header-pad", d.headerPad + "px");
  v("--name-size", d.nameSize + "px");
  v("--name-weight", d.nameWeight);
  v("--name-case", d.nameCase === "smallcaps" ? "none" : d.nameCase);
  v("--name-variant", d.nameCase === "smallcaps" ? "small-caps" : "normal");
  v("--name-ls", d.nameSpacing + "em");
  v("--name-color", d.nameColor);
  v("--contact-size", d.contactSize + "px");
  v("--header-gap", d.headerGap + "px");
  v("--photo-size", d.photoSize + "px");
  v("--photo-radius", d.photoShape === "circle" ? "50%" : (d.photoShape === "rounded" ? "10px" : "0"));

  v("--title-size", d.titleSize + "px");
  v("--title-weight", d.titleWeight);
  v("--title-case", d.titleCase === "smallcaps" ? "none" : d.titleCase);
  v("--title-variant", d.titleCase === "smallcaps" ? "small-caps" : "normal");
  v("--title-ls", d.titleSpacing + "em");
  v("--title-color", d.titleColor);
  v("--title-align", d.titleAlign);
  v("--title-band", d.titleBandBg);
  v("--title-pad", d.titlePad + "px");
  v("--rule-w", d.ruleWidth + "px");
  v("--rule-style", d.ruleWidth > 0 ? d.ruleStyle : "none");
  v("--rule-gap", d.ruleGap + "px");
  v("--title-mb", d.titleGap + "px");

  v("--section-gap", d.sectionGap + "px");
  v("--item-gap", d.itemGap + "px");
  v("--bullet-gap", d.bulletGap + "px");
  v("--bullet-char", d.bulletChar);
  v("--bullet-indent", d.bulletIndent + "px");
  v("--bullet-color", d.bulletColor || d.textColor);
  v("--label-w", d.labelWidth + "px");
  v("--label-weight", d.labelWeight);
  v("--main-weight", d.mainWeight);
  v("--date-style", d.dateStyle);
  v("--date-weight", d.dateWeight);
  v("--sub-style", d.subStyle);
  v("--sub-weight", d.subWeight);

  v("--side-w", d.sideWidth + "%");
  v("--col-gap", d.colGap + "px");
  v("--side-bg", d.sideBg);
  v("--side-pad", d.sidePad + "px");

  v("--short-left", d.titleAlign === "center" ? "calc(50% - 19px)"
    : (d.titleAlign === "right" ? "calc(100% - 38px)" : "0px"));

  root.className = "cv cv-live" +
    (d.avoidBreak ? " avoid-break" : "") +
    (d.hyphenate ? " hyphenate" : "") +
    (d.twoCol ? " two-col side-" + d.sidePos : "") +
    " deco-" + d.titleDeco +
    " hl-" + d.headerLayout +
    " rows-" + d.rowsLayout +
    (d.photoShow && st.header.photo ? " has-photo" : "");

  var ps = $("#dynamic-print-style");
  if (ps) {
    ps.textContent =
      "@page{ size:" + (d.pageSize === "legal" ? "legal" : d.pageSize) +
      "; margin:" + d.marginTop + "mm " + d.marginRight + "mm " +
      d.marginBottom + "mm " + d.marginLeft + "mm; }";
  }
  layoutPageMarks(st);
}

function layoutPageMarks(st) {
  if (!body) return;
  $$(".cv-pagenum", body).forEach(function (n) { n.remove(); });
  if (!st.design.showPageNumbers) return;
  var u = usableHeightPx(st), n = pageCount(st);
  for (var i = 1; i <= n; i++) {
    var el = document.createElement("div");
    el.className = "cv-pagenum";
    el.style.top = (i * u - 16) + "px";
    el.textContent = i + " / " + n;
    body.appendChild(el);
  }
}

function fitToPages(st, target, applyFn) {
  var d = st.design, guard = 0;
  var limit = usableHeightPx(st) * target;
  applyFn();
  while (contentHeightPx() > limit - 2 && guard++ < 260) {
    var changed = false;
    if (d.sectionGap > 4)      { d.sectionGap = U.r1(d.sectionGap - 0.5); changed = true; }
    if (d.itemGap > 3)         { d.itemGap = U.r1(d.itemGap - 0.5); changed = true; }
    if (d.bulletGap > 0.5)     { d.bulletGap = U.r1(d.bulletGap - 0.5); changed = true; }
    if (d.lineHeight > 1.15)   { d.lineHeight = U.r2(d.lineHeight - 0.02); changed = true; }
    if (d.fontSize > 9.5)      { d.fontSize = U.r2(d.fontSize - 0.1); changed = true; }
    if (d.nameSize > 17)       { d.nameSize = U.r1(d.nameSize - 0.5); changed = true; }
    if (d.headerGap > 5)       { d.headerGap = U.r1(d.headerGap - 0.5); changed = true; }
    if (d.titleGap > 4)        { d.titleGap = U.r1(d.titleGap - 0.5); changed = true; }
    if (!changed) break;
    applyFn();
  }
  return contentHeightPx() <= limit;
}

CVF.render = {
  init: function (el) { root = el; },
  get root() { return root; },
  get body() { return body; },
  renderCV: renderCV,
  applyDesign: applyDesign,
  patchField: patchField,
  setEditHandler: setEditHandler,
  pageCount: pageCount,
  lastPageFill: lastPageFill,
  usableHeightPx: usableHeightPx,
  contentHeightPx: contentHeightPx,
  fitToPages: fitToPages,
  MM_PX: MM_PX
};

})();
