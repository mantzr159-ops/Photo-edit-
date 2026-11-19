import type { DesignElement } from "./types";

export type Box = { x: number; y: number; width: number; height: number };

/** Axis-aligned bounding box of a (possibly rotated) element. Rotation is around (x, y). */
export function elementBounds(el: Pick<DesignElement, "x" | "y" | "width" | "height" | "rotation">): Box {
  const rad = (el.rotation * Math.PI) / 180;
  if (!rad) return { x: el.x, y: el.y, width: el.width, height: el.height };
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const pts = [
    [0, 0],
    [el.width, 0],
    [el.width, el.height],
    [0, el.height],
  ].map(([px, py]) => [el.x + px * cos - py * sin, el.y + px * sin + py * cos]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

export function unionBounds(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.width));
  const maxY = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function boxesIntersect(a: Box, b: Box) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export type AlignKind = "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom";

/**
 * Compute translation deltas aligning elements. With a single element (or
 * when `toPage`), alignment is relative to the page; otherwise to the selection bounds.
 */
export function alignDeltas(els: DesignElement[], kind: AlignKind, page: { width: number; height: number }, toPage: boolean) {
  const boxes = els.map(elementBounds);
  const ref = toPage ? { x: 0, y: 0, width: page.width, height: page.height } : unionBounds(boxes)!;
  return boxes.map((b) => {
    switch (kind) {
      case "left": return { dx: ref.x - b.x, dy: 0 };
      case "hcenter": return { dx: ref.x + ref.width / 2 - (b.x + b.width / 2), dy: 0 };
      case "right": return { dx: ref.x + ref.width - (b.x + b.width), dy: 0 };
      case "top": return { dx: 0, dy: ref.y - b.y };
      case "vcenter": return { dx: 0, dy: ref.y + ref.height / 2 - (b.y + b.height / 2) };
      case "bottom": return { dx: 0, dy: ref.y + ref.height - (b.y + b.height) };
    }
  });
}

/** Evenly distribute elements so gaps between them are equal. */
export function distributeDeltas(els: DesignElement[], axis: "horizontal" | "vertical") {
  const items = els.map((el, i) => ({ i, b: elementBounds(el) }));
  if (items.length < 3) return els.map(() => ({ dx: 0, dy: 0 }));
  const key = axis === "horizontal" ? "x" : "y";
  const size = axis === "horizontal" ? "width" : "height";
  items.sort((a, b) => a.b[key] - b.b[key]);
  const first = items[0].b, last = items[items.length - 1].b;
  const total = last[key] + last[size] - first[key];
  const occupied = items.reduce((s, it) => s + it.b[size], 0);
  const gap = (total - occupied) / (items.length - 1);
  const out = els.map(() => ({ dx: 0, dy: 0 }));
  let cursor = first[key];
  for (const it of items) {
    const delta = cursor - it.b[key];
    out[it.i] = axis === "horizontal" ? { dx: delta, dy: 0 } : { dx: 0, dy: delta };
    cursor += it.b[size] + gap;
  }
  return out;
}

/* ───────────────────────────── snapping ───────────────────────────── */

export type Guide = { orientation: "V" | "H"; position: number };

/**
 * Snap a moving box to page edges/centre and to other elements' edges/centres.
 * Returns the adjusted position plus the guides to display.
 */
export function snapBox(moving: Box, others: Box[], page: { width: number; height: number }, threshold: number) {
  const vTargets = [0, page.width / 2, page.width];
  const hTargets = [0, page.height / 2, page.height];
  for (const o of others) {
    vTargets.push(o.x, o.x + o.width / 2, o.x + o.width);
    hTargets.push(o.y, o.y + o.height / 2, o.y + o.height);
  }
  const vEdges = [moving.x, moving.x + moving.width / 2, moving.x + moving.width];
  const hEdges = [moving.y, moving.y + moving.height / 2, moving.y + moving.height];

  let bestV: { diff: number; target: number } | null = null;
  for (const t of vTargets)
    for (const e of vEdges) {
      const diff = t - e;
      if (Math.abs(diff) <= threshold && (!bestV || Math.abs(diff) < Math.abs(bestV.diff))) bestV = { diff, target: t };
    }
  let bestH: { diff: number; target: number } | null = null;
  for (const t of hTargets)
    for (const e of hEdges) {
      const diff = t - e;
      if (Math.abs(diff) <= threshold && (!bestH || Math.abs(diff) < Math.abs(bestH.diff))) bestH = { diff, target: t };
    }
  const guides: Guide[] = [];
  if (bestV) guides.push({ orientation: "V", position: bestV.target });
  if (bestH) guides.push({ orientation: "H", position: bestH.target });
  return { dx: bestV?.diff ?? 0, dy: bestH?.diff ?? 0, guides };
}
