/* ============================================================
   CV Forge — diseñador de CV en formato Harvard
   Sin dependencias. Todo corre en el navegador.
   ============================================================ */
(function () {
"use strict";

/* ---------- 1. Constantes ---------------------------------- */

var STORE_KEY = "cvforge.v1";
var PAGE_MM = { letter: { w: 215.9, h: 279.4 }, a4: { w: 210, h: 297 } };
var MM_PX = 96 / 25.4;

var FONTS = [
  ['"Times New Roman", Times, serif', "Times New Roman"],
  ["Georgia, \"Times New Roman\", serif", "Georgia"],
  ['"EB Garamond", Garamond, serif', "EB Garamond"],
  ['"Source Serif 4", Georgia, serif', "Source Serif 4"],
  ["Merriweather, Georgia, serif", "Merriweather"],
  ["Cambria, Georgia, serif", "Cambria"],
  ["Arial, Helvetica, sans-serif", "Arial"],
  ['"Helvetica Neue", Helvetica, Arial, sans-serif', "Helvetica"],
  ['Calibri, "Segoe UI", sans-serif', "Calibri"],
  ['Lato, "Segoe UI", sans-serif', "Lato"],
  ["Inter, system-ui, sans-serif", "Inter"],
  ['"IBM Plex Sans", system-ui, sans-serif', "IBM Plex Sans"],
  ["Verdana, Geneva, sans-serif", "Verdana"],
  ['"Trebuchet MS", Tahoma, sans-serif', "Trebuchet MS"]
];

var DEFAULT_DESIGN = {
  pageSize: "letter",
  marginTop: 10, marginRight: 13, marginBottom: 12, marginLeft: 13,
  pageBg: "#ffffff", textColor: "#000000", ruleColor: "#000000",
  avoidBreak: true, showGuides: true,

  fontFamily: FONTS[0][0],
  fontSize: 11.5, lineHeight: 1.4, letterSpacing: 0, textAlign: "left",

  headerAlign: "center", nameSize: 22, nameWeight: 700,
  nameCase: "uppercase", nameSpacing: 0.05, nameColor: "#000000",
  contactSize: 11, contactSep: " | ", headerGap: 10, headerRule: false,

  titleSize: 11.5, titleWeight: 700, titleCase: "uppercase",
  titleSpacing: 0.04, titleColor: "#000000", titleAlign: "left",
  ruleWidth: 1, ruleStyle: "solid", ruleGap: 2, titleGap: 8,

  sectionGap: 14, itemGap: 10, bulletGap: 2,
  bulletChar: "disc", bulletIndent: 20, labelWidth: 150,
  dateStyle: "normal", dateWeight: "inherit",
  subStyle: "italic", subWeight: "400"
};

var PRESETS = [
  ["Harvard clásico", "Times · reglas sólidas", {
    fontFamily: FONTS[0][0], fontSize: 11.5, lineHeight: 1.4, titleCase: "uppercase",
    titleAlign: "left", ruleWidth: 1, ruleStyle: "solid", headerAlign: "center",
    nameSize: 22, nameCase: "uppercase", nameSpacing: 0.05, bulletChar: "disc",
    textColor: "#000000", titleColor: "#000000", ruleColor: "#000000", nameColor: "#000000"
  }],
  ["Serif moderno", "EB Garamond · aire", {
    fontFamily: FONTS[2][0], fontSize: 12.5, lineHeight: 1.45, titleCase: "uppercase",
    titleSpacing: 0.12, titleSize: 11, ruleWidth: 1, ruleStyle: "solid", ruleGap: 3,
    headerAlign: "center", nameSize: 25, nameCase: "none", nameSpacing: 0.01,
    nameWeight: 400, sectionGap: 16, bulletChar: '"– "'
  }],
  ["Sans limpio", "Lato · sin reglas", {
    fontFamily: FONTS[9][0], fontSize: 11, lineHeight: 1.45, titleCase: "uppercase",
    titleSpacing: 0.14, titleSize: 10.5, ruleWidth: 0, ruleStyle: "none",
    headerAlign: "left", nameSize: 24, nameCase: "none", nameWeight: 700,
    nameSpacing: -0.01, sectionGap: 15, bulletChar: '"– "', bulletIndent: 14
  }],
  ["Compacto", "cabe más en una hoja", {
    fontSize: 10.5, lineHeight: 1.28, sectionGap: 9, itemGap: 6, bulletGap: 1,
    titleGap: 5, headerGap: 7, nameSize: 19, marginTop: 9, marginBottom: 9,
    marginLeft: 12, marginRight: 12
  }],
  ["Editorial", "títulos centrados", {
    fontFamily: FONTS[3][0], fontSize: 11.5, titleAlign: "center", titleCase: "uppercase",
    titleSpacing: 0.18, titleSize: 10.5, ruleWidth: 1, ruleStyle: "solid",
    headerAlign: "center", nameSize: 26, nameCase: "none", nameWeight: 600,
    headerRule: true, sectionGap: 15
  }],
  ["Técnico / ATS", "Arial · máxima lectura", {
    fontFamily: FONTS[6][0], fontSize: 11, lineHeight: 1.35, titleCase: "uppercase",
    titleSpacing: 0.03, ruleWidth: 1, ruleStyle: "solid", headerAlign: "left",
    nameSize: 20, nameCase: "uppercase", nameSpacing: 0.02, bulletChar: "disc",
    textAlign: "left", titleColor: "#000000", textColor: "#000000"
  }]
];

/* ---------- 2. Datos de ejemplo y plantilla vacía ---------- */

function EXAMPLE() {
  return {
    v: 1,
    design: copy(DEFAULT_DESIGN),
    header: {
      name: "Angel Martín Chegue Rivera",
      contacts: [
        "achegue05@gmail.com",
        "+52 833 128 20 35",
        "linkedin.com/in/angel-martin-c-24068b239/",
        "Ciudad Madero, México"
      ],
      tagline: "Willing to relocate"
    },
    sections: [
      { id: uid(), type: "entries", title: "Education", visible: true, rule: true, columns: 1, items: [
        { left: "Universidad Tecnológica de Altamira", right: "Altamira, Tamaulipas, México",
          subs: [
            { left: "B.S. in Mechatronics Engineering", right: "Expected August 2028" },
            { left: "Associate's Degree in Automation", right: "Expected December 2026" }
          ], text: "", bullets: [] },
        { left: "Centro de Bachillerato Tecnológico Industrial y de Servicios No.164", right: "Ciudad Madero, México",
          subs: [{ left: "Programming Technician", right: "2021 — 2024" }], text: "", bullets: [] }
      ]},
      { id: uid(), type: "entries", title: "Professional Experience", visible: true, rule: true, columns: 1, items: [
        { left: "CBTis 164", right: "Feb 2026 — May 2026",
          subs: [{ left: "Substitute Technical Teacher", right: "Ciudad Madero, México" }],
          text: "", bullets: [
            "Delivered programming courses and lab sessions covering non-relational databases, computer maintenance, and hardware best practices to technical high school students.",
            "Translated complex algorithmic and data-modeling concepts into structured, hands-on lessons tailored to beginner-level learners.",
            "Managed classroom dynamics and individual mentoring across concurrent student groups, strengthening communication precision and technical leadership."
          ]},
        { left: "ServiSC", right: "Jul 2024 — Dec 2025",
          subs: [{ left: "PHP Developer", right: "Ciudad Madero, México (Remote)" }],
          text: "", bullets: [
            "Designed and implemented optimized algorithmic modules, applying OOP principles (encapsulation, inheritance, polymorphism) to build high-efficiency, modular architectures.",
            "Architected normalized relational database schemas in MySQL, optimizing data-query execution times through indexing, JOIN strategies, and stored procedures to handle concurrent data processing.",
            "Enforced strict data integrity via foreign key constraints and input validation parameters, minimizing computational overhead and eliminating security vulnerabilities across data-access layers.",
            "Delivered end-to-end data processing solutions, from schema modeling to system integration, significantly reducing latency and operational runtimes."
          ]}
      ]},
      { id: uid(), type: "entries", title: "Engineering Projects & Achievements", visible: true, rule: true, columns: 1, items: [
        { left: "IEEE EDS Seasonal Summer School | CINVESTAV CDMX", right: "*Semiconductors · IC Design*",
          subs: [{ left: "Participant – Integrated Circuits (IC) Design Track", right: "July 2026" }],
          text: "", bullets: [
            "Took classes among specialized engineering students for intensive training in custom IC design flows (RTL-to-GDSII) using Synopsys EDA.",
            "Gained foundational exposure to semiconductor mechanics, functional circuit simulation, and modern verification methodologies.",
            "Collaborated with academic researchers and industry experts driving national microelectronics and chip manufacturing initiatives."
          ]},
        { left: "Custom ESP32 PCB Design", right: "*PCB Design · Microcontrollers*", subs: [],
          text: "Currently working on a custom ESP32-WROOM-32 PCB with integrated BME680 and HSC sensors, optimizing power distribution and signal integrity for real-time data acquisition.",
          bullets: [] }
      ]},
      { id: uid(), type: "rows", title: "Skills", visible: true, rule: true, columns: 1, items: [
        { label: "Languages:", content: "Spanish (Native) · English (C1) · French (B1)" },
        { label: "Programming Languages:", content: "Verilog, SystemVerilog, C++, Python, PHP, SQL, VHDL (Basic)" },
        { label: "Soft Skills:", content: "Technical Leadership, Analytical Problem Solving, Cross-functional Collaboration, Effective Communication, Continuous Learning" },
        { label: "Hardware Skills:", content: "PCB Layout & Prototyping, Embedded Systems Architecture, Digital Logic Design, FPGA Emulation, Electronic Instrumentation, Circuit Troubleshooting" },
        { label: "Software Skills:", content: "Linux, LTSpice, MATLAB/Simulink, Altium Designer, Quartus Prime, AutoCAD, GitHub, Synopsys Design Compiler (Basic), Synopsys IC Compiler II (Basic)" }
      ]},
      { id: uid(), type: "list", title: "Certifications", visible: true, rule: true, columns: 1, marked: false, items: [
        { text: "**Duolingo English Test (C1)** — Duolingo (2026)" },
        { text: "**Basic PCB Design** — Altium Education (2025)" },
        { text: "**EFSI01-002: English for the Semiconductor Industry** — TecNM (2024)" },
        { text: "**iTEP Certificate of Proficiency (CEFR B2)** — iTEP International (2024)" }
      ]}
    ]
  };
}

function BLANK() {
  return {
    v: 1,
    design: copy(DEFAULT_DESIGN),
    header: { name: "Tu Nombre Completo", contacts: ["correo@ejemplo.com", "+52 000 000 0000", "Ciudad, País"], tagline: "" },
    sections: [
      { id: uid(), type: "entries", title: "Educación", visible: true, rule: true, columns: 1,
        items: [newItem("entries")] },
      { id: uid(), type: "entries", title: "Experiencia Profesional", visible: true, rule: true, columns: 1,
        items: [newItem("entries")] },
      { id: uid(), type: "rows", title: "Habilidades", visible: true, rule: true, columns: 1,
        items: [{ label: "Idiomas:", content: "" }, { label: "Software:", content: "" }] }
    ]
  };
}

/* ---------- 3. Utilidades ---------------------------------- */

function $(s, r) { return (r || document).querySelector(s); }
function copy(o) { return JSON.parse(JSON.stringify(o)); }
function uid() { return "s" + Math.random().toString(36).slice(2, 9); }
function r1(n) { return Math.round(n * 10) / 10; }
function r2(n) { return Math.round(n * 100) / 100; }
function esc(s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmt(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
function attr(s) { return esc(s).replace(/"/g, "&quot;"); }
function lines(s) { return String(s || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean); }

function newItem(type) {
  if (type === "rows") return { label: "Etiqueta:", content: "" };
  if (type === "list") return { text: "" };
  if (type === "text") return { text: "" };
  return { left: "", right: "", subs: [{ left: "", right: "" }], text: "", bullets: [] };
}

var toastTimer;
function toast(msg, isErr) {
  var t = $("#toast");
  t.textContent = msg;
  t.className = "toast" + (isErr ? " err" : "");
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
}

function download(name, text, mime) {
  var b = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
}

/* ---------- 4. Estado -------------------------------------- */

var state = null;
var ui = { collapsed: {}, groups: {}, zoom: 1, autoZoom: true };
var cvRoot, scaler, saveTimer;

function load() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      var d = JSON.parse(raw);
      if (d && d.sections) return migrate(d);
    }
  } catch (e) {}
  return EXAMPLE();
}
function migrate(d) {
  d.design = Object.assign({}, DEFAULT_DESIGN, d.design || {});
  d.header = Object.assign({ name: "", contacts: [], tagline: "" }, d.header || {});
  (d.sections || []).forEach(function (s) {
    if (!s.id) s.id = uid();
    if (s.visible === undefined) s.visible = true;
    if (s.rule === undefined) s.rule = true;
    if (!s.columns) s.columns = 1;
    if (!Array.isArray(s.items)) s.items = [];
    if (s.type === "entries") s.items.forEach(function (it) {
      if (!Array.isArray(it.subs)) it.subs = [];
      if (!Array.isArray(it.bullets)) it.bullets = [];
    });
  });
  return d;
}
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }, 350);
}

/* ---------- 5. Render del documento ------------------------ */

function renderCV() {
  var h = state.header, out = "";

  if (state.design.showGuides) out += '<div class="cv-guides"></div>';

  var contacts = (h.contacts || []).filter(Boolean).map(fmt).join(esc(state.design.contactSep));
  out += '<header class="cv-header">';
  out += '<h1 class="cv-name">' + (fmt(h.name) || '<span class="cv-empty">Tu nombre</span>') + "</h1>";
  if (contacts) out += '<p class="cv-contact">' + contacts + "</p>";
  if (h.tagline) out += '<p class="cv-tagline">' + fmt(h.tagline) + "</p>";
  if (state.design.headerRule) out += '<hr class="cv-header-rule">';
  out += "</header>";

  state.sections.forEach(function (sec) {
    if (!sec.visible) return;
    out += '<section class="cv-section' + (sec.rule ? "" : " no-rule") + '">';
    out += '<h2 class="cv-section-title">' + esc(sec.title) + "</h2>";
    out += '<div class="' + (sec.columns === 2 ? "cols-2" : "") + '">';

    if (sec.type === "entries") {
      sec.items.forEach(function (it) {
        out += '<div class="cv-item">';
        if (it.left || it.right) {
          out += '<div class="cv-row cv-row-main"><span>' + fmt(it.left) +
                 '</span><span class="cv-side">' + fmt(it.right) + "</span></div>";
        }
        (it.subs || []).forEach(function (s) {
          if (!s.left && !s.right) return;
          out += '<div class="cv-row cv-row-sub"><span>' + fmt(s.left) +
                 '</span><span class="cv-side">' + fmt(s.right) + "</span></div>";
        });
        if (it.text) out += '<p class="cv-text">' + fmt(it.text) + "</p>";
        var bl = (it.bullets || []).filter(Boolean);
        if (bl.length) {
          out += '<ul class="cv-bullets">' + bl.map(function (b) {
            return "<li>" + fmt(b) + "</li>";
          }).join("") + "</ul>";
        }
        out += "</div>";
      });
    } else if (sec.type === "rows") {
      sec.items.forEach(function (it) {
        out += '<div class="cv-info"><div class="cv-info-label">' + fmt(it.label) +
               '</div><div class="cv-info-content">' + fmt(it.content) + "</div></div>";
      });
    } else if (sec.type === "list") {
      out += '<ul class="cv-list' + (sec.marked ? " marked" : "") + '">' +
        sec.items.map(function (it) { return "<li>" + fmt(it.text) + "</li>"; }).join("") + "</ul>";
    } else if (sec.type === "text") {
      sec.items.forEach(function (it) {
        out += '<p class="cv-text">' + fmt(it.text).replace(/\n/g, "<br>") + "</p>";
      });
    }

    out += "</div></section>";
  });

  cvRoot.innerHTML = out;
  cvRoot.className = "cv" + (state.design.avoidBreak ? " avoid-break" : "");
  updatePageCount();
}

/* ---------- 6. Aplicar diseño ------------------------------ */

function applyDesign() {
  var d = state.design, p = PAGE_MM[d.pageSize] || PAGE_MM.letter, st = cvRoot.style;
  function v(k, val) { st.setProperty(k, val); }

  v("--page-w", p.w + "mm");
  v("--page-h", p.h + "mm");
  v("--mt", d.marginTop + "mm"); v("--mr", d.marginRight + "mm");
  v("--mb", d.marginBottom + "mm"); v("--ml", d.marginLeft + "mm");
  v("--page-bg", d.pageBg); v("--text", d.textColor); v("--rule", d.ruleColor);

  v("--font", d.fontFamily);
  v("--fs", d.fontSize + "px");
  v("--lh", d.lineHeight);
  v("--ls", d.letterSpacing + "em");
  v("--text-align", d.textAlign);

  v("--header-align", d.headerAlign);
  v("--name-size", d.nameSize + "px");
  v("--name-weight", d.nameWeight);
  v("--name-case", d.nameCase);
  v("--name-ls", d.nameSpacing + "em");
  v("--name-color", d.nameColor);
  v("--contact-size", d.contactSize + "px");
  v("--header-gap", d.headerGap + "px");

  v("--title-size", d.titleSize + "px");
  v("--title-weight", d.titleWeight);
  v("--title-case", d.titleCase);
  v("--title-ls", d.titleSpacing + "em");
  v("--title-color", d.titleColor);
  v("--title-align", d.titleAlign);
  v("--rule-w", d.ruleWidth + "px");
  v("--rule-style", d.ruleWidth > 0 ? d.ruleStyle : "none");
  v("--rule-gap", d.ruleGap + "px");
  v("--title-mb", d.titleGap + "px");

  v("--section-gap", d.sectionGap + "px");
  v("--item-gap", d.itemGap + "px");
  v("--bullet-gap", d.bulletGap + "px");
  v("--bullet-char", d.bulletChar);
  v("--bullet-indent", d.bulletIndent + "px");
  v("--label-w", d.labelWidth + "px");
  v("--date-style", d.dateStyle);
  v("--date-weight", d.dateWeight);
  v("--sub-style", d.subStyle);
  v("--sub-weight", d.subWeight);

  $("#dynamic-print-style").textContent =
    "@page{ size:" + d.pageSize + "; margin:" + d.marginTop + "mm " + d.marginRight +
    "mm " + d.marginBottom + "mm " + d.marginLeft + "mm; }";

  cvRoot.className = "cv" + (d.avoidBreak ? " avoid-break" : "");
  if (ui.autoZoom) fitZoom(); else applyZoom();
  updatePageCount();
}

function pageHeightPx() { return (PAGE_MM[state.design.pageSize] || PAGE_MM.letter).h * MM_PX; }

function updatePageCount() {
  var n = Math.max(1, Math.ceil((cvRoot.scrollHeight - 4) / pageHeightPx()));
  $("#page-count").textContent = n + (n === 1 ? " página" : " páginas");
}

/* ---------- 7. Zoom ---------------------------------------- */

function applyZoom() {
  scaler.style.transform = "scale(" + ui.zoom + ")";
  var w = cvRoot.offsetWidth * ui.zoom, h = cvRoot.offsetHeight * ui.zoom;
  scaler.style.width = w + "px";
  scaler.style.height = h + "px";
  $("#zoom-value").textContent = Math.round(ui.zoom * 100) + "%";
}
function fitZoom() {
  var avail = $("#stage-scroll").clientWidth - 46;
  var natural = cvRoot.offsetWidth || 1;
  ui.zoom = Math.min(1.4, Math.max(0.25, avail / natural));
  applyZoom();
}
function setZoom(z) { ui.autoZoom = false; ui.zoom = Math.min(2, Math.max(0.25, z)); applyZoom(); }

/* ---------- 8. Panel: contenido ---------------------------- */

var TYPE_LABEL = { entries: "entradas", rows: "filas", list: "lista", text: "texto" };

function renderContentPane() {
  var h = state.header;
  var out = "";

  out += '<details class="group" ' + (ui.groups.head === false ? "" : "open") + ' data-g="head"><summary>Encabezado</summary><div class="group-body">' +
    field("Nombre completo", '<input type="text" data-p="header.name" value="' + attr(h.name) + '">') +
    field("Datos de contacto (uno por línea)",
      '<textarea data-p="header.contacts" data-list="1" rows="4">' + esc((h.contacts || []).join("\n")) + "</textarea>") +
    field("Línea extra bajo el contacto",
      '<input type="text" data-p="header.tagline" value="' + attr(h.tagline) + '" placeholder="Ej. Disponible para reubicación">') +
    '<p class="hint">En cualquier campo puedes usar **negrita** y *cursiva*.</p>' +
    "</div></details>";

  out += '<p class="eyebrow">Secciones</p>';

  state.sections.forEach(function (sec, si) {
    var collapsed = ui.collapsed[sec.id];
    out += '<div class="ed-section' + (sec.visible ? "" : " is-hidden") + '" data-si="' + si + '">';
    out += '<div class="ed-sec-head">' +
      '<button class="icon-btn" data-a="collapse" data-si="' + si + '" title="Plegar">' + (collapsed ? "▸" : "▾") + "</button>" +
      '<input type="text" data-p="sections.' + si + '.title" value="' + attr(sec.title) + '">' +
      '<span class="ed-tools">' +
        '<button class="icon-btn" data-a="move-sec" data-si="' + si + '" data-dir="-1" title="Subir">↑</button>' +
        '<button class="icon-btn" data-a="move-sec" data-si="' + si + '" data-dir="1" title="Bajar">↓</button>' +
        '<button class="icon-btn" data-a="dup-sec" data-si="' + si + '" title="Duplicar">⧉</button>' +
        '<button class="icon-btn" data-a="hide-sec" data-si="' + si + '" title="Mostrar u ocultar">' + (sec.visible ? "◉" : "◌") + "</button>" +
        '<button class="icon-btn danger" data-a="del-sec" data-si="' + si + '" title="Eliminar">✕</button>' +
      "</span></div>";

    out += '<div class="ed-sec-body"' + (collapsed ? ' style="display:none"' : "") + ">";
    out += '<div class="row-2" style="margin-bottom:10px">' +
      field("Línea bajo el título", checkbox("sections." + si + ".rule", sec.rule, "Mostrar")) +
      field("Columnas", select("sections." + si + ".columns", [[1, "Una"], [2, "Dos"]], sec.columns, true)) +
      "</div>";
    if (sec.type === "list") {
      out += field("Viñetas", checkbox("sections." + si + ".marked", !!sec.marked, "Mostrar viñeta"));
    }

    sec.items.forEach(function (it, ii) {
      out += '<div class="ed-item">';
      out += '<div class="ed-item-head"><span class="ed-item-num">' + TYPE_LABEL[sec.type] + " " + (ii + 1) + "</span>" +
        '<span class="ed-tools">' +
          '<button class="icon-btn" data-a="move-item" data-si="' + si + '" data-ii="' + ii + '" data-dir="-1">↑</button>' +
          '<button class="icon-btn" data-a="move-item" data-si="' + si + '" data-ii="' + ii + '" data-dir="1">↓</button>' +
          '<button class="icon-btn" data-a="dup-item" data-si="' + si + '" data-ii="' + ii + '">⧉</button>' +
          '<button class="icon-btn danger" data-a="del-item" data-si="' + si + '" data-ii="' + ii + '">✕</button>' +
        "</span></div>";

      var base = "sections." + si + ".items." + ii + ".";

      if (sec.type === "entries") {
        out += '<div class="row-2">' +
          field("Título (izquierda)", '<input type="text" data-p="' + base + 'left" value="' + attr(it.left) + '" placeholder="Empresa o institución">') +
          field("Derecha", '<input type="text" data-p="' + base + 'right" value="' + attr(it.right) + '" placeholder="Fecha o lugar">') +
          "</div>";

        out += '<div class="field"><div class="field-head"><span>Subtítulos</span></div>';
        (it.subs || []).forEach(function (s, k) {
          out += '<div class="sub-row">' +
            '<input type="text" data-p="' + base + "subs." + k + '.left" value="' + attr(s.left) + '" placeholder="Puesto o grado">' +
            '<input type="text" data-p="' + base + "subs." + k + '.right" value="' + attr(s.right) + '" placeholder="Fecha o lugar">' +
            '<button class="icon-btn danger" data-a="del-sub" data-si="' + si + '" data-ii="' + ii + '" data-ki="' + k + '">✕</button>' +
            "</div>";
        });
        out += '<button class="btn-ghost neutral" data-a="add-sub" data-si="' + si + '" data-ii="' + ii + '">+ subtítulo</button></div>';

        out += field("Descripción (párrafo, opcional)",
          '<textarea data-p="' + base + 'text" rows="2">' + esc(it.text) + "</textarea>");
        out += field("Viñetas (una por línea)",
          '<textarea data-p="' + base + 'bullets" data-list="1" rows="4">' + esc((it.bullets || []).join("\n")) + "</textarea>");

      } else if (sec.type === "rows") {
        out += field("Etiqueta", '<input type="text" data-p="' + base + 'label" value="' + attr(it.label) + '">');
        out += field("Contenido", '<textarea data-p="' + base + 'content" rows="2">' + esc(it.content) + "</textarea>");
      } else {
        out += field("Texto", '<textarea data-p="' + base + 'text" rows="2">' + esc(it.text) + "</textarea>");
      }
      out += "</div>";
    });

    out += '<div class="add-row"><button class="btn-ghost" data-a="add-item" data-si="' + si + '">+ ' + TYPE_LABEL[sec.type] + "</button></div>";
    out += "</div></div>";
  });

  out += '<p class="eyebrow" style="margin-top:14px">Añadir sección</p><div class="add-row">' +
    '<button class="btn-ghost" data-a="add-sec" data-type="entries">Entradas</button>' +
    '<button class="btn-ghost" data-a="add-sec" data-type="rows">Filas etiqueta/valor</button>' +
    '<button class="btn-ghost" data-a="add-sec" data-type="list">Lista</button>' +
    '<button class="btn-ghost" data-a="add-sec" data-type="text">Párrafo</button></div>' +
    '<p class="hint">Entradas: experiencia, educación, proyectos. Filas: habilidades e idiomas. Lista: certificaciones o publicaciones. Párrafo: perfil o resumen.</p>';

  $("#pane-content").innerHTML = out;
}

function field(label, control) {
  return '<div class="field"><div class="field-head"><span>' + label + "</span></div>" + control + "</div>";
}
function checkbox(path, val, label) {
  return '<label class="check"><input type="checkbox" data-p="' + path + '"' + (val ? " checked" : "") + "><span>" + label + "</span></label>";
}
function select(path, opts, val, num) {
  return '<select data-p="' + path + '"' + (num ? ' data-num="1"' : "") + ">" + opts.map(function (o) {
    return '<option value="' + attr(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
  }).join("") + "</select>";
}

/* ---------- 9. Panel: diseño ------------------------------- */

var DESIGN_GROUPS = [
  ["Presets", "presets", []],
  ["Página y márgenes", "page", [
    ["pageSize", "select", "Tamaño de hoja", [["letter", "Carta (US Letter)"], ["a4", "A4"]]],
    ["marginTop", "range", "Margen superior", 5, 40, 0.5, "mm"],
    ["marginBottom", "range", "Margen inferior", 5, 40, 0.5, "mm"],
    ["marginLeft", "range", "Margen izquierdo", 5, 40, 0.5, "mm"],
    ["marginRight", "range", "Margen derecho", 5, 40, 0.5, "mm"],
    ["avoidBreak", "check", "Evitar partir una entrada entre páginas"],
    ["showGuides", "check", "Mostrar guía de corte de página"]
  ]],
  ["Tipografía", "type", [
    ["fontFamily", "select", "Tipografía", FONTS],
    ["fontSize", "range", "Tamaño de texto", 8, 16, 0.1, "px"],
    ["lineHeight", "range", "Interlineado", 1, 2, 0.01, ""],
    ["letterSpacing", "range", "Espaciado entre letras", -0.02, 0.1, 0.005, "em"],
    ["textAlign", "select", "Alineación del texto", [["left", "Izquierda"], ["justify", "Justificado"]]],
    ["textColor", "color", "Color del texto"],
    ["pageBg", "color", "Color de fondo"]
  ]],
  ["Encabezado", "header", [
    ["headerAlign", "select", "Alineación", [["center", "Centrado"], ["left", "Izquierda"], ["right", "Derecha"]]],
    ["nameSize", "range", "Tamaño del nombre", 14, 42, 0.5, "px"],
    ["nameWeight", "select", "Grosor del nombre", [[400, "Normal"], [600, "Semibold"], [700, "Negrita"]]],
    ["nameCase", "select", "Mayúsculas", [["uppercase", "TODO MAYÚSCULAS"], ["none", "Como se escribe"], ["capitalize", "Cada Palabra"]]],
    ["nameSpacing", "range", "Espaciado del nombre", -0.03, 0.3, 0.005, "em"],
    ["nameColor", "color", "Color del nombre"],
    ["contactSize", "range", "Tamaño del contacto", 7, 16, 0.25, "px"],
    ["contactSep", "text", "Separador de contacto"],
    ["headerGap", "range", "Espacio bajo el encabezado", 0, 40, 1, "px"],
    ["headerRule", "check", "Línea bajo el encabezado"]
  ]],
  ["Títulos de sección", "titles", [
    ["titleSize", "range", "Tamaño", 8, 20, 0.25, "px"],
    ["titleWeight", "select", "Grosor", [[400, "Normal"], [600, "Semibold"], [700, "Negrita"]]],
    ["titleCase", "select", "Mayúsculas", [["uppercase", "TODO MAYÚSCULAS"], ["none", "Como se escribe"], ["capitalize", "Cada Palabra"]]],
    ["titleSpacing", "range", "Espaciado entre letras", 0, 0.3, 0.005, "em"],
    ["titleAlign", "select", "Alineación", [["left", "Izquierda"], ["center", "Centrado"]]],
    ["titleColor", "color", "Color"],
    ["ruleColor", "color", "Color de la línea"],
    ["ruleWidth", "range", "Grosor de la línea", 0, 4, 0.5, "px"],
    ["ruleStyle", "select", "Estilo de línea", [["solid", "Sólida"], ["double", "Doble"], ["dashed", "Guiones"], ["dotted", "Puntos"]]],
    ["ruleGap", "range", "Espacio título → línea", 0, 12, 0.5, "px"],
    ["titleGap", "range", "Espacio línea → contenido", 0, 24, 1, "px"]
  ]],
  ["Espaciado y viñetas", "space", [
    ["sectionGap", "range", "Entre secciones", 0, 40, 0.5, "px"],
    ["itemGap", "range", "Entre entradas", 0, 30, 0.5, "px"],
    ["bulletGap", "range", "Entre viñetas", 0, 12, 0.5, "px"],
    ["bulletChar", "select", "Viñeta", [["disc", "● Punto"], ["circle", "○ Círculo"], ["square", "■ Cuadro"], ['"– "', "– Guion"], ['"— "', "— Raya"], ['"▪ "', "▪ Cuadro pequeño"], ["none", "Sin viñeta"]]],
    ["bulletIndent", "range", "Sangría de viñetas", 0, 40, 1, "px"],
    ["labelWidth", "range", "Ancho de etiquetas (filas)", 60, 260, 2, "px"]
  ]],
  ["Detalles de entrada", "items", [
    ["dateStyle", "select", "Estilo de la columna derecha", [["normal", "Normal"], ["italic", "Cursiva"]]],
    ["dateWeight", "select", "Grosor de la columna derecha", [["inherit", "Igual que la fila"], ["400", "Normal"], ["700", "Negrita"]]],
    ["subStyle", "select", "Estilo del subtítulo", [["italic", "Cursiva"], ["normal", "Normal"]]],
    ["subWeight", "select", "Grosor del subtítulo", [["400", "Normal"], ["600", "Semibold"], ["700", "Negrita"]]]
  ]]
];

function renderDesignPane() {
  var d = state.design, out = "";

  out += '<div class="group" style="padding:12px">' +
    '<p class="eyebrow">Ajuste automático</p>' +
    '<button class="btn-ghost" data-a="fit-page" style="width:100%">Ajustar a 1 página</button>' +
    '<p class="hint">Reduce tipografía y espaciados hasta que el contenido quepa en una hoja.</p>' +
    '<div class="add-row"><button class="btn-ghost neutral" data-a="reset-design">Restablecer diseño</button></div></div>';

  DESIGN_GROUPS.forEach(function (g) {
    var name = g[0], key = g[1], ctrls = g[2];
    var open = ui.groups[key] === undefined ? (key === "presets" || key === "type") : ui.groups[key];
    out += '<details class="group"' + (open ? " open" : "") + ' data-g="' + key + '"><summary>' + name + "</summary><div class=\"group-body\">";

    if (key === "presets") {
      out += '<div class="presets">' + PRESETS.map(function (p, i) {
        return '<button class="preset" data-a="preset" data-i="' + i + '">' + esc(p[0]) + "<small>" + esc(p[1]) + "</small></button>";
      }).join("") + "</div>";
    }

    ctrls.forEach(function (c) {
      var k = c[0], t = c[1], label = c[2], val = d[k];
      if (t === "range") {
        var min = c[3], max = c[4], step = c[5], unit = c[6];
        out += '<div class="field"><div class="field-head"><span>' + label +
          '</span><span class="field-val" data-val-for="' + k + '">' + val + unit + '</span></div>' +
          '<input type="range" data-d="' + k + '" data-num="1" data-unit="' + unit + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></div>';
      } else if (t === "select") {
        var isNum = typeof val === "number";
        out += field(label, '<select data-d="' + k + '"' + (isNum ? ' data-num="1"' : "") + ">" + c[3].map(function (o) {
          return '<option value="' + attr(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
        }).join("") + "</select>");
      } else if (t === "color") {
        out += field(label, '<input type="color" data-d="' + k + '" value="' + attr(val) + '">');
      } else if (t === "check") {
        out += '<div class="field"><label class="check"><input type="checkbox" data-d="' + k + '"' + (val ? " checked" : "") + "><span>" + label + "</span></label></div>";
      } else if (t === "text") {
        out += field(label, '<input type="text" data-d="' + k + '" value="' + attr(val) + '">');
      }
    });

    out += "</div></details>";
  });

  $("#pane-design").innerHTML = out;
}

function refreshDesignValues() {
  var d = state.design;
  Array.prototype.forEach.call(document.querySelectorAll("[data-d]"), function (el) {
    var k = el.getAttribute("data-d");
    if (el.type === "checkbox") el.checked = !!d[k];
    else el.value = d[k];
    var out = document.querySelector('[data-val-for="' + k + '"]');
    if (out) out.textContent = d[k] + (el.getAttribute("data-unit") || "");
  });
}

/* ---------- 10. Rutas de estado ---------------------------- */

function setPath(path, value) {
  var parts = path.split("."), o = state;
  for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
  o[parts[parts.length - 1]] = value;
}

/* ---------- 11. Eventos ------------------------------------ */

function onPanelInput(e) {
  var el = e.target;
  if (el.hasAttribute && el.hasAttribute("data-d")) {
    var k = el.getAttribute("data-d");
    var val = el.type === "checkbox" ? el.checked : el.value;
    if (el.getAttribute("data-num")) val = parseFloat(val);
    state.design[k] = val;
    var out = document.querySelector('[data-val-for="' + k + '"]');
    if (out) out.textContent = val + (el.getAttribute("data-unit") || "");
    applyDesign();
    if (k === "showGuides" || k === "contactSep" || k === "headerRule") renderCV();
    save();
    return;
  }
  if (el.hasAttribute && el.hasAttribute("data-p")) {
    var p = el.getAttribute("data-p"), v;
    if (el.type === "checkbox") v = el.checked;
    else if (el.getAttribute("data-list")) v = lines(el.value);
    else if (el.getAttribute("data-num")) v = parseFloat(el.value);
    else v = el.value;
    setPath(p, v);
    renderCV(); save();
  }
}

function onPanelClick(e) {
  var btn = e.target.closest("[data-a]");
  if (!btn) {
    var sum = e.target.closest("details.group > summary");
    if (sum) {
      var det = sum.parentNode;
      setTimeout(function () { ui.groups[det.getAttribute("data-g")] = det.open; }, 0);
    }
    return;
  }
  var a = btn.getAttribute("data-a");
  var si = parseInt(btn.getAttribute("data-si"), 10);
  var ii = parseInt(btn.getAttribute("data-ii"), 10);
  var secs = state.sections;
  var keepScroll = $(".panel-scroll").scrollTop;

  if (a === "collapse") {
    var id = secs[si].id;
    ui.collapsed[id] = !ui.collapsed[id];
  } else if (a === "move-sec") {
    var dir = parseInt(btn.getAttribute("data-dir"), 10), t = si + dir;
    if (t < 0 || t >= secs.length) return;
    secs.splice(t, 0, secs.splice(si, 1)[0]);
  } else if (a === "dup-sec") {
    var c = copy(secs[si]); c.id = uid(); c.title = c.title + " (copia)";
    secs.splice(si + 1, 0, c);
  } else if (a === "hide-sec") {
    secs[si].visible = !secs[si].visible;
  } else if (a === "del-sec") {
    if (!confirm('¿Eliminar la sección "' + secs[si].title + '"? No se puede deshacer.')) return;
    secs.splice(si, 1);
  } else if (a === "add-sec") {
    var type = btn.getAttribute("data-type");
    secs.push({ id: uid(), type: type, title: "Nueva sección", visible: true, rule: true, columns: 1, marked: false, items: [newItem(type)] });
  } else if (a === "add-item") {
    secs[si].items.push(newItem(secs[si].type));
  } else if (a === "del-item") {
    secs[si].items.splice(ii, 1);
  } else if (a === "dup-item") {
    secs[si].items.splice(ii + 1, 0, copy(secs[si].items[ii]));
  } else if (a === "move-item") {
    var d2 = parseInt(btn.getAttribute("data-dir"), 10), t2 = ii + d2, arr = secs[si].items;
    if (t2 < 0 || t2 >= arr.length) return;
    arr.splice(t2, 0, arr.splice(ii, 1)[0]);
  } else if (a === "add-sub") {
    secs[si].items[ii].subs.push({ left: "", right: "" });
  } else if (a === "del-sub") {
    secs[si].items[ii].subs.splice(parseInt(btn.getAttribute("data-ki"), 10), 1);
  } else if (a === "preset") {
    Object.assign(state.design, PRESETS[parseInt(btn.getAttribute("data-i"), 10)][2]);
    applyDesign(); renderCV(); renderDesignPane(); save();
    toast("Preset aplicado");
    return;
  } else if (a === "reset-design") {
    state.design = copy(DEFAULT_DESIGN);
    applyDesign(); renderCV(); renderDesignPane(); save();
    toast("Diseño restablecido");
    return;
  } else if (a === "fit-page") {
    fitToOnePage();
    return;
  } else {
    return;
  }

  renderContentPane();
  renderCV();
  save();
  $(".panel-scroll").scrollTop = keepScroll;
}

function fitToOnePage() {
  var target = pageHeightPx(), d = state.design, guard = 0;
  applyDesign();
  while (cvRoot.scrollHeight > target - 2 && guard++ < 200) {
    var changed = false;
    if (d.sectionGap > 4) { d.sectionGap = r1(d.sectionGap - 0.5); changed = true; }
    if (d.itemGap > 3) { d.itemGap = r1(d.itemGap - 0.5); changed = true; }
    if (d.bulletGap > 0.5) { d.bulletGap = r1(d.bulletGap - 0.5); changed = true; }
    if (d.lineHeight > 1.15) { d.lineHeight = r2(d.lineHeight - 0.02); changed = true; }
    if (d.fontSize > 9.5) { d.fontSize = r2(d.fontSize - 0.1); changed = true; }
    if (d.nameSize > 17) { d.nameSize = r1(d.nameSize - 0.5); changed = true; }
    if (d.headerGap > 5) { d.headerGap = r1(d.headerGap - 0.5); changed = true; }
    if (!changed) break;
    applyDesign();
  }
  renderDesignPane();
  save();
  if (cvRoot.scrollHeight > target) {
    toast("Sigue sin caber: recorta contenido o reduce márgenes", true);
  } else {
    toast("Listo, cabe en una página");
  }
}

/* ---------- 12. Archivos ----------------------------------- */

function fileName(ext) {
  var n = (state.header.name || "CV").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  return "CV_" + (n || "sin_nombre") + "." + ext;
}

function exportJSON() {
  download(fileName("json"), JSON.stringify(state, null, 2), "application/json");
  toast("Archivo guardado");
}

function importJSON(file) {
  var fr = new FileReader();
  fr.onload = function () {
    try {
      var d = JSON.parse(fr.result);
      if (!d || !d.sections) throw new Error("formato");
      state = migrate(d);
      ui.collapsed = {};
      renderAll(); save();
      toast("CV cargado");
    } catch (err) {
      toast("Ese archivo no es un CV de CV Forge", true);
    }
  };
  fr.readAsText(file);
}

function cvCssText() {
  try {
    var sheets = Array.prototype.slice.call(document.styleSheets);
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].href && sheets[i].href.indexOf("cv.css") > -1 && sheets[i].cssRules) {
        return Promise.resolve(Array.prototype.map.call(sheets[i].cssRules, function (r) { return r.cssText; }).join("\n"));
      }
    }
  } catch (e) {}
  return fetch("assets/cv.css").then(function (r) { return r.text(); }).catch(function () { return null; });
}

function exportHTML() {
  Promise.resolve(cvCssText()).then(function (css) {
    if (!css) { toast("Abre la página desde un servidor o GitHub Pages para exportar HTML", true); return; }
    var d = state.design;
    var page = "@page{ size:" + d.pageSize + "; margin:" + d.marginTop + "mm " + d.marginRight + "mm " + d.marginBottom + "mm " + d.marginLeft + "mm; }";
    var clone = cvRoot.cloneNode(true);
    var g = clone.querySelector(".cv-guides"); if (g) g.remove();
    var doc = "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n<meta charset=\"UTF-8\">\n" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
      "<title>" + esc(state.header.name || "CV") + "</title>\n" +
      '<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Lato:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600&family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">\n' +
      "<style>\nbody{margin:0;background:#d4d4d4;display:flex;justify-content:center;padding:14px 0;}\n" +
      "@media print{body{background:#fff;padding:0;display:block;}}\n" + page + "\n" + css + "\n</style>\n</head>\n<body>\n" +
      clone.outerHTML + "\n</body>\n</html>";
    download(fileName("html"), doc, "text/html;charset=utf-8");
    toast("HTML descargado");
  });
}

/* ---------- 13. Arranque ----------------------------------- */

function renderAll() {
  renderContentPane();
  renderDesignPane();
  applyDesign();
  renderCV();
}

function init() {
  cvRoot = $("#cv-root");
  scaler = $("#paper-scaler");
  state = load();
  renderAll();
  setTimeout(function () { if (ui.autoZoom) fitZoom(); }, 350);

  var panel = $("#panel");
  panel.addEventListener("input", onPanelInput);
  panel.addEventListener("change", onPanelInput);
  panel.addEventListener("click", onPanelClick);

  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("is-active"); });
      document.querySelectorAll(".tabpane").forEach(function (p) { p.classList.remove("is-active"); });
      tab.classList.add("is-active");
      $("#pane-" + tab.getAttribute("data-tab")).classList.add("is-active");
    });
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action]");
    if (!b) return;
    var a = b.getAttribute("data-action");
    if (a === "print") { window.print(); }
    else if (a === "export") { exportJSON(); }
    else if (a === "export-html") { exportHTML(); }
    else if (a === "import") { $("#file-input").click(); }
    else if (a === "load-example") {
      if (!confirm("Se reemplazará el CV actual por el ejemplo. ¿Continuar?")) return;
      state = EXAMPLE(); ui.collapsed = {}; renderAll(); save(); toast("Ejemplo cargado");
    }
    else if (a === "new-cv") {
      if (!confirm("Se borrará el CV actual. ¿Continuar?")) return;
      state = BLANK(); ui.collapsed = {}; renderAll(); save(); toast("CV en blanco");
    }
    else if (a === "zoom-in") setZoom(ui.zoom + 0.1);
    else if (a === "zoom-out") setZoom(ui.zoom - 0.1);
    else if (a === "zoom-fit") { ui.autoZoom = true; fitZoom(); }
    else if (a === "toggle-panel") $("#app").classList.toggle("preview-only");
  });

  $("#file-input").addEventListener("change", function (e) {
    if (e.target.files && e.target.files[0]) importJSON(e.target.files[0]);
    e.target.value = "";
  });

  window.addEventListener("resize", function () { if (ui.autoZoom) fitZoom(); });

  document.addEventListener("keydown", function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); exportJSON(); }
    if (mod && e.altKey && e.key === "]") { e.preventDefault(); setZoom(ui.zoom + 0.1); }
    if (mod && e.altKey && e.key === "[") { e.preventDefault(); setZoom(ui.zoom - 0.1); }
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { updatePageCount(); if (ui.autoZoom) fitZoom(); });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

})();
