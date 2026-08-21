(function () {
"use strict";

var CVF = window.CVF;
var U = CVF.util, $ = U.$, $$ = U.$$;
var D = CVF.data;
var t = function (k) { return CVF.i18n.t(k); };

var CRC = (function () {
  var table = new Uint32Array(256), c, n, k;
  for (n = 0; n < 256; n++) {
    c = n;
    for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  var c = 0xFFFFFFFF;
  for (var i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function zip(files) {
  var enc = new TextEncoder();
  var parts = [], central = [], offset = 0;

  files.forEach(function (f) {
    var name = enc.encode(f.name);
    var data = typeof f.data === "string" ? enc.encode(f.data) : f.data;
    var sum = crc32(data);

    var local = new Uint8Array(30 + name.length);
    var lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);       
    lv.setUint16(6, 0x0800, true);   
    lv.setUint16(8, 0, true);        
    lv.setUint16(10, 0, true);       
    lv.setUint16(12, 0x0021, true);  
    lv.setUint32(14, sum, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);
    parts.push(local, data);

    var dir = new Uint8Array(46 + name.length);
    var dv = new DataView(dir.buffer);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 20, true);
    dv.setUint16(8, 0x0800, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint16(14, 0x0021, true);
    dv.setUint32(16, sum, true);
    dv.setUint32(20, data.length, true);
    dv.setUint32(24, data.length, true);
    dv.setUint16(28, name.length, true);
    dv.setUint32(42, offset, true);
    dir.set(name, 46);
    central.push(dir);

    offset += local.length + data.length;
  });

  var cdSize = central.reduce(function (a, b) { return a + b.length; }, 0);
  var end = new Uint8Array(22);
  var ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  return new Blob(parts.concat(central, [end]),
    { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

function tw(mm) { return Math.round(mm * 1440 / 25.4); }   
function pxTw(px) { return Math.round(px * 15); }          
function pxHalfPt(px) { return Math.max(2, Math.round(px * 1.5)); }

function xml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function hex(color) {
  if (!color) return null;
  var c = String(color).trim();
  var m = c.match(/^rgba?\(([^)]+)\)/i);
  if (m) {
    var p = m[1].split(",").map(function (x) { return parseFloat(x); });
    return [p[0], p[1], p[2]].map(function (n) {
      return ("0" + U.clamp(Math.round(n || 0), 0, 255).toString(16)).slice(-2);
    }).join("").toUpperCase();
  }
  m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  var h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return h.toUpperCase();
}

function fontName(stack) {
  if (!stack || stack === "inherit") return null;
  return String(stack).split(",")[0].replace(/['"]/g, "").trim() || null;
}

function runProps(f) {
  var out = "";
  if (f.font) out += '<w:rFonts w:ascii="' + xml(f.font) + '" w:hAnsi="' + xml(f.font) +
    '" w:cs="' + xml(f.font) + '"/>';
  if (f.b) out += "<w:b/>";
  if (f.i) out += "<w:i/>";
  if (f.caps) out += "<w:caps/>";
  if (f.smallCaps) out += "<w:smallCaps/>";
  if (f.strike) out += "<w:strike/>";
  if (f.color) out += '<w:color w:val="' + f.color + '"/>';
  if (f.spacing) out += '<w:spacing w:val="' + f.spacing + '"/>';
  if (f.size) out += '<w:sz w:val="' + f.size + '"/><w:szCs w:val="' + f.size + '"/>';
  if (f.u) out += '<w:u w:val="single"/>';
  if (f.shd) out += '<w:shd w:val="clear" w:color="auto" w:fill="' + f.shd + '"/>';
  if (f.vert) out += '<w:vertAlign w:val="' + f.vert + '"/>';
  return out ? "<w:rPr>" + out + "</w:rPr>" : "";
}

function textRun(text, f) {
  if (!text) return "";
  return "<w:r>" + runProps(f) + '<w:t xml:space="preserve">' + xml(text) + "</w:t></w:r>";
}

function runsFromHTML(html, base) {
  var host = document.createElement("div");
  host.innerHTML = String(html || "");
  var out = [];

  (function walk(node, f) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var txt = n.nodeValue.replace(/​/g, "");
        if (txt) out.push(textRun(txt, f));
        return;
      }
      if (n.nodeType !== 1) return;

      var g = Object.assign({}, f);
      var tag = n.tagName;
      if (tag === "BR") { out.push("<w:r><w:br/></w:r>"); return; }
      if (tag === "STRONG" || tag === "B") g.b = true;
      if (tag === "EM" || tag === "I") g.i = true;
      if (tag === "U" || tag === "INS") g.u = true;
      if (tag === "S" || tag === "STRIKE" || tag === "DEL") g.strike = true;
      if (tag === "SUP") g.vert = "superscript";
      if (tag === "SUB") g.vert = "subscript";
      if (tag === "MARK") g.shd = "FFF176";
      if (tag === "CODE") g.font = "Consolas";
      if (tag === "A") { g.color = g.color || "1F4E79"; g.u = true; }

      var s = n.style;
      if (s) {
        if (s.fontWeight) g.b = /bold|[6-9]00/.test(s.fontWeight);
        if (s.fontStyle === "italic") g.i = true;
        if (s.textDecoration || s.textDecorationLine) {
          var deco = s.textDecoration + " " + (s.textDecorationLine || "");
          if (/underline/.test(deco)) g.u = true;
          if (/line-through/.test(deco)) g.strike = true;
        }
        if (s.color) g.color = hex(s.color) || g.color;
        if (s.backgroundColor && s.backgroundColor !== "transparent") {
          g.shd = hex(s.backgroundColor) || g.shd;
        }
        if (s.fontSize && /px$/.test(s.fontSize)) g.size = pxHalfPt(parseFloat(s.fontSize));
        if (s.fontFamily) g.font = fontName(s.fontFamily) || g.font;
        if (s.letterSpacing && /em$/.test(s.letterSpacing)) {
          g.spacing = Math.round(parseFloat(s.letterSpacing) * (g.size ? g.size / 2 : 11) * 20);
        }
        if (s.textTransform === "uppercase") g.caps = true;
        if (s.verticalAlign === "super") g.vert = "superscript";
        if (s.verticalAlign === "sub") g.vert = "subscript";
      }
      walk(n, g);
    });
  })(host, base || {});

  return out.join("");
}

function para(runs, o) {
  o = o || {};
  var pr = "";
  if (o.keepNext) pr += "<w:keepNext/>";
  if (o.numId) pr += '<w:numPr><w:ilvl w:val="' + (o.ilvl || 0) + '"/><w:numId w:val="' + o.numId + '"/></w:numPr>';
  if (o.border) pr += '<w:pBdr><w:bottom w:val="single" w:sz="' + o.border +
    '" w:space="' + (o.borderSpace || 1) + '" w:color="' + (o.borderColor || "000000") + '"/></w:pBdr>';
  if (o.shd) pr += '<w:shd w:val="clear" w:color="auto" w:fill="' + o.shd + '"/>';
  if (o.tabRight) pr += '<w:tabs><w:tab w:val="right" w:pos="' + o.tabRight + '"/></w:tabs>';
  pr += '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) + '"' +
    (o.line ? ' w:line="' + o.line + '" w:lineRule="auto"' : "") + "/>";
  if (o.ind) pr += '<w:ind w:left="' + (o.ind.left || 0) + '"' +
    (o.ind.hanging ? ' w:hanging="' + o.ind.hanging + '"' : "") +
    (o.ind.firstLine ? ' w:firstLine="' + o.ind.firstLine + '"' : "") + "/>";
  if (o.align && o.align !== "left") pr += '<w:jc w:val="' +
    (o.align === "justify" ? "both" : o.align) + '"/>';
  return "<w:p>" + (pr ? "<w:pPr>" + pr + "</w:pPr>" : "") + (runs || "") + "</w:p>";
}

var TAB = "<w:r><w:tab/></w:r>";

function docxBody(st) {
  var d = st.design, h = st.header;
  var page = D.PAGE_MM[d.pageSize] || D.PAGE_MM.letter;
  var contentW = tw(page.w - d.marginLeft - d.marginRight);
  var bodyFont = fontName(d.fontFamily);
  var headFont = fontName(d.headingFont === "inherit" ? d.fontFamily : d.headingFont);
  var baseSize = pxHalfPt(d.fontSize);
  var lineTw = Math.round(d.lineHeight * 240);
  var out = "";

  var align = d.headerAlign === "center" ? "center" : (d.headerAlign === "right" ? "right" : "left");

  out += para(runsFromHTML(h.name, {
    b: d.nameWeight >= 600, size: pxHalfPt(d.nameSize),
    caps: d.nameCase === "uppercase", smallCaps: d.nameCase === "smallcaps",
    color: hex(d.nameColor), font: fontName(d.nameFont === "inherit" ? (d.headingFont === "inherit" ? d.fontFamily : d.headingFont) : d.nameFont),
    spacing: d.nameSpacing ? Math.round(d.nameSpacing * d.nameSize * 15) : 0
  }), { align: align, after: 40 });

  var contactRuns = [];
  (h.contacts || []).forEach(function (c, i) {
    if (U.isEmptyHTML(c.text)) return;
    if (contactRuns.length) contactRuns.push(textRun(d.contactSep, { size: pxHalfPt(d.contactSize), font: bodyFont }));
    contactRuns.push(runsFromHTML(c.text, { size: pxHalfPt(d.contactSize), font: bodyFont }));
  });
  if (contactRuns.length) out += para(contactRuns.join(""), { align: align, after: 20 });

  if (!U.isEmptyHTML(h.tagline)) {
    out += para(runsFromHTML(h.tagline, { i: true, size: pxHalfPt(d.contactSize), font: bodyFont }),
      { align: align, after: pxTw(d.headerGap) });
  } else {
    out += para("", { after: pxTw(d.headerGap) / 2 });
  }

  st.sections.forEach(function (sec) {
    if (!sec.visible) return;

    var titleColor = hex(sec.accent || d.titleColor);
    var withRule = sec.rule && d.ruleWidth > 0 && d.titleDeco !== "none" && d.titleDeco !== "band";
    out += para(runsFromHTML(sec.title, {
      b: d.titleWeight >= 600, size: pxHalfPt(d.titleSize),
      caps: d.titleCase === "uppercase", smallCaps: d.titleCase === "smallcaps",
      color: titleColor, font: headFont,
      spacing: d.titleSpacing ? Math.round(d.titleSpacing * d.titleSize * 15) : 0
    }), {
      align: d.titleAlign, keepNext: true,
      before: pxTw(d.sectionGap), after: pxTw(d.titleGap),
      border: withRule ? Math.max(2, Math.round(d.ruleWidth * 6)) : 0,
      borderColor: hex(d.ruleColor) || "000000",
      shd: d.titleDeco === "band" ? hex(d.titleBandBg) : null
    });

    var baseRun = { size: baseSize, font: bodyFont };

    sec.items.forEach(function (it) {
      if (sec.type === "entries") {
        var left = runsFromHTML(it.left, Object.assign({}, baseRun, { b: d.mainWeight >= 600 }));
        var right = runsFromHTML(it.right, Object.assign({}, baseRun, {
          i: d.dateStyle === "italic", b: d.dateWeight === "700"
        }));
        if (left || right) {
          out += para(left + TAB + right, { tabRight: contentW, line: lineTw, after: 0 });
        }
        (it.subs || []).forEach(function (s) {
          var sl = runsFromHTML(s.left, Object.assign({}, baseRun, {
            i: d.subStyle === "italic", b: d.subWeight >= 600
          }));
          var sr = runsFromHTML(s.right, Object.assign({}, baseRun, { i: d.subStyle === "italic" }));
          if (sl || sr) out += para(sl + TAB + sr, { tabRight: contentW, line: lineTw, after: 0 });
        });
        if (!U.isEmptyHTML(it.text)) out += blockParas(it.text, baseRun, d, lineTw);
        (it.bullets || []).forEach(function (b) {
          if (U.isEmptyHTML(b)) return;
          out += para(runsFromHTML(b, baseRun), {
            numId: 1, line: lineTw, after: pxTw(d.bulletGap),
            ind: { left: Math.max(230, pxTw(d.bulletIndent)), hanging: 180 }
          });
        });
        out += para("", { after: pxTw(d.itemGap) / 2 });

      } else if (sec.type === "rows") {
        var lbl = runsFromHTML(it.label, Object.assign({}, baseRun, { b: d.labelWeight >= 600 }));
        var val = runsFromHTML(it.content, baseRun);
        out += para(lbl + textRun("  ", baseRun) + val, {
          line: lineTw, after: pxTw(d.bulletGap),
          ind: { left: pxTw(d.labelWidth), hanging: pxTw(d.labelWidth) }
        });

      } else if (sec.type === "list") {
        if (U.isEmptyHTML(it.text)) return;
        out += para(runsFromHTML(it.text, baseRun), sec.marked
          ? { numId: 1, line: lineTw, after: pxTw(d.bulletGap),
              ind: { left: Math.max(230, pxTw(d.bulletIndent)), hanging: 180 } }
          : { line: lineTw, after: pxTw(d.bulletGap) });

      } else if (sec.type === "tags") {
        var chips = U.htmlToText(it.text, ", ").split(/\s*[,;·]\s*/).filter(Boolean);
        if (chips.length) out += para(textRun(chips.join("  ·  "), baseRun), { line: lineTw, after: 40 });

      } else if (sec.type === "bars") {
        var pips = "";
        var lvl = U.clamp(parseInt(it.level, 10) || 0, 0, 5);
        for (var k = 1; k <= 5; k++) pips += k <= lvl ? "●" : "○";
        var note = U.htmlToText(it.note, " ");
        out += para(
          runsFromHTML(it.label, Object.assign({}, baseRun, { b: true })) +
          textRun("  " + pips + (note ? "  " + note : ""), baseRun),
          { line: lineTw, after: pxTw(d.bulletGap) });

      } else {
        if (!U.isEmptyHTML(it.text)) out += blockParas(it.text, baseRun, d, lineTw);
      }
    });
  });

  out += '<w:sectPr><w:pgSz w:w="' + tw(page.w) + '" w:h="' + tw(page.h) + '"/>' +
    '<w:pgMar w:top="' + tw(d.marginTop) + '" w:right="' + tw(d.marginRight) +
    '" w:bottom="' + tw(d.marginBottom) + '" w:left="' + tw(d.marginLeft) +
    '" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';

  return out;
}

function blockParas(html, baseRun, d, lineTw) {
  var host = document.createElement("div");
  host.innerHTML = String(html || "");
  var out = "";
  var blocks = $$(":scope > p, :scope > div, :scope > ul, :scope > ol", host);

  if (!blocks.length) {
    return para(runsFromHTML(host.innerHTML, baseRun),
      { line: lineTw, after: pxTw(d.paraGap), align: d.textAlign,
        ind: d.paraIndent ? { firstLine: pxTw(d.paraIndent) } : null });
  }

  blocks.forEach(function (b) {
    if (b.tagName === "UL" || b.tagName === "OL") {
      $$(":scope > li", b).forEach(function (li) {
        out += para(runsFromHTML(li.innerHTML, baseRun), {
          numId: 1, line: lineTw, after: pxTw(d.bulletGap),
          ind: { left: Math.max(230, pxTw(d.bulletIndent)), hanging: 180 }
        });
      });
    } else {
      var al = b.style && b.style.textAlign ? b.style.textAlign : d.textAlign;
      out += para(runsFromHTML(b.innerHTML, baseRun),
        { line: lineTw, after: pxTw(d.paraGap), align: al,
          ind: d.paraIndent ? { firstLine: pxTw(d.paraIndent) } : null });
    }
  });
  return out;
}

var XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
var W_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

function exportDOCX(st) {
  var d = st.design;
  var bodyFont = fontName(d.fontFamily) || "Times New Roman";

  var document_xml = XML_HEAD + "<w:document " + W_NS + "><w:body>" + docxBody(st) + "</w:body></w:document>";

  var styles_xml = XML_HEAD + "<w:styles " + W_NS + ">" +
    "<w:docDefaults><w:rPrDefault><w:rPr>" +
      '<w:rFonts w:ascii="' + xml(bodyFont) + '" w:hAnsi="' + xml(bodyFont) +
      '" w:cs="' + xml(bodyFont) + '"/>' +
      '<w:sz w:val="' + pxHalfPt(d.fontSize) + '"/><w:szCs w:val="' + pxHalfPt(d.fontSize) + '"/>' +
      '<w:color w:val="' + (hex(d.textColor) || "111111") + '"/>' +
    "</w:rPr></w:rPrDefault>" +
    "<w:pPrDefault><w:pPr><w:spacing w:after=\"0\" w:line=\"" +
      Math.round(d.lineHeight * 240) + "\" w:lineRule=\"auto\"/></w:pPr></w:pPrDefault>" +
    "</w:docDefaults>" +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">' +
      '<w:name w:val="Normal"/><w:qFormat/></w:style>' +
    "</w:styles>";

  var numbering_xml = XML_HEAD + "<w:numbering " + W_NS + ">" +
    '<w:abstractNum w:abstractNumId="0">' +
      '<w:multiLevelType w:val="hybridMultilevel"/>' +
      '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/>' +
        '<w:lvlText w:val="•"/><w:lvlJc w:val="left"/>' +
        '<w:pPr><w:ind w:left="360" w:hanging="180"/></w:pPr>' +
        '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:hint="default"/></w:rPr></w:lvl>' +
      '<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/>' +
        '<w:lvlText w:val="◦"/><w:lvlJc w:val="left"/>' +
        '<w:pPr><w:ind w:left="720" w:hanging="180"/></w:pPr>' +
        '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:hint="default"/></w:rPr></w:lvl>' +
    "</w:abstractNum>" +
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>' +
    "</w:numbering>";

  var content_types = XML_HEAD +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
    "</Types>";

  var rels = XML_HEAD +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    "</Relationships>";

  var docRels = XML_HEAD +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
    "</Relationships>";

  var blob = zip([
    { name: "[Content_Types].xml", data: content_types },
    { name: "_rels/.rels", data: rels },
    { name: "word/_rels/document.xml.rels", data: docRels },
    { name: "word/document.xml", data: document_xml },
    { name: "word/styles.xml", data: styles_xml },
    { name: "word/numbering.xml", data: numbering_xml }
  ]);

  U.download(fileName(st, "docx"), blob);
  U.toast(t("msgDocx"));
}

var FONT_LINK = "https://fonts.googleapis.com/css2?" + [
  "family=EB+Garamond:ital,wght@0,400;0,600;1,400",
  "family=Source+Serif+4:ital,wght@0,400;0,600;1,400",
  "family=Libre+Baskerville:ital,wght@0,400;0,700;1,400",
  "family=Crimson+Pro:ital,wght@0,400;0,600;1,400",
  "family=Playfair+Display:ital,wght@0,400;0,700;1,400",
  "family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400",
  "family=Lora:ital,wght@0,400;0,700;1,400",
  "family=Merriweather:ital,wght@0,400;0,700;1,400",
  "family=PT+Serif:ital,wght@0,400;0,700;1,400",
  "family=Inter:wght@300;400;600;700",
  "family=Source+Sans+3:ital,wght@0,400;0,600;1,400",
  "family=Lato:ital,wght@0,300;0,400;0,700;1,400",
  "family=Roboto:ital,wght@0,400;0,700;1,400",
  "family=Open+Sans:ital,wght@0,400;0,700;1,400",
  "family=Montserrat:wght@400;600;700",
  "family=Poppins:wght@400;600;700",
  "family=Work+Sans:wght@400;600;700",
  "family=Manrope:wght@400;600;700",
  "family=Karla:wght@400;700",
  "family=Raleway:wght@400;600;700",
  "family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400",
  "family=IBM+Plex+Mono:wght@400;600",
  "family=JetBrains+Mono:wght@400;700",
  "family=Space+Grotesk:wght@400;600;700"
].join("&") + "&display=swap";

function cleanClone(st) {
  var clone = CVF.render.root.cloneNode(true);
  clone.classList.remove("cv-live");
  $$(".cv-guides, .cv-pagenum", clone).forEach(function (n) { n.remove(); });
  $$("[contenteditable]", clone).forEach(function (n) {
    n.removeAttribute("contenteditable");
    n.removeAttribute("data-rt");
    n.removeAttribute("data-path");
    n.removeAttribute("data-mode");
    n.removeAttribute("data-ph");
    n.removeAttribute("spellcheck");
    n.classList.remove("ed", "is-empty", "is-editing");
    if (!n.className) n.removeAttribute("class");
  });
  $$("[data-region], [data-lvl-path]", clone).forEach(function (n) {
    n.removeAttribute("data-region");
    n.removeAttribute("data-lvl-path");
    n.removeAttribute("data-lvl");
  });
  return clone;
}

function exportHTML(st) {
  var d = st.design;
  var page = "@page{ size:" + (d.pageSize === "legal" ? "legal" : d.pageSize) +
    "; margin:" + d.marginTop + "mm " + d.marginRight + "mm " +
    d.marginBottom + "mm " + d.marginLeft + "mm; }";

  var doc = "<!DOCTYPE html>\n<html lang=\"" + CVF.i18n.lang + "\">\n<head>\n" +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<title>" + U.esc(U.htmlToText(st.header.name, " ") || "CV") + "</title>\n" +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="' + FONT_LINK + '" rel="stylesheet">\n' +
    "<style>\n" +
    "html,body{margin:0;background:#e8e8ea;}\n" +
    "body{display:flex;justify-content:center;padding:18px 0;}\n" +
    ".cv{box-shadow:0 12px 40px rgba(0,0,0,.22);}\n" +
    "@media print{html,body{background:#fff;}body{padding:0;display:block;}.cv{box-shadow:none;}}\n" +
    page + "\n" + CVF.docStyle + "\n</style>\n</head>\n<body>\n" +
    cleanClone(st).outerHTML + "\n</body>\n</html>\n";

  U.download(fileName(st, "html"), doc, "text/html;charset=utf-8");
  U.toast(t("msgHtml"));
}

function exportTXT(st) {
  var L = [], contacts = [];
  var T = function (h) { return U.htmlToText(h, " "); };

  L.push(T(st.header.name).toUpperCase());
  (st.header.contacts || []).forEach(function (c) {
    if (!U.isEmptyHTML(c.text)) contacts.push(T(c.text));
  });
  if (contacts.length) L.push(contacts.join(" | "));
  if (!U.isEmptyHTML(st.header.tagline)) L.push(T(st.header.tagline));

  st.sections.forEach(function (sec) {
    if (!sec.visible) return;
    L.push("", T(sec.title).toUpperCase(), "-".repeat(Math.max(4, T(sec.title).length)));
    sec.items.forEach(function (it) {
      if (sec.type === "entries") {
        var head = [T(it.left), T(it.right)].filter(Boolean).join("  —  ");
        if (head) L.push(head);
        (it.subs || []).forEach(function (s) {
          var line = [T(s.left), T(s.right)].filter(Boolean).join("  —  ");
          if (line) L.push("  " + line);
        });
        if (!U.isEmptyHTML(it.text)) L.push("  " + T(it.text));
        (it.bullets || []).forEach(function (b) {
          if (!U.isEmptyHTML(b)) L.push("  - " + T(b));
        });
        L.push("");
      } else if (sec.type === "rows") {
        L.push(T(it.label) + " " + T(it.content));
      } else if (sec.type === "bars") {
        var lvl = U.clamp(parseInt(it.level, 10) || 0, 0, 5);
        L.push(T(it.label) + ": " + lvl + "/5" + (U.isEmptyHTML(it.note) ? "" : " (" + T(it.note) + ")"));
      } else if (!U.isEmptyHTML(it.text)) {
        L.push((sec.type === "list" ? "- " : "") + T(it.text));
      }
    });
  });

  U.download(fileName(st, "txt"), L.join("\n").replace(/\n{3,}/g, "\n\n") + "\n",
    "text/plain;charset=utf-8");
  U.toast(t("msgTxt"));
}

function exportMD(st) {
  var L = [], M = U.htmlToMd, T = function (h) { return U.htmlToText(h, " "); };
  var contacts = (st.header.contacts || []).filter(function (c) { return !U.isEmptyHTML(c.text); })
    .map(function (c) { return c.link ? "[" + T(c.text) + "](" + c.link + ")" : T(c.text); });

  L.push("# " + M(st.header.name));
  if (contacts.length) L.push("", contacts.join(" · "));
  if (!U.isEmptyHTML(st.header.tagline)) L.push("", "*" + M(st.header.tagline) + "*");

  st.sections.forEach(function (sec) {
    if (!sec.visible) return;
    L.push("", "## " + M(sec.title), "");
    sec.items.forEach(function (it) {
      if (sec.type === "entries") {
        var head = "**" + M(it.left) + "**";
        if (!U.isEmptyHTML(it.right)) head += " — " + M(it.right);
        L.push(head);
        (it.subs || []).forEach(function (s) {
          if (U.isEmptyHTML(s.left) && U.isEmptyHTML(s.right)) return;
          L.push("*" + M(s.left) + "*" + (U.isEmptyHTML(s.right) ? "" : " — " + M(s.right)));
        });
        if (!U.isEmptyHTML(it.text)) L.push("", M(it.text));
        (it.bullets || []).forEach(function (b) {
          if (!U.isEmptyHTML(b)) L.push("- " + M(b));
        });
        L.push("");
      } else if (sec.type === "rows") {
        L.push("- **" + M(it.label) + "** " + M(it.content));
      } else if (sec.type === "bars") {
        var lvl = U.clamp(parseInt(it.level, 10) || 0, 0, 5);
        L.push("- **" + M(it.label) + "** " + "●".repeat(lvl) + "○".repeat(5 - lvl) +
          (U.isEmptyHTML(it.note) ? "" : " — " + M(it.note)));
      } else if (!U.isEmptyHTML(it.text)) {
        L.push((sec.type === "list" ? "- " : "") + M(it.text));
      }
    });
  });

  U.download(fileName(st, "md"), L.join("\n").replace(/\n{3,}/g, "\n\n") + "\n",
    "text/markdown;charset=utf-8");
  U.toast(t("msgMd"));
}

function exportJSON(st) {
  U.download(fileName(st, "json"), JSON.stringify(st, null, 2), "application/json");
  U.toast(t("msgJson"));
}

function fileName(st, ext) {
  return "CV_" + U.slug(U.htmlToText(st.header.name, "_")) + "." + ext;
}

CVF.exporter = {
  json: exportJSON, html: exportHTML, docx: exportDOCX,
  txt: exportTXT, md: exportMD, fileName: fileName, zip: zip
};

})();
