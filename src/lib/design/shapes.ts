import type { ImageMask, ShapeElement } from "./types";

/** SVG path generators for shapes, sized to an arbitrary w×h box at origin. */

function polygonPoints(n: number, w: number, h: number, rotate = -Math.PI / 2) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = rotate + (i * 2 * Math.PI) / n;
    pts.push([w / 2 + (w / 2) * Math.cos(a), h / 2 + (h / 2) * Math.sin(a)]);
  }
  return pts;
}

function toPath(pts: [number, number][]) {
  return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ") + " Z";
}

export function starPoints(points: number, inner: number, w: number, h: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? 1 : inner;
    pts.push([w / 2 + (w / 2) * r * Math.cos(a), h / 2 + (h / 2) * r * Math.sin(a)]);
  }
  return pts;
}

export function heartPath(w: number, h: number) {
  const sx = w / 100, sy = h / 92;
  const p = (x: number, y: number) => `${(x * sx).toFixed(2)} ${(y * sy).toFixed(2)}`;
  return `M${p(50, 92)} C${p(20, 70)} ${p(0, 52)} ${p(0, 28)} C${p(0, 12)} ${p(12, 0)} ${p(27, 0)} C${p(38, 0)} ${p(46, 6)} ${p(50, 15)} C${p(54, 6)} ${p(62, 0)} ${p(73, 0)} C${p(88, 0)} ${p(100, 12)} ${p(100, 28)} C${p(100, 52)} ${p(80, 70)} ${p(50, 92)} Z`;
}

export function blobPath(w: number, h: number) {
  const sx = w / 200, sy = h / 200;
  const p = (x: number, y: number) => `${(x * sx).toFixed(2)} ${(y * sy).toFixed(2)}`;
  return `M${p(152, 30)} C${p(185, 55)} ${p(200, 102)} ${p(184, 142)} C${p(168, 182)} ${p(120, 204)} ${p(78, 194)} C${p(36, 184)} ${p(2, 148)} ${p(1, 104)} C${p(0, 60)} ${p(30, 18)} ${p(74, 6)} C${p(104, -2)} ${p(128, 12)} ${p(152, 30)} Z`;
}

export function arrowShapePath(w: number, h: number) {
  const head = Math.min(w * 0.4, h);
  return toPath([[0, h * 0.3], [w - head, h * 0.3], [w - head, 0], [w, h / 2], [w - head, h], [w - head, h * 0.7], [0, h * 0.7]]);
}

export function archPath(w: number, h: number) {
  const r = w / 2;
  return `M0 ${h} L0 ${r} A${r} ${r} 0 0 1 ${w} ${r} L${w} ${h} Z`;
}

/** Path data for a shape element, or null for shapes rendered natively (rect/ellipse). */
export function shapePath(el: Pick<ShapeElement, "shape" | "width" | "height" | "sides" | "innerRadiusRatio">): string | null {
  const { width: w, height: h } = el;
  switch (el.shape) {
    case "triangle": return toPath([[w / 2, 0], [w, h], [0, h]]);
    case "polygon": return toPath(polygonPoints(Math.max(3, el.sides ?? 6), w, h));
    case "star": return toPath(starPoints(Math.max(3, el.sides ?? 5), el.innerRadiusRatio ?? 0.45, w, h));
    case "heart": return heartPath(w, h);
    case "blob": return blobPath(w, h);
    case "arrowShape": return arrowShapePath(w, h);
    default: return null;
  }
}

/** Canvas clip path for an image mask. */
export function applyMaskClip(ctx: CanvasRenderingContext2D | { beginPath(): void }, mask: ImageMask, w: number, h: number, radius = 0) {
  const c = ctx as CanvasRenderingContext2D;
  switch (mask) {
    case "circle":
      c.beginPath();
      c.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      c.closePath();
      return;
    case "rounded": {
      const r = Math.min(radius || Math.min(w, h) * 0.12, w / 2, h / 2);
      c.beginPath();
      c.moveTo(r, 0);
      c.arcTo(w, 0, w, h, r);
      c.arcTo(w, h, 0, h, r);
      c.arcTo(0, h, 0, 0, r);
      c.arcTo(0, 0, w, 0, r);
      c.closePath();
      return;
    }
    case "hexagon": {
      const pts = polygonPoints(6, w, h, 0);
      c.beginPath();
      pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.closePath();
      return;
    }
    case "arch": {
      const r = w / 2;
      c.beginPath();
      c.moveTo(0, h);
      c.lineTo(0, r);
      c.arc(r, r, r, Math.PI, 0);
      c.lineTo(w, h);
      c.closePath();
      return;
    }
    case "blob": {
      c.beginPath();
      const sx = w / 200, sy = h / 200;
      c.moveTo(152 * sx, 30 * sy);
      c.bezierCurveTo(185 * sx, 55 * sy, 200 * sx, 102 * sy, 184 * sx, 142 * sy);
      c.bezierCurveTo(168 * sx, 182 * sy, 120 * sx, 204 * sy, 78 * sx, 194 * sy);
      c.bezierCurveTo(36 * sx, 184 * sy, 2 * sx, 148 * sy, 1 * sx, 104 * sy);
      c.bezierCurveTo(0, 60 * sy, 30 * sx, 18 * sy, 74 * sx, 6 * sy);
      c.bezierCurveTo(104 * sx, -2 * sy, 128 * sx, 12 * sy, 152 * sx, 30 * sy);
      c.closePath();
      return;
    }
    default:
      c.beginPath();
      c.rect(0, 0, w, h);
      c.closePath();
  }
}

/** SVG path equivalent of a mask (for SVG export). */
export function maskSvgPath(mask: ImageMask, w: number, h: number, radius = 0): string {
  switch (mask) {
    case "circle": return `M${w / 2} 0 A${w / 2} ${h / 2} 0 1 1 ${w / 2} ${h} A${w / 2} ${h / 2} 0 1 1 ${w / 2} 0 Z`;
    case "rounded": {
      const r = Math.min(radius || Math.min(w, h) * 0.12, w / 2, h / 2);
      return `M${r} 0 H${w - r} A${r} ${r} 0 0 1 ${w} ${r} V${h - r} A${r} ${r} 0 0 1 ${w - r} ${h} H${r} A${r} ${r} 0 0 1 0 ${h - r} V${r} A${r} ${r} 0 0 1 ${r} 0 Z`;
    }
    case "hexagon": return toPath(polygonPoints(6, w, h, 0));
    case "arch": return archPath(w, h);
    case "blob": return blobPath(w, h);
    default: return `M0 0 H${w} V${h} H0 Z`;
  }
}
