# CV Forge — Resume Builder

A web editor to create, customize, and export resumes in the Harvard format along with 11 other designs. Edit **directly on the page, just like in Word**: click on any text and start typing with bold, custom fonts, sizes, colors, and keyboard shortcuts.

Runs entirely in your browser: no servers, no accounts, and your data never leaves your device. Designed to be hosted for free on GitHub Pages and shared via link.

Interface available in **English and Spanish**, featuring **Dark and Light modes**.

---

## Features

### Rich Text Editor

No need to write Markdown syntax: edit just like a word processor, both on the page and inside the side panel inputs.

- **Ctrl+B** bold · **Ctrl+I** italic · **Ctrl+U** underline · **Ctrl+Shift+X** strikethrough
- **Ctrl+K** link · **Ctrl+\\** clear formatting · **Ctrl+Z / Ctrl+Shift+Z** undo and redo
- Persistent toolbar: typography, font size (6–72), text color, highlight, superscript and subscript, case conversion, text alignment, bulleted/numbered lists, and letter spacing.
- In lists, **Enter** creates a new bullet and **Tab** indents it.
- Smart clipboard cleaner: pasting from the web or Word keeps clean formatting and strips unnecessary styles automatically.

### Content

- Header with full name, subtitle/headline, optional photo, and custom contact items with individual icons and links.
- Six mix-and-match section types:
  - **Entries** — experience, education, projects: title, right-side metadata column, unlimited subtitles, paragraph, and bullet points.
  - **Label / Value pairs** — skills, languages, tools.
  - **List** — certifications, publications, awards.
  - **Paragraph** — summary, bio, or objective.
  - **Tags** — tech stacks and skills as badges.
  - **Level Bars** — languages or tools rated on a 5-point scale.
- Reorder items via **drag-and-drop**, plus options to duplicate, hide, or remove sections, entries, bullets, and contact links.
- **Manage multiple resumes**: create separate versions tailored to different job roles, duplicate, and rename them.
- **Version history**: save named snapshots with timestamps and restore them at any time.
- Autosave and unlimited undo/redo within the active session.

### Customization

Over 90 real-time controls:

- Letter, A4, or Legal page sizes, with 4 independent margins in millimeters (or locked together).
- **Single or two-column** layout, customizable sidebar width, position, gap, background, and padding.
- 38 fonts with independent font families for body text, headings, and name. Fine-tune font sizes with 0.1 px precision, line-height, letter/word spacing, text justification, indentation, and paragraph margins.
- Header layouts: stacked, right-aligned contact info, or colored banner; custom alignment, size, weight, uppercase, small caps, tracking, color, background, padding, icons, and configurable separators.
- Section headings with 6 styles: bottom border, short underline, background pill, left accent bar, full box, or clean text. Independent line weight, style, and offset controls.
- Independent spacing between sections, entries, and bullets; bullet icon shape and color; list indent; label width and weight.
- Color controls for text, page background, accent, name, headings, divider lines, and hyperlinks, plus **10 preset color palettes**.
- Sections configurable in 1, 2, or 3 columns with custom accent colors.
- **12 built-in templates**: Harvard Classic, Harvard Compact, Editorial, Modern Two-Column, Colored Sidebar, Minimalist, Ribbon Headings, Europass Style, Academic, Technical / ATS, Swiss, and Boxed.
- **Fit to 1 or 2 pages**: automatically reduces font sizes and spacing until all content fits cleanly.

### Analysis & Review

- Live counter for words, characters, bullets, total pages, and last page fill percentage.
- 14 automated ATS and quality checks: presence of email and phone, length, print-safe margins, readable font sizes, ATS-friendly typography, column count, photo check, bullet length, quantifiable metrics/numbers, filler action verbs ("Responsible for..."), missing entry dates, empty fields, and last page whitespace balance.
- **Job match comparison**: paste any job description to instantly see matched keywords, missing terms, and an overall match score. Everything runs client-side; no job description data is transmitted.

### Export Options

- **PDF** via the browser print dialog, configured with native `@page` CSS margins and clean page-break rules.
- **Native Word (.docx)**: built directly in the browser (ZIP + WordprocessingML) without external dependencies. Opens and edits seamlessly in Word, LibreOffice, or Google Docs, preserving styles, bold/italics, colors, sizes, date tabs, and bullet formatting.
- **Standalone HTML**: single-file export with all styles embedded; opens offline in any browser.
- **Plain text** and **Markdown**: ideal for copy-pasting into text-only ATS application portals.
- **.json project file**: backup, import, or resume editing later.

---

## File Structure

```text
cv-forge/
├── index.html            ← main entry point
├── assets/
│   ├── app.css           ← UI styles (dark and light themes)
│   └── js/
│       ├── core.js       ← utilities, HTML sanitization, storage
│       ├── i18n.js       ← UI localization (es / en)
│       ├── docstyle.js   ← DOCUMENT styles (see note below)
│       ├── data.js       ← fonts, default layout, palettes, templates, sample data
│       ├── richtext.js   ← rich text editor engine and formatting toolbar
│       ├── render.js     ← document renderer and design variables
│       ├── review.js     ← metrics, quality checks, and job description matcher
│       ├── panel.js      ← sidebar control panel
│       ├── export.js     ← PDF, HTML, .docx, plain text, Markdown, JSON exporters
│       └── app.js        ← state management, versioning, multi-resume logic, shortcuts
├── .nojekyll             ← disables Jekyll processing on GitHub Pages
├── LICENSE
└── README.md