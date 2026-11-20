/**
 * Editorial slide system.
 *
 * Art direction: premium editorial / Swiss typography / scientific journal /
 * keynote. Built on a 12-column grid with strong type, asymmetry, whitespace
 * and meaningful diagrams — deliberately avoiding icon-per-heading card grids,
 * generic gradients and repeated layouts. Each slide "kind" is a distinct
 * composition, and decks are expected to vary kinds slide to slide.
 *
 * Used by the premium presentation templates and by the AI deck generator.
 */
import { createFrame, createPage, createShape, createText } from "@/lib/design/factory";
import type { DesignElement, Page, TextElement } from "@/lib/design/types";
import { mirror } from "./layouts";

/* ───────────────────────────── themes ───────────────────────────── */

export type DeckStyle = "swiss" | "editorial" | "journal" | "keynote" | "forest";

export type DeckTheme = {
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  rule: string;
  /** colours for art-directed image placeholders */
  imageA: string;
  imageB: string;
  display: string;
  displayWeight: number;
  /** tracking for display type, in em */
  displayTracking: number;
  text: string;
  label: string;
  /** use uppercase tracked labels */
  capsLabels: boolean;
};

export const DECK_THEMES: Record<DeckStyle, DeckTheme> = {
  swiss: { paper: "#f2f0eb", ink: "#111111", muted: "#6f6a62", accent: "#e8462b", rule: "#1111111f", imageA: "#d9d4ca", imageB: "#b9b2a5", display: "Inter Tight", displayWeight: 700, displayTracking: -0.035, text: "Inter", label: "Inter", capsLabels: true },
  editorial: { paper: "#f4efe6", ink: "#1c1a17", muted: "#7a7064", accent: "#8a2a1e", rule: "#1c1a1724", imageA: "#d8cbb8", imageB: "#a8927a", display: "Instrument Serif", displayWeight: 400, displayTracking: -0.01, text: "DM Sans", label: "DM Sans", capsLabels: true },
  journal: { paper: "#ffffff", ink: "#0f1720", muted: "#5b6573", accent: "#1f5fa8", rule: "#0f172022", imageA: "#e3e8ef", imageB: "#c3ccd8", display: "Newsreader", displayWeight: 500, displayTracking: -0.01, text: "Inter", label: "Inter", capsLabels: false },
  keynote: { paper: "#0c0c0e", ink: "#f5f3ee", muted: "#8b8a86", accent: "#ff5a1f", rule: "#f5f3ee26", imageA: "#1d1d21", imageB: "#3a3a40", display: "Space Grotesk", displayWeight: 600, displayTracking: -0.03, text: "Inter", label: "Space Grotesk", capsLabels: true },
  forest: { paper: "#10261d", ink: "#efe9dc", muted: "#a9b5a6", accent: "#c9a227", rule: "#efe9dc26", imageA: "#1c3b2d", imageB: "#2f5a45", display: "Cormorant Garamond", displayWeight: 600, displayTracking: -0.01, text: "Lato", label: "Lato", capsLabels: true },
};

/** Arabic font substitutions (same art direction, Arabic-capable faces). */
const ARABIC_FONTS: Record<DeckStyle, { display: string; text: string; weight: number }> = {
  swiss: { display: "Noto Kufi Arabic", text: "Readex Pro", weight: 700 },
  editorial: { display: "Amiri", text: "Noto Naskh Arabic", weight: 700 },
  journal: { display: "Noto Naskh Arabic", text: "Readex Pro", weight: 600 },
  keynote: { display: "Readex Pro", text: "Readex Pro", weight: 600 },
  forest: { display: "El Messiri", text: "Tajawal", weight: 600 },
};

/* ───────────────────────────── content model ───────────────────────────── */

export const SLIDE_KINDS = ["cover", "statement", "bigNumber", "imageCaption", "essay", "timeline", "bars", "comparison", "quote", "index", "process", "closing"] as const;
export type SlideKind = (typeof SLIDE_KINDS)[number];

export type SlideItem = { label: string; value?: string; desc?: string };

export type SlideSpec = {
  kind: SlideKind;
  /** small label: section name, figure number, eyebrow */
  label?: string;
  heading: string;
  body?: string;
  /** big number / statistic for bigNumber, e.g. "62%" */
  number?: string;
  items?: SlideItem[];
  quote?: string;
  attribution?: string;
  /** footnote / source line */
  footnote?: string;
};

export type DeckSpec = {
  title: string;
  /** meta line on the cover, e.g. "Annual report · 2026" */
  subtitle?: string;
  author?: string;
  style: DeckStyle;
  /** optional accent override (hex) */
  accent?: string;
  rtl?: boolean;
  slides: SlideSpec[];
};

/* ───────────────────────────── helpers ───────────────────────────── */

type Measure = (el: TextElement) => number;

type G = {
  W: number;
  H: number;
  s: number;
  mx: number;
  my: number;
  g: number;
  colW: number;
  t: DeckTheme;
  rtl: boolean;
  measure: Measure;
  deckTitle: string;
  page: number;
  total: number;
};

/** Rough height estimate; the editor re-measures exactly on load. */
const estimate: Measure = (el) => {
  const avg = el.fontSize * (/[؀-ۿ]/.test(el.text) ? 0.5 : 0.53) + el.letterSpacing;
  const lines = el.text.split("\n").reduce((n, para) => n + Math.max(1, Math.ceil((para.length * avg) / Math.max(1, el.width))), 0);
  return lines * el.fontSize * el.lineHeight;
};

const X = (g: G, col: number) => g.mx + col * (g.colW + g.g);
const SPAN = (g: G, a: number, b: number) => (b - a + 1) * g.colW + (b - a) * g.g;

function txt(g: G, value: string, x: number, y: number, w: number, size: number, o: Partial<TextElement> & { role?: "display" | "text" | "label" } = {}) {
  const { role = "text", ...rest } = o;
  const font = role === "display" ? g.t.display : role === "label" ? g.t.label : g.t.text;
  const el = createText({
    text: role === "label" && g.t.capsLabels && !g.rtl ? value.toUpperCase() : value,
    x,
    y,
    width: w,
    fontFamily: font,
    fontSize: size,
    fontWeight: role === "display" ? g.t.displayWeight : role === "label" ? 600 : 400,
    letterSpacing: role === "display" ? size * g.t.displayTracking : role === "label" && g.t.capsLabels && !g.rtl ? size * 0.16 : 0,
    lineHeight: role === "display" ? (g.rtl ? 1.3 : 1.02) : g.rtl ? 1.75 : 1.5,
    fill: role === "label" ? g.t.muted : g.t.ink,
    ...rest,
  });
  el.height = g.measure(el);
  return el;
}

function rule(g: G, x: number, y: number, w: number, color = g.t.rule, weight = 1.5) {
  return createShape("rect", { x, y, width: w, height: Math.max(1, weight * g.s), fill: color, name: "Rule" });
}

function vrule(g: G, x: number, y: number, h: number, color = g.t.rule) {
  return createShape("rect", { x, y, width: Math.max(1, 1.5 * g.s), height: h, fill: color, name: "Rule" });
}

/** Art-directed image placeholder: a calm tonal field instead of a grey icon. */
function artPlaceholder(a: string, b: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="r" cx="0.72" cy="0.28" r="0.6"><stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="1200" fill="url(#g)"/><rect width="1200" height="1200" fill="url(#r)"/><g stroke="#000" stroke-opacity="0.08" stroke-width="2"><path d="M0 600H1200M600 0V1200"/></g><text x="600" y="618" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="30" letter-spacing="8" fill="#000" fill-opacity="0.28">DROP IMAGE</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function image(g: G, x: number, y: number, w: number, h: number) {
  return createFrame("none", { x, y, width: w, height: h, src: artPlaceholder(g.t.imageA, g.t.imageB), naturalWidth: 1200, naturalHeight: 1200, name: "Image" });
}

/** Running header + folio for interior slides (editorial chrome). */
function chrome(g: G, section?: string): DesignElement[] {
  const size = 15 * g.s;
  const els: DesignElement[] = [txt(g, g.deckTitle, X(g, 0), g.my * 0.55, SPAN(g, 0, 5), size, { role: "label" })];
  if (section) els.push(txt(g, section, X(g, 6), g.my * 0.55, SPAN(g, 6, 11), size, { role: "label", align: "right" }));
  els.push(txt(g, String(g.page).padStart(2, "0"), X(g, 11), g.H - g.my * 0.55 - size * 1.5, SPAN(g, 11, 11), size, { role: "label", align: "right" }));
  return els;
}

/* ───────────────────────────── compositions ───────────────────────────── */

type Comp = (g: G, sl: SlideSpec, deck: DeckSpec) => DesignElement[];

const COMPOSITIONS: Record<SlideKind, Comp> = {
  /** Cover: oversized title anchored bottom-left, meta in grid columns, one bold image or accent field. */
  cover: (g, sl, deck) => {
    const { s, t, W, H } = g;
    const withImage = deck.style !== "swiss";
    const els: DesignElement[] = [];
    if (withImage) els.push(image(g, X(g, 7) + g.g, 0, W - X(g, 7) - g.g, H));
    else els.push(createShape("ellipse", { x: W * 0.68, y: -H * 0.38, width: H * 1.0, height: H * 1.0, fill: t.accent, name: "Accent field" }));
    const titleCols = withImage ? 6 : 7;
    els.push(txt(g, deck.subtitle ?? sl.label ?? "", X(g, 0), g.my, SPAN(g, 0, titleCols), 18 * s, { role: "label", fill: t.ink }));
    const title = txt(g, sl.heading || deck.title, X(g, 0), 0, SPAN(g, 0, titleCols), (withImage ? 132 : 168) * s, { role: "display" });
    title.y = H - g.my - 120 * s - title.height;
    els.push(title);
    els.push(rule(g, X(g, 0), H - g.my - 70 * s, SPAN(g, 0, titleCols), t.ink, 2));
    const meta = [deck.author ?? "", sl.body ?? "", sl.footnote ?? ""].filter(Boolean);
    meta.slice(0, 3).forEach((m, i) => {
      const span = withImage ? 2 : 3;
      els.push(txt(g, m, X(g, i * span), H - g.my - 50 * s, SPAN(g, i * span, i * span + span - 1), 18 * s, { fill: t.muted }));
    });
    return els;
  },

  /** Statement: a single large sentence with generous whitespace. */
  statement: (g, sl) => {
    const { s, t } = g;
    const els = chrome(g, sl.label);
    els.push(createShape("rect", { x: X(g, 0), y: g.H * 0.3 - 40 * s, width: 64 * s, height: 6 * s, fill: t.accent, name: "Accent" }));
    const h = txt(g, sl.heading, X(g, 0), g.H * 0.3, SPAN(g, 0, 9), 92 * g.s, { role: "display", lineHeight: g.rtl ? 1.4 : 1.08 });
    els.push(h);
    if (sl.body) els.push(txt(g, sl.body, X(g, 6), h.y + h.height + 60 * s, SPAN(g, 6, 10), 24 * s, { fill: t.muted }));
    return els;
  },

  /** Big number: a giant figure with a tight explanatory column. */
  bigNumber: (g, sl) => {
    const { s, t } = g;
    const els = chrome(g, sl.label);
    const num = txt(g, sl.number ?? "—", X(g, 0), 0, SPAN(g, 0, 7), 330 * s, { role: "display", fill: t.accent, lineHeight: 0.95, letterSpacing: -330 * s * 0.045 });
    num.y = g.H * 0.5 - num.height / 2;
    els.push(num);
    const colX = X(g, 8);
    const head = txt(g, sl.heading, colX, num.y + 40 * s, SPAN(g, 8, 11), 40 * s, { role: "display", lineHeight: 1.15 });
    els.push(rule(g, colX, head.y - 24 * s, SPAN(g, 8, 11), t.ink, 2));
    els.push(head);
    if (sl.body) els.push(txt(g, sl.body, colX, head.y + head.height + 24 * s, SPAN(g, 8, 11), 21 * s, { fill: t.muted }));
    if (sl.footnote) els.push(txt(g, sl.footnote, X(g, 0), g.H - g.my - 22 * s, SPAN(g, 0, 8), 15 * s, { fill: t.muted }));
    return els;
  },

  /** Full-bleed image with an editorial caption column (figure number, headline, caption). */
  imageCaption: (g, sl) => {
    const { s, t, H } = g;
    const els: DesignElement[] = [image(g, 0, 0, X(g, 7) + g.colW, H)];
    els.push(txt(g, String(g.page).padStart(2, "0"), X(g, 11), H - g.my * 0.55 - 22 * s, SPAN(g, 11, 11), 15 * s, { role: "label", align: "right" }));
    const x = X(g, 8) + g.g, w = SPAN(g, 8, 11) - g.g;
    els.push(txt(g, sl.label ?? `Fig. ${String(g.page).padStart(2, "0")}`, x, g.my, w, 16 * s, { role: "label", fill: t.accent }));
    const head = txt(g, sl.heading, x, g.my + 60 * s, w, 54 * s, { role: "display", lineHeight: 1.08 });
    els.push(head);
    if (sl.body) {
      const b = txt(g, sl.body, x, 0, w, 20 * s, { fill: t.muted });
      b.y = H - g.my - b.height;
      els.push(rule(g, x, b.y - 28 * s, w * 0.35, t.ink, 2));
      els.push(b);
    }
    return els;
  },

  /** Essay: journal headline with two text columns and a pull quote. */
  essay: (g, sl) => {
    const { s, t } = g;
    const els = chrome(g, sl.label);
    const head = txt(g, sl.heading, X(g, 0), g.my + 50 * s, SPAN(g, 0, 7), 68 * s, { role: "display", lineHeight: 1.06 });
    els.push(head);
    const top = Math.max(head.y + head.height + 70 * s, g.H * 0.45);
    els.push(rule(g, X(g, 0), top - 30 * s, SPAN(g, 0, 11)));
    if (sl.body) els.push(txt(g, sl.body, X(g, 0), top, SPAN(g, 0, 5), 21 * s, { lineHeight: g.rtl ? 1.8 : 1.62 }));
    if (sl.quote) {
      els.push(vrule(g, X(g, 7), top, 220 * s, t.accent));
      els.push(txt(g, sl.quote, X(g, 7) + 34 * s, top - 6 * s, SPAN(g, 7, 11) - 34 * s, 36 * s, { role: "display", italic: g.t.display !== "Space Grotesk" && !g.rtl, fill: t.ink, lineHeight: 1.25 }));
      if (sl.attribution) els.push(txt(g, sl.attribution, X(g, 7) + 34 * s, top + 240 * s, SPAN(g, 7, 11), 16 * s, { role: "label" }));
    }
    return els;
  },

  /** Timeline: a single hairline axis with milestones — a real diagram, not cards. */
  timeline: (g, sl) => {
    const { s, t, W } = g;
    const els = chrome(g, sl.label);
    els.push(txt(g, sl.heading, X(g, 0), g.my + 50 * s, SPAN(g, 0, 7), 60 * s, { role: "display", lineHeight: 1.08 }));
    const items = (sl.items ?? []).slice(0, 6);
    const axisY = g.H * 0.6;
    els.push(rule(g, X(g, 0), axisY, W - X(g, 0), t.ink, 2));
    const step = SPAN(g, 0, 11) / Math.max(1, items.length);
    items.forEach((it, i) => {
      const x = X(g, 0) + i * step;
      const dot = 16 * s;
      els.push(createShape("ellipse", { x: x - (i === 0 ? 0 : dot / 2), y: axisY - dot / 2 + 1, width: dot, height: dot, fill: i === items.length - 1 ? t.accent : t.ink, name: "Milestone" }));
      els.push(txt(g, it.label, x, axisY - 90 * s, step - g.g, 46 * s, { role: "display", fill: i === items.length - 1 ? t.accent : t.ink }));
      if (it.desc) els.push(txt(g, it.desc, x, axisY + 34 * s, step - g.g * 1.5, 19 * s, { fill: t.muted }));
    });
    return els;
  },

  /** Bars: horizontal bar chart drawn to scale with values and a source line. */
  bars: (g, sl) => {
    const { s, t } = g;
    const els = chrome(g, sl.label);
    const head = txt(g, sl.heading, X(g, 0), g.my + 50 * s, SPAN(g, 0, 3), 52 * s, { role: "display", lineHeight: 1.08 });
    els.push(head);
    if (sl.body) els.push(txt(g, sl.body, X(g, 0), head.y + head.height + 30 * s, SPAN(g, 0, 3), 20 * s, { fill: t.muted }));
    const items = (sl.items ?? []).slice(0, 7);
    const vals = items.map((i) => parseFloat(String(i.value ?? "0").replace(/[^\d.-]/g, "")) || 0);
    const max = Math.max(1, ...vals);
    const top = g.my + 70 * s, bottom = g.H - g.my - 70 * s;
    const rowH = (bottom - top) / Math.max(1, items.length);
    const labelX = X(g, 5), barX = X(g, 7), barW = SPAN(g, 7, 11) - 90 * s;
    items.forEach((it, i) => {
      const y = top + i * rowH;
      const bh = Math.min(26 * s, rowH * 0.32);
      const cy = y + rowH / 2;
      els.push(txt(g, it.label, labelX, cy - 14 * s, SPAN(g, 5, 6), 19 * s, { fill: t.ink }));
      const w = Math.max(4 * s, (vals[i] / max) * barW);
      els.push(createShape("rect", { x: barX, y: cy - bh / 2, width: w, height: bh, fill: i === vals.indexOf(max) ? t.accent : t.ink, opacity: i === vals.indexOf(max) ? 1 : 0.85, name: `Bar ${i + 1}` }));
      els.push(txt(g, it.value ?? "", barX + w + 14 * s, cy - 16 * s, 120 * s, 22 * s, { role: "display", fill: t.ink }));
      els.push(rule(g, labelX, y + rowH, SPAN(g, 5, 11)));
    });
    if (sl.footnote) els.push(txt(g, sl.footnote, X(g, 0), g.H - g.my - 22 * s, SPAN(g, 0, 4), 15 * s, { fill: t.muted }));
    return els;
  },

  /** Comparison: split page, a hairline divider, two contrasting statements. */
  comparison: (g, sl) => {
    const { s, t, H } = g;
    const els = chrome(g, sl.label);
    els.push(txt(g, sl.heading, X(g, 0), g.my + 50 * s, SPAN(g, 0, 8), 48 * s, { role: "display", lineHeight: 1.1 }));
    els.push(vrule(g, X(g, 6) - g.g / 2, H * 0.36, H * 0.52, t.ink));
    (sl.items ?? []).slice(0, 2).forEach((it, i) => {
      const x = i === 0 ? X(g, 0) : X(g, 6) + g.g;
      const w = SPAN(g, 0, 4);
      els.push(txt(g, it.label, x, H * 0.36, w, 110 * s, { role: "display", fill: i === 1 ? t.accent : t.ink, lineHeight: 1 }));
      if (it.value) els.push(txt(g, it.value, x, H * 0.36 + 150 * s, w, 30 * s, { role: "display" }));
      if (it.desc) els.push(txt(g, it.desc, x, H * 0.36 + 210 * s, w, 20 * s, { fill: t.muted }));
    });
    return els;
  },

  /** Quote: hanging quotation mark, large serif type, rule + attribution. */
  quote: (g, sl) => {
    const { s, t } = g;
    const els = chrome(g, sl.label);
    els.push(txt(g, g.rtl ? "”" : "“", X(g, 0), g.H * 0.2, 200 * s, 260 * s, { role: "display", fill: t.accent, lineHeight: 1 }));
    const q = txt(g, sl.quote ?? sl.heading, X(g, 1), g.H * 0.3, SPAN(g, 1, 10), 64 * s, { role: "display", lineHeight: g.rtl ? 1.5 : 1.15, italic: g.t.display === "Instrument Serif" || g.t.display === "Newsreader" });
    els.push(q);
    els.push(rule(g, X(g, 1), q.y + q.height + 50 * s, 80 * s, t.ink, 2));
    if (sl.attribution) els.push(txt(g, sl.attribution, X(g, 1), q.y + q.height + 80 * s, SPAN(g, 1, 8), 18 * s, { role: "label" }));
    return els;
  },

  /** Index: magazine-style contents list with numbers and hairlines. */
  index: (g, sl) => {
    const { s, t } = g;
    const els = chrome(g, sl.label);
    els.push(txt(g, sl.heading, X(g, 0), g.my + 50 * s, SPAN(g, 0, 3), 64 * s, { role: "display" }));
    const items = (sl.items ?? []).slice(0, 7);
    const top = g.my + 60 * s, bottom = g.H - g.my - 40 * s;
    const rowH = Math.min(120 * s, (bottom - top) / Math.max(1, items.length));
    items.forEach((it, i) => {
      const y = top + i * rowH;
      els.push(txt(g, String(i + 1).padStart(2, "0"), X(g, 5), y + rowH * 0.28, SPAN(g, 5, 5), 20 * s, { role: "label", fill: t.accent }));
      els.push(txt(g, it.label, X(g, 6), y + rowH * 0.18, SPAN(g, 6, 9), 38 * s, { role: "display" }));
      if (it.value) els.push(txt(g, it.value, X(g, 10), y + rowH * 0.3, SPAN(g, 10, 11), 17 * s, { fill: t.muted, align: "right" }));
      els.push(rule(g, X(g, 5), y + rowH, SPAN(g, 5, 11)));
    });
    return els;
  },

  /** Process: outlined numerals and a connecting hairline. */
  process: (g, sl) => {
    const { s, t } = g;
    const els = chrome(g, sl.label);
    els.push(txt(g, sl.heading, X(g, 0), g.my + 50 * s, SPAN(g, 0, 7), 56 * s, { role: "display", lineHeight: 1.08 }));
    const items = (sl.items ?? []).slice(0, 4);
    const span = 12 / Math.max(1, items.length);
    const y = g.H * 0.46;
    els.push(rule(g, X(g, 0), y + 150 * s, SPAN(g, 0, 11), t.ink, 1.5));
    items.forEach((it, i) => {
      const c0 = Math.round(i * span), c1 = Math.round((i + 1) * span) - 1;
      const x = X(g, c0), w = SPAN(g, c0, c1) - g.g;
      els.push(txt(g, String(i + 1).padStart(2, "0"), x, y - 20 * s, w, 150 * s, { role: "display", lineHeight: 1, effect: { type: "hollow", color: t.ink, offset: 0, direction: 0, intensity: 15 }, fill: i === items.length - 1 ? t.accent : t.ink }));
      els.push(txt(g, it.label, x, y + 180 * s, w, 28 * s, { role: "display", lineHeight: 1.15 }));
      if (it.desc) els.push(txt(g, it.desc, x, y + 230 * s, w, 18 * s, { fill: t.muted }));
    });
    return els;
  },

  /** Closing: asymmetric sign-off with contact details in the grid. */
  closing: (g, sl, deck) => {
    const { s, t, H } = g;
    const els: DesignElement[] = [createShape("rect", { x: 0, y: H - 14 * s, width: g.W, height: 14 * s, fill: t.accent, name: "Accent band" })];
    const h = txt(g, sl.heading || "Thank you", X(g, 0), 0, SPAN(g, 0, 8), 150 * s, { role: "display" });
    h.y = H * 0.48 - h.height;
    els.push(h);
    els.push(rule(g, X(g, 0), H * 0.48 + 40 * s, SPAN(g, 0, 11), t.ink, 2));
    const items = sl.items?.length ? sl.items : [{ label: deck.author ?? deck.title, desc: sl.body ?? "" }];
    items.slice(0, 3).forEach((it, i) => {
      els.push(txt(g, it.label, X(g, i * 4), H * 0.48 + 80 * s, SPAN(g, i * 4, i * 4 + 3), 18 * s, { role: "label", fill: t.ink }));
      if (it.desc) els.push(txt(g, it.desc, X(g, i * 4), H * 0.48 + 120 * s, SPAN(g, i * 4, i * 4 + 3), 20 * s, { fill: t.muted }));
    });
    return els;
  },
};

/* ───────────────────────────── deck build ───────────────────────────── */

export function themeFor(deck: Pick<DeckSpec, "style" | "accent" | "rtl">): DeckTheme {
  const base = DECK_THEMES[deck.style] ?? DECK_THEMES.swiss;
  const t = { ...base, accent: deck.accent && /^#[0-9a-f]{6}$/i.test(deck.accent) ? deck.accent : base.accent };
  if (deck.rtl) {
    const a = ARABIC_FONTS[deck.style] ?? ARABIC_FONTS.swiss;
    Object.assign(t, { display: a.display, text: a.text, label: a.text, displayWeight: a.weight, displayTracking: 0 });
  }
  return t;
}

export function buildSlide(deck: DeckSpec, slide: SlideSpec, index: number, W: number, H: number, measure: Measure = estimate): Page {
  const t = themeFor(deck);
  const s = Math.min(W / 1920, H / 1080);
  const mx = W * 0.055, my = H * 0.085, gutter = W * 0.0125;
  const colW = (W - 2 * mx - 11 * gutter) / 12;
  const g: G = { W, H, s, mx, my, g: gutter, colW, t, rtl: !!deck.rtl, measure, deckTitle: deck.title, page: index + 1, total: deck.slides.length };
  const comp = COMPOSITIONS[slide.kind] ?? COMPOSITIONS.statement;
  const raw = comp(g, slide, deck).filter((e) => e.type !== "text" || e.text.trim().length > 0);
  const els = deck.rtl ? mirror(raw, W) : raw;
  return createPage({ background: { fill: t.paper, image: null, pattern: null, transparent: false }, elements: els, name: (slide.heading || slide.quote || slide.kind).slice(0, 40) });
}

export function buildDeck(deck: DeckSpec, W = 1920, H = 1080, measure?: Measure): Page[] {
  return deck.slides.map((sl, i) => buildSlide(deck, sl, i, W, H, measure));
}

/** Fonts a deck needs (for preloading). */
export function deckFonts(deck: Pick<DeckSpec, "style" | "rtl">) {
  const t = themeFor({ style: deck.style, rtl: deck.rtl });
  return [...new Set([t.display, t.text, t.label])];
}

/**
 * Enforce variety: no kind repeats back-to-back, cover first, closing last.
 * Repeats are swapped for a fitting alternative so decks never look generated.
 */
export function diversify(slides: SlideSpec[]): SlideSpec[] {
  const out = slides.map((s) => ({ ...s }));
  if (out.length && out[0].kind !== "cover") out[0].kind = "cover";
  const alt: Partial<Record<SlideKind, SlideKind[]>> = {
    statement: ["quote", "essay"],
    essay: ["statement", "imageCaption"],
    bigNumber: ["bars", "statement"],
    bars: ["bigNumber", "comparison"],
    imageCaption: ["essay", "statement"],
    timeline: ["process", "index"],
    process: ["timeline", "index"],
    quote: ["statement", "imageCaption"],
    comparison: ["essay", "statement"],
    index: ["statement", "process"],
  };
  for (let i = 1; i < out.length; i++) {
    if (out[i].kind === out[i - 1].kind) {
      const options = alt[out[i].kind] ?? ["statement"];
      const pick = options.find((k) => k !== out[i - 1].kind && (i + 1 >= out.length || k !== out[i + 1].kind)) ?? "statement";
      // only switch to kinds whose content needs are met
      const needsItems = pick === "bars" || pick === "timeline" || pick === "process" || pick === "index" || pick === "comparison";
      out[i].kind = needsItems && !out[i].items?.length ? "statement" : pick;
    }
  }
  return out;
}
