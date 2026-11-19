/**
 * Render descriptors: a single source of truth that maps design elements to
 * Konva node configurations. Used by:
 *   - the react-konva editor canvas (components/editor/canvas/*)
 *   - the imperative renderer used for exports & thumbnails (lib/export/*)
 *
 * Every element renders as an outer Group positioned at (x, y) with rotation &
 * opacity; children are laid out in local coordinates (0..width, 0..height).
 * Client-only module (imports Konva).
 */
import Konva from "konva";
import type { DesignElement, ImageElement, Paint, PageBackground, Shadow, TextElement } from "./types";
import { applyMaskClip, shapePath } from "./shapes";

export type NodeKind = "Group" | "Rect" | "Ellipse" | "Path" | "Line" | "Arrow" | "Text" | "Image" | "Circle";

export interface NodeDesc {
  kind: NodeKind;
  key: string;
  config: Record<string, unknown>;
  children?: NodeDesc[];
  /** node must be cached for Konva filters to apply */
  cache?: boolean;
}

export interface RenderContext {
  getImage: (src: string) => HTMLImageElement | undefined;
  /** rasterised icon image for an icon element (color/stroke specific) */
  getIcon: (key: string) => HTMLImageElement | undefined;
}

export const iconKey = (el: { icon: string; color: string; strokeWidth: number }) => `${el.icon}|${el.color}|${el.strokeWidth}`;

/* ───────────────────────────── paints ───────────────────────────── */

export function paintToKonva(paint: Paint, w: number, h: number, prefix: "fill" | "stroke" = "fill"): Record<string, unknown> {
  if (typeof paint === "string") return { [prefix]: paint };
  const stops = [...paint.stops].sort((a, b) => a.offset - b.offset).flatMap((s) => [s.offset, s.color]);
  if (paint.type === "linear") {
    const rad = (paint.angle * Math.PI) / 180;
    const cx = w / 2, cy = h / 2;
    // half-length of the gradient line so it spans the full box at this angle
    const half = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2;
    const dx = Math.cos(rad) * half, dy = Math.sin(rad) * half;
    return {
      [prefix]: undefined,
      [`${prefix}LinearGradientStartPoint`]: { x: cx - dx, y: cy - dy },
      [`${prefix}LinearGradientEndPoint`]: { x: cx + dx, y: cy + dy },
      [`${prefix}LinearGradientColorStops`]: stops,
      ...(prefix === "fill" ? { fillPriority: "linear-gradient" } : {}),
    };
  }
  return {
    [`${prefix}RadialGradientStartPoint`]: { x: w / 2, y: h / 2 },
    [`${prefix}RadialGradientEndPoint`]: { x: w / 2, y: h / 2 },
    [`${prefix}RadialGradientStartRadius`]: 0,
    [`${prefix}RadialGradientEndRadius`]: Math.max(w, h) * 0.7,
    [`${prefix}RadialGradientColorStops`]: stops,
    ...(prefix === "fill" ? { fillPriority: "radial-gradient" } : {}),
  };
}

export { paintToCss } from "./render-css";

/** First / dominant colour of a paint. */
export function paintPrimary(paint: Paint): string {
  return typeof paint === "string" ? paint : paint.stops[0]?.color ?? "#000000";
}

function shadowProps(shadow?: Shadow): Record<string, unknown> {
  if (!shadow?.enabled) return { shadowEnabled: false };
  return {
    shadowEnabled: true,
    shadowColor: shadow.color,
    shadowBlur: shadow.blur,
    shadowOffsetX: shadow.offsetX,
    shadowOffsetY: shadow.offsetY,
    shadowOpacity: shadow.opacity,
    shadowForStrokeEnabled: false,
  };
}

/* ───────────────────────────── text ───────────────────────────── */

export function transformText(el: Pick<TextElement, "text" | "textTransform">) {
  if (el.textTransform === "uppercase") return el.text.toUpperCase();
  if (el.textTransform === "lowercase") return el.text.toLowerCase();
  return el.text;
}

export function textKonvaConfig(el: TextElement): Record<string, unknown> {
  const decoration = [el.underline ? "underline" : "", el.strike ? "line-through" : ""].filter(Boolean).join(" ");
  return {
    text: transformText(el),
    fontFamily: `"${el.fontFamily}", sans-serif`,
    fontSize: el.fontSize,
    fontStyle: `${el.italic ? "italic " : ""}${el.fontWeight}`,
    textDecoration: decoration || "",
    align: el.align,
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing,
    width: Math.max(1, el.width),
    wrap: "word",
    ...paintToKonva(el.fill, el.width, el.height),
    stroke: el.strokeWidth ? el.stroke : undefined,
    strokeWidth: el.strokeWidth || 0,
    fillAfterStrokeEnabled: true,
    ...shadowProps(el.shadow),
  };
}

let measureNode: Konva.Text | null = null;

/** Measure the natural height of a text element at its current width. */
export function measureTextHeight(el: TextElement): number {
  if (typeof window === "undefined") return el.height;
  if (!measureNode) measureNode = new Konva.Text();
  const cfg = textKonvaConfig(el);
  measureNode.setAttrs({ ...cfg, height: undefined });
  return Math.ceil(measureNode.height());
}

/** Natural single-line width (for auto-sizing new text boxes). */
export function measureTextWidth(el: TextElement): number {
  if (typeof window === "undefined") return el.width;
  if (!measureNode) measureNode = new Konva.Text();
  const cfg = textKonvaConfig(el);
  measureNode.setAttrs({ ...cfg, width: undefined, wrap: "none", height: undefined });
  return Math.ceil(measureNode.width()) + 2;
}

/* ───────────────────────────── images ───────────────────────────── */

/** "cover" crop rectangle in natural image pixels. */
export function coverCrop(nw: number, nh: number, w: number, h: number) {
  const scale = Math.max(w / nw, h / nh);
  const cw = w / scale, ch = h / scale;
  return { x: (nw - cw) / 2, y: (nh - ch) / 2, width: cw, height: ch };
}

function filterList(el: ImageElement) {
  const f = el.filters ?? {};
  const list: unknown[] = [];
  if (f.brightness) list.push(Konva.Filters.Brighten);
  if (f.contrast) list.push(Konva.Filters.Contrast);
  if (f.saturation) list.push(Konva.Filters.HSL);
  if (f.blur) list.push(Konva.Filters.Blur);
  if (f.grayscale) list.push(Konva.Filters.Grayscale);
  if (f.sepia) list.push(Konva.Filters.Sepia);
  return list;
}

/* ───────────────────────────── elements ───────────────────────────── */

export function elementGroupConfig(el: DesignElement): Record<string, unknown> {
  return {
    id: el.id,
    name: "element",
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    opacity: el.opacity,
    visible: !el.hidden,
  };
}

/** Children of an element's group in local coordinates. */
export function describeElement(el: DesignElement, ctx: RenderContext): NodeDesc[] {
  const w = el.width, h = el.height;
  const flip: Record<string, unknown> =
    el.flipX || el.flipY ? { scaleX: el.flipX ? -1 : 1, scaleY: el.flipY ? -1 : 1, x: el.flipX ? w : 0, y: el.flipY ? h : 0 } : {};
  const wrap = (children: NodeDesc[]): NodeDesc[] =>
    Object.keys(flip).length ? [{ kind: "Group", key: "flip", config: flip, children }] : children;

  switch (el.type) {
    case "shape": {
      const common = {
        ...paintToKonva(el.fill, w, h),
        stroke: el.strokeWidth ? el.stroke : undefined,
        strokeWidth: el.strokeWidth,
        dash: el.dash,
        ...shadowProps(el.shadow),
        perfectDrawEnabled: false,
      };
      if (el.shape === "rect") {
        return wrap([{ kind: "Rect", key: "s", config: { width: w, height: h, cornerRadius: Math.min(el.cornerRadius ?? 0, w / 2, h / 2), ...common } }]);
      }
      if (el.shape === "ellipse") {
        return wrap([{ kind: "Ellipse", key: "s", config: { x: w / 2, y: h / 2, radiusX: w / 2, radiusY: h / 2, ...common } }]);
      }
      return wrap([{ kind: "Path", key: "s", config: { data: shapePath(el) ?? "", ...common } }]);
    }
    case "line": {
      const y = h / 2;
      const points = el.curved ? [0, h, w / 2, 0, w, h] : [0, y, w, y];
      const pointer = Math.max(10, el.strokeWidth * 3);
      const nodes: NodeDesc[] = [
        {
          kind: "Arrow",
          key: "l",
          config: {
            points,
            tension: el.curved ? 0.5 : 0,
            stroke: el.stroke,
            fill: el.stroke,
            strokeWidth: el.strokeWidth,
            dash: el.dash,
            lineCap: "round",
            lineJoin: "round",
            pointerAtBeginning: el.startCap === "arrow",
            pointerAtEnding: el.endCap === "arrow",
            pointerLength: pointer,
            pointerWidth: pointer,
            hitStrokeWidth: Math.max(20, el.strokeWidth + 16),
            ...shadowProps(el.shadow),
          },
        },
      ];
      const r = Math.max(4, el.strokeWidth * 1.4);
      if (el.startCap === "circle") nodes.push({ kind: "Circle", key: "c1", config: { x: points[0], y: points[1], radius: r, fill: el.stroke } });
      if (el.endCap === "circle") nodes.push({ kind: "Circle", key: "c2", config: { x: points[points.length - 2], y: points[points.length - 1], radius: r, fill: el.stroke } });
      return wrap(nodes);
    }
    case "text": {
      const nodes: NodeDesc[] = [];
      if (el.background?.color) {
        const p = el.background.padding;
        nodes.push({
          kind: "Rect",
          key: "bg",
          config: { x: -p, y: -p, width: w + p * 2, height: h + p * 2, fill: el.background.color, cornerRadius: el.background.radius },
        });
      }
      nodes.push({ kind: "Text", key: "t", config: textKonvaConfig(el) });
      return nodes;
    }
    case "image": {
      const img = ctx.getImage(el.src);
      const nw = el.naturalWidth || img?.naturalWidth || w;
      const nh = el.naturalHeight || img?.naturalHeight || h;
      const crop = el.crop ?? coverCrop(nw, nh, w, h);
      const f = el.filters ?? {};
      const filters = filterList(el);
      const imageNode: NodeDesc = img
        ? {
            kind: "Image",
            key: "img",
            config: {
              image: img,
              width: w,
              height: h,
              crop,
              filters,
              brightness: f.brightness ?? 0,
              contrast: f.contrast ?? 0,
              saturation: f.saturation ?? 0,
              blurRadius: f.blur ?? 0,
            },
            cache: filters.length > 0,
          }
        : { kind: "Rect", key: "img", config: { width: w, height: h, fill: "#ece9f6" } };
      const needsClip = el.mask !== "none" || (el.cornerRadius ?? 0) > 0;
      const mask = el.mask === "none" && el.cornerRadius > 0 ? "rounded" : el.mask;
      const children: NodeDesc[] = [
        needsClip
          ? {
              kind: "Group",
              key: "clip",
              config: { clipFunc: (c: CanvasRenderingContext2D) => applyMaskClip(c, mask, w, h, el.cornerRadius) },
              children: [imageNode],
            }
          : imageNode,
      ];
      if (el.shadow?.enabled) {
        // Shadow drawn by a mask-shaped backing shape so it follows the clip.
        children.unshift({
          kind: "Rect",
          key: "shadow",
          config: {
            width: w,
            height: h,
            fill: "#000",
            cornerRadius: mask === "circle" ? Math.min(w, h) / 2 : mask === "rounded" ? el.cornerRadius || Math.min(w, h) * 0.12 : 0,
            ...shadowProps(el.shadow),
          },
        });
      }
      if (el.strokeWidth && el.stroke) {
        children.push({
          kind: mask === "circle" ? "Ellipse" : "Rect",
          key: "stroke",
          config:
            mask === "circle"
              ? { x: w / 2, y: h / 2, radiusX: w / 2, radiusY: h / 2, stroke: el.stroke, strokeWidth: el.strokeWidth, listening: false }
              : { width: w, height: h, stroke: el.stroke, strokeWidth: el.strokeWidth, cornerRadius: mask === "rounded" ? el.cornerRadius || Math.min(w, h) * 0.12 : 0, listening: false },
        });
      }
      return wrap(children);
    }
    case "icon": {
      const img = ctx.getIcon(iconKey(el));
      // transparent hit area so the whole box is draggable
      const nodes: NodeDesc[] = [{ kind: "Rect", key: "hit", config: { width: w, height: h, fill: "rgba(0,0,0,0.001)" } }];
      if (img) nodes.push({ kind: "Image", key: "i", config: { image: img, width: w, height: h, ...shadowProps(el.shadow) } });
      return wrap(nodes);
    }
    case "emoji": {
      const size = Math.min(w, h);
      return wrap([
        { kind: "Rect", key: "hit", config: { width: w, height: h, fill: "rgba(0,0,0,0.001)" } },
        {
          kind: "Text",
          key: "e",
          config: {
            text: el.emoji,
            fontSize: size * 0.84,
            width: w,
            height: h,
            align: "center",
            verticalAlign: "middle",
            fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
            ...shadowProps(el.shadow),
          },
        },
      ]);
    }
  }
}

/* ───────────────────────────── background ───────────────────────────── */

export function describeBackground(bg: PageBackground, w: number, h: number, ctx: RenderContext, patternImage?: HTMLImageElement): NodeDesc[] {
  const nodes: NodeDesc[] = [];
  if (!bg.transparent) {
    nodes.push({ kind: "Rect", key: "bg-fill", config: { name: "background", width: w, height: h, ...paintToKonva(bg.fill, w, h) } });
  }
  if (bg.image?.src) {
    const img = ctx.getImage(bg.image.src);
    if (img) {
      const crop =
        bg.image.fit === "cover"
          ? coverCrop(img.naturalWidth, img.naturalHeight, w, h)
          : { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
      let dw = w, dh = h, dx = 0, dy = 0;
      if (bg.image.fit === "contain") {
        const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
        dw = img.naturalWidth * s; dh = img.naturalHeight * s; dx = (w - dw) / 2; dy = (h - dh) / 2;
      }
      nodes.push({
        kind: "Image",
        key: "bg-img",
        config: {
          name: "background",
          image: img,
          x: dx,
          y: dy,
          width: dw,
          height: dh,
          crop,
          opacity: bg.image.opacity,
          filters: bg.image.blur ? [Konva.Filters.Blur] : [],
          blurRadius: bg.image.blur,
        },
        cache: !!bg.image.blur,
      });
    }
  }
  if (bg.pattern && patternImage) {
    nodes.push({
      kind: "Rect",
      key: "bg-pattern",
      config: {
        name: "background",
        width: w,
        height: h,
        fillPatternImage: patternImage,
        fillPatternRepeat: "repeat",
        fillPatternScale: { x: bg.pattern.scale, y: bg.pattern.scale },
        opacity: bg.pattern.opacity,
        listening: true,
      },
    });
  }
  return nodes;
}

/* ───────────────────────── imperative build ───────────────────────── */

const ctorMap: Record<NodeKind, new (cfg: Record<string, unknown>) => Konva.Node> = {
  Group: Konva.Group as never,
  Rect: Konva.Rect as never,
  Ellipse: Konva.Ellipse as never,
  Path: Konva.Path as never,
  Line: Konva.Line as never,
  Arrow: Konva.Arrow as never,
  Text: Konva.Text as never,
  Image: Konva.Image as never,
  Circle: Konva.Circle as never,
};

/** Build real Konva nodes from descriptors (used by exporter). */
export function buildNodes(descs: NodeDesc[], parent: Konva.Container) {
  for (const d of descs) {
    const node = new ctorMap[d.kind]({ ...d.config, listening: false });
    parent.add(node as Konva.Shape);
    if (d.children && node instanceof Konva.Container) buildNodes(d.children, node);
    if (d.cache) (node as Konva.Shape).cache();
  }
}
