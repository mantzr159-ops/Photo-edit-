/**
 * Built-in template library. All artwork is original and constructed from
 * editable primitives (text, shapes, icons, frames) — no third-party assets.
 */
import type { TemplateDef } from "@/lib/design/types";
import { bg, body, circle, emoji, frame, heading, icon, lin, line, page, rad, rect, shape, template, text } from "./builders";

const INK = "#16132b";

export const BUILTIN_TEMPLATES: TemplateDef[] = [
  /* ───────────── Instagram Posts ───────────── */
  template("ig-launch", "Bold Product Launch", "Instagram Posts", 1080, 1080, ["launch", "product", "sale", "gradient"], [
    page(bg(lin(135, "#7444ff", "#b14dff", "#ff6b5a")), [
      circle(-160, -160, 620, "rgba(255,255,255,0.12)"),
      circle(700, 720, 520, "rgba(255,255,255,0.10)"),
      text("NEW ARRIVAL", 90, 120, 600, { fontSize: 30, fontWeight: 700, letterSpacing: 8, fill: "#ffffff", fontFamily: "Inter" }),
      heading("Meet the\nfuture of\nsound.", 90, 190, 900, { fontSize: 140, fill: "#ffffff" }),
      body("Wireless. Weightless. Wonderfully clear.", 90, 700, 800, { fill: "rgba(255,255,255,0.86)", fontSize: 36 }),
      rect(90, 840, 340, 96, "#ffffff", { cornerRadius: 48 }),
      text("Shop now →", 90, 868, 340, { align: "center", fontSize: 34, fontWeight: 700, fill: "#6328f5", fontFamily: "Plus Jakarta Sans" }),
    ]),
  ]),
  template("ig-quote", "Minimal Quote", "Instagram Posts", 1080, 1080, ["quote", "minimal", "inspiration"], [
    page(bg("#f7f3ec"), [
      text("“", 90, 40, 300, { fontSize: 360, fontFamily: "Playfair Display", fill: "#ff6b5a", lineHeight: 1 }),
      text("Creativity is intelligence having fun.", 120, 360, 840, { fontSize: 84, fontFamily: "Playfair Display", fontWeight: 600, lineHeight: 1.2, fill: INK }),
      line(120, 790, 120, "#ff6b5a", { strokeWidth: 6 }),
      text("ALBERT EINSTEIN", 120, 830, 600, { fontSize: 28, letterSpacing: 6, fontWeight: 600, fill: "#6b6585" }),
    ]),
  ]),
  template("ig-sale", "Flash Sale", "Instagram Posts", 1080, 1080, ["sale", "discount", "retail"], [
    page(bg("#16132b"), [
      shape("star", 600, -60, 560, 560, "#ffd23f", { sides: 12, innerRadiusRatio: 0.82, rotation: 12 }),
      text("UP TO", 700, 140, 300, { align: "center", fontSize: 44, fontWeight: 800, fill: INK, fontFamily: "Plus Jakarta Sans" }),
      text("50%", 680, 190, 340, { align: "center", fontSize: 150, fontWeight: 900, fill: INK, fontFamily: "Anton" }),
      heading("FLASH\nSALE", 90, 470, 900, { fontFamily: "Anton", fontWeight: 400, fontSize: 230, letterSpacing: 4, fill: "#ffffff", lineHeight: 0.95 }),
      body("This weekend only · Online & in store", 90, 950, 900, { fill: "#b8b3cc", fontSize: 34 }),
    ]),
  ]),
  template("ig-photo-card", "Photo Feature Card", "Instagram Posts", 1080, 1350, ["photo", "travel", "frame"], [
    page(bg("#ffffff"), [
      frame("rounded", 70, 70, 940, 900, { cornerRadius: 40 }),
      text("TRAVEL DIARIES", 70, 1020, 900, { fontSize: 28, letterSpacing: 6, fontWeight: 700, fill: "#7444ff" }),
      heading("Golden hour in Lisbon", 70, 1070, 940, { fontSize: 76, fill: INK }),
      body("Swipe for the full guide →", 70, 1240, 900, { fontSize: 30 }),
    ]),
  ]),

  /* ───────────── Instagram Stories / TikTok ───────────── */
  template("story-event", "Event Countdown Story", "Instagram Stories", 1080, 1920, ["event", "countdown", "story"], [
    page(bg(lin(90, "#0f2027", "#2c5364")), [
      circle(140, 260, 800, rad("rgba(116,68,255,0.65)", "rgba(116,68,255,0)")),
      text("SAVE THE DATE", 90, 300, 900, { align: "center", fontSize: 36, letterSpacing: 10, fontWeight: 700, fill: "#9fe7ff" }),
      heading("Design\nSummit\n2026", 90, 420, 900, { align: "center", fontSize: 180, fill: "#ffffff" }),
      rect(190, 1180, 700, 200, "rgba(255,255,255,0.1)", { cornerRadius: 36, stroke: "rgba(255,255,255,0.3)", strokeWidth: 2 }),
      text("12 · 14 · 22\nDAYS  HRS  MIN", 190, 1215, 700, { align: "center", fontSize: 52, fontWeight: 700, fill: "#ffffff", lineHeight: 1.4, fontFamily: "Space Grotesk" }),
      body("Tap the link to grab your seat", 90, 1640, 900, { align: "center", fill: "#cfe8f2", fontSize: 38 }),
    ]),
  ]),
  template("story-poll", "Ask Me Anything", "Instagram Stories", 1080, 1920, ["q&a", "poll", "pastel"], [
    page(bg(lin(160, "#ffecd2", "#fcb69f")), [
      emoji("💬", 400, 380, 280),
      heading("Ask me\nanything", 90, 720, 900, { align: "center", fontSize: 150, fill: INK, fontFamily: "Fraunces" }),
      rect(140, 1180, 800, 260, "#ffffff", { cornerRadius: 40, shadow: { enabled: true, color: "#c46a4a", blur: 40, offsetX: 0, offsetY: 16, opacity: 0.25 } }),
      body("Type your question here…", 190, 1280, 700, { align: "center", fill: "#a49dc4", fontSize: 40 }),
    ]),
  ]),
  template("tiktok-cover", "TikTok Tutorial Cover", "TikTok", 1080, 1920, ["tiktok", "tutorial", "neon"], [
    page(bg("#0b0820"), [
      rect(-100, 380, 1300, 360, "#00f2ea", { rotation: -8 }),
      rect(-100, 420, 1300, 360, "#ff0050", { rotation: -8, opacity: 0.9 }),
      heading("5 EDITING\nHACKS", 70, 470, 960, { fontFamily: "Anton", fontWeight: 400, fontSize: 170, fill: "#ffffff", rotation: -8, lineHeight: 0.95 }),
      text("you need to know", 90, 1000, 900, { fontFamily: "Caveat", fontSize: 110, fill: "#ffd23f", align: "center" }),
      emoji("🔥", 420, 1300, 240),
    ]),
  ]),

  /* ───────────── Social Media / YouTube ───────────── */
  template("social-announcement", "Company Announcement", "Social Media", 1200, 630, ["announcement", "corporate", "linkedin"], [
    page(bg("#ffffff"), [
      rect(0, 0, 440, 630, lin(160, "#7444ff", "#4517b0")),
      icon("Megaphone", 120, 215, 200, "#ffffff", 1.6),
      text("ANNOUNCEMENT", 500, 140, 640, { fontSize: 22, letterSpacing: 6, fontWeight: 700, fill: "#7444ff" }),
      heading("We’re opening our new studio in Berlin", 500, 190, 640, { fontSize: 58, fill: INK }),
      body("Join us for the launch event on May 18.", 500, 470, 640, { fontSize: 26 }),
    ]),
  ]),
  template("yt-thumb-vs", "YouTube Versus Thumbnail", "YouTube Thumbnails", 1280, 720, ["youtube", "versus", "comparison"], [
    page(bg(lin(0, "#ff3b6b", "#7444ff")), [
      frame("rounded", 60, 120, 480, 480, { cornerRadius: 30, stroke: "#ffffff", strokeWidth: 10 }),
      frame("rounded", 740, 120, 480, 480, { cornerRadius: 30, stroke: "#ffffff", strokeWidth: 10 }),
      circle(560, 280, 160, "#ffd23f", { stroke: INK, strokeWidth: 8 }),
      text("VS", 560, 318, 160, { align: "center", fontFamily: "Anton", fontSize: 80, fill: INK }),
      heading("WHICH IS BETTER?", 60, 620, 1160, { align: "center", fontFamily: "Anton", fontWeight: 400, fontSize: 80, fill: "#ffffff", stroke: INK, strokeWidth: 4, lineHeight: 1 }),
    ]),
  ]),
  template("yt-thumb-howto", "How-To Thumbnail", "YouTube Thumbnails", 1280, 720, ["youtube", "how to", "tutorial"], [
    page(bg("#ffd23f"), [
      frame("circle", 700, 60, 600, 600, { stroke: INK, strokeWidth: 12 }),
      heading("BAKE\nBREAD\nIN 1 HOUR", 60, 90, 680, { fontFamily: "Anton", fontWeight: 400, fontSize: 150, fill: INK, lineHeight: 0.95 }),
      rect(60, 600, 300, 70, INK, { cornerRadius: 12 }),
      text("NO YEAST!", 60, 612, 300, { align: "center", fontSize: 40, fontWeight: 800, fill: "#ffd23f" }),
    ]),
  ]),

  /* ───────────── Presentations ───────────── */
  template("pres-pitch", "Startup Pitch Deck", "Presentations", 1920, 1080, ["pitch", "startup", "deck"], [
    page(bg(lin(135, "#16132b", "#3a168f")), [
      circle(1300, -200, 900, rad("rgba(177,77,255,0.55)", "rgba(177,77,255,0)")),
      text("SERIES A · 2026", 140, 200, 900, { fontSize: 32, letterSpacing: 8, fontWeight: 700, fill: "#b5a3ff" }),
      heading("Lumen Health", 140, 280, 1400, { fontSize: 180, fill: "#ffffff" }),
      body("Making preventive care effortless for 100 million people.", 140, 520, 1200, { fontSize: 46, fill: "#d4caff" }),
      line(140, 880, 200, "#ff6b5a", { strokeWidth: 8 }),
      body("Investor presentation", 140, 910, 900, { fontSize: 30, fill: "#b8b3cc" }),
    ], "Title"),
    page(bg("#ffffff"), [
      text("THE PROBLEM", 140, 140, 900, { fontSize: 28, letterSpacing: 6, fontWeight: 700, fill: "#7444ff" }),
      heading("Chronic disease is caught too late.", 140, 200, 1640, { fontSize: 88, fill: INK }),
      ...[0, 1, 2].flatMap((i) => [
        rect(140 + i * 560, 520, 500, 400, "#f4f2fb", { cornerRadius: 28 }),
        icon(["Clock", "TrendingUp", "Users"][i], 200 + i * 560, 580, 96, "#7444ff"),
        heading(["7 yrs", "$3.8T", "60%"][i], 200 + i * 560, 700, 400, { fontSize: 72, fill: INK }),
        body(["average diagnosis delay", "annual cost in the US", "of adults affected"][i], 200 + i * 560, 800, 400, { fontSize: 28 }),
      ]),
    ], "Problem"),
    page(bg("#ffffff"), [
      text("OUR SOLUTION", 140, 140, 900, { fontSize: 28, letterSpacing: 6, fontWeight: 700, fill: "#7444ff" }),
      heading("Continuous screening,\nzero friction.", 140, 200, 900, { fontSize: 88, fill: INK }),
      body("A wearable + AI companion that flags risk months earlier and books the right specialist automatically.", 140, 480, 820, { fontSize: 36 }),
      frame("rounded", 1060, 140, 720, 800, { cornerRadius: 40 }),
    ], "Solution"),
  ]),
  template("pres-lesson", "Lesson Slides", "Presentations", 1920, 1080, ["lesson", "education", "class"], [
    page(bg("#fdf0d5"), [
      shape("blob", 1200, 300, 800, 800, "#f77f00", { opacity: 0.9 }),
      text("UNIT 3", 140, 220, 600, { fontSize: 36, letterSpacing: 8, fontWeight: 700, fill: "#c1121f" }),
      heading("The Water Cycle", 140, 300, 1200, { fontSize: 150, fill: "#003049", fontFamily: "Fraunces" }),
      body("Evaporation · Condensation · Precipitation · Collection", 140, 520, 1100, { fontSize: 40, fill: "#335c67" }),
      icon("CloudRain", 1440, 470, 360, "#ffffff", 1.5),
    ], "Title"),
  ]),

  /* ───────────── Posters & Flyers ───────────── */
  template("poster-concert", "Concert Poster", "Posters", 1728, 2304, ["music", "concert", "event"], [
    page(bg("#0b0820"), [
      circle(214, 300, 1300, lin(45, "#ff0844", "#ffb199")),
      circle(514, 600, 700, "#0b0820"),
      heading("NEON\nNIGHTS", 120, 1450, 1500, { fontFamily: "Bebas Neue", fontWeight: 400, fontSize: 380, fill: "#ffffff", lineHeight: 0.9, letterSpacing: 10 }),
      text("LIVE AT THE WAREHOUSE · AUG 21 · 9PM", 120, 2130, 1500, { fontSize: 48, letterSpacing: 6, fontWeight: 600, fill: "#ffb199" }),
    ]),
  ]),
  template("poster-exhibit", "Art Exhibition Poster", "Posters", 1728, 2304, ["art", "exhibition", "gallery", "minimal"], [
    page(bg("#f4f2fb"), [
      rect(140, 140, 1448, 1400, "#7444ff"),
      shape("ellipse", 400, 380, 900, 900, "#ff6b5a"),
      shape("triangle", 760, 700, 700, 640, "#ffd23f", { opacity: 0.95 }),
      heading("Form &\nColour", 140, 1620, 1448, { fontSize: 220, fill: INK, fontFamily: "DM Serif Display", fontWeight: 400 }),
      body("Modern Abstraction 1950–1980 · City Gallery · Opens March 3", 140, 2100, 1448, { fontSize: 44, fill: "#4a4566" }),
    ]),
  ]),
  template("flyer-cafe", "Café Opening Flyer", "Flyers", 1240, 1754, ["cafe", "coffee", "opening", "food"], [
    page(bg("#3a2a20", { pattern: { kind: "dots", color: "#ffffff", opacity: 0.06, scale: 1.4 } }), [
      icon("Coffee", 470, 160, 300, "#f6c28b", 1.4),
      text("Grand Opening", 90, 520, 1060, { align: "center", fontFamily: "Great Vibes", fontSize: 150, fill: "#f6c28b" }),
      heading("THE DAILY GRIND", 90, 720, 1060, { align: "center", fontSize: 100, fill: "#fff6ec", fontFamily: "Oswald", fontWeight: 600, letterSpacing: 6 }),
      line(420, 900, 400, "#f6c28b", { strokeWidth: 4 }),
      body("Free pastry with every drink\nSaturday 8am – 4pm\n24 Market Street", 90, 960, 1060, { align: "center", fontSize: 48, fill: "#f3e3d3", lineHeight: 1.7 }),
      rect(370, 1450, 500, 120, "#f6c28b", { cornerRadius: 60 }),
      text("See you there!", 370, 1485, 500, { align: "center", fontSize: 44, fontWeight: 700, fill: "#3a2a20" }),
    ]),
  ]),
  template("flyer-realestate", "Open House Flyer", "Flyers", 1240, 1754, ["real estate", "house", "business"], [
    page(bg("#ffffff"), [
      frame("none", 0, 0, 1240, 900),
      rect(0, 860, 1240, 894, "#0f4c81"),
      heading("OPEN HOUSE", 90, 930, 1060, { fontSize: 120, fill: "#ffffff", fontFamily: "Montserrat", fontWeight: 800 }),
      body("4 bed · 3 bath · 2,400 sq ft · Private garden", 90, 1100, 1060, { fontSize: 40, fill: "#cfe1f2" }),
      ...[0, 1, 2].flatMap((i) => [
        icon(["BedDouble", "Bath", "Trees"][i], 90 + i * 360, 1260, 90, "#ffd23f"),
        text(["4 Bedrooms", "3 Bathrooms", "Garden"][i], 200 + i * 360, 1282, 240, { fontSize: 34, fontWeight: 600, fill: "#ffffff" }),
      ]),
      body("Sunday 1–4pm · 18 Willow Lane", 90, 1520, 1060, { fontSize: 44, fontWeight: 700, fill: "#ffffff" }),
    ]),
  ]),

  /* ───────────── Business Cards ───────────── */
  template("card-modern", "Modern Business Card", "Business Cards", 1050, 600, ["business card", "corporate", "minimal"], [
    page(bg("#16132b"), [
      rect(0, 0, 18, 600, lin(90, "#7444ff", "#ff6b5a")),
      heading("Alex Morgan", 90, 170, 800, { fontSize: 68, fill: "#ffffff" }),
      text("Creative Director", 90, 260, 800, { fontSize: 30, fill: "#b5a3ff", fontWeight: 500 }),
      ...[0, 1, 2].flatMap((i) => [
        icon(["Phone", "Mail", "Globe"][i], 90, 360 + i * 56, 32, "#b8b3cc"),
        text(["+1 (555) 012-3456", "alex@studio.example", "studio.example"][i], 140, 362 + i * 56, 600, { fontSize: 26, fill: "#e6e3f2" }),
      ]),
    ], "Front"),
    page(bg(lin(135, "#7444ff", "#ff6b5a")), [
      shape("star", 425, 200, 200, 200, "#ffffff", { sides: 4, innerRadiusRatio: 0.35 }),
      text("MORGAN STUDIO", 0, 440, 1050, { align: "center", fontSize: 34, letterSpacing: 10, fontWeight: 700, fill: "#ffffff" }),
    ], "Back"),
  ]),
  template("card-botanical", "Botanical Card", "Business Cards", 1050, 600, ["business card", "florist", "nature"], [
    page(bg("#f1f5ee"), [
      icon("Leaf", 760, 80, 240, "#3a5a40", 1.2),
      heading("Fern & Bloom", 80, 180, 700, { fontFamily: "Cormorant Garamond", fontWeight: 600, fontSize: 84, fill: "#3a5a40" }),
      text("FLORAL DESIGN", 80, 290, 700, { fontSize: 24, letterSpacing: 8, fill: "#588157", fontWeight: 600 }),
      body("hello@fernbloom.example · (555) 019-2233", 80, 470, 900, { fontSize: 24, fill: "#3a5a40" }),
    ]),
  ]),

  /* ───────────── CV / Resume ───────────── */
  template("resume-clean", "Clean Resume", "CV / Resume", 1275, 1650, ["resume", "cv", "job", "professional"], [
    page(bg("#ffffff"), [
      rect(0, 0, 420, 1650, "#f4f2fb"),
      frame("circle", 90, 90, 240, 240),
      text("CONTACT", 70, 400, 300, { fontSize: 22, letterSpacing: 4, fontWeight: 700, fill: "#7444ff" }),
      body("jordan@mail.example\n(555) 010-2020\nPortland, OR\nportfolio.example", 70, 440, 300, { fontSize: 22, lineHeight: 1.8 }),
      text("SKILLS", 70, 680, 300, { fontSize: 22, letterSpacing: 4, fontWeight: 700, fill: "#7444ff" }),
      body("Product strategy\nUX research\nFigma & prototyping\nDesign systems\nData storytelling", 70, 720, 300, { fontSize: 22, lineHeight: 1.8 }),
      text("LANGUAGES", 70, 1000, 300, { fontSize: 22, letterSpacing: 4, fontWeight: 700, fill: "#7444ff" }),
      body("English — native\nSpanish — fluent", 70, 1040, 300, { fontSize: 22, lineHeight: 1.8 }),
      heading("Jordan Rivera", 500, 100, 700, { fontSize: 72, fill: INK }),
      text("Senior Product Designer", 500, 190, 700, { fontSize: 32, fill: "#7444ff", fontWeight: 600 }),
      body("Designer with 8 years of experience shipping consumer products used by millions. Passionate about accessible, data-informed design.", 500, 260, 690, { fontSize: 22 }),
      text("EXPERIENCE", 500, 420, 690, { fontSize: 22, letterSpacing: 4, fontWeight: 700, fill: INK }),
      line(500, 460, 690, "#e6e3f2", { strokeWidth: 2 }),
      ...[0, 1, 2].flatMap((i) => [
        text(["Lead Designer · Brightwave", "Product Designer · Northstar", "UX Designer · Pixel & Co"][i], 500, 490 + i * 240, 690, { fontSize: 26, fontWeight: 700, fill: INK }),
        text(["2022 — Present", "2019 — 2022", "2017 — 2019"][i], 500, 530 + i * 240, 690, { fontSize: 20, fill: "#6b6585" }),
        body(["Led redesign of the core app, lifting retention 18%. Built a 120-component design system.", "Owned onboarding and payments flows; ran 40+ usability studies.", "Designed responsive marketing sites and an internal analytics tool."][i], 500, 570 + i * 240, 690, { fontSize: 22 }),
      ]),
      text("EDUCATION", 500, 1240, 690, { fontSize: 22, letterSpacing: 4, fontWeight: 700, fill: INK }),
      line(500, 1280, 690, "#e6e3f2", { strokeWidth: 2 }),
      text("BFA Interaction Design · State University", 500, 1310, 690, { fontSize: 26, fontWeight: 700, fill: INK }),
      text("2013 — 2017", 500, 1350, 690, { fontSize: 20, fill: "#6b6585" }),
    ]),
  ]),

  /* ───────────── Infographics ───────────── */
  template("info-steps", "Process Infographic", "Infographics", 1080, 2160, ["infographic", "steps", "process", "data"], [
    page(bg("#ffffff"), [
      rect(0, 0, 1080, 520, lin(135, "#00a6fb", "#7444ff")),
      text("HOW IT WORKS", 90, 120, 900, { fontSize: 30, letterSpacing: 8, fontWeight: 700, fill: "#e6f6ff" }),
      heading("From idea to launch in 4 steps", 90, 180, 900, { fontSize: 88, fill: "#ffffff" }),
      ...[0, 1, 2, 3].flatMap((i) => {
        const y = 640 + i * 360;
        return [
          circle(90, y, 160, i % 2 ? "#ff6b5a" : "#7444ff"),
          text(String(i + 1).padStart(2, "0"), 90, y + 45, 160, { align: "center", fontSize: 60, fontWeight: 800, fill: "#ffffff", fontFamily: "Plus Jakarta Sans" }),
          ...(i < 3 ? [rect(166, y + 175, 8, 170, "#d4caff", { cornerRadius: 4 })] : []),
          heading(["Research", "Design", "Build", "Launch"][i], 300, y + 10, 690, { fontSize: 56, fill: INK }),
          body(["Interview users and map their biggest pain points.", "Sketch, prototype and test until it clicks.", "Ship iteratively with weekly feedback loops.", "Measure, learn and keep improving."][i], 300, y + 90, 690, { fontSize: 32 }),
        ];
      }),
    ]),
  ]),
  template("info-stats", "Statistics Infographic", "Infographics", 1080, 2160, ["infographic", "statistics", "report", "climate"], [
    page(bg("#0b3d2e"), [
      text("CLIMATE REPORT 2026", 90, 120, 900, { fontSize: 30, letterSpacing: 8, fontWeight: 700, fill: "#8fe3b8" }),
      heading("Renewables by the numbers", 90, 180, 900, { fontSize: 96, fill: "#ffffff" }),
      ...[0, 1, 2].flatMap((i) => {
        const y = 560 + i * 480;
        return [
          rect(90, y, 900, 420, "rgba(255,255,255,0.06)", { cornerRadius: 36 }),
          icon(["Sun", "Wind", "Zap"][i], 150, y + 60, 120, "#8fe3b8"),
          heading(["42%", "3.1 TW", "−18%"][i], 330, y + 60, 620, { fontSize: 110, fill: "#ffffff" }),
          body(["of global electricity now comes from renewables", "of installed solar & wind capacity worldwide", "drop in power-sector emissions since 2019"][i], 330, y + 210, 620, { fontSize: 34, fill: "#cfeee0" }),
          rect(150, y + 340, 780, 20, "rgba(255,255,255,0.12)", { cornerRadius: 10 }),
          rect(150, y + 340, [0.42, 0.68, 0.18][i] * 780, 20, "#8fe3b8", { cornerRadius: 10 }),
        ];
      }),
      body("Source: illustrative data for template purposes", 90, 2040, 900, { fontSize: 22, fill: "#8fbfaa" }),
    ]),
  ]),

  /* ───────────── Educational / Medical Education ───────────── */
  template("edu-worksheet", "Vocabulary Worksheet", "Educational Designs", 1240, 1754, ["worksheet", "school", "kids", "education"], [
    page(bg("#fffaf0", { pattern: { kind: "grid", color: "#f2d9a6", opacity: 0.5, scale: 1 } }), [
      rect(60, 60, 1120, 220, "#ffd23f", { cornerRadius: 40 }),
      emoji("📚", 100, 90, 160),
      heading("Word of the Week", 290, 110, 860, { fontSize: 76, fill: INK, fontFamily: "Nunito", fontWeight: 900 }),
      body("Name: ____________________   Date: ___________", 290, 205, 860, { fontSize: 28, fill: INK }),
      ...[0, 1, 2, 3, 4].flatMap((i) => [
        rect(90, 360 + i * 270, 1060, 230, "#ffffff", { cornerRadius: 28, stroke: "#f2d9a6", strokeWidth: 4 }),
        circle(130, 400 + i * 270, 80, ["#ff6b5a", "#2ec4b6", "#7444ff", "#ff9f1c", "#00a6fb"][i]),
        text(String(i + 1), 130, 418 + i * 270, 80, { align: "center", fontSize: 40, fontWeight: 800, fill: "#ffffff" }),
        body("Word: ______________   Meaning: ______________________________", 240, 412 + i * 270, 880, { fontSize: 28, fill: INK }),
        body("Use it in a sentence: ____________________________________", 240, 480 + i * 270, 880, { fontSize: 28, fill: "#6b6585" }),
      ]),
    ]),
  ]),
  template("med-hypertension", "Hypertension Overview", "Medical Education", 1080, 2160, ["medical", "hypertension", "cardiology", "students", "infographic"], [
    page(bg("#f5fbff"), [
      rect(0, 0, 1080, 560, lin(135, "#c1121f", "#ff6b5a")),
      icon("HeartPulse", 820, 90, 190, "#ffffff", 1.6),
      text("CARDIOLOGY · QUICK REVIEW", 80, 110, 760, { fontSize: 26, letterSpacing: 5, fontWeight: 700, fill: "#ffe3e0" }),
      heading("Hypertension", 80, 170, 900, { fontSize: 112, fill: "#ffffff" }),
      body("Persistent systolic BP ≥ 130 mmHg or diastolic ≥ 80 mmHg (ACC/AHA).", 80, 330, 760, { fontSize: 34, fill: "#fff2f0" }),
      text("RISK FACTORS", 80, 620, 900, { fontSize: 26, letterSpacing: 5, fontWeight: 800, fill: "#c1121f" }),
      ...["Age", "Obesity", "High salt", "Smoking", "Inactivity", "Family Hx"].flatMap((r, i) => [
        rect(80 + (i % 3) * 315, 680 + Math.floor(i / 3) * 140, 290, 110, "#ffffff", { cornerRadius: 24, shadow: { enabled: true, color: "#6b8cae", blur: 20, offsetX: 0, offsetY: 6, opacity: 0.15 } }),
        text(r, 80 + (i % 3) * 315, 715 + Math.floor(i / 3) * 140, 290, { align: "center", fontSize: 32, fontWeight: 700, fill: INK }),
      ]),
      text("COMPLICATIONS", 80, 1010, 900, { fontSize: 26, letterSpacing: 5, fontWeight: 800, fill: "#c1121f" }),
      ...[["Brain", "Stroke"], ["Heart", "Heart failure · MI"], ["Eye", "Retinopathy"], ["Activity", "Chronic kidney disease"]].flatMap(([ic, label], i) => [
        icon(ic, 80, 1070 + i * 110, 70, "#c1121f"),
        body(label, 180, 1080 + i * 110, 800, { fontSize: 36, fill: INK, fontWeight: 600 }),
      ]),
      text("FIRST-LINE MANAGEMENT", 80, 1530, 900, { fontSize: 26, letterSpacing: 5, fontWeight: 800, fill: "#c1121f" }),
      rect(80, 1590, 920, 420, "#ffffff", { cornerRadius: 32, stroke: "#ffd6d1", strokeWidth: 3 }),
      body("• Lifestyle: DASH diet, sodium < 1.5 g/day, exercise\n• Thiazide diuretics\n• ACE inhibitors / ARBs\n• Calcium-channel blockers", 130, 1640, 840, { fontSize: 34, fill: INK, lineHeight: 1.7 }),
      body("For educational use — verify against current guidelines.", 80, 2070, 920, { fontSize: 22, fill: "#6b8cae" }),
    ]),
  ]),
  template("med-anatomy-card", "Anatomy Flashcard", "Medical Education", 1080, 1080, ["medical", "anatomy", "flashcard", "students"], [
    page(bg("#ffffff"), [
      rect(40, 40, 1000, 1000, "#eef6ff", { cornerRadius: 48 }),
      icon("Brain", 380, 120, 320, "#0f4c81", 1.2),
      text("FLASHCARD #12", 40, 500, 1000, { align: "center", fontSize: 26, letterSpacing: 6, fontWeight: 700, fill: "#00a6fb" }),
      heading("Which lobe processes visual information?", 120, 560, 840, { align: "center", fontSize: 64, fill: "#0f4c81" }),
      rect(340, 860, 400, 90, "#0f4c81", { cornerRadius: 45 }),
      text("Occipital lobe", 340, 885, 400, { align: "center", fontSize: 34, fontWeight: 700, fill: "#ffffff" }),
    ]),
  ]),

  /* ───────────── Invitations ───────────── */
  template("invite-wedding", "Elegant Wedding Invitation", "Invitations", 1500, 2100, ["wedding", "invitation", "elegant"], [
    page(bg("#fbf7f2"), [
      rect(70, 70, 1360, 1960, "rgba(0,0,0,0)", { stroke: "#c9a96e", strokeWidth: 4 }),
      rect(100, 100, 1300, 1900, "rgba(0,0,0,0)", { stroke: "#c9a96e", strokeWidth: 1.5 }),
      icon("Flower2", 650, 230, 200, "#c9a96e", 1.2),
      text("TOGETHER WITH THEIR FAMILIES", 150, 520, 1200, { align: "center", fontSize: 34, letterSpacing: 8, fill: "#6b6585" }),
      text("Amelia\n&\nNoah", 150, 620, 1200, { align: "center", fontFamily: "Great Vibes", fontSize: 210, fill: "#7a5c2e", lineHeight: 1.05 }),
      text("REQUEST THE PLEASURE OF YOUR COMPANY", 150, 1350, 1200, { align: "center", fontSize: 30, letterSpacing: 6, fill: "#6b6585" }),
      heading("Saturday, June 20, 2026", 150, 1450, 1200, { align: "center", fontFamily: "Cormorant Garamond", fontWeight: 600, fontSize: 72, fill: INK }),
      body("Four o’clock in the afternoon\nRosewood Gardens · Napa Valley", 150, 1580, 1200, { align: "center", fontFamily: "Cormorant Garamond", fontSize: 46, fill: "#4a4566" }),
    ]),
  ]),
  template("invite-birthday", "Birthday Party Invite", "Invitations", 1500, 2100, ["birthday", "party", "kids", "fun"], [
    page(bg(lin(160, "#a1c4fd", "#c2e9fb"), { pattern: { kind: "confetti", color: "#ff6b5a", opacity: 0.5, scale: 2 } }), [
      emoji("🎈", 160, 160, 320),
      emoji("🎂", 1020, 200, 300),
      text("You’re invited to", 150, 620, 1200, { align: "center", fontFamily: "Caveat", fontSize: 120, fill: "#0f4c81" }),
      heading("MIA’S 7th\nBIRTHDAY", 150, 790, 1200, { align: "center", fontFamily: "Bungee", fontWeight: 400, fontSize: 170, fill: "#ff3b6b", lineHeight: 1.05 }),
      rect(250, 1340, 1000, 420, "#ffffff", { cornerRadius: 60 }),
      body("Saturday, April 11 · 2–5 PM\n12 Sunny Lane\nRSVP to Sam · (555) 014-7788", 250, 1420, 1000, { align: "center", fontSize: 54, fill: "#0f4c81", fontWeight: 600, lineHeight: 1.6 }),
    ]),
  ]),

  /* ───────────── Logos ───────────── */
  template("logo-mono", "Monogram Logo", "Logos", 1000, 1000, ["logo", "monogram", "brand"], [
    page(bg("#ffffff"), [
      circle(250, 180, 500, lin(135, "#7444ff", "#ff6b5a")),
      text("NV", 250, 300, 500, { align: "center", fontFamily: "Playfair Display", fontWeight: 700, fontSize: 230, fill: "#ffffff" }),
      text("NOVA VENTURES", 100, 760, 800, { align: "center", fontSize: 54, letterSpacing: 14, fontWeight: 700, fill: INK, fontFamily: "Montserrat" }),
    ]),
  ]),
  template("logo-badge", "Outdoor Badge Logo", "Logos", 1000, 1000, ["logo", "badge", "outdoor", "vintage"], [
    page(bg("#f1ede4"), [
      shape("polygon", 200, 160, 600, 680, "#2f3e46", { sides: 6 }),
      shape("triangle", 330, 330, 340, 260, "#cad2c5"),
      shape("triangle", 440, 400, 280, 190, "#84a98c"),
      text("SUMMIT", 200, 610, 600, { align: "center", fontFamily: "Oswald", fontWeight: 600, fontSize: 96, letterSpacing: 10, fill: "#f1ede4" }),
      text("EST. 2026", 200, 730, 600, { align: "center", fontSize: 30, letterSpacing: 8, fill: "#cad2c5" }),
    ]),
  ]),

  /* ───────────── Wallpapers ───────────── */
  template("wall-aurora", "Aurora Desktop Wallpaper", "Wallpapers", 1920, 1080, ["wallpaper", "abstract", "gradient", "desktop"], [
    page(bg(lin(120, "#0b0820", "#16132b")), [
      shape("blob", -200, -100, 1100, 900, rad("#7444ff", "rgba(116,68,255,0)"), { opacity: 0.9 }),
      shape("blob", 900, 300, 1200, 900, rad("#ff6b5a", "rgba(255,107,90,0)"), { opacity: 0.7, rotation: 30 }),
      shape("blob", 600, -300, 900, 800, rad("#2ec4b6", "rgba(46,196,182,0)"), { opacity: 0.6 }),
      text("stay curious", 0, 900, 1920, { align: "center", fontSize: 40, letterSpacing: 16, fill: "rgba(255,255,255,0.6)", fontFamily: "Space Grotesk" }),
    ]),
  ]),
  template("wall-phone-minimal", "Minimal Phone Wallpaper", "Wallpapers", 1170, 2532, ["wallpaper", "phone", "minimal"], [
    page(bg(lin(180, "#fdfbfb", "#e6e3f2")), [
      circle(185, 900, 800, lin(135, "#ffd23f", "#ff6b5a")),
      rect(0, 1700, 1170, 832, "#16132b"),
      shape("triangle", 0, 1350, 1170, 400, "#16132b"),
    ]),
  ]),
];

export function getBuiltinTemplate(id: string) {
  return BUILTIN_TEMPLATES.find((t) => t.id === id);
}
