/**
 * Parametric layout styles used to generate the extended template library.
 * Each layout adapts to any canvas size and takes a palette, a font pairing
 * and copy, so one layout yields many distinct, fully editable templates.
 * All artwork is original and built from editable primitives.
 */
import type { DesignElement, Page, PageBackground, TextElement } from "@/lib/design/types";
import { bg, body, circle, frame, heading, icon, lin, line, page, rad, rect, shape, text } from "./builders";

export type Palette = { bg: string; surface: string; primary: string; accent: string; text: string; muted: string; onPrimary: string };
export type Fonts = { heading: string; body: string; headingWeight?: number };
export type Item = { icon: string; label: string; desc?: string };
export type Copy = {
  name: string;
  tags: string[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  body?: string;
  cta?: string;
  footer?: string;
  items?: Item[];
  author?: string;
};

export type LayoutId =
  | "centered" | "splitFrame" | "blobHero" | "bordered" | "bigStat" | "listIcons"
  | "photoOverlay" | "diagonal" | "minimal" | "cardGrid" | "quote" | "badge" | "resume" | "card";

type Ctx = { W: number; H: number; s: number; m: number; p: Palette; f: Fonts; c: Copy; rtl: boolean };

/** Rough text height estimate (the editor re-measures on load). */
function est(t: string, fs: number, w: number, lh: number, arabic = false) {
  const avg = fs * (arabic ? 0.5 : 0.56);
  const lines = t.split("\n").reduce((n, para) => n + Math.max(1, Math.ceil((para.length * avg) / Math.max(1, w))), 0);
  return lines * fs * lh;
}

const H_ = (c: Ctx, value: string, x: number, y: number, w: number, fs: number, extra: Partial<TextElement> = {}) => {
  const el = heading(value, x, y, w, { fontFamily: c.f.heading, fontWeight: c.f.headingWeight ?? 800, fontSize: fs, fill: c.p.text, lineHeight: c.rtl ? 1.35 : 1.08, letterSpacing: c.rtl ? 0 : -fs * 0.01, ...extra });
  el.height = est(value, el.fontSize, w, el.lineHeight, c.rtl);
  return el;
};
const B_ = (c: Ctx, value: string, x: number, y: number, w: number, fs: number, extra: Partial<TextElement> = {}) => {
  const el = body(value, x, y, w, { fontFamily: c.f.body, fontSize: fs, fill: c.p.muted, lineHeight: c.rtl ? 1.7 : 1.45, ...extra });
  el.height = est(value, el.fontSize, w, el.lineHeight, c.rtl);
  return el;
};
const E_ = (c: Ctx, value: string, x: number, y: number, w: number, fs: number, extra: Partial<TextElement> = {}) => {
  const el = text(c.rtl ? value : value.toUpperCase(), x, y, w, { fontFamily: c.f.body, fontWeight: 700, fontSize: fs, letterSpacing: c.rtl ? 0 : fs * 0.22, fill: c.p.primary, lineHeight: 1.3, ...extra });
  el.height = est(value, el.fontSize, w, el.lineHeight, c.rtl) * 1.1;
  return el;
};

function pill(c: Ctx, label: string, x: number, y: number, fs: number, fill = c.p.primary, color = c.p.onPrimary, align: "left" | "center" = "left") {
  const w = Math.max(fs * 7, label.length * fs * 0.62 + fs * 3);
  const h = fs * 2.6;
  const px = align === "center" ? x - w / 2 : x;
  return [
    rect(px, y, w, h, fill, { cornerRadius: h / 2, name: "Button" }),
    text(label, px, y + h / 2 - fs * 0.65, w, { align: "center", fontFamily: c.f.body, fontWeight: 700, fontSize: fs, fill: color, height: fs * 1.3, name: "Button label" }),
  ];
}

const LAYOUTS: Record<LayoutId, (c: Ctx) => { background: PageBackground; els: DesignElement[] }> = {
  centered: (c) => {
    const { W, H, s, m, p } = c;
    const cw = W - 2 * m;
    const els: DesignElement[] = [
      circle(W / 2 - Math.max(W, H) * 0.45, H / 2 - Math.max(W, H) * 0.45, Math.max(W, H) * 0.9, "rgba(0,0,0,0)", { stroke: p.primary, strokeWidth: 2 * s, opacity: 0.25, name: "Decoration" }),
      circle(W / 2 - Math.max(W, H) * 0.32, H / 2 - Math.max(W, H) * 0.32, Math.max(W, H) * 0.64, "rgba(0,0,0,0)", { stroke: p.accent, strokeWidth: 2 * s, opacity: 0.35, name: "Decoration" }),
    ];
    const tfs = 118 * s * (W > H * 1.4 ? 0.85 : 1);
    const blocks: DesignElement[] = [];
    if (c.c.eyebrow) blocks.push(E_(c, c.c.eyebrow, m, 0, cw, 26 * s, { align: "center" }));
    blocks.push(H_(c, c.c.title, m, 0, cw, tfs, { align: "center" }));
    if (c.c.subtitle) blocks.push(B_(c, c.c.subtitle, m * 1.4, 0, W - 2.8 * m, 34 * s, { align: "center" }));
    const gap = 26 * s;
    const total = blocks.reduce((a, b) => a + b.height + gap, 0) + (c.c.cta ? 90 * s : 0);
    let y = (H - total) / 2;
    blocks.forEach((b) => {
      b.y = y;
      y += b.height + gap;
    });
    els.push(...blocks);
    if (c.c.cta) els.push(...pill(c, c.c.cta, W / 2, y + 10 * s, 28 * s, p.primary, p.onPrimary, "center"));
    if (c.c.footer) els.push(B_(c, c.c.footer, m, H - m - 30 * s, cw, 22 * s, { align: "center" }));
    return { background: bg(p.bg), els };
  },

  splitFrame: (c) => {
    const { W, H, s, m, p } = c;
    const land = W > H * 1.15;
    const els: DesignElement[] = [];
    let tx: number, tw: number, ty: number;
    if (land) {
      els.push(frame("none", 0, 0, W * 0.5, H));
      tx = W * 0.5 + m * 0.8;
      tw = W * 0.5 - m * 1.6;
      ty = H * 0.2;
    } else {
      els.push(frame("rounded", m, m, W - 2 * m, H * 0.52, { cornerRadius: 36 * s }));
      tx = m;
      tw = W - 2 * m;
      ty = m + H * 0.52 + 50 * s;
    }
    els.push(rect(tx, ty, 70 * s, 8 * s, p.accent, { cornerRadius: 4 * s, name: "Accent" }));
    ty += 40 * s;
    if (c.c.eyebrow) {
      const e = E_(c, c.c.eyebrow, tx, ty, tw, 24 * s);
      els.push(e);
      ty += e.height + 14 * s;
    }
    const t = H_(c, c.c.title, tx, ty, tw, (land ? 86 : 92) * s);
    els.push(t);
    ty += t.height + 20 * s;
    if (c.c.subtitle) {
      const b = B_(c, c.c.subtitle, tx, ty, tw, 30 * s);
      els.push(b);
      ty += b.height + 34 * s;
    }
    if (c.c.cta && ty + 80 * s < H - m * 0.5) els.push(...pill(c, c.c.cta, tx, ty, 26 * s));
    return { background: bg(p.bg), els };
  },

  blobHero: (c) => {
    const { W, H, s, m, p } = c;
    const els: DesignElement[] = [
      shape("blob", W * 0.45, -H * 0.12, W * 0.75, W * 0.7, rad(p.accent, "rgba(255,255,255,0)"), { opacity: 0.85, name: "Decoration" }),
      shape("blob", -W * 0.25, H * 0.62, W * 0.7, W * 0.62, rad(p.primary, "rgba(255,255,255,0)"), { opacity: 0.6, rotation: 20, name: "Decoration" }),
    ];
    const cw = W - 2 * m;
    let y = H * (W > H ? 0.22 : 0.3);
    if (c.c.eyebrow) {
      const e = E_(c, c.c.eyebrow, m, y, cw, 26 * s, { fill: p.onPrimary });
      els.push(e);
      y += e.height + 16 * s;
    }
    const t = H_(c, c.c.title, m, y, cw * 0.92, 128 * s * (W > H * 1.4 ? 0.8 : 1), { fill: p.onPrimary });
    els.push(t);
    y += t.height + 24 * s;
    if (c.c.subtitle) {
      const b = B_(c, c.c.subtitle, m, y, cw * 0.8, 34 * s, { fill: p.onPrimary, opacity: 0.88 });
      els.push(b);
      y += b.height + 40 * s;
    }
    if (c.c.cta) els.push(...pill(c, c.c.cta, m, y, 28 * s, "#ffffff", p.primary));
    return { background: bg(lin(135, p.primary, p.accent)), els };
  },

  bordered: (c) => {
    const { W, H, s, m, p } = c;
    const cw = W - 4 * m;
    const els: DesignElement[] = [
      rect(m * 0.7, m * 0.7, W - 1.4 * m, H - 1.4 * m, "rgba(0,0,0,0)", { stroke: p.primary, strokeWidth: 4 * s, name: "Border" }),
      rect(m, m, W - 2 * m, H - 2 * m, "rgba(0,0,0,0)", { stroke: p.primary, strokeWidth: 1.5 * s, name: "Border" }),
      icon(c.c.items?.[0]?.icon ?? "Flower2", W / 2 - 70 * s, H * 0.14, 140 * s, p.primary, 1.2),
    ];
    let y = H * 0.14 + 190 * s;
    if (c.c.eyebrow) {
      const e = E_(c, c.c.eyebrow, 2 * m, y, cw, 26 * s, { align: "center", fill: p.muted });
      els.push(e);
      y += e.height + 30 * s;
    }
    const t = H_(c, c.c.title, 2 * m, y, cw, 150 * s, { align: "center", fill: p.primary, fontWeight: c.f.headingWeight ?? 400 });
    els.push(t);
    y += t.height + 40 * s;
    els.push(line(W / 2 - 80 * s, y, 160 * s, p.accent, { strokeWidth: 3 * s }));
    y += 50 * s;
    if (c.c.subtitle) {
      const b = H_(c, c.c.subtitle, 2 * m, y, cw, 52 * s, { align: "center", fontFamily: c.f.body, fontWeight: 600 });
      els.push(b);
      y += b.height + 24 * s;
    }
    if (c.c.body) els.push(B_(c, c.c.body, 2 * m, y, cw, 34 * s, { align: "center", lineHeight: 1.7 }));
    return { background: bg(p.bg), els };
  },

  bigStat: (c) => {
    const { W, H, s, m, p } = c;
    const cw = W - 2 * m;
    const els: DesignElement[] = [
      shape("star", W - Math.min(W, H) * 0.55, -Math.min(W, H) * 0.08, Math.min(W, H) * 0.62, Math.min(W, H) * 0.62, p.accent, { sides: 14, innerRadiusRatio: 0.84, rotation: 10, name: "Decoration" }),
    ];
    let y = H * (W > H ? 0.14 : 0.32);
    if (c.c.eyebrow) {
      const e = E_(c, c.c.eyebrow, m, y, cw, 30 * s, { fill: p.accent });
      els.push(e);
      y += e.height + 10 * s;
    }
    const big = H_(c, c.c.title, m, y, cw, 300 * s * (W > H * 1.4 ? 0.7 : 1), { fontFamily: c.rtl ? c.f.heading : "Anton", fontWeight: c.rtl ? 800 : 400, lineHeight: c.rtl ? 1.2 : 1, fill: p.text, letterSpacing: 0 });
    els.push(big);
    y += big.height + 10 * s;
    if (c.c.subtitle) {
      const sub = H_(c, c.c.subtitle, m, y, cw, 70 * s, { fill: p.text, fontWeight: 700 });
      els.push(sub);
      y += sub.height + 20 * s;
    }
    if (c.c.body) {
      const b = B_(c, c.c.body, m, y, cw * 0.85, 30 * s);
      els.push(b);
      y += b.height + 30 * s;
    }
    if (c.c.cta && y + 80 * s < H - m) els.push(...pill(c, c.c.cta, m, y, 28 * s, p.accent, p.bg));
    return { background: bg(p.bg), els };
  },

  listIcons: (c) => {
    const { W, H, s, m, p } = c;
    const cw = W - 2 * m;
    const headH = Math.max(H * 0.22, 300 * s);
    const els: DesignElement[] = [rect(0, 0, W, headH, lin(135, p.primary, p.accent), { name: "Header" })];
    let y = m;
    if (c.c.eyebrow) {
      const e = E_(c, c.c.eyebrow, m, y, cw, 24 * s, { fill: p.onPrimary, opacity: 0.85 });
      els.push(e);
      y += e.height + 12 * s;
    }
    const t = H_(c, c.c.title, m, y, cw, 84 * s * (H > W * 1.6 ? 1.25 : 1), { fill: p.onPrimary });
    els.push(t);
    y += t.height + 12 * s;
    if (c.c.subtitle) els.push(B_(c, c.c.subtitle, m, y, cw, 28 * s, { fill: p.onPrimary, opacity: 0.9 }));
    (els[0] as DesignElement).height = Math.max(headH, y + 80 * s);
    const items = c.c.items ?? [];
    const top = (els[0] as DesignElement).height + m * 0.7;
    const bottom = H - m - (c.c.footer ? 40 * s : 0);
    const rowH = (bottom - top) / Math.max(1, items.length);
    items.forEach((it, i) => {
      const ry = top + i * rowH;
      const d = Math.min(rowH * 0.62, 120 * s);
      els.push(circle(m, ry + (rowH - d) / 2, d, i % 2 ? p.accent : p.primary, { opacity: 0.16, name: "Icon badge" }));
      els.push(icon(it.icon, m + d * 0.22, ry + (rowH - d) / 2 + d * 0.22, d * 0.56, i % 2 ? p.accent : p.primary));
      const tx = m + d + 30 * s, tw = cw - d - 30 * s;
      const lf = Math.min(44 * s, rowH * 0.26);
      const lbl = H_(c, it.label, tx, 0, tw, lf, { fontWeight: 700 });
      const desc = it.desc ? B_(c, it.desc, tx, 0, tw, Math.min(28 * s, rowH * 0.17)) : null;
      const block = lbl.height + (desc ? desc.height + 6 * s : 0);
      lbl.y = ry + (rowH - block) / 2;
      els.push(lbl);
      if (desc) {
        desc.y = lbl.y + lbl.height + 6 * s;
        els.push(desc);
      }
    });
    if (c.c.footer) els.push(B_(c, c.c.footer, m, H - m * 0.7 - 24 * s, cw, 20 * s, { align: "center" }));
    return { background: bg(p.bg), els };
  },

  photoOverlay: (c) => {
    const { W, H, s, m, p } = c;
    const cw = W - 2 * m;
    const els: DesignElement[] = [
      frame("none", 0, 0, W, H),
      rect(0, H * 0.35, W, H * 0.65, { type: "linear", angle: 90, stops: [{ offset: 0, color: "rgba(0,0,0,0)" }, { offset: 1, color: "rgba(0,0,0,0.78)" }] }, { name: "Overlay" }),
    ];
    const blocks: DesignElement[] = [];
    if (c.c.eyebrow) blocks.push(E_(c, c.c.eyebrow, m, 0, cw, 26 * s, { fill: p.accent }));
    blocks.push(H_(c, c.c.title, m, 0, cw, 112 * s * (W > H * 1.4 ? 0.8 : 1), { fill: "#ffffff" }));
    if (c.c.subtitle) blocks.push(B_(c, c.c.subtitle, m, 0, cw * 0.9, 32 * s, { fill: "#ffffff", opacity: 0.88 }));
    let y = H - m - (c.c.cta ? 100 * s : 0);
    for (let i = blocks.length - 1; i >= 0; i--) {
      y -= blocks[i].height + 18 * s;
      blocks[i].y = y;
    }
    els.push(...blocks);
    if (c.c.cta) els.push(...pill(c, c.c.cta, m, H - m - 76 * s, 26 * s, p.accent, p.text === "#ffffff" ? "#111111" : p.text));
    return { background: bg("#1b1b1f"), els };
  },

  diagonal: (c) => {
    const { W, H, s, m, p } = c;
    const els: DesignElement[] = [
      rect(-W * 0.2, H * 0.36, W * 1.4, H * 0.3, p.primary, { rotation: -8, name: "Band" }),
      rect(-W * 0.2, H * 0.36 + H * 0.3, W * 1.4, 14 * s, p.accent, { rotation: -8, name: "Band accent" }),
    ];
    if (c.c.eyebrow) els.push(E_(c, c.c.eyebrow, m, m * 1.2, W - 2 * m, 30 * s, { fill: p.text }));
    const t = H_(c, c.c.title, m, H * 0.4, W - 2 * m, 120 * s * (W > H * 1.4 ? 0.75 : 1), { fill: p.onPrimary, rotation: -8, fontFamily: c.f.heading });
    els.push(t);
    if (c.c.subtitle) els.push(B_(c, c.c.subtitle, m, H * 0.78, W - 2 * m, 38 * s, { fill: p.text, fontWeight: 600 }));
    if (c.c.cta) els.push(...pill(c, c.c.cta, m, H * 0.78 + 90 * s, 28 * s, p.accent, p.bg));
    return { background: bg(p.bg), els };
  },

  minimal: (c) => {
    const { W, H, s, m, p } = c;
    const cw = W - 2 * m;
    const els: DesignElement[] = [];
    if (c.c.eyebrow) els.push(E_(c, c.c.eyebrow, m, m, cw, 22 * s, { fill: p.muted }));
    const t = H_(c, c.c.title, m, H * 0.36, cw * 0.9, 104 * s * (W > H * 1.4 ? 0.85 : H > W * 1.6 ? 1.4 : 1), { fontWeight: c.f.headingWeight ?? 600 });
    els.push(t);
    els.push(line(m, H * 0.36 + t.height + 50 * s, 120 * s, p.primary, { strokeWidth: 4 * s }));
    if (c.c.subtitle) els.push(B_(c, c.c.subtitle, m, H * 0.36 + t.height + 90 * s, cw * 0.75, 32 * s));
    if (c.c.footer) els.push(B_(c, c.c.footer, m, H - m - 30 * s, cw, 22 * s, { fill: p.muted }));
    els.push(circle(W - m - 26 * s, m, 26 * s, p.accent, { name: "Dot" }));
    return { background: bg(p.bg), els };
  },

  cardGrid: (c) => {
    const { W, H, s, m, p } = c;
    const cw = W - 2 * m;
    const els: DesignElement[] = [];
    let y = m * 1.2;
    if (c.c.eyebrow) {
      const e = E_(c, c.c.eyebrow, m, y, cw, 24 * s);
      els.push(e);
      y += e.height + 12 * s;
    }
    const t = H_(c, c.c.title, m, y, cw, 80 * s);
    els.push(t);
    y += t.height + 16 * s;
    if (c.c.subtitle) {
      const b = B_(c, c.c.subtitle, m, y, cw, 28 * s);
      els.push(b);
      y += b.height;
    }
    y += m * 0.7;
    const items = c.c.items ?? [];
    const cols = W > H * 1.2 ? Math.min(4, items.length) : 2;
    const rows = Math.ceil(items.length / cols);
    const gap = 26 * s;
    const bottom = H - m - (c.c.footer ? 40 * s : 0);
    const cwid = (cw - gap * (cols - 1)) / cols;
    const chei = (bottom - y - gap * (rows - 1)) / Math.max(1, rows);
    items.forEach((it, i) => {
      const x = m + (i % cols) * (cwid + gap), cy = y + Math.floor(i / cols) * (chei + gap);
      els.push(rect(x, cy, cwid, chei, p.surface, { cornerRadius: 28 * s, shadow: { enabled: true, color: "#000000", blur: 24 * s, offsetX: 0, offsetY: 8 * s, opacity: 0.08 }, name: `Card ${i + 1}` }));
      const d = Math.min(chei * 0.28, 90 * s);
      els.push(icon(it.icon, x + 30 * s, cy + 30 * s, d, i % 2 ? p.accent : p.primary));
      const lbl = H_(c, it.label, x + 30 * s, cy + 30 * s + d + 18 * s, cwid - 60 * s, Math.min(40 * s, chei * 0.13), { fontWeight: 700 });
      els.push(lbl);
      if (it.desc) els.push(B_(c, it.desc, x + 30 * s, lbl.y + lbl.height + 8 * s, cwid - 60 * s, Math.min(25 * s, chei * 0.085)));
    });
    if (c.c.footer) els.push(B_(c, c.c.footer, m, H - m * 0.8 - 22 * s, cw, 20 * s, { align: "center" }));
    return { background: bg(p.bg), els };
  },

  quote: (c) => {
    const { W, H, s, m, p } = c;
    const cw = W - 2.4 * m;
    const els: DesignElement[] = [
      text(c.rtl ? "”" : "“", m, H * 0.12, 300 * s, { fontFamily: "Playfair Display", fontSize: 380 * s, fill: p.accent, lineHeight: 1, height: 300 * s, name: "Quote mark" }),
    ];
    const t = H_(c, c.c.title, m * 1.2, H * 0.12 + 260 * s, cw, 76 * s * (W > H * 1.4 ? 0.85 : H > W * 1.6 ? 1.6 : 1), { fontWeight: c.f.headingWeight ?? 500, lineHeight: 1.25 });
    els.push(t);
    const y = H * 0.12 + 260 * s + t.height + 50 * s;
    els.push(line(m * 1.2, y, 110 * s, p.primary, { strokeWidth: 5 * s }));
    if (c.c.author) els.push(E_(c, c.c.author, m * 1.2, y + 40 * s, cw, 26 * s, { fill: p.muted }));
    return { background: bg(p.bg), els };
  },

  badge: (c) => {
    const { W, H, s, p } = c;
    const d = Math.min(W, H) * 0.56;
    const cx = W / 2, cy = H * 0.42;
    const els: DesignElement[] = [
      circle(cx - d / 2, cy - d / 2, d, p.primary, { name: "Badge" }),
      circle(cx - d / 2 + 16 * s, cy - d / 2 + 16 * s, d - 32 * s, "rgba(0,0,0,0)", { stroke: p.onPrimary, strokeWidth: 3 * s, opacity: 0.6, name: "Badge ring" }),
      icon(c.c.items?.[0]?.icon ?? "Sparkles", cx - d * 0.22, cy - d * 0.28, d * 0.44, p.onPrimary, 1.4),
    ];
    const t = H_(c, c.c.title, W * 0.08, cy + d / 2 + 50 * s, W * 0.84, 90 * s, { align: "center", fontWeight: c.f.headingWeight ?? 800, letterSpacing: c.rtl ? 0 : 4 * s });
    els.push(t);
    if (c.c.subtitle) els.push(E_(c, c.c.subtitle, W * 0.1, t.y + t.height + 20 * s, W * 0.8, 28 * s, { align: "center", fill: p.muted }));
    return { background: bg(p.bg), els };
  },

  resume: (c) => {
    const { W, H, s, p } = c;
    const side = W * 0.34;
    const els: DesignElement[] = [
      rect(0, 0, side, H, p.primary, { name: "Sidebar" }),
      frame("circle", side / 2 - 120 * s, 90 * s, 240 * s, 240 * s, { stroke: p.onPrimary, strokeWidth: 6 * s }),
    ];
    const sx = 60 * s, sw = side - 120 * s;
    let y = 380 * s;
    const sideSection = (title: string, content: string) => {
      const h = E_(c, title, sx, y, sw, 22 * s, { fill: p.accent });
      const b = B_(c, content, sx, y + h.height + 14 * s, sw, 22 * s, { fill: p.onPrimary, lineHeight: 1.8 });
      els.push(h, b);
      y += h.height + b.height + 60 * s;
    };
    sideSection(c.rtl ? "التواصل" : "Contact", c.c.footer ?? "hello@email.example\n(555) 010-0000\nYour City");
    sideSection(c.rtl ? "المهارات" : "Skills", (c.c.items ?? []).map((i) => i.label).join("\n"));
    const mx = side + 70 * s, mw = W - side - 130 * s;
    let my = 100 * s;
    const name = H_(c, c.c.title, mx, my, mw, 72 * s, { fill: p.text });
    els.push(name);
    my += name.height + 10 * s;
    if (c.c.subtitle) {
      const r = H_(c, c.c.subtitle, mx, my, mw, 32 * s, { fill: p.primary, fontFamily: c.f.body, fontWeight: 600 });
      els.push(r);
      my += r.height + 30 * s;
    }
    if (c.c.body) {
      const b = B_(c, c.c.body, mx, my, mw, 23 * s);
      els.push(b);
      my += b.height + 60 * s;
    }
    const block = (title: string, entries: [string, string, string][]) => {
      els.push(E_(c, title, mx, my, mw, 22 * s, { fill: p.text }));
      els.push(line(mx, my + 46 * s, mw, p.muted, { strokeWidth: 1.5 * s, opacity: 0.4 }));
      my += 80 * s;
      for (const [role, when, desc] of entries) {
        els.push(H_(c, role, mx, my, mw, 27 * s, { fontWeight: 700 }));
        els.push(B_(c, when, mx, my + 40 * s, mw, 20 * s));
        const d = B_(c, desc, mx, my + 74 * s, mw, 22 * s);
        els.push(d);
        my += 74 * s + d.height + 40 * s;
      }
    };
    block(c.rtl ? "الخبرات" : "Experience", c.rtl
      ? [["مدير مشروع · شركة الأفق", "٢٠٢٢ — الآن", "قيادة فريق من ١٢ شخصاً وتسليم ٨ مشاريع في الوقت المحدد."], ["محلل أعمال · شركة الريادة", "٢٠١٩ — ٢٠٢٢", "تحسين العمليات وتقليل التكاليف بنسبة ١٥٪."]]
      : [["Senior Role · Company One", "2022 — Present", "Led a cross-functional team and shipped measurable results."], ["Specialist · Company Two", "2019 — 2022", "Owned key projects end-to-end and improved core metrics."]]);
    block(c.rtl ? "التعليم" : "Education", c.rtl ? [["بكالوريوس إدارة أعمال · جامعة بغداد", "٢٠١٥ — ٢٠١٩", "تخرج بامتياز."]] : [["B.Sc. · State University", "2015 — 2019", "Graduated with honours."]]);
    return { background: bg(p.bg), els };
  },

  card: (c) => {
    const { W, H, s, p } = c;
    const mx = 80 * s;
    const els: DesignElement[] = [
      rect(W * 0.62, 0, W * 0.38, H, p.primary, { name: "Panel" }),
      icon(c.c.items?.[0]?.icon ?? "Sparkles", W * 0.62 + W * 0.19 - 80 * s, H / 2 - 80 * s, 160 * s, p.onPrimary, 1.4),
    ];
    const n = H_(c, c.c.title, mx, 150 * s, W * 0.55, 64 * s);
    els.push(n);
    if (c.c.subtitle) els.push(E_(c, c.c.subtitle, mx, 150 * s + n.height + 14 * s, W * 0.55, 22 * s, { fill: p.primary }));
    (c.c.items ?? []).slice(1, 4).forEach((it, i) => {
      els.push(icon(it.icon, mx, 360 * s + i * 56 * s, 30 * s, p.muted));
      els.push(B_(c, it.label, mx + 46 * s, 358 * s + i * 56 * s, W * 0.5, 24 * s, { fill: p.text }));
    });
    return { background: bg(p.bg), els };
  },
};

/** Mirror a layout horizontally for right-to-left languages. */
export function mirror(els: DesignElement[], W: number): DesignElement[] {
  return els.map((e) => {
    const c = { ...e, x: W - e.x - e.width, rotation: -e.rotation };
    if (c.type === "text") {
      c.direction = "rtl";
      if (c.align === "left") c.align = "right";
      else if (c.align === "right") c.align = "left";
    }
    return c;
  });
}

export function buildPage(layout: LayoutId, W: number, H: number, p: Palette, f: Fonts, c: Copy, rtl = false): Page {
  const s = Math.min(W, H) / 1080;
  const m = Math.round(Math.min(W, H) * 0.075);
  const { background, els: raw } = LAYOUTS[layout]({ W, H, s, m, p, f, c, rtl });
  // drop text boxes for copy fields a template leaves empty (e.g. wallpapers)
  const els = raw.filter((e) => e.type !== "text" || e.text.trim().length > 0);
  return page(background, rtl ? mirror(els, W) : els, c.name.slice(0, 40));
}
