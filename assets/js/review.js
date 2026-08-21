(function () {
"use strict";

var CVF = window.CVF;
var U = CVF.util;
var D = CVF.data;
var t = function (k) { return CVF.i18n.t(k); };

function collect(st) {
  var out = { header: "", bullets: [], entries: [], all: [] };
  var push = function (h) { var s = U.htmlToText(h, " "); if (s) out.all.push(s); return s; };

  out.header += push(st.header.name) + " ";
  out.header += push(st.header.tagline) + " ";
  (st.header.contacts || []).forEach(function (c) {
    out.header += push(c.text) + " " + (c.link || "") + " ";
  });

  st.sections.forEach(function (sec) {
    if (!sec.visible) return;
    push(sec.title);
    (sec.items || []).forEach(function (it) {
      if (sec.type === "entries") {
        var left = push(it.left), right = push(it.right);
        var subText = (it.subs || []).map(function (s) {
          return push(s.left) + " " + push(s.right);
        }).join(" ");
        push(it.text);
        (it.bullets || []).forEach(function (b) {
          var s = push(b);
          if (s) out.bullets.push(s);
        });
        out.entries.push({
          left: left, right: right,
          dates: (right + " " + subText),
          bullets: (it.bullets || []).length
        });
      } else if (sec.type === "rows") {
        push(it.label); push(it.content);
      } else if (sec.type === "bars") {
        push(it.label); push(it.note);
      } else {
        var s = push(it.text);
        if (sec.type === "list" && s) out.bullets.push(s);
      }
    });
  });

  out.text = out.all.join(" ");
  return out;
}

function stats(st) {
  var c = collect(st);
  var words = (c.text.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
  return {
    words: words,
    chars: c.text.replace(/\s+/g, " ").length,
    bullets: c.bullets.length,
    pages: CVF.render.pageCount(st),
    fill: CVF.render.lastPageFill(st),
    data: c
  };
}

/* ---------- 3. Comprobaciones ------------------------------ */

var WEAK = /^(responsable de|encargad[oa] de|apoy[éo]|ayud[éo]|particip[éo] en|colabor[éo] en|mis funciones|tareas|responsible for|in charge of|helped|assisted|worked on|duties included|tasked with|involved in)\b/i;

function checks(st) {
  var s = stats(st), c = s.data, d = st.design, out = [];

  function add(level, msg, detail) { out.push({ level: level, msg: msg, detail: detail || "" }); }

  var hasMail = /[\w.+-]+@[\w.-]+\.\w{2,}/.test(c.header);
  add(hasMail ? "ok" : "bad", hasMail ? t("ckEmail") : t("ckEmailNo"));

  var hasPhone = /(\+?\d[\d\s().-]{7,})/.test(c.header);
  add(hasPhone ? "ok" : "warn", hasPhone ? t("ckPhone") : t("ckPhoneNo"));

  add(s.pages <= 2 ? "ok" : "warn",
      s.pages <= 2 ? t("ckPages") : t("ckPagesLong"),
      s.pages + " " + t("pages"));

  var minMargin = Math.min(d.marginTop, d.marginRight, d.marginBottom, d.marginLeft);
  add(minMargin >= 12 ? "ok" : "warn",
      minMargin >= 12 ? t("ckMargins") : t("ckMarginsNo"),
      minMargin + " mm");

  add(d.fontSize >= 10 ? "ok" : "warn",
      d.fontSize >= 10 ? t("ckFontSize") : t("ckFontSizeNo"),
      d.fontSize + " px");

  var atsFont = D.ATS_FONTS.test(d.fontFamily);
  add(atsFont ? "ok" : "warn", atsFont ? t("ckAtsFont") : t("ckAtsFontNo"));

  add(d.twoCol ? "warn" : "ok", d.twoCol ? t("ckTwoCol") : t("ckOneCol"));

  var photo = d.photoShow && st.header.photo;
  add(photo ? "warn" : "ok", photo ? t("ckPhotoOn") : t("ckPhotoOff"));

  var longOnes = c.bullets.filter(function (b) { return b.length > 240; }).length;
  add(longOnes ? "warn" : "ok",
      longOnes ? t("ckBulletsLong") : t("ckBulletsOk"),
      longOnes ? longOnes + "" : "");

  if (c.bullets.length) {
    var withNum = c.bullets.filter(function (b) { return /\d/.test(b); }).length;
    var ratio = withNum / c.bullets.length;
    add(ratio >= 0.3 ? "ok" : "warn",
        ratio >= 0.3 ? t("ckNumbers") : t("ckNumbersNo"),
        Math.round(ratio * 100) + "%");

    var weak = c.bullets.filter(function (b) { return WEAK.test(b.trim()); }).length;
    add(weak ? "warn" : "ok", weak ? t("ckVerbsNo") : t("ckVerbs"), weak ? weak + "" : "");
  }

  var noDate = c.entries.filter(function (e) { return !/\d{4}|\d{1,2}\/\d{2}/.test(e.dates); }).length;
  if (c.entries.length) {
    add(noDate ? "warn" : "ok", noDate ? t("ckDatesNo") : t("ckDates"), noDate ? noDate + "" : "");
  }

  var empties = countEmpty(st);
  add(empties ? "warn" : "ok", empties ? t("ckEmptyNo") : t("ckEmpty"), empties ? empties + "" : "");

  add(s.fill >= 55 || s.pages === 1 ? "ok" : "warn",
      s.fill >= 55 || s.pages === 1 ? t("ckFill") : t("ckFillNo"),
      s.fill + "%");

  return { stats: s, list: out };
}

function countEmpty(st) {
  var n = 0;
  st.sections.forEach(function (sec) {
    if (!sec.visible) return;
    (sec.items || []).forEach(function (it) {
      if (sec.type === "entries") {
        if (U.isEmptyHTML(it.left) && U.isEmptyHTML(it.right) &&
            U.isEmptyHTML(it.text) && !(it.bullets || []).length) n++;
        (it.subs || []).forEach(function (s) {
          if (U.isEmptyHTML(s.left) && U.isEmptyHTML(s.right)) n++;
        });
        (it.bullets || []).forEach(function (b) { if (U.isEmptyHTML(b)) n++; });
      } else if (sec.type === "rows") {
        if (U.isEmptyHTML(it.label) && U.isEmptyHTML(it.content)) n++;
      } else if (sec.type === "bars") {
        if (U.isEmptyHTML(it.label)) n++;
      } else if (U.isEmptyHTML(it.text)) n++;
    });
  });
  return n;
}

/* ---------- 4. Comparación con una oferta ------------------ */

var STOP = ("de la que el en y a los del se las por un para con no una su al lo como mas pero " +
  "sus le ya o este si porque esta entre cuando muy sin sobre tambien me hasta hay donde quien " +
  "desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto mi antes algunos " +
  "que unos yo otro otras otra el tanto esa estos mucho quienes nada muchos cual sea poco ella " +
  "estar haber estas estaba estamos algunas algo nosotros " +
  "the of and to in a is that for it with as was on are be this by from or an at we you your " +
  "have has will can not but they their our all more which about would should could may our us " +
  "who what when where how any into out up down over under than then them these those there here " +
  "role team work working experience years year ability strong good great new including etc via " +
  "looking required require requires must need needs needed join help build using use want wants " +
  "seeking candidate candidates ideal bonus nice preferred familiar knowledge skills skill " +
  "understanding proficiency environment company position job opportunity opportunities benefits " +
  "salary apply please send resume across able within also make making take taking get well " +
  "buscamos requiere requisitos deseable puesto empresa vacante ofrecemos funciones perfil " +
  "conocimientos experiencia habilidades capacidad trabajo equipo interesados enviar curriculum").split(" ");
var STOPSET = {};
STOP.forEach(function (w) { STOPSET[w] = 1; });

function tokens(text) {
  return (String(text).toLowerCase().match(/[\p{L}][\p{L}\p{N}+#.\-']{1,}/gu) || [])
    .map(function (w) { return w.replace(/^[.\-']+|[.\-']+$/g, ""); })
    .filter(function (w) { return w.length > 2 && !STOPSET[w] && !/^\d+$/.test(w); });
}

function match(st, jobText) {
  var cv = collect(st).text.toLowerCase();
  var cvSet = {};
  tokens(cv).forEach(function (w) { cvSet[w] = 1; });

  var freq = {};
  tokens(jobText).forEach(function (w) { freq[w] = (freq[w] || 0) + 1; });

  var terms = Object.keys(freq).sort(function (a, b) {
    return freq[b] - freq[a] || a.localeCompare(b);
  }).slice(0, 45);

  var present = [], missing = [];
  terms.forEach(function (w) {
    var hit = cvSet[w] || cv.indexOf(w) > -1 ||
      (w.length > 4 && cv.indexOf(w.slice(0, w.length - 1)) > -1);
    (hit ? present : missing).push({ term: w, n: freq[w] });
  });

  var score = terms.length ? Math.round(present.length / terms.length * 100) : 0;
  return { score: score, present: present, missing: missing, total: terms.length };
}

CVF.review = { stats: stats, checks: checks, match: match, collect: collect };

})();
