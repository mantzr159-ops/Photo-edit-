/**
 * Vector SVG export built directly from the document model.
 * Shapes, lines and text are emitted as native SVG; raster images & icons are
 * embedded as data URIs so the file is self-contained.
 *
 * Known limitations (documented in the UI): Konva image filters and text
 * letter-spacing on some viewers are approximated.
 */
import type { DesignElement, Page, Paint, ProjectDoc, Shadow, TextElement } from "@/lib/design/types";
import { maskSvgPath, shapePath } from "@/lib/design/shapes";
import { coverCrop, transformText } from "@/lib/design/render";
import { patternTileSvg } from "@/lib/design/patterns";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Ctx = { defs: string[]; n: number; resolveImage: (src: string) => Promise<string | null>; iconSvg: (el: Extract<DesignElement, { type: "icon" }>) => Promise<string | null> };

function paint(p: Paint, ctx: Ctx, w: number, h: number): string {
  if (typeof p === "string") return esc(p);
  const id = `g${ctx.n++}`;
  const stops = p.stops.map((s) => `<stop offset="${s.offset}" stop-color="${esc(s.color)}"/>`).join("");
  if (p.type === "linear") {
    const rad = (p.angle * Math.PI) / 180;
    const half = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2;
    const dx = Math.cos(rad) * half, dy = Math.sin(rad) * half;
    ctx.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${w / 2 - dx}" y1="${h / 2 - dy}" x2="${w / 2 + dx}" y2="${h / 2 + dy}">${stops}</linearGradient>`);
  } else {
    ctx.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${w / 2}" cy="${h / 2}" r="${Math.max(w, h) * 0.7}">${stops}</radialGradient>`);
  }
  return `url(#${id})`;
}

function shadowFilter(s: Shadow | undefined, ctx: Ctx): string {
  if (!s?.enabled) return "";
  const id = `f${ctx.n++}`;
  ctx.defs.push(
    `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${s.offsetX}" dy="${s.offsetY}" stdDeviation="${s.blur / 2}" flood-color="${esc(s.color)}" flood-opacity="${s.opacity}"/></filter>`,
  );
  return ` filter="url(#${id})"`;
}

/** Approximate Konva's word wrapping using canvas text metrics. */
function wrapLines(el: TextElement): string[] {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  const c = canvas?.getContext("2d");
  const content = transformText(el);
  if (!c) return content.split("\n");
  c.font = `${el.italic ? "italic " : ""}${el.fontWeight} ${el.fontSize}px "${el.fontFamily}"`;
  const measure = (t: string) => c.measureText(t).width + Math.max(0, t.length - 1) * el.letterSpacing;
  const out: string[] = [];
  for (const para of content.split("\n")) {
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (measure(test) > el.width && line) {
        out.push(line);
        line = w;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

async function elementSvg(el: DesignElement, ctx: Ctx): Promise<string> {
  if (el.hidden) return "";
  const w = el.width, h = el.height;
  const flip = el.flipX || el.flipY ? ` transform="translate(${el.flipX ? w : 0} ${el.flipY ? h : 0}) scale(${el.flipX ? -1 : 1} ${el.flipY ? -1 : 1})"` : "";
  const open = `<g transform="translate(${el.x} ${el.y}) rotate(${el.rotation})" opacity="${el.opacity}"><g${flip}>`;
  const close = `</g></g>`;
  let inner = "";
  switch (el.type) {
    case "shape": {
      const fill = paint(el.fill, ctx, w, h);
      const stroke = el.strokeWidth ? ` stroke="${esc(el.stroke)}" stroke-width="${el.strokeWidth}"${el.dash ? ` stroke-dasharray="${el.dash.join(" ")}"` : ""}` : "";
      const f = shadowFilter(el.shadow, ctx);
      if (el.shape === "rect") inner = `<rect width="${w}" height="${h}" rx="${Math.min(el.cornerRadius ?? 0, w / 2, h / 2)}" fill="${fill}"${stroke}${f}/>`;
      else if (el.shape === "ellipse") inner = `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fill}"${stroke}${f}/>`;
      else inner = `<path d="${shapePath(el)}" fill="${fill}"${stroke}${f}/>`;
      break;
    }
    case "line": {
      const y = h / 2;
      const d = el.curved ? `M0 ${h} Q${w / 2} ${-h} ${w} ${h}` : `M0 ${y} L${w} ${y}`;
      const mid = `m${ctx.n++}`;
      const size = Math.max(10, el.strokeWidth * 3);
      if (el.startCap === "arrow" || el.endCap === "arrow")
        ctx.defs.push(`<marker id="${mid}" markerUnits="userSpaceOnUse" markerWidth="${size}" markerHeight="${size}" refX="${size * 0.8}" refY="${size / 2}" orient="auto-start-reverse"><path d="M0 0 L${size} ${size / 2} L0 ${size} Z" fill="${esc(el.stroke)}"/></marker>`);
      const markers = `${el.startCap === "arrow" ? ` marker-start="url(#${mid})"` : ""}${el.endCap === "arrow" ? ` marker-end="url(#${mid})"` : ""}`;
      inner = `<path d="${d}" fill="none" stroke="${esc(el.stroke)}" stroke-width="${el.strokeWidth}" stroke-linecap="round"${el.dash ? ` stroke-dasharray="${el.dash.join(" ")}"` : ""}${markers}/>`;
      const r = Math.max(4, el.strokeWidth * 1.4);
      if (el.startCap === "circle") inner += `<circle cx="0" cy="${el.curved ? h : y}" r="${r}" fill="${esc(el.stroke)}"/>`;
      if (el.endCap === "circle") inner += `<circle cx="${w}" cy="${el.curved ? h : y}" r="${r}" fill="${esc(el.stroke)}"/>`;
      break;
    }
    case "text": {
      const lines = wrapLines(el);
      const lh = el.fontSize * el.lineHeight;
      const anchor = el.align === "center" ? "middle" : el.align === "right" ? "end" : "start";
      const x = el.align === "center" ? w / 2 : el.align === "right" ? w : 0;
      const deco = [el.underline ? "underline" : "", el.strike ? "line-through" : ""].filter(Boolean).join(" ");
      if (el.background?.color) {
        const p = el.background.padding;
        inner += `<rect x="${-p}" y="${-p}" width="${w + 2 * p}" height="${h + 2 * p}" rx="${el.background.radius}" fill="${esc(el.background.color)}"/>`;
      }
      const fill = paint(el.fill, ctx, w, h);
      const stroke = el.strokeWidth ? ` stroke="${esc(el.stroke ?? "#000")}" stroke-width="${el.strokeWidth}" paint-order="stroke"` : "";
      // Konva places each line box of height lh; the baseline sits ~ (lh + fontSize*0.7)/2 from its top
      const tspans = lines.map((l, i) => `<tspan x="${x}" y="${i * lh + (lh - el.fontSize) / 2 + el.fontSize * 0.8}">${esc(l) || " "}</tspan>`).join("");
      inner += `<text font-family="${esc(el.fontFamily)}, sans-serif" font-size="${el.fontSize}" font-weight="${el.fontWeight}" font-style="${el.italic ? "italic" : "normal"}" letter-spacing="${el.letterSpacing}" text-anchor="${anchor}" fill="${fill}"${deco ? ` text-decoration="${deco}"` : ""}${stroke}${shadowFilter(el.shadow, ctx)} xml:space="preserve">${tspans}</text>`;
      break;
    }
    case "image": {
      const href = await ctx.resolveImage(el.src);
      if (!href) break;
      const nw = el.naturalWidth || w, nh = el.naturalHeight || h;
      const crop = el.crop ?? coverCrop(nw, nh, w, h);
      const sx = w / crop.width, sy = h / crop.height;
      const clipId = `c${ctx.n++}`;
      const mask = el.mask === "none" && el.cornerRadius > 0 ? "rounded" : el.mask;
      ctx.defs.push(`<clipPath id="${clipId}"><path d="${maskSvgPath(mask, w, h, el.cornerRadius)}"/></clipPath>`);
      inner = `<g clip-path="url(#${clipId})"><image href="${esc(href)}" x="${-crop.x * sx}" y="${-crop.y * sy}" width="${nw * sx}" height="${nh * sy}" preserveAspectRatio="none"/></g>`;
      if (el.strokeWidth && el.stroke) inner += `<path d="${maskSvgPath(mask, w, h, el.cornerRadius)}" fill="none" stroke="${esc(el.stroke)}" stroke-width="${el.strokeWidth}"/>`;
      break;
    }
    case "icon": {
      const svg = await ctx.iconSvg(el);
      if (svg) inner = `<svg width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="${esc(el.color)}" stroke-width="${el.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
      break;
    }
    case "emoji":
      inner = `<text x="${w / 2}" y="${h / 2}" font-size="${Math.min(w, h) * 0.84}" text-anchor="middle" dominant-baseline="central">${esc(el.emoji)}</text>`;
      break;
  }
  return open + inner + close;
}

export async function pageToSvg(
  doc: Pick<ProjectDoc, "width" | "height">,
  page: Page,
  opts: { transparent?: boolean; resolveImage: Ctx["resolveImage"]; iconSvg: Ctx["iconSvg"] },
): Promise<string> {
  const ctx: Ctx = { defs: [], n: 0, resolveImage: opts.resolveImage, iconSvg: opts.iconSvg };
  const W = doc.width, H = doc.height;
  let bgSvg = "";
  const bgPage = page.background;
  if (!opts.transparent && !bgPage.transparent) bgSvg += `<rect width="${W}" height="${H}" fill="${paint(bgPage.fill, ctx, W, H)}"/>`;
  if (bgPage.image?.src) {
    const href = await ctx.resolveImage(bgPage.image.src);
    if (href) {
      const blurId = `b${ctx.n++}`;
      if (bgPage.image.blur) ctx.defs.push(`<filter id="${blurId}"><feGaussianBlur stdDeviation="${bgPage.image.blur / 2}"/></filter>`);
      bgSvg += `<image href="${esc(href)}" width="${W}" height="${H}" preserveAspectRatio="${bgPage.image.fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}" opacity="${bgPage.image.opacity}"${bgPage.image.blur ? ` filter="url(#${blurId})"` : ""}/>`;
    }
  }
  if (bgPage.pattern) {
    const pid = `p${ctx.n++}`;
    const tile = patternTileSvg(bgPage.pattern.kind, bgPage.pattern.color);
    const size = Number(/width="(\d+)"/.exec(tile)?.[1] ?? 40) * bgPage.pattern.scale;
    ctx.defs.push(`<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${size}" height="${size}"><image href="data:image/svg+xml;base64,${btoa(tile)}" width="${size}" height="${size}"/></pattern>`);
    bgSvg += `<rect width="${W}" height="${H}" fill="url(#${pid})" opacity="${bgPage.pattern.opacity}"/>`;
  }
  const els: string[] = [];
  for (const el of page.elements) els.push(await elementSvg(el, ctx));
  const fonts = [...new Set(page.elements.filter((e): e is TextElement => e.type === "text").map((e) => e.fontFamily))];
  const fontImport = fonts.length
    ? `<style>@import url('https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;700`).join("&")}&display=swap');</style>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${fontImport}${ctx.defs.join("")}</defs>
<clipPath id="page-clip"><rect width="${W}" height="${H}"/></clipPath>
<g clip-path="url(#page-clip)">${bgSvg}${els.join("\n")}</g>
</svg>`;
}
