(function () {
"use strict";

var CVF = window.CVF;
var uid = CVF.util.uid;
var copy = CVF.util.copy;

var FONTS = [
  ["— Serif clásicas —", null],
  ['"Times New Roman", Times, serif', "Times New Roman"],
  ["Georgia, \"Times New Roman\", serif", "Georgia"],
  ["Cambria, Georgia, serif", "Cambria"],
  ['Garamond, "EB Garamond", serif', "Garamond"],
  ['"Book Antiqua", Palatino, serif', "Book Antiqua"],
  ["— Serif de pantalla —", null],
  ['"EB Garamond", Garamond, serif', "EB Garamond"],
  ['"Source Serif 4", Georgia, serif', "Source Serif 4"],
  ['"Libre Baskerville", Georgia, serif', "Libre Baskerville"],
  ['"Crimson Pro", Georgia, serif', "Crimson Pro"],
  ['"Playfair Display", Georgia, serif', "Playfair Display"],
  ['"Cormorant Garamond", Garamond, serif', "Cormorant Garamond"],
  ["Lora, Georgia, serif", "Lora"],
  ["Merriweather, Georgia, serif", "Merriweather"],
  ['"PT Serif", Georgia, serif', "PT Serif"],
  ["— Sans del sistema —", null],
  ["Arial, Helvetica, sans-serif", "Arial"],
  ['"Helvetica Neue", Helvetica, Arial, sans-serif', "Helvetica"],
  ['Calibri, "Segoe UI", sans-serif', "Calibri"],
  ["Verdana, Geneva, sans-serif", "Verdana"],
  ["Tahoma, Geneva, sans-serif", "Tahoma"],
  ['"Trebuchet MS", Tahoma, sans-serif', "Trebuchet MS"],
  ['"Segoe UI", system-ui, sans-serif', "Segoe UI"],
  ["— Sans de pantalla —", null],
  ["Inter, system-ui, sans-serif", "Inter"],
  ['"Source Sans 3", system-ui, sans-serif', "Source Sans 3"],
  ["Lato, system-ui, sans-serif", "Lato"],
  ["Roboto, system-ui, sans-serif", "Roboto"],
  ['"Open Sans", system-ui, sans-serif', "Open Sans"],
  ["Montserrat, system-ui, sans-serif", "Montserrat"],
  ["Poppins, system-ui, sans-serif", "Poppins"],
  ['"Work Sans", system-ui, sans-serif', "Work Sans"],
  ["Manrope, system-ui, sans-serif", "Manrope"],
  ["Karla, system-ui, sans-serif", "Karla"],
  ["Raleway, system-ui, sans-serif", "Raleway"],
  ['"IBM Plex Sans", system-ui, sans-serif', "IBM Plex Sans"],
  ['"Space Grotesk", system-ui, sans-serif', "Space Grotesk"],
  ["— Monoespaciadas —", null],
  ['"IBM Plex Mono", ui-monospace, monospace', "IBM Plex Mono"],
  ['"JetBrains Mono", ui-monospace, monospace', "JetBrains Mono"],
  ['"Courier New", Courier, monospace', "Courier New"]
];

var ATS_FONTS = /times|georgia|cambria|garamond|arial|helvetica|calibri|verdana|tahoma|trebuchet|segoe|lato|roboto|open sans|source|book antiqua|pt serif/i;

var FONT_SIZES = [6, 7, 8, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

var PAGE_MM = {
  letter: { w: 215.9, h: 279.4 },
  a4:     { w: 210,   h: 297 },
  legal:  { w: 215.9, h: 355.6 }
};

var DEFAULT_DESIGN = {
  
  pageSize: "letter",
  marginTop: 13, marginRight: 14, marginBottom: 13, marginLeft: 14,
  linkMargins: false,
  pageBg: "#ffffff", textColor: "#111111", accent: "#1F4E79",
  avoidBreak: true, showGuides: true, showPageNumbers: false, hyphenate: false,

  twoCol: false, sideWidth: 34, sidePos: "right", colGap: 18,
  sideBg: "transparent", sidePad: 0,

  fontFamily: '"Times New Roman", Times, serif',
  headingFont: "inherit",
  fontSize: 11.5, lineHeight: 1.4, letterSpacing: 0, wordSpacing: 0,
  textAlign: "left", paraGap: 4, paraIndent: 0,

  headerLayout: "stacked", headerAlign: "center",
  headerBg: "transparent", headerPad: 0,
  nameFont: "inherit", nameSize: 24, nameWeight: 700, nameCase: "uppercase",
  nameSpacing: 0.05, nameColor: "#111111",
  contactSize: 10.5, contactSep: " | ", contactIcons: false,
  headerGap: 12, headerRule: false,
  photoShow: false, photoSize: 96, photoShape: "circle",

  titleFont: "inherit", titleSize: 11.5, titleWeight: 700,
  titleCase: "uppercase", titleSpacing: 0.04, titleColor: "#111111",
  titleAlign: "left", titleDeco: "rule", titleBandBg: "#EEF2F7", titlePad: 0,
  ruleColor: "#111111", ruleWidth: 1, ruleStyle: "solid", ruleGap: 2, titleGap: 8,

  sectionGap: 14, itemGap: 10, bulletGap: 2,
  bulletChar: "disc", bulletIndent: 18, bulletColor: "",
  labelWidth: 150, labelWeight: 700, rowsLayout: "inline",

  mainWeight: 700, dateStyle: "normal", dateWeight: "inherit",
  subStyle: "italic", subWeight: 400,

  linkColor: "#1F4E79", linkUnderline: false
};

var PALETTES = [
  ["Tinta", "#111111", "#111111", "#111111", "#ffffff", "#EEEEEE"],
  ["Azul Harvard", "#111111", "#1F4E79", "#1F4E79", "#ffffff", "#E7EEF6"],
  ["Granate", "#1A1A1A", "#7B1E28", "#7B1E28", "#ffffff", "#F6E9EA"],
  ["Verde bosque", "#141A16", "#1F5136", "#1F5136", "#ffffff", "#E6EFEA"],
  ["Grafito", "#1C1C1C", "#3F4650", "#5A626D", "#ffffff", "#EDEFF2"],
  ["Índigo", "#15161D", "#2E3A8C", "#2E3A8C", "#ffffff", "#EAECF8"],
  ["Cobre", "#1B1613", "#8A4B1E", "#8A4B1E", "#FFFDFA", "#F7ECE3"],
  ["Teal", "#0F1A1C", "#0E5C63", "#0E5C63", "#ffffff", "#E4F0F1"],
  ["Ciruela", "#1A1119", "#5C2751", "#5C2751", "#ffffff", "#F2E9F0"],
  ["Papel crema", "#1F1B16", "#6B4E2E", "#6B4E2E", "#FDFBF6", "#F1E9DC"]
];

var TEMPLATES = [
  {
    id: "harvard",
    name: ["Harvard clásico", "Harvard classic"],
    desc: ["Times New Roman, una columna, líneas finas", "Times New Roman, one column, hairline rules"],
    swatch: ["#ffffff", "#111111", "#111111"],
    design: {
      fontFamily: '"Times New Roman", Times, serif', headingFont: "inherit",
      fontSize: 11.5, lineHeight: 1.4, letterSpacing: 0,
      headerAlign: "center", headerLayout: "stacked",
      nameSize: 24, nameWeight: 700, nameCase: "uppercase", nameSpacing: 0.05,
      titleCase: "uppercase", titleSize: 11.5, titleWeight: 700, titleSpacing: 0.04,
      titleAlign: "left", titleDeco: "rule", ruleWidth: 1, ruleStyle: "solid",
      ruleGap: 2, titleGap: 8, sectionGap: 14, itemGap: 10,
      bulletChar: "disc", bulletIndent: 18, twoCol: false, photoShow: false,
      textColor: "#111111", titleColor: "#111111", nameColor: "#111111",
      ruleColor: "#111111", accent: "#111111", pageBg: "#ffffff"
    }
  },
  {
    id: "harvard-compact",
    name: ["Harvard compacto", "Harvard compact"],
    desc: ["Lo mismo, apretado para caber en una hoja", "The same, tightened to fit one page"],
    swatch: ["#ffffff", "#111111", "#333333"],
    design: {
      fontFamily: '"Times New Roman", Times, serif', fontSize: 10.5, lineHeight: 1.26,
      sectionGap: 9, itemGap: 6, bulletGap: 1, titleGap: 5, headerGap: 7,
      nameSize: 19, marginTop: 10, marginBottom: 10, marginLeft: 12, marginRight: 12,
      titleDeco: "rule", ruleWidth: 1, twoCol: false, photoShow: false
    }
  },
  {
    id: "editorial",
    name: ["Editorial", "Editorial"],
    desc: ["Serif elegante, títulos centrados", "Elegant serif, centred titles"],
    swatch: ["#FDFBF6", "#1F1B16", "#6B4E2E"],
    design: {
      fontFamily: '"Source Serif 4", Georgia, serif', headingFont: '"Playfair Display", Georgia, serif',
      fontSize: 11.5, lineHeight: 1.45,
      headerAlign: "center", nameFont: '"Playfair Display", Georgia, serif',
      nameSize: 30, nameWeight: 400, nameCase: "none", nameSpacing: 0.01,
      titleAlign: "center", titleCase: "uppercase", titleSpacing: 0.18, titleSize: 10.5,
      titleDeco: "short", ruleWidth: 1, ruleStyle: "solid", headerRule: true,
      sectionGap: 16, bulletChar: '"– "', pageBg: "#FDFBF6",
      textColor: "#1F1B16", accent: "#6B4E2E", titleColor: "#1F1B16", ruleColor: "#6B4E2E",
      twoCol: false, photoShow: false
    }
  },
  {
    id: "modern",
    name: ["Moderno a dos columnas", "Modern two-column"],
    desc: ["Lateral con habilidades e idiomas", "Sidebar for skills and languages"],
    swatch: ["#ffffff", "#15161D", "#2E3A8C"],
    design: {
      fontFamily: "Inter, system-ui, sans-serif", headingFont: "Inter, system-ui, sans-serif",
      fontSize: 10.5, lineHeight: 1.45, letterSpacing: 0,
      headerLayout: "split", headerAlign: "left",
      nameSize: 26, nameWeight: 700, nameCase: "none", nameSpacing: -0.01,
      titleSize: 10, titleCase: "uppercase", titleSpacing: 0.12, titleWeight: 700,
      titleDeco: "rule", ruleWidth: 1.5, ruleGap: 3, titleGap: 7,
      sectionGap: 13, itemGap: 8, bulletChar: '"– "', bulletIndent: 14,
      twoCol: true, sideWidth: 33, sidePos: "right", colGap: 20,
      accent: "#2E3A8C", titleColor: "#2E3A8C", nameColor: "#15161D",
      ruleColor: "#D5D8E8", linkColor: "#2E3A8C", textColor: "#15161D",
      marginTop: 14, marginBottom: 14, marginLeft: 15, marginRight: 15
    },
    layout: { twoCol: true, sideKeys: ["skills", "langs", "tools", "certs"] }
  },
  {
    id: "sidebar-color",
    name: ["Lateral con color", "Colour sidebar"],
    desc: ["Banda tintada a la izquierda, con foto", "Tinted band on the left, with photo"],
    swatch: ["#ffffff", "#0F1A1C", "#0E5C63"],
    design: {
      fontFamily: '"Source Sans 3", system-ui, sans-serif', headingFont: '"Source Sans 3", system-ui, sans-serif',
      fontSize: 10.5, lineHeight: 1.45,
      headerLayout: "banner", headerAlign: "left", headerBg: "#0E5C63", headerPad: 14,
      nameColor: "#ffffff", nameSize: 26, nameCase: "none", nameWeight: 700, nameSpacing: 0,
      contactSize: 10, contactIcons: true,
      titleDeco: "leftbar", titleSize: 10.5, titleCase: "uppercase", titleSpacing: 0.1,
      ruleWidth: 2.5, titleGap: 7, sectionGap: 13,
      twoCol: true, sideWidth: 32, sidePos: "left", colGap: 16,
      sideBg: "#F2F7F7", sidePad: 10,
      accent: "#0E5C63", titleColor: "#0E5C63", ruleColor: "#0E5C63",
      textColor: "#0F1A1C", linkColor: "#0E5C63",
      photoShow: true, photoSize: 92, photoShape: "circle",
      marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0
    },
    layout: { twoCol: true, sideKeys: ["skills", "langs", "tools", "certs"] }
  },
  {
    id: "minimal",
    name: ["Minimalista", "Minimal"],
    desc: ["Sin líneas, mucho aire", "No rules, plenty of air"],
    swatch: ["#ffffff", "#1C1C1C", "#5A626D"],
    design: {
      fontFamily: "Lato, system-ui, sans-serif", headingFont: "Lato, system-ui, sans-serif",
      fontSize: 11, lineHeight: 1.5, letterSpacing: 0.002,
      headerAlign: "left", headerLayout: "stacked",
      nameSize: 26, nameWeight: 300, nameCase: "none", nameSpacing: -0.005,
      titleSize: 10, titleCase: "uppercase", titleSpacing: 0.22, titleWeight: 700,
      titleDeco: "none", titleGap: 7, sectionGap: 18, itemGap: 11,
      bulletChar: '"– "', bulletIndent: 14, twoCol: false, photoShow: false,
      textColor: "#1C1C1C", titleColor: "#5A626D", accent: "#5A626D",
      marginTop: 18, marginBottom: 18, marginLeft: 18, marginRight: 18
    }
  },
  {
    id: "banded",
    name: ["Títulos con banda", "Banded titles"],
    desc: ["Cada sección con fondo tintado", "Every section title on a tinted band"],
    swatch: ["#ffffff", "#111111", "#7B1E28"],
    design: {
      fontFamily: "Cambria, Georgia, serif", headingFont: '"Work Sans", system-ui, sans-serif',
      fontSize: 11, lineHeight: 1.4,
      headerAlign: "center", nameSize: 25, nameCase: "uppercase", nameSpacing: 0.08,
      titleDeco: "band", titleBandBg: "#F6E9EA", titlePad: 5,
      titleSize: 10.5, titleCase: "uppercase", titleSpacing: 0.1, titleAlign: "left",
      titleGap: 8, sectionGap: 13, ruleWidth: 0,
      accent: "#7B1E28", titleColor: "#7B1E28", nameColor: "#111111",
      linkColor: "#7B1E28", twoCol: false, photoShow: false
    }
  },
  {
    id: "europass",
    name: ["Estilo Europass", "Europass style"],
    desc: ["Etiqueta a la izquierda, contenido a la derecha", "Label left, content right"],
    swatch: ["#ffffff", "#15161D", "#2E3A8C"],
    design: {
      fontFamily: '"Open Sans", system-ui, sans-serif', headingFont: '"Open Sans", system-ui, sans-serif',
      fontSize: 10.5, lineHeight: 1.45,
      headerLayout: "split", headerAlign: "left",
      nameSize: 22, nameWeight: 700, nameCase: "none",
      titleDeco: "rule", titleSize: 10.5, titleCase: "uppercase", titleSpacing: 0.08,
      ruleWidth: 1, ruleColor: "#2E3A8C", titleColor: "#2E3A8C",
      rowsLayout: "inline", labelWidth: 190, labelWeight: 700,
      sectionGap: 12, itemGap: 8, bulletChar: '"▪ "', bulletIndent: 15,
      accent: "#2E3A8C", photoShow: true, photoSize: 84, photoShape: "square",
      twoCol: false
    }
  },
  {
    id: "academic",
    name: ["Académico", "Academic"],
    desc: ["CV largo, para investigación y docencia", "Long-form CV for research and teaching"],
    swatch: ["#ffffff", "#111111", "#1F5136"],
    design: {
      fontFamily: '"EB Garamond", Garamond, serif', headingFont: '"EB Garamond", Garamond, serif',
      fontSize: 12, lineHeight: 1.38, textAlign: "left",
      headerAlign: "center", nameSize: 22, nameCase: "none", nameWeight: 600, nameSpacing: 0.01,
      titleSize: 11.5, titleCase: "smallcaps", titleSpacing: 0.06, titleAlign: "left",
      titleDeco: "rule", ruleWidth: 0.5, ruleGap: 2, titleGap: 6,
      sectionGap: 13, itemGap: 7, bulletChar: "none", bulletIndent: 0,
      dateStyle: "normal", subStyle: "italic",
      accent: "#1F5136", titleColor: "#111111", twoCol: false, photoShow: false,
      marginTop: 16, marginBottom: 16, marginLeft: 20, marginRight: 20
    }
  },
  {
    id: "ats",
    name: ["Técnico / ATS", "Technical / ATS"],
    desc: ["Arial, una columna, máxima lectura por robots", "Arial, one column, maximum machine readability"],
    swatch: ["#ffffff", "#000000", "#000000"],
    design: {
      fontFamily: "Arial, Helvetica, sans-serif", headingFont: "inherit",
      fontSize: 11, lineHeight: 1.35, letterSpacing: 0, textAlign: "left",
      headerAlign: "left", headerLayout: "stacked",
      nameSize: 20, nameCase: "uppercase", nameSpacing: 0.02, nameWeight: 700,
      titleCase: "uppercase", titleSpacing: 0.03, titleSize: 11,
      titleDeco: "rule", ruleWidth: 1, ruleStyle: "solid",
      bulletChar: "disc", bulletIndent: 18,
      textColor: "#000000", titleColor: "#000000", nameColor: "#000000",
      ruleColor: "#000000", accent: "#000000", linkColor: "#000000",
      linkUnderline: true, twoCol: false, photoShow: false, contactIcons: false,
      marginTop: 13, marginBottom: 13, marginLeft: 14, marginRight: 14
    }
  },
  {
    id: "swiss",
    name: ["Suizo", "Swiss"],
    desc: ["Rejilla estricta, sans geométrica", "Strict grid, geometric sans"],
    swatch: ["#ffffff", "#111111", "#D33A2C"],
    design: {
      fontFamily: '"Work Sans", system-ui, sans-serif', headingFont: '"Space Grotesk", system-ui, sans-serif',
      fontSize: 10.5, lineHeight: 1.5, letterSpacing: 0,
      headerAlign: "left", headerLayout: "stacked",
      nameFont: '"Space Grotesk", system-ui, sans-serif',
      nameSize: 32, nameWeight: 700, nameCase: "none", nameSpacing: -0.03,
      titleSize: 9.5, titleCase: "uppercase", titleSpacing: 0.16, titleWeight: 600,
      titleDeco: "leftbar", ruleWidth: 3, titleGap: 6, ruleColor: "#D33A2C",
      sectionGap: 16, itemGap: 9, bulletChar: '"— "', bulletIndent: 16,
      accent: "#D33A2C", titleColor: "#111111", linkColor: "#D33A2C",
      twoCol: false, photoShow: false,
      marginTop: 16, marginBottom: 16, marginLeft: 16, marginRight: 16
    }
  },
  {
    id: "boxed",
    name: ["Recuadros", "Boxed"],
    desc: ["Títulos enmarcados, aire generoso", "Framed titles, generous spacing"],
    swatch: ["#ffffff", "#141A16", "#1F5136"],
    design: {
      fontFamily: '"PT Serif", Georgia, serif', headingFont: "Montserrat, system-ui, sans-serif",
      fontSize: 11, lineHeight: 1.45,
      headerAlign: "center", nameFont: "Montserrat, system-ui, sans-serif",
      nameSize: 24, nameWeight: 700, nameCase: "uppercase", nameSpacing: 0.1,
      titleDeco: "boxed", titlePad: 5, titleSize: 10, titleCase: "uppercase",
      titleSpacing: 0.12, titleAlign: "center", ruleWidth: 1, titleGap: 9,
      sectionGap: 15, accent: "#1F5136", titleColor: "#1F5136", ruleColor: "#1F5136",
      twoCol: false, photoShow: false
    }
  }
];

function newItem(type) {
  if (type === "rows")  return { label: "", content: "" };
  if (type === "list")  return { text: "" };
  if (type === "text")  return { text: "" };
  if (type === "tags")  return { text: "" };
  if (type === "bars")  return { label: "", level: 3, note: "" };
  return { left: "", right: "", subs: [{ left: "", right: "" }], text: "", bullets: [] };
}

function newSection(type, title) {
  return {
    id: uid("s"), type: type, title: title || "", visible: true, rule: true,
    columns: 1, col: "main", marked: false, accent: "",
    items: [newItem(type)]
  };
}

function BLANK(lang) {
  var en = lang === "en";
  var d = copy(DEFAULT_DESIGN);
  return {
    v: 2,
    title: en ? "Untitled CV" : "CV sin título",
    design: d,
    header: {
      name: en ? "Your Full Name" : "Tu Nombre Completo",
      tagline: "",
      photo: "",
      contacts: [
        { text: en ? "you@example.com" : "correo@ejemplo.com", link: "", icon: "mail" },
        { text: en ? "+1 (555) 000-0000" : "+52 000 000 0000", link: "", icon: "phone" },
        { text: en ? "City, Country" : "Ciudad, País", link: "", icon: "pin" }
      ]
    },
    sections: [
      Object.assign(newSection("entries", en ? "Education" : "Educación"), { key: "edu" }),
      Object.assign(newSection("entries", en ? "Experience" : "Experiencia"), { key: "exp" }),
      Object.assign(newSection("rows", en ? "Skills" : "Habilidades"), {
        key: "skills",
        items: [
          { label: en ? "Languages:" : "Idiomas:", content: "" },
          { label: en ? "Tools:" : "Herramientas:", content: "" }
        ]
      })
    ]
  };
}

function EXAMPLE_EN() {
  var d = copy(DEFAULT_DESIGN);
  return {
    v: 2,
    title: "Example CV",
    design: d,
    header: {
      name: "Jordan Ellis Parker",
      tagline: "Open to relocation",
      photo: "",
      contacts: [
        { text: "j.parker@example.com", link: "mailto:j.parker@example.com", icon: "mail" },
        { text: "+1 (555) 014-2278", link: "", icon: "phone" },
        { text: "linkedin.com/in/example-parker", link: "https://linkedin.com/in/example-parker", icon: "link" },
        { text: "Boston, Massachusetts", link: "", icon: "pin" }
      ]
    },
    sections: [
      Object.assign(newSection("text", "Profile"), {
        key: "profile",
        items: [{ text: "Data analyst with three years of experience turning operational data into decisions people actually act on. Comfortable owning a question end to end: pulling the data, cleaning it, modelling it and presenting the answer to a non-technical room." }]
      }),
      Object.assign(newSection("entries", "Education"), {
        key: "edu",
        items: [
          { left: "Northgate State University", right: "Boston, Massachusetts",
            subs: [{ left: "B.S. in Statistics, minor in Economics", right: "Expected May 2027" }],
            text: "", bullets: [
              "GPA 3.8/4.0 · Dean&rsquo;s List, five consecutive semesters.",
              "Relevant coursework: Regression Analysis, Database Systems, Machine Learning, Econometrics."
            ] },
          { left: "Riverside High School", right: "Portland, Maine",
            subs: [{ left: "Advanced diploma, mathematics track", right: "2019 &mdash; 2023" }],
            text: "", bullets: [] }
        ]
      }),
      Object.assign(newSection("entries", "Professional Experience"), {
        key: "exp",
        items: [
          { left: "Northwind Analytics", right: "Jun 2025 &mdash; Present",
            subs: [{ left: "Data Analyst", right: "Boston, Massachusetts" }],
            text: "", bullets: [
              "Rebuilt the weekly reporting pipeline in Python, cutting the manual preparation time from <strong>six hours to twelve minutes</strong>.",
              "Designed 14 dashboards used daily by three departments, replacing a spreadsheet process that had drifted out of sync for years.",
              "Ran an A/B test on the onboarding email sequence that lifted 30-day activation by <strong>11%</strong> across 40,000 users.",
              "Trained seven colleagues on SQL fundamentals, so routine questions stopped queuing on the analytics team."
            ] },
          { left: "Riverbend Labs", right: "Jan 2025 &mdash; May 2025",
            subs: [{ left: "Software Engineering Intern", right: "Remote" }],
            text: "", bullets: [
              "Built an internal API in Node.js that consolidated four legacy endpoints into one documented service.",
              "Added an automated test suite that raised coverage from 34% to 81% and caught two production bugs before release.",
              "Wrote the migration guide the rest of the team used to move off the deprecated endpoints."
            ] },
          { left: "Northgate State University", right: "Sep 2024 &mdash; Dec 2024",
            subs: [{ left: "Teaching Assistant, Introductory Statistics", right: "Boston, Massachusetts" }],
            text: "", bullets: [
              "Led two weekly lab sections of 25 students and held office hours for a 180-student lecture course.",
              "Rewrote the lab handouts around worked examples; the section average rose four points over the previous term."
            ] }
        ]
      }),
      Object.assign(newSection("entries", "Projects"), {
        key: "projects",
        items: [
          { left: "Transit Delay Explorer", right: "<em>Python &middot; Streamlit &middot; PostgreSQL</em>",
            subs: [{ left: "Personal project", right: "2025" }],
            text: "Interactive map of five years of public transport delays, built from an open data set of 2.3 million records. Used by a local newsroom for a story on weekend service cuts.",
            bullets: [] },
          { left: "Grocery Price Tracker", right: "<em>Web scraping &middot; SQLite</em>",
            subs: [],
            text: "Scheduled scraper following 400 supermarket products and charting real inflation against the published index.",
            bullets: [] }
        ]
      }),
      Object.assign(newSection("rows", "Skills"), {
        key: "skills",
        items: [
          { label: "Programming:", content: "Python (pandas, scikit-learn), SQL, R, JavaScript" },
          { label: "Data &amp; BI:", content: "PostgreSQL, dbt, Tableau, Power BI, Looker Studio" },
          { label: "Methods:", content: "A/B testing, regression modelling, time series, survey design" },
          { label: "Ways of working:", content: "Git, dbt, Jira, technical writing, stakeholder interviews" }
        ]
      }),
      Object.assign(newSection("bars", "Languages"), {
        key: "langs",
        items: [
          { label: "English", level: 5, note: "Native" },
          { label: "Spanish", level: 4, note: "C1" },
          { label: "French", level: 2, note: "A2" }
        ]
      }),
      Object.assign(newSection("list", "Certifications &amp; Awards"), {
        key: "certs",
        items: [
          { text: "<strong>Google Data Analytics Professional Certificate</strong> &mdash; Coursera (2025)" },
          { text: "<strong>AWS Certified Cloud Practitioner</strong> &mdash; Amazon Web Services (2025)" },
          { text: "<strong>First place, Northgate Data Challenge</strong> &mdash; team of four, 60 competing teams (2024)" }
        ]
      }),
      Object.assign(newSection("tags", "Tools"), {
        key: "tools",
        items: [{ text: "Python, SQL, R, Tableau, Power BI, dbt, Airflow, Git, Docker, Excel, Figma, Jupyter" }]
      })
    ]
  };
}

function EXAMPLE_ES() {
  var d = copy(DEFAULT_DESIGN);
  return {
    v: 2,
    title: "CV de ejemplo",
    design: d,
    header: {
      name: "Valeria Ruiz Salazar",
      tagline: "Disponible para reubicación",
      photo: "",
      contacts: [
        { text: "v.ruiz@ejemplo.com", link: "mailto:v.ruiz@ejemplo.com", icon: "mail" },
        { text: "+52 555 014 2278", link: "", icon: "phone" },
        { text: "linkedin.com/in/ejemplo-ruiz", link: "https://linkedin.com/in/ejemplo-ruiz", icon: "link" },
        { text: "Guadalajara, México", link: "", icon: "pin" }
      ]
    },
    sections: [
      Object.assign(newSection("text", "Perfil"), {
        key: "profile",
        items: [{ text: "Analista de datos con tres años de experiencia convirtiendo información operativa en decisiones que el equipo realmente aplica. Cómoda llevando una pregunta de principio a fin: extraer los datos, limpiarlos, modelarlos y explicar la respuesta a una sala sin perfil técnico." }]
      }),
      Object.assign(newSection("entries", "Educación"), {
        key: "edu",
        items: [
          { left: "Universidad Estatal de Occidente", right: "Guadalajara, Jalisco",
            subs: [{ left: "Licenciatura en Estadística, minor en Economía", right: "Titulación prevista: mayo 2027" }],
            text: "", bullets: [
              "Promedio 9.4/10 · Cuadro de honor durante cinco semestres consecutivos.",
              "Materias relevantes: análisis de regresión, bases de datos, aprendizaje automático, econometría."
            ] },
          { left: "Preparatoria Técnica del Valle", right: "Zapopan, Jalisco",
            subs: [{ left: "Bachillerato técnico en Programación", right: "2019 &mdash; 2023" }],
            text: "", bullets: [] }
        ]
      }),
      Object.assign(newSection("entries", "Experiencia profesional"), {
        key: "exp",
        items: [
          { left: "Northwind Analytics", right: "Jun 2025 &mdash; Actualidad",
            subs: [{ left: "Analista de datos", right: "Guadalajara, México" }],
            text: "", bullets: [
              "Reconstruí el proceso de reportes semanales en Python y bajé la preparación manual de <strong>seis horas a doce minutos</strong>.",
              "Diseñé 14 tableros que usan a diario tres departamentos, sustituyendo hojas de cálculo que llevaban años desincronizadas.",
              "Ejecuté una prueba A/B sobre la secuencia de bienvenida que subió la activación a 30 días un <strong>11%</strong> en 40 000 usuarios.",
              "Capacité a siete compañeros en SQL básico, de modo que las consultas rutinarias dejaron de hacer cola en el equipo de datos."
            ] },
          { left: "Riverbend Labs", right: "Ene 2025 &mdash; May 2025",
            subs: [{ left: "Practicante de desarrollo de software", right: "Remoto" }],
            text: "", bullets: [
              "Construí una API interna en Node.js que unificó cuatro endpoints heredados en un solo servicio documentado.",
              "Añadí pruebas automatizadas que subieron la cobertura del 34% al 81% y detectaron dos errores antes de salir a producción.",
              "Redacté la guía de migración que usó el resto del equipo para abandonar los endpoints obsoletos."
            ] },
          { left: "Universidad Estatal de Occidente", right: "Sep 2024 &mdash; Dic 2024",
            subs: [{ left: "Ayudante de cátedra, Estadística I", right: "Guadalajara, México" }],
            text: "", bullets: [
              "Impartí dos laboratorios semanales de 25 alumnos y asesorías para un curso de 180 estudiantes.",
              "Reescribí los cuadernillos de práctica alrededor de ejemplos resueltos; el promedio del grupo subió cuatro puntos respecto al periodo anterior."
            ] }
        ]
      }),
      Object.assign(newSection("entries", "Proyectos"), {
        key: "projects",
        items: [
          { left: "Explorador de retrasos del transporte", right: "<em>Python &middot; Streamlit &middot; PostgreSQL</em>",
            subs: [{ left: "Proyecto personal", right: "2025" }],
            text: "Mapa interactivo con cinco años de retrasos del transporte público, a partir de un conjunto abierto de 2.3 millones de registros. Un medio local lo usó para un reportaje sobre los recortes de servicio en fin de semana.",
            bullets: [] },
          { left: "Rastreador de precios de despensa", right: "<em>Web scraping &middot; SQLite</em>",
            subs: [],
            text: "Robot programado que sigue 400 productos de supermercado y grafica la inflación real frente al índice publicado.",
            bullets: [] }
        ]
      }),
      Object.assign(newSection("rows", "Habilidades"), {
        key: "skills",
        items: [
          { label: "Programación:", content: "Python (pandas, scikit-learn), SQL, R, JavaScript" },
          { label: "Datos y BI:", content: "PostgreSQL, dbt, Tableau, Power BI, Looker Studio" },
          { label: "Métodos:", content: "Pruebas A/B, modelos de regresión, series de tiempo, diseño de encuestas" },
          { label: "Forma de trabajo:", content: "Git, Jira, redacción técnica, entrevistas con áreas usuarias" }
        ]
      }),
      Object.assign(newSection("bars", "Idiomas"), {
        key: "langs",
        items: [
          { label: "Español", level: 5, note: "Nativo" },
          { label: "Inglés", level: 4, note: "C1" },
          { label: "Francés", level: 2, note: "A2" }
        ]
      }),
      Object.assign(newSection("list", "Certificaciones y premios"), {
        key: "certs",
        items: [
          { text: "<strong>Certificado profesional en Análisis de Datos de Google</strong> &mdash; Coursera (2025)" },
          { text: "<strong>AWS Certified Cloud Practitioner</strong> &mdash; Amazon Web Services (2025)" },
          { text: "<strong>Primer lugar, Reto de Datos Occidente</strong> &mdash; equipo de cuatro, 60 equipos participantes (2024)" }
        ]
      }),
      Object.assign(newSection("tags", "Herramientas"), {
        key: "tools",
        items: [{ text: "Python, SQL, R, Tableau, Power BI, dbt, Airflow, Git, Docker, Excel, Figma, Jupyter" }]
      })
    ]
  };
}

function EXAMPLE(lang) { return lang === "en" ? EXAMPLE_EN() : EXAMPLE_ES(); }

var ICONS = {
  mail:  'M2 4h12v8H2z M2 4l6 4 6-4',
  phone: 'M3 3h3l1.5 3.5L6 8a8 8 0 0 0 2 2l1.5-1.5L13 10v3h-2A8 8 0 0 1 3 5V3z',
  pin:   'M8 1.5a4 4 0 0 0-4 4c0 3 4 8.5 4 8.5s4-5.5 4-8.5a4 4 0 0 0-4-4z M8 7.2a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4z',
  link:  'M6.5 9.5a2.5 2.5 0 0 1 0-3.5l2-2a2.5 2.5 0 0 1 3.5 3.5l-1 1 M9.5 6.5a2.5 2.5 0 0 1 0 3.5l-2 2A2.5 2.5 0 0 1 4 8.5l1-1',
  globe: 'M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M1.5 8h13 M8 1.5c1.8 2 2.7 4.2 2.7 6.5S9.8 12.5 8 14.5C6.2 12.5 5.3 10.3 5.3 8S6.2 3.5 8 1.5z',
  github:'M8 1.5a6.5 6.5 0 0 0-2 12.7v-2.2c-1.8.4-2.2-.8-2.2-.8-.3-.8-.7-1-.7-1-.6-.4 0-.4 0-.4.7 0 1 .7 1 .7.6 1 1.6.7 2 .6 0-.5.2-.8.4-1-1.4-.2-2.9-.7-2.9-3.2 0-.7.3-1.3.7-1.7 0-.2-.3-.9.1-1.8 0 0 .5-.2 1.8.6a6 6 0 0 1 3.2 0c1.3-.8 1.8-.6 1.8-.6.4.9.1 1.6.1 1.8.4.4.7 1 .7 1.7 0 2.5-1.5 3-2.9 3.2.2.2.4.6.4 1.3v2c3-.9 4.6-4 3.8-7A6.5 6.5 0 0 0 8 1.5z',
  award: 'M8 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M5.5 8.2L4.5 14 8 12.3 11.5 14l-1-5.8'
};

var ICON_LIST = [
  ["", "—"], ["mail", "✉ correo"], ["phone", "☎ teléfono"], ["pin", "⌖ ubicación"],
  ["link", "🔗 enlace"], ["globe", "🌐 web"], ["github", "⌨ GitHub"], ["award", "★ otro"]
];

CVF.data = {
  FONTS: FONTS, FONT_SIZES: FONT_SIZES, ATS_FONTS: ATS_FONTS,
  PAGE_MM: PAGE_MM, DEFAULT_DESIGN: DEFAULT_DESIGN,
  PALETTES: PALETTES, TEMPLATES: TEMPLATES,
  ICONS: ICONS, ICON_LIST: ICON_LIST,
  newItem: newItem, newSection: newSection,
  BLANK: BLANK, EXAMPLE: EXAMPLE
};

})();
