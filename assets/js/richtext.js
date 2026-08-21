(function () {
"use strict";

var CVF = window.CVF;
var U = CVF.util, $ = U.$, $$ = U.$$;
var t = function (k) { return CVF.i18n.t(k); };

var active = null;        
var savedRange = null;    
var listeners = [];       

function editableHost(node) {
  var n = node && node.nodeType === 3 ? node.parentNode : node;
  while (n && n !== document) {
    if (n.nodeType === 1 && n.hasAttribute && n.hasAttribute("data-rt")) return n;
    n = n.parentNode;
  }
  return null;
}

document.addEventListener("selectionchange", function () {
  var sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  var r = sel.getRangeAt(0);
  var host = editableHost(r.commonAncestorContainer);
  if (host) {
    active = host;
    savedRange = r.cloneRange();
    notify();
  }
});

function restore() {
  if (!active || !document.contains(active)) return false;
  active.focus({ preventScroll: true });
  if (!savedRange) return true;
  try {
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  } catch (e) { return false; }
  return true;
}

function hasSelection() {
  return !!(savedRange && !savedRange.collapsed);
}

function mode() { return active ? (active.getAttribute("data-rt") || "line") : null; }

function exec(cmd, val, css) {
  if (!restore()) return false;
  try { document.execCommand("styleWithCSS", false, css !== false); } catch (e) {}
  var ok = false;
  try { ok = document.execCommand(cmd, false, val === undefined ? null : val); } catch (e) {}
  afterEdit();
  return ok;
}

function styleSelection(css) {
  if (!restore()) return;
  if (!active || !savedRange) return;
  var props = Object.keys(css);

  if (savedRange.collapsed) {
    
    var span = document.createElement("span");
    props.forEach(function (p) { span.style.setProperty(p, css[p]); });
    span.appendChild(document.createTextNode("​"));
    savedRange.insertNode(span);
    var r0 = document.createRange();
    r0.setStart(span.firstChild, 1);
    r0.collapse(true);
    applyRange(r0);
    afterEdit();
    return;
  }

  var range = savedRange;
  var frag = range.extractContents();

  $$("*", frag).forEach(function (el) {
    if (!el.style) return;
    props.forEach(function (p) { el.style.removeProperty(p); });
    if (el.tagName === "SPAN" && !el.getAttribute("style")) {
      var parent = el.parentNode;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }
  });

  var walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT, null, false);
  var texts = [], n;
  while ((n = walker.nextNode())) if (n.nodeValue !== "") texts.push(n);

  var wraps = texts.map(function (tn) {
    var s = document.createElement("span");
    props.forEach(function (p) { s.style.setProperty(p, css[p]); });
    tn.parentNode.replaceChild(s, tn);
    s.appendChild(tn);
    return s;
  });

  var first = wraps[0], last = wraps[wraps.length - 1];
  range.insertNode(frag);

  if (first && last && active.contains(first) && active.contains(last)) {
    var r = document.createRange();
    r.setStartBefore(first);
    r.setEndAfter(last);
    applyRange(r);
  }
  afterEdit();
}

function applyRange(r) {
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  savedRange = r.cloneRange();
}

function afterEdit() {
  if (active && active.__rtInput) active.__rtInput();
  notify();
}

var CMD = {
  bold:      function () { exec("bold"); },
  italic:    function () { exec("italic"); },
  underline: function () { exec("underline"); },
  strike:    function () { exec("strikeThrough"); },
  sup:       function () { exec("superscript"); },
  sub:       function () { exec("subscript"); },
  color:     function (v) { exec("foreColor", v); },
  highlight: function (v) {
    if (v === "none") { styleSelection({ "background-color": "transparent" }); return; }
    if (!exec("hiliteColor", v)) exec("backColor", v);
  },
  font:      function (v) { styleSelection({ "font-family": v }); },
  size:      function (v) { styleSelection({ "font-size": v + "px" }); },
  bulletList:function () { exec("insertUnorderedList"); },
  numberList:function () { exec("insertOrderedList"); },
  alignLeft: function () { exec("justifyLeft"); },
  alignCenter:function(){ exec("justifyCenter"); },
  alignRight:function () { exec("justifyRight"); },
  alignJustify:function(){ exec("justifyFull"); },
  indent:    function () { exec("indent"); },
  outdent:   function () { exec("outdent"); },
  unlink:    function () { exec("unlink"); },

  clear: function () {
    if (!restore()) return;
    exec("removeFormat");
    exec("unlink");
    
    if (!active) return;
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var r = sel.getRangeAt(0);
    $$("span[style]", active).forEach(function (s) {
      if (!r.intersectsNode(s)) return;
      var p = s.parentNode;
      while (s.firstChild) p.insertBefore(s.firstChild, s);
      p.removeChild(s);
    });
    active.normalize();
    afterEdit();
  },

  spacing: function (delta) {
    if (!restore() || !active) return;
    var el = anchorElement();
    var cs = el ? getComputedStyle(el) : null;
    var fs = cs ? parseFloat(cs.fontSize) || 16 : 16;
    var cur = cs ? (cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing) || 0) : 0;
    var em = U.clamp(cur / fs + delta, -0.08, 0.5);
    styleSelection({ "letter-spacing": em.toFixed(3) + "em" });
  },

  changeCase: function (kind) {
    if (!restore() || !hasSelection()) return;
    var r = savedRange;
    var frag = r.extractContents();
    var walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT, null, false);
    var n, first = true;
    while ((n = walker.nextNode())) {
      var v = n.nodeValue;
      if (kind === "upper") v = v.toLocaleUpperCase();
      else if (kind === "lower") v = v.toLocaleLowerCase();
      else if (kind === "title") {
        v = v.toLocaleLowerCase().replace(/(^|[\s(\[«"'—–-])(\p{L})/gu, function (m, a, b) {
          return a + b.toLocaleUpperCase();
        });
      } else if (kind === "sentence") {
        v = v.toLocaleLowerCase();
        if (first) v = v.replace(/(\p{L})/u, function (m) { return m.toLocaleUpperCase(); });
      }
      n.nodeValue = v;
      if (n.nodeValue.trim()) first = false;
    }
    var last = frag.lastChild;
    r.insertNode(frag);
    if (last) {
      var nr = document.createRange();
      nr.setStartBefore(r.startContainer.childNodes[0] || r.startContainer);
      nr.setEndAfter(last);
      try { applyRange(nr); } catch (e) {}
    }
    afterEdit();
  },

  link: function () {
    if (!active) return;
    var pre = "";
    var a = closestTag("A");
    if (a) pre = a.getAttribute("href") || "";
    U.confirmBox({
      title: t("fmtLink"), body: t("linkBody"), input: pre,
      ok: t("ok"), cancel: t("cancel")
    }).then(function (val) {
      if (val === false) return;
      var href = U.safeHref(String(val || "").trim());
      if (!href) { CMD.unlink(); return; }
      exec("createLink", href);
      if (active) {
        $$("a", active).forEach(function (el) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
        });
        afterEdit();
      }
    });
  }
};

function anchorElement() {
  var sel = window.getSelection();
  if (!sel || !sel.rangeCount) return active;
  var n = sel.getRangeAt(0).startContainer;
  return n.nodeType === 3 ? n.parentElement : n;
}

function closestTag(tag) {
  var n = anchorElement();
  while (n && n !== active) {
    if (n.tagName === tag) return n;
    n = n.parentNode;
  }
  return null;
}

/* ---------- 4. Enlazar un campo ----------------------------
   opts.mode  "line"  una sola línea, sin bloques ni listas
              "rich"  párrafos, alineación y listas
              "list"  una lista <ul>/<ol>: Enter crea otro punto
   ----------------------------------------------------------- */

function bind(el, opts) {
  opts = opts || {};
  var m = opts.mode || "line";
  el.setAttribute("data-rt", m);
  el.setAttribute("contenteditable", "true");
  el.setAttribute("spellcheck", "true");
  if (opts.placeholder) el.setAttribute("data-ph", opts.placeholder);

  var cleanOpts = m === "rich" ? { block: true } : (m === "list" ? { block: true, lists: true } : {});

  function value() { return U.clean(el.innerHTML, cleanOpts); }

  var fire = U.debounce(function () {
    markEmpty();
    if (opts.onChange) opts.onChange(value(), el);
  }, opts.delay === undefined ? 220 : opts.delay);

  function markEmpty() {
    var txt = (el.textContent || "").replace(/[\s​]/g, "");
    var hasStuff = txt !== "" || el.querySelector("img");
    el.classList.toggle("is-empty", !hasStuff);
  }

  el.__rtInput = fire;
  el.__rtValue = value;

  el.addEventListener("input", fire);
  el.addEventListener("focus", function () {
    active = el;
    el.classList.add("is-editing");
    notify();
    if (opts.onFocus) opts.onFocus(el);
  });
  el.addEventListener("blur", function () {
    el.classList.remove("is-editing");
    markEmpty();
    if (opts.onChange) opts.onChange(value(), el);
    if (opts.onBlur) opts.onBlur(el);
  });

  el.addEventListener("paste", function (e) {
    e.preventDefault();
    var dt = e.clipboardData;
    if (!dt) return;
    var html = dt.getData("text/html");
    var text = dt.getData("text/plain");
    var out;
    if (html && !e.shiftKey) out = U.clean(html, cleanOpts);
    else out = U.esc(text || "").replace(/\n/g, m === "line" ? " " : "<br>");
    document.execCommand("insertHTML", false, out);
    fire();
  });

  el.addEventListener("drop", function (e) { e.preventDefault(); });

  el.addEventListener("keydown", function (e) {
    var mod = e.ctrlKey || e.metaKey;

    if (mod && !e.altKey) {
      var k = e.key.toLowerCase();
      if (k === "b") { e.preventDefault(); CMD.bold(); return; }
      if (k === "i") { e.preventDefault(); CMD.italic(); return; }
      if (k === "u") { e.preventDefault(); CMD.underline(); return; }
      if (k === "k") { e.preventDefault(); CMD.link(); return; }
      if (e.shiftKey && k === "x") { e.preventDefault(); CMD.strike(); return; }
      if (k === "\\") { e.preventDefault(); CMD.clear(); return; }
      if (m !== "line") {
        if (e.shiftKey && k === "l") { e.preventDefault(); CMD.alignLeft(); return; }
        if (e.shiftKey && k === "e") { e.preventDefault(); CMD.alignCenter(); return; }
        if (e.shiftKey && k === "r") { e.preventDefault(); CMD.alignRight(); return; }
        if (e.shiftKey && k === "j") { e.preventDefault(); CMD.alignJustify(); return; }
      }
      // Ctrl+Z / Ctrl+Y se dejan al navegador: deshace dentro del campo.
      return;
    }

    if (e.key === "Escape") { e.preventDefault(); el.blur(); return; }

    if (e.key === "Enter") {
      if (m === "line") {
        e.preventDefault();
        if (opts.onEnter) opts.onEnter(el, e);
        else el.blur();
        return;
      }
      if (m === "list" && opts.onEnter) { opts.onEnter(el, e); return; }
    }

    if (e.key === "Tab" && m !== "line") {
      e.preventDefault();
      if (e.shiftKey) CMD.outdent(); else CMD.indent();
      return;
    }

    if (e.key === "Backspace" && m === "list") {
      var li = closestIn(el, "LI");
      if (li && el.querySelectorAll("li").length === 1 && !li.textContent.trim() && opts.onEmptyList) {
        e.preventDefault(); opts.onEmptyList(el);
      }
    }
  });

  markEmpty();
  return el;
}

function closestIn(root, tag) {
  var sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  var n = sel.getRangeAt(0).startContainer;
  n = n.nodeType === 3 ? n.parentElement : n;
  while (n && n !== root) { if (n.tagName === tag) return n; n = n.parentNode; }
  return null;
}

/* ---------- 5. Estado del formato para la barra ------------ */

function queryState() {
  var st = { on: {}, font: "", size: "", align: "", link: false, live: !!active };
  if (!active) return st;
  ["bold", "italic", "underline", "strikeThrough", "superscript", "subscript",
   "insertUnorderedList", "insertOrderedList"].forEach(function (c) {
    try { st.on[c] = document.queryCommandState(c); } catch (e) { st.on[c] = false; }
  });
  var el = anchorElement();
  if (el && el.nodeType === 1) {
    var cs = getComputedStyle(el);
    st.font = cs.fontFamily;
    st.size = Math.round(parseFloat(cs.fontSize) * 10) / 10;
    st.align = cs.textAlign;
    st.color = cs.color;
  }
  st.link = !!closestTag("A");
  return st;
}

function onChangeState(fn) { listeners.push(fn); }
function notify() {
  var st = queryState();
  listeners.forEach(function (f) { try { f(st); } catch (e) {} });
}

/* ---------- 6. Barra de formato ---------------------------- */

var I = {
  bold:   '<path d="M4 2.5h4.2a2.75 2.75 0 0 1 0 5.5H4zM4 8h4.8a2.75 2.75 0 0 1 0 5.5H4z"/>',
  italic: '<path d="M6.5 2.5h6M3.5 13.5h6M9.5 2.5l-3 11"/>',
  under:  '<path d="M4 2.5v5a4 4 0 0 0 8 0v-5M3.5 14h9"/>',
  strike: '<path d="M3 8h10M11.5 4.6C11 3.3 9.7 2.5 8 2.5c-2 0-3.3 1-3.3 2.4 0 1 .6 1.7 2 2.2M4.6 11.2c.4 1.4 1.8 2.3 3.5 2.3 2.2 0 3.4-1 3.4-2.4 0-.9-.4-1.6-1.4-2.1"/>',
  sup:    '<path d="M2.5 13.5l5-8M7.5 13.5l-5-8M11 6.2c0-1.6 2.5-1.4 2.5-.2 0 1-2.5 1.6-2.5 3.2h3"/>',
  sub:    '<path d="M2.5 9.5l5-8M7.5 9.5l-5-8M11 14.4c0-1.6 2.5-1.4 2.5-.2 0 1-2.5 1.6-2.5 3.2h3" transform="translate(0,-3)"/>',
  alignL: '<path d="M2.5 3.5h11M2.5 6.8h7M2.5 10.1h11M2.5 13.4h7"/>',
  alignC: '<path d="M2.5 3.5h11M4.5 6.8h7M2.5 10.1h11M4.5 13.4h7"/>',
  alignR: '<path d="M2.5 3.5h11M6.5 6.8h7M2.5 10.1h11M6.5 13.4h7"/>',
  alignJ: '<path d="M2.5 3.5h11M2.5 6.8h11M2.5 10.1h11M2.5 13.4h11"/>',
  ul:     '<path d="M6 4h8M6 8h8M6 12h8"/><circle cx="3" cy="4" r="1.1" fill="currentColor" stroke="none"/><circle cx="3" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
  ol:     '<path d="M6 4h8M6 8h8M6 12h8M2 2.6h1v2.8M1.8 7.2h1.6L1.8 9.4h1.6M1.8 10.9h1.5v1.2H2.2h1.1v1.2H1.8"/>',
  link:   '<path d="M6.6 9.4a2.6 2.6 0 0 1 0-3.7l2-2a2.6 2.6 0 0 1 3.7 3.7l-1 1M9.4 6.6a2.6 2.6 0 0 1 0 3.7l-2 2A2.6 2.6 0 0 1 3.7 8.6l1-1"/>',
  unlink: '<path d="M6.6 9.4a2.6 2.6 0 0 1 0-3.7l1-1M9.4 6.6a2.6 2.6 0 0 1 0 3.7l-1 1M2.5 2.5l11 11"/>',
  clear:  '<path d="M5.5 13.5h8M9.8 2.6L3.4 9a1.4 1.4 0 0 0 0 2l1.6 1.6h3l6.1-6.1a1.4 1.4 0 0 0 0-2l-2.3-2.3a1.4 1.4 0 0 0-2 0zM6.5 5.9l4.6 4.6"/>',
  case:   '<path d="M1.5 12.5l3.2-9 3.2 9M2.7 9.6h4M10 12.5V7.2M10 8.6c.4-1 1.3-1.5 2.3-1.5 1.4 0 2.2.8 2.2 2.2v3.8"/>',
  undo:   '<path d="M3 7.5h7.2a3.3 3.3 0 0 1 0 6.6H6M3 7.5l3-3M3 7.5l3 3"/>',
  redo:   '<path d="M13 7.5H5.8a3.3 3.3 0 0 0 0 6.6H10M13 7.5l-3-3M13 7.5l-3 3"/>',
  wider:  '<path d="M2 3v10M14 3v10M5.5 8h5M5.5 8L7 6.5M5.5 8L7 9.5M10.5 8L9 6.5M10.5 8L9 9.5"/>',
  tighter:'<path d="M2 3v10M14 3v10M4 8h8M8.8 8l-1.4-1.5M8.8 8l-1.4 1.5"/>'
};

function svg(path) {
  return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>";
}

function btn(cmd, icon, label, arg) {
  return '<button type="button" class="rb-btn" data-cmd="' + cmd + '"' +
    (arg !== undefined ? ' data-arg="' + U.attr(arg) + '"' : "") +
    ' title="' + U.attr(label) + '" aria-label="' + U.attr(label) + '">' + svg(icon) + "</button>";
}

function buildRibbon(host) {
  var D = CVF.data;
  var fontOpts = D.FONTS.map(function (f) {
    if (f[1] === null) return '<option disabled>' + U.esc(f[0]) + "</option>";
    return '<option value="' + U.attr(f[0]) + '">' + U.esc(f[1]) + "</option>";
  }).join("");
  var sizeOpts = D.FONT_SIZES.map(function (s) {
    return '<option value="' + s + '">' + s + "</option>";
  }).join("");

  host.innerHTML =
    '<div class="rb-group">' +
      btn("undoDoc", I.undo, t("undo")) +
      btn("redoDoc", I.redo, t("redo")) +
    "</div>" +

    '<div class="rb-group">' +
      '<select class="rb-select rb-font" data-cmd="font" title="' + U.attr(t("fmtFont")) + '">' +
        '<option value="">' + U.esc(t("fmtFont")) + "</option>" + fontOpts + "</select>" +
      '<select class="rb-select rb-size" data-cmd="size" title="' + U.attr(t("fmtSize")) + '">' +
        '<option value="">' + U.esc(t("fmtSize")) + "</option>" + sizeOpts + "</select>" +
    "</div>" +

    '<div class="rb-group">' +
      btn("bold", I.bold, t("fmtBold") + " (Ctrl+B)") +
      btn("italic", I.italic, t("fmtItalic") + " (Ctrl+I)") +
      btn("underline", I.under, t("fmtUnderline") + " (Ctrl+U)") +
      btn("strike", I.strike, t("fmtStrike") + " (Ctrl+Shift+X)") +
      btn("sup", I.sup, t("fmtSup")) +
      btn("sub", I.sub, t("fmtSub")) +
    "</div>" +

    '<div class="rb-group">' +
      '<label class="rb-color" title="' + U.attr(t("fmtColor")) + '">' +
        '<span class="rb-color-glyph">A</span>' +
        '<input type="color" data-cmd="color" value="#111111">' +
      "</label>" +
      '<label class="rb-color rb-hl" title="' + U.attr(t("fmtHighlight")) + '">' +
        '<span class="rb-color-glyph">A</span>' +
        '<input type="color" data-cmd="highlight" value="#ffe680">' +
      "</label>" +
      '<button type="button" class="rb-btn" data-cmd="highlight" data-arg="none" title="' +
        U.attr(t("fmtHighlight") + " — " + t("none")) + '"><svg viewBox="0 0 16 16" fill="none" ' +
        'stroke="currentColor" stroke-width="1.4"><path d="M3 3l10 10M3 13L13 3"/></svg></button>' +
    "</div>" +

    '<div class="rb-group rb-menu-wrap">' +
      '<button type="button" class="rb-btn" data-menu="case" title="' + U.attr(t("fmtCase")) + '">' +
        svg(I.case) + '<span class="rb-caret"></span></button>' +
      '<div class="rb-menu glass" data-menu-for="case">' +
        '<button type="button" data-cmd="case" data-arg="upper">' + U.esc(t("fmtUpper")) + "</button>" +
        '<button type="button" data-cmd="case" data-arg="lower">' + U.esc(t("fmtLower")) + "</button>" +
        '<button type="button" data-cmd="case" data-arg="title">' + U.esc(t("fmtTitle")) + "</button>" +
        '<button type="button" data-cmd="case" data-arg="sentence">' + U.esc(t("fmtSentence")) + "</button>" +
      "</div>" +
    "</div>" +

    '<div class="rb-group rb-hide-sm">' +
      btn("alignLeft", I.alignL, t("fmtLeft")) +
      btn("alignCenter", I.alignC, t("fmtCenter")) +
      btn("alignRight", I.alignR, t("fmtRight")) +
      btn("alignJustify", I.alignJ, t("fmtJustify")) +
    "</div>" +

    '<div class="rb-group">' +
      btn("bulletList", I.ul, t("fmtBullets")) +
      btn("numberList", I.ol, t("fmtNumbers")) +
    "</div>" +

    '<div class="rb-group rb-hide-sm">' +
      btn("spacingDown", I.tighter, t("fmtSpacingDown")) +
      btn("spacingUp", I.wider, t("fmtSpacingUp")) +
    "</div>" +

    '<div class="rb-group">' +
      btn("link", I.link, t("fmtLink") + " (Ctrl+K)") +
      btn("unlink", I.unlink, t("fmtUnlink")) +
      btn("clear", I.clear, t("fmtClear") + " (Ctrl+\\)") +
    "</div>" +

    '<span class="rb-hint">' + U.esc(t("fmtHint")) + "</span>";

  // No robar el foco del campo editable.
  host.addEventListener("mousedown", function (e) {
    if (e.target.closest("select, input[type=color]")) return;
    e.preventDefault();
  });

  host.addEventListener("click", function (e) {
    var menuBtn = e.target.closest("[data-menu]");
    if (menuBtn) {
      var key = menuBtn.getAttribute("data-menu");
      var menu = $('[data-menu-for="' + key + '"]', host);
      var open = menu.classList.contains("is-open");
      $$(".rb-menu", host).forEach(function (m) { m.classList.remove("is-open"); });
      menu.classList.toggle("is-open", !open);
      return;
    }
    var b = e.target.closest("[data-cmd]");
    if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return;
    run(b.getAttribute("data-cmd"), b.getAttribute("data-arg"));
    $$(".rb-menu", host).forEach(function (m) { m.classList.remove("is-open"); });
  });

  host.addEventListener("change", function (e) {
    var el = e.target;
    if (!el.hasAttribute("data-cmd")) return;
    if (el.tagName === "SELECT") {
      if (!el.value) return;
      run(el.getAttribute("data-cmd"), el.value);
      el.blur();
    }
  });
  host.addEventListener("input", function (e) {
    var el = e.target;
    if (el.type === "color" && el.hasAttribute("data-cmd")) run(el.getAttribute("data-cmd"), el.value);
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".rb-menu-wrap")) $$(".rb-menu", host).forEach(function (m) { m.classList.remove("is-open"); });
  });

  onChangeState(function (st) { syncRibbon(host, st); });
  syncRibbon(host, queryState());
}

var STATE_MAP = {
  bold: "bold", italic: "italic", underline: "underline", strike: "strikeThrough",
  sup: "superscript", sub: "subscript",
  bulletList: "insertUnorderedList", numberList: "insertOrderedList"
};

function syncRibbon(host, st) {
  host.classList.toggle("is-live", !!st.live);
  $$(".rb-btn[data-cmd]", host).forEach(function (b) {
    var c = b.getAttribute("data-cmd");
    var key = STATE_MAP[c];
    if (key) b.classList.toggle("is-on", !!st.on[key]);
    if (c === "alignLeft") b.classList.toggle("is-on", st.align === "left" || st.align === "start");
    if (c === "alignCenter") b.classList.toggle("is-on", st.align === "center");
    if (c === "alignRight") b.classList.toggle("is-on", st.align === "right");
    if (c === "alignJustify") b.classList.toggle("is-on", st.align === "justify");
    if (c === "unlink") b.classList.toggle("is-on", !!st.link);
  });
  var sz = $(".rb-size", host);
  if (sz && st.size && document.activeElement !== sz) {
    var found = Array.prototype.some.call(sz.options, function (o) {
      if (parseFloat(o.value) === st.size) { sz.value = o.value; return true; }
      return false;
    });
    if (!found) sz.value = "";
  }
  var ft = $(".rb-font", host);
  if (ft && st.font && document.activeElement !== ft) {
    var first = String(st.font).split(",")[0].replace(/['"]/g, "").toLowerCase();
    var hit = "";
    Array.prototype.forEach.call(ft.options, function (o) {
      if (!hit && o.value && o.value.toLowerCase().indexOf(first) > -1) hit = o.value;
    });
    ft.value = hit;
  }
}

function run(cmd, arg) {
  if (cmd === "undoDoc") { CVF.app && CVF.app.undo(); return; }
  if (cmd === "redoDoc") { CVF.app && CVF.app.redo(); return; }
  if (cmd === "case") { CMD.changeCase(arg); return; }
  if (cmd === "spacingUp") { CMD.spacing(0.02); return; }
  if (cmd === "spacingDown") { CMD.spacing(-0.02); return; }
  if (cmd === "size") { CMD.size(parseFloat(arg)); return; }
  if (CMD[cmd]) CMD[cmd](arg);
}

CVF.rt = {
  bind: bind,
  cmd: CMD,
  run: run,
  buildRibbon: buildRibbon,
  queryState: queryState,
  onChangeState: onChangeState,
  get active() { return active; },
  blur: function () { if (active) active.blur(); active = null; savedRange = null; notify(); }
};

})();
