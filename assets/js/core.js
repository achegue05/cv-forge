(function () {
"use strict";

var CVF = window.CVF = window.CVF || {};

function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(sel));
}
function copy(o) { return JSON.parse(JSON.stringify(o)); }
function uid(p) { return (p || "x") + Math.random().toString(36).slice(2, 9); }
function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
function r1(n) { return Math.round(n * 10) / 10; }
function r2(n) { return Math.round(n * 100) / 100; }

function esc(s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function attr(s) { return esc(s).replace(/"/g, "&quot;"); }

function debounce(fn, ms) {
  var t;
  return function () {
    var self = this, args = arguments;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(self, args); }, ms || 200);
  };
}

function lines(s) {
  return String(s || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
}

var INLINE_OK = {
  STRONG: 1, B: 1, EM: 1, I: 1, U: 1, S: 1, STRIKE: 1, DEL: 1, INS: 1,
  SPAN: 1, A: 1, BR: 1, SUB: 1, SUP: 1, MARK: 1, CODE: 1, SMALL: 1
};
var BLOCK_OK = { P: 1, DIV: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1 };
var KILL = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, LINK: 1, META: 1, NOSCRIPT: 1, SVG: 1, CANVAS: 1, FORM: 1, INPUT: 1, BUTTON: 1 };

var STYLE_OK = [
  "color", "background-color", "font-size", "font-family", "font-weight",
  "font-style", "font-variant", "text-decoration", "text-decoration-line",
  "text-decoration-color", "text-decoration-style", "letter-spacing",
  "word-spacing", "text-transform", "vertical-align", "line-height",
  "text-align", "text-indent", "opacity"
];

var SIZE_MAP = { 1: "8px", 2: "10px", 3: "12px", 4: "14px", 5: "18px", 6: "24px", 7: "32px" };

function safeStyle(el) {
  var keep = [];
  for (var i = 0; i < STYLE_OK.length; i++) {
    var prop = STYLE_OK[i];
    var val = el.style.getPropertyValue(prop);
    if (!val) continue;
    val = String(val).replace(/[<>]/g, "");
    if (/expression|javascript:|url\s*\(/i.test(val)) continue;
    keep.push(prop + ":" + val);
  }
  return keep.join(";");
}

function safeHref(h) {
  var v = String(h || "").trim();
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(v)) return v;
  if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(v)) return "mailto:" + v;
  if (/^www\./i.test(v) || /^[\w-]+\.[a-z]{2,}(\/|$)/i.test(v)) return "https://" + v;
  return "";
}

function unwrap(node, spaced) {
  var p = node.parentNode;
  if (!p) return;
  while (node.firstChild) p.insertBefore(node.firstChild, node);
  // Al aplanar un bloque en un campo de una sola línea hace falta
  // un espacio, o dos párrafos quedarían pegados: «unodos».
  if (spaced) p.insertBefore(node.ownerDocument.createTextNode(" "), node);
  p.removeChild(node);
}

function clean(html, opts) {
  opts = opts || {};
  var doc = new DOMParser().parseFromString(
    "<!doctype html><body>" + String(html == null ? "" : html), "text/html");
  var host = doc.body;
  var make = function (tag) { return doc.createElement(tag); };

  (function strip(node) {
    var kids = Array.prototype.slice.call(node.childNodes);
    kids.forEach(function (n) {
      if (n.nodeType === 8) { node.removeChild(n); return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName;
      if (KILL[tag]) { node.removeChild(n); return; }
      strip(n);

      if (tag === "FONT") {
        var span = make("span");
        if (n.getAttribute("color")) span.style.color = n.getAttribute("color");
        if (n.getAttribute("face")) span.style.fontFamily = n.getAttribute("face");
        var sz = n.getAttribute("size");
        if (sz && SIZE_MAP[sz]) span.style.fontSize = SIZE_MAP[sz];
        while (n.firstChild) span.appendChild(n.firstChild);
        node.replaceChild(span, n);
        n = span; tag = "SPAN";
      }

      if (/^H[1-6]$/.test(tag)) {
        if (opts.block) {
          var p = make("p");
          var st = make("strong");
          while (n.firstChild) st.appendChild(n.firstChild);
          p.appendChild(st);
          node.replaceChild(p, n);
          return;
        }
        unwrap(n); return;
      }

      var isBlock = !!BLOCK_OK[tag];
      var listTag = tag === "UL" || tag === "OL" || tag === "LI";
      if (isBlock && !opts.block && !(opts.lists && listTag)) { unwrap(n, true); return; }
      if (!isBlock && !INLINE_OK[tag]) { unwrap(n); return; }

      var href = tag === "A" ? safeHref(n.getAttribute("href")) : "";
      var style = safeStyle(n);

      Array.prototype.map.call(n.attributes, function (a) { return a.name; })
        .forEach(function (name) { n.removeAttribute(name); });

      if (style) n.setAttribute("style", style);
      if (tag === "A") {
        if (!href) { unwrap(n); return; }
        n.setAttribute("href", href);
        n.setAttribute("target", "_blank");
        n.setAttribute("rel", "noopener noreferrer");
      }
    });
  })(host);

  var out = host.innerHTML;
  if (!opts.block && !opts.lists) {
    out = out.replace(/<br\s*\/?>/gi, " ").replace(/[ \t]{2,}/g, " ");
  }
  out = out.replace(/(<p[^>]*>)\s*(<\/p>)/gi, "");
  return out.trim();
}

function htmlToText(html, sep) {
  var src = String(html || "").replace(/<\/(p|div|li|ul|ol)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");
  var d = new DOMParser().parseFromString("<!doctype html><body>" + src, "text/html").body;
  var t = d.textContent || "";
  return t.replace(/\n{3,}/g, "\n\n").split("\n").map(function (l) { return l.trim(); })
    .join(sep === undefined ? "\n" : sep).trim();
}

function mdToHtml(s) {
  if (s == null) return "";
  if (/<[a-z][\s\S]*>/i.test(s)) return clean(s, { block: false });
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
}

function htmlToMd(html) {
  var d = new DOMParser().parseFromString("<!doctype html><body>" + String(html || ""), "text/html").body;
  (function walk(n) {
    Array.prototype.slice.call(n.childNodes).forEach(function (k) {
      if (k.nodeType !== 1) return;
      walk(k);
      var t = k.tagName, inner = k.innerHTML;
      if (t === "STRONG" || t === "B") k.outerHTML = "**" + inner + "**";
      else if (t === "EM" || t === "I") k.outerHTML = "*" + inner + "*";
    });
  })(d);
  return htmlToText(d.innerHTML, " ");
}

function isEmptyHTML(html) { return htmlToText(html, " ").replace(/\s+/g, "") === ""; }

var LS = {
  get: function (k, dflt) {
    try {
      var raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : dflt;
    } catch (e) { return dflt; }
  },
  set: function (k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
  keys: function (prefix) {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!prefix || k.indexOf(prefix) === 0) out.push(k);
      }
    } catch (e) {}
    return out;
  }
};

function getPath(obj, path) {
  var parts = String(path).split("."), o = obj;
  for (var i = 0; i < parts.length; i++) {
    if (o == null) return undefined;
    o = o[parts[i]];
  }
  return o;
}
function setPath(obj, path, value) {
  var parts = String(path).split("."), o = obj;
  for (var i = 0; i < parts.length - 1; i++) {
    if (o[parts[i]] == null) o[parts[i]] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    o = o[parts[i]];
  }
  o[parts[parts.length - 1]] = value;
}

function download(name, data, mime) {
  var blob = data instanceof Blob ? data : new Blob([data], { type: mime || "text/plain;charset=utf-8" });
  var a = document.createElement("a");
  var url = URL.createObjectURL(blob);
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}

function slug(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "cv";
}

var toastTimer;
function toast(msg, kind) {
  var t = $("#toast");
  if (!t) return;
  t.innerHTML = '<span class="toast-dot"></span><span>' + esc(msg) + "</span>";
  t.className = "toast is-on" + (kind ? " " + kind : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.className = "toast"; }, kind === "err" ? 4200 : 2600);
}

function confirmBox(opts) {
  return new Promise(function (resolve) {
    var host = document.createElement("div");
    host.className = "modal-back";
    host.innerHTML =
      '<div class="modal glass" role="dialog" aria-modal="true">' +
        '<h3>' + esc(opts.title || "") + "</h3>" +
        '<p>' + esc(opts.body || "") + "</p>" +
        (opts.input !== undefined
          ? '<input type="text" class="modal-input" value="' + attr(opts.input) + '">' : "") +
        '<div class="modal-actions">' +
          '<button class="btn" data-r="0">' + esc(opts.cancel || "Cancelar") + "</button>" +
          '<button class="btn btn-primary" data-r="1">' + esc(opts.ok || "Aceptar") + "</button>" +
        "</div></div>";
    document.body.appendChild(host);
    var input = $(".modal-input", host);
    if (input) setTimeout(function () { input.focus(); input.select(); }, 30);

    function done(val) { host.remove(); document.removeEventListener("keydown", key); resolve(val); }
    function key(e) {
      if (e.key === "Escape") done(false);
      if (e.key === "Enter" && input) done(input.value);
    }
    document.addEventListener("keydown", key);
    host.addEventListener("click", function (e) {
      if (e.target === host) return done(false);
      var b = e.target.closest("[data-r]");
      if (!b) return;
      if (b.getAttribute("data-r") === "0") return done(false);
      done(input ? input.value : true);
    });
  });
}

CVF.util = {
  $: $, $$: $$, copy: copy, uid: uid, clamp: clamp, r1: r1, r2: r2,
  esc: esc, attr: attr, debounce: debounce, lines: lines,
  clean: clean, htmlToText: htmlToText, mdToHtml: mdToHtml, htmlToMd: htmlToMd,
  isEmptyHTML: isEmptyHTML, safeHref: safeHref,
  LS: LS, getPath: getPath, setPath: setPath,
  download: download, slug: slug, toast: toast, confirmBox: confirmBox
};

})();
