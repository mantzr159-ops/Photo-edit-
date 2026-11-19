/**
 * Deterministic design tools (no AI required):
 *  - recolour a page with a new palette (luminance-rank mapping + contrast fix)
 *  - apply a font pairing (largest text → heading font)
 *  - "smart tidy": snap near-aligned edges, centre near-centred items, even out vertical rhythm
 */
import type { DesignElement, Page, Paint, TextElement } from "@/lib/design/types";
import { contrastRatio, luminance, readableOn } from "@/lib/utils/color";
import { elementBounds } from "@/lib/design/geometry";

const isHex = (c: string) => /^#[0-9a-f]{6}$/i.test(c);

function mapPaint(p: Paint, map: (c: string) => string): Paint {
  if (typeof p === "string") return isHex(p) ? map(p.toLowerCase()) : p;
  return { ...p, stops: p.stops.map((s) => ({ ...s, color: isHex(s.color) ? map(s.color.toLowerCase()) : s.color })) };
}

function collect(page: Page) {
  const counts = new Map<string, number>();
  const add = (p: Paint | undefined, weight = 1) => {
    if (!p) return;
    const list = typeof p === "string" ? [p] : p.stops.map((s) => s.color);
    list.forEach((c) => isHex(c) && counts.set(c.toLowerCase(), (counts.get(c.toLowerCase()) ?? 0) + weight));
  };
  add(page.background.fill, 10);
  for (const e of page.elements) {
    if (e.type === "shape") add(e.fill, 2);
    if (e.type === "text") add(e.fill);
    if (e.type === "icon") add(e.color);
    if (e.type === "line") add(e.stroke);
  }
  return [...counts.keys()];
}

export function recolorPage(page: Page, palette: string[]): Page {
  const pal = palette.filter(isHex).map((c) => c.toLowerCase());
  if (pal.length < 2) return page;
  const old = collect(page).sort((a, b) => luminance(a) - luminance(b));
  const sortedPal = [...pal].sort((a, b) => luminance(a) - luminance(b));
  const mapping = new Map<string, string>();
  old.forEach((c, i) => {
    const t = old.length === 1 ? 0 : i / (old.length - 1);
    mapping.set(c, sortedPal[Math.round(t * (sortedPal.length - 1))]);
  });
  const m = (c: string) => mapping.get(c) ?? c;
  const background = { ...page.background, fill: mapPaint(page.background.fill, m) };
  const bgColor = typeof background.fill === "string" ? background.fill : background.fill.stops[0].color;
  const elements = page.elements.map((e): DesignElement => {
    switch (e.type) {
      case "shape": return { ...e, fill: mapPaint(e.fill, m), stroke: isHex(e.stroke) ? m(e.stroke.toLowerCase()) : e.stroke };
      case "line": return { ...e, stroke: isHex(e.stroke) ? m(e.stroke.toLowerCase()) : e.stroke };
      case "icon": return { ...e, color: isHex(e.color) ? m(e.color.toLowerCase()) : e.color };
      case "text": {
        let fill = mapPaint(e.fill, m);
        // only fix contrast for text sitting directly on the page background
        if (typeof fill === "string" && isHex(bgColor) && contrastRatio(fill, bgColor) < 2.2 && !overlapsShape(e, page)) fill = readableOn(bgColor);
        return { ...e, fill };
      }
      default: return e;
    }
  });
  return { ...page, background, elements };
}

function overlapsShape(t: TextElement, page: Page) {
  const tb = elementBounds(t);
  return page.elements.some((e) => {
    if (e.type !== "shape" && e.type !== "image") return false;
    const b = elementBounds(e);
    return b.x <= tb.x && b.y <= tb.y && b.x + b.width >= tb.x + tb.width && b.y + b.height >= tb.y + tb.height;
  });
}

export function applyFontPair(page: Page, heading: string, body: string): Page {
  const texts = page.elements.filter((e): e is TextElement => e.type === "text");
  if (!texts.length) return page;
  const sizes = texts.map((t) => t.fontSize).sort((a, b) => b - a);
  const threshold = sizes.length > 1 ? (sizes[0] + sizes[sizes.length - 1]) / 2 : 0;
  return {
    ...page,
    elements: page.elements.map((e) => (e.type === "text" ? { ...e, fontFamily: e.fontSize >= threshold && e.fontSize >= sizes[0] * 0.6 ? heading : body } : e)),
  };
}

/** Returns per-element position patches that tidy the layout. */
export function smartTidy(page: Page, W: number, H: number): { id: string; patch: Partial<DesignElement> }[] {
  const unit = Math.min(W, H);
  const margin = unit * 0.05;
  const tol = unit * 0.02;
  const content = page.elements.filter((e) => !e.locked && !e.hidden && e.name !== "Decoration" && e.width < W * 0.9 && e.height < H * 0.9 && !e.rotation);
  const pos = new Map(content.map((e) => [e.id, { x: e.x, y: e.y }]));

  // 1. keep content inside the safe margin
  for (const e of content) {
    const p = pos.get(e.id)!;
    if (e.width <= W - 2 * margin) p.x = Math.min(W - margin - e.width, Math.max(margin, p.x));
    if (e.height <= H - 2 * margin) p.y = Math.min(H - margin - e.height, Math.max(margin, p.y));
  }
  // 2. centre items that are almost centred
  for (const e of content) {
    const p = pos.get(e.id)!;
    const cx = p.x + e.width / 2;
    if (Math.abs(cx - W / 2) < tol * 1.5) p.x = W / 2 - e.width / 2;
  }
  // 3. cluster near-identical left edges
  const sorted = [...content].sort((a, b) => pos.get(a.id)!.x - pos.get(b.id)!.x);
  let cluster: DesignElement[] = [];
  const flush = () => {
    if (cluster.length > 1) {
      const x = Math.min(...cluster.map((c) => pos.get(c.id)!.x));
      cluster.forEach((c) => (pos.get(c.id)!.x = x));
    }
    cluster = [];
  };
  for (const e of sorted) {
    if (cluster.length && Math.abs(pos.get(e.id)!.x - pos.get(cluster[0].id)!.x) > tol) flush();
    cluster.push(e);
  }
  flush();
  // 4. even vertical rhythm for stacked text sharing a left edge
  const columns = new Map<number, TextElement[]>();
  for (const e of content) if (e.type === "text") {
    const k = Math.round(pos.get(e.id)!.x);
    columns.set(k, [...(columns.get(k) ?? []), e]);
  }
  for (const col of columns.values()) {
    if (col.length < 3) continue;
    col.sort((a, b) => pos.get(a.id)!.y - pos.get(b.id)!.y);
    const gaps = col.slice(1).map((e, i) => pos.get(e.id)!.y - (pos.get(col[i].id)!.y + col[i].height));
    if (gaps.some((g) => g < 0)) continue;
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (gaps.every((g) => Math.abs(g - avg) < avg * 0.6 + tol)) {
      let y = pos.get(col[0].id)!.y + col[0].height;
      for (const e of col.slice(1)) {
        pos.get(e.id)!.y = y + avg;
        y = pos.get(e.id)!.y + e.height;
      }
    }
  }
  return content
    .filter((e) => {
      const p = pos.get(e.id)!;
      return Math.abs(p.x - e.x) > 0.5 || Math.abs(p.y - e.y) > 0.5;
    })
    .map((e) => ({ id: e.id, patch: { x: Math.round(pos.get(e.id)!.x), y: Math.round(pos.get(e.id)!.y) } }));
}
