"use client";
/**
 * Layout compiler: turns an AI DesignSpec into a Page of individually
 * editable elements. Layout maths is deterministic (LLMs are poor at precise
 * coordinates); the model decides content, hierarchy, palette and type.
 */
import { createIcon, createPage, createShape, createText } from "@/lib/design/factory";
import type { DesignElement, Page, TextElement } from "@/lib/design/types";
import { measureTextHeight } from "@/lib/design/render";
import { loadIconSet } from "@/lib/design/icons";
import { ensureFonts } from "@/lib/design/fonts";
import { hexToHsl, hslToHex, readableOn, withAlpha } from "@/lib/utils/color";
import type { DesignSpec } from "./schema";

const FALLBACK_ICONS = ["Sparkles", "Star", "CircleCheck", "Lightbulb", "Target", "Heart"];

function sanitizeHex(c: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(c) ? c : fallback;
}

export async function compileDesign(spec: DesignSpec, W: number, H: number): Promise<Page> {
  const icons = await loadIconSet().catch(() => ({}) as Record<string, unknown>);
  const validIcon = (name: string, i: number) => (name && name in icons ? name : FALLBACK_ICONS[i % FALLBACK_ICONS.length]);
  await ensureFonts([spec.typography.heading, spec.typography.body]);

  const P = {
    background: sanitizeHex(spec.palette.background, "#ffffff"),
    surface: sanitizeHex(spec.palette.surface, "#f4f2fb"),
    primary: sanitizeHex(spec.palette.primary, "#7444ff"),
    secondary: sanitizeHex(spec.palette.secondary, "#2ec4b6"),
    accent: sanitizeHex(spec.palette.accent, "#ff6b5a"),
    text: sanitizeHex(spec.palette.text, "#16132b"),
    muted: sanitizeHex(spec.palette.mutedText, "#4a4566"),
  };
  // guarantee legible text on the chosen background
  P.text = readableOn(P.background) === "#ffffff" && hexToHsl(P.text).l < 60 ? "#ffffff" : P.text;

  const S = Math.min(W, H) / 1080; // type scale
  const m = Math.round(Math.min(W, H) * 0.075);
  const els: DesignElement[] = [];
  const HF = spec.typography.heading, BF = spec.typography.body;

  const T = (text: string, x: number, y: number, w: number, o: Partial<TextElement>) => {
    const el = createText({ text, x, y, width: w, fontFamily: BF, fill: P.text, ...o });
    el.height = measureTextHeight(el);
    els.push(el);
    return el;
  };

  /* decoration (drawn first so it sits behind content) */
  const deco = () => {
    const d = spec.decoration;
    if (d === "circles") {
      els.push(createShape("ellipse", { x: W - W * 0.45, y: -H * 0.12, width: W * 0.6, height: W * 0.6, fill: withAlpha(P.primary, 0.12), name: "Decoration" }));
      els.push(createShape("ellipse", { x: -W * 0.15, y: H - W * 0.3, width: W * 0.4, height: W * 0.4, fill: withAlpha(P.accent, 0.14), name: "Decoration" }));
    } else if (d === "blobs") {
      els.push(createShape("blob", { x: W * 0.5, y: -H * 0.08, width: W * 0.65, height: W * 0.6, fill: { type: "radial", stops: [{ offset: 0, color: withAlpha(P.primary, 0.55) }, { offset: 1, color: withAlpha(P.primary, 0) }] }, name: "Decoration" }));
      els.push(createShape("blob", { x: -W * 0.2, y: H * 0.6, width: W * 0.6, height: W * 0.55, rotation: 25, fill: { type: "radial", stops: [{ offset: 0, color: withAlpha(P.secondary, 0.45) }, { offset: 1, color: withAlpha(P.secondary, 0) }] }, name: "Decoration" }));
    } else if (d === "lines") {
      for (let i = 0; i < 3; i++) els.push(createShape("rect", { x: m, y: m * 0.6 + i * 14 * S, width: (120 - i * 30) * S, height: 6 * S, fill: i ? P.secondary : P.accent, cornerRadius: 3, name: "Decoration" }));
    } else if (d === "waves") {
      els.push(createShape("ellipse", { x: -W * 0.2, y: H - H * 0.12, width: W * 1.4, height: H * 0.3, fill: withAlpha(P.secondary, 0.18), name: "Decoration" }));
      els.push(createShape("ellipse", { x: -W * 0.1, y: H - H * 0.07, width: W * 1.3, height: H * 0.25, fill: withAlpha(P.primary, 0.18), name: "Decoration" }));
    } else if (d === "dots") {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) els.push(createShape("ellipse", { x: W - m - c * 26 * S - 12 * S, y: m * 0.7 + r * 26 * S, width: 10 * S, height: 10 * S, fill: withAlpha(P.accent, 0.6), name: "Decoration" }));
    }
  };

  const background: Page["background"] =
    spec.decoration === "gradient"
      ? { fill: { type: "linear", angle: 135, stops: [{ offset: 0, color: P.background }, { offset: 1, color: hslToHex({ ...hexToHsl(P.background), l: Math.max(4, hexToHsl(P.background).l - 8) }) }] }, image: null, pattern: null }
      : { fill: P.background, image: null, pattern: null };

  const eyebrow = (x: number, y: number, w: number, align: TextElement["align"] = "left", color = P.primary) =>
    spec.eyebrow ? T(spec.eyebrow.toUpperCase(), x, y, w, { fontSize: 24 * S, fontWeight: 700, letterSpacing: 5 * S, fill: color, align, name: "Eyebrow" }) : null;

  const cta = (x: number, y: number, align: "left" | "center" = "left", bgColor = P.accent) => {
    if (!spec.callToAction) return y;
    const bw = Math.min(W - 2 * m, Math.max(280 * S, spec.callToAction.length * 20 * S + 120 * S));
    const bh = 84 * S;
    const bx = align === "center" ? (W - bw) / 2 : x;
    els.push(createShape("rect", { x: bx, y, width: bw, height: bh, fill: bgColor, cornerRadius: bh / 2, name: "Button" }));
    const t = createText({ text: spec.callToAction, x: bx, y: 0, width: bw, align: "center", fontFamily: HF, fontWeight: 700, fontSize: 30 * S, fill: readableOn(bgColor), name: "Button label" });
    t.height = measureTextHeight(t);
    t.y = y + (bh - t.height) / 2;
    els.push(t);
    return y + bh;
  };

  const footer = () => {
    if (!spec.footer) return;
    const f = createText({ text: spec.footer, x: m, y: 0, width: W - 2 * m, fontFamily: BF, fontSize: 20 * S, fill: P.muted, align: "center", name: "Footer" });
    f.height = measureTextHeight(f);
    f.y = H - m * 0.6 - f.height;
    els.push(f);
  };

  deco();
  const sections = spec.sections.slice(0, 6);

  switch (spec.layout) {
    case "infographic": {
      const bandH = H * 0.28;
      els.push(createShape("rect", { x: 0, y: 0, width: W, height: bandH, fill: { type: "linear", angle: 135, stops: [{ offset: 0, color: P.primary }, { offset: 1, color: P.secondary }] }, name: "Header band" }));
      const onBand = readableOn(P.primary);
      let y = m;
      const e = eyebrow(m, y, W - 2 * m, "left", withAlpha(onBand, 0.85));
      if (e) y += e.height + 16 * S;
      const t = T(spec.title, m, y, W - 2 * m, { fontFamily: HF, fontWeight: 800, fontSize: 92 * S, lineHeight: 1.08, fill: onBand, name: "Title" });
      y += t.height + 18 * S;
      if (spec.subtitle) T(spec.subtitle, m, y, W - 2 * m, { fontSize: 32 * S, fill: withAlpha(onBand, 0.88), lineHeight: 1.4, name: "Subtitle" });
      // shrink header text if it overflows the band
      const headerBottom = Math.max(...els.filter((x) => x.type === "text").map((x) => x.y + x.height));
      const bandBottom = Math.max(Math.min(bandH, H * 0.2), headerBottom + m * 0.8);
      (els.find((x) => x.name === "Header band") as DesignElement).height = bandBottom;
      const avail = H - bandBottom - m * 1.6 - (spec.footer ? 40 * S : 0);
      const n = Math.max(1, sections.length);
      const gap = 24 * S;
      const cardH = (avail - gap * (n - 1)) / n;
      sections.forEach((s, i) => {
        const cy = bandBottom + m * 0.8 + i * (cardH + gap);
        els.push(createShape("rect", { x: m, y: cy, width: W - 2 * m, height: cardH, fill: P.surface, cornerRadius: 28 * S, shadow: { enabled: true, color: P.primary, blur: 24 * S, offsetX: 0, offsetY: 8 * S, opacity: 0.08 }, name: `Card ${i + 1}` }));
        const d = Math.min(cardH * 0.62, 120 * S);
        const col = i % 2 ? P.accent : P.primary;
        els.push(createShape("ellipse", { x: m + 28 * S, y: cy + (cardH - d) / 2, width: d, height: d, fill: withAlpha(col, 0.14), name: "Icon badge" }));
        els.push(createIcon(validIcon(s.icon, i), { x: m + 28 * S + d * 0.22, y: cy + (cardH - d) / 2 + d * 0.22, width: d * 0.56, height: d * 0.56, color: col, strokeWidth: 2 }));
        const tx = m + 28 * S + d + 28 * S;
        const tw = W - m - tx - 28 * S;
        const h = createText({ text: s.heading, x: tx, y: 0, width: tw, fontFamily: HF, fontWeight: 700, fontSize: Math.min(44 * S, cardH * 0.26), fill: P.text });
        h.height = measureTextHeight(h);
        const b = createText({ text: s.body, x: tx, y: 0, width: tw, fontFamily: BF, fontSize: Math.min(28 * S, cardH * 0.17), fill: P.muted, lineHeight: 1.4 });
        b.height = measureTextHeight(b);
        const block = h.height + 8 * S + b.height;
        h.y = cy + (cardH - block) / 2;
        b.y = h.y + h.height + 8 * S;
        els.push(h, b);
      });
      footer();
      break;
    }
    case "list":
    case "grid": {
      let y = m * 1.3;
      const e = eyebrow(m, y, W - 2 * m);
      if (e) y += e.height + 14 * S;
      const t = T(spec.title, m, y, W - 2 * m, { fontFamily: HF, fontWeight: 800, fontSize: 84 * S, lineHeight: 1.08, name: "Title" });
      y += t.height + 16 * S;
      if (spec.subtitle) {
        const st = T(spec.subtitle, m, y, W - 2 * m, { fontSize: 30 * S, fill: P.muted, lineHeight: 1.45, name: "Subtitle" });
        y += st.height;
      }
      y += m * 0.7;
      const bottom = H - m * 1.2 - (spec.callToAction ? 110 * S : 0) - (spec.footer ? 40 * S : 0);
      if (spec.layout === "list") {
        const n = Math.max(1, sections.length);
        const rowH = (bottom - y) / n;
        sections.forEach((s, i) => {
          const ry = y + i * rowH;
          const d = Math.min(rowH * 0.6, 96 * S);
          els.push(createShape("rect", { x: m, y: ry + (rowH - d) / 2, width: d, height: d, cornerRadius: d * 0.3, fill: i % 2 ? P.secondary : P.primary, name: "Icon tile" }));
          els.push(createIcon(validIcon(s.icon, i), { x: m + d * 0.22, y: ry + (rowH - d) / 2 + d * 0.22, width: d * 0.56, height: d * 0.56, color: readableOn(i % 2 ? P.secondary : P.primary), strokeWidth: 2 }));
          const tx = m + d + 28 * S, tw = W - m - tx;
          const h = createText({ text: s.heading, x: tx, y: 0, width: tw, fontFamily: HF, fontWeight: 700, fontSize: Math.min(40 * S, rowH * 0.28), fill: P.text });
          h.height = measureTextHeight(h);
          const b = createText({ text: s.body, x: tx, y: 0, width: tw, fontFamily: BF, fontSize: Math.min(26 * S, rowH * 0.18), fill: P.muted, lineHeight: 1.4 });
          b.height = measureTextHeight(b);
          const block = h.height + 6 * S + b.height;
          h.y = ry + (rowH - block) / 2;
          b.y = h.y + h.height + 6 * S;
          els.push(h, b);
          if (i < n - 1) els.push(createShape("rect", { x: tx, y: ry + rowH - 1, width: tw, height: 2 * S, fill: withAlpha(P.muted, 0.2), name: "Divider" }));
        });
      } else {
        const cols = W > H * 1.2 ? 3 : 2;
        const n = Math.max(1, sections.length);
        const rows = Math.ceil(n / cols);
        const gap = 24 * S;
        const cw = (W - 2 * m - gap * (cols - 1)) / cols;
        const ch = (bottom - y - gap * (rows - 1)) / rows;
        sections.forEach((s, i) => {
          const cx = m + (i % cols) * (cw + gap), cy = y + Math.floor(i / cols) * (ch + gap);
          els.push(createShape("rect", { x: cx, y: cy, width: cw, height: ch, fill: P.surface, cornerRadius: 28 * S, name: `Card ${i + 1}` }));
          const d = Math.min(ch * 0.3, 88 * S);
          els.push(createIcon(validIcon(s.icon, i), { x: cx + 28 * S, y: cy + 28 * S, width: d, height: d, color: i % 2 ? P.accent : P.primary, strokeWidth: 2 }));
          const h = T(s.heading, cx + 28 * S, cy + 28 * S + d + 16 * S, cw - 56 * S, { fontFamily: HF, fontWeight: 700, fontSize: Math.min(38 * S, ch * 0.13) });
          T(s.body, cx + 28 * S, h.y + h.height + 8 * S, cw - 56 * S, { fontSize: Math.min(24 * S, ch * 0.085), fill: P.muted, lineHeight: 1.4 });
        });
      }
      cta(m, H - m - 84 * S - (spec.footer ? 40 * S : 0));
      footer();
      break;
    }
    case "split": {
      const panelW = W * 0.48;
      els.push(createShape("rect", { x: 0, y: 0, width: panelW, height: H, fill: { type: "linear", angle: 135, stops: [{ offset: 0, color: P.primary }, { offset: 1, color: P.secondary }] }, name: "Panel" }));
      const on = readableOn(P.primary);
      let y = H * 0.18;
      const e = eyebrow(m, y, panelW - 2 * m, "left", withAlpha(on, 0.85));
      if (e) y += e.height + 14 * S;
      const t = T(spec.title, m, y, panelW - 2 * m, { fontFamily: HF, fontWeight: 800, fontSize: 80 * S, lineHeight: 1.08, fill: on, name: "Title" });
      y += t.height + 18 * S;
      if (spec.subtitle) {
        const st = T(spec.subtitle, m, y, panelW - 2 * m, { fontSize: 28 * S, fill: withAlpha(on, 0.88), lineHeight: 1.45 });
        y += st.height + 30 * S;
      }
      cta(m, y, "left", P.accent);
      const rx = panelW + m * 0.8, rw = W - rx - m;
      const n = Math.max(1, sections.length);
      const rowH = (H - 2 * m) / n;
      sections.forEach((s, i) => {
        const ry = m + i * rowH;
        const d = Math.min(rowH * 0.45, 72 * S);
        els.push(createIcon(validIcon(s.icon, i), { x: rx, y: ry + rowH * 0.2, width: d, height: d, color: i % 2 ? P.accent : P.primary, strokeWidth: 2 }));
        const h = T(s.heading, rx + d + 20 * S, ry + rowH * 0.18, rw - d - 20 * S, { fontFamily: HF, fontWeight: 700, fontSize: Math.min(36 * S, rowH * 0.22) });
        T(s.body, rx + d + 20 * S, h.y + h.height + 6 * S, rw - d - 20 * S, { fontSize: Math.min(24 * S, rowH * 0.15), fill: P.muted, lineHeight: 1.4 });
      });
      break;
    }
    case "poster": {
      const big = createShape(sections.length % 2 ? "ellipse" : "blob", { x: W * 0.12, y: H * 0.06, width: W * 0.76, height: W * 0.76, fill: { type: "linear", angle: 45, stops: [{ offset: 0, color: P.primary }, { offset: 1, color: P.accent }] }, name: "Hero shape" });
      els.push(big);
      els.push(createIcon(validIcon(spec.sections[0]?.icon ?? spec.suggestedIcons[0] ?? "", 0), { x: W / 2 - W * 0.17, y: H * 0.06 + W * 0.38 - W * 0.17, width: W * 0.34, height: W * 0.34, color: readableOn(P.primary), strokeWidth: 1.5 }));
      let y = H * 0.06 + W * 0.8 + m * 0.4;
      const e = eyebrow(m, y, W - 2 * m);
      if (e) y += e.height + 12 * S;
      const t = T(spec.title, m, y, W - 2 * m, { fontFamily: HF, fontWeight: 800, fontSize: 110 * S, lineHeight: 1.02, name: "Title" });
      y += t.height + 16 * S;
      if (spec.subtitle) {
        const st = T(spec.subtitle, m, y, W - 2 * m, { fontSize: 32 * S, fill: P.muted, lineHeight: 1.4 });
        y += st.height + 24 * S;
      }
      const remaining = H - y - m - (spec.footer ? 40 * S : 0);
      if (sections.length && remaining > 120 * S) {
        const n = Math.min(3, sections.length);
        const cw = (W - 2 * m - 24 * S * (n - 1)) / n;
        sections.slice(0, n).forEach((s, i) => {
          const x = m + i * (cw + 24 * S);
          els.push(createShape("rect", { x, y, width: 48 * S, height: 6 * S, fill: P.accent, cornerRadius: 3 }));
          const h = T(s.heading, x, y + 20 * S, cw, { fontFamily: HF, fontWeight: 700, fontSize: 30 * S });
          T(s.body, x, h.y + h.height + 6 * S, cw, { fontSize: 22 * S, fill: P.muted, lineHeight: 1.4 });
        });
      }
      footer();
      break;
    }
    case "hero":
    default: {
      let y = H * (sections.length ? 0.16 : 0.3);
      const e = eyebrow(m, y, W - 2 * m, "center");
      if (e) y += e.height + 18 * S;
      const t = T(spec.title, m, y, W - 2 * m, { fontFamily: HF, fontWeight: 800, fontSize: 112 * S, lineHeight: 1.05, align: "center", name: "Title" });
      y += t.height + 22 * S;
      if (spec.subtitle) {
        const st = T(spec.subtitle, m * 1.6, y, W - 3.2 * m, { fontSize: 34 * S, fill: P.muted, lineHeight: 1.45, align: "center", name: "Subtitle" });
        y += st.height + 40 * S;
      }
      y = cta(m, y, "center") + 50 * S;
      const n = Math.min(3, sections.length);
      if (n) {
        const cw = (W - 2 * m - 24 * S * (n - 1)) / n;
        sections.slice(0, n).forEach((s, i) => {
          const x = m + i * (cw + 24 * S);
          const d = 72 * S;
          els.push(createIcon(validIcon(s.icon, i), { x: x + (cw - d) / 2, y, width: d, height: d, color: P.primary, strokeWidth: 2 }));
          const h = T(s.heading, x, y + d + 16 * S, cw, { fontFamily: HF, fontWeight: 700, fontSize: 30 * S, align: "center" });
          T(s.body, x, h.y + h.height + 6 * S, cw, { fontSize: 22 * S, fill: P.muted, align: "center", lineHeight: 1.4 });
        });
      }
      footer();
    }
  }
  return createPage({ background, elements: els, name: spec.title.slice(0, 40) });
}
