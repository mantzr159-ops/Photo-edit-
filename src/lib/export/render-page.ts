"use client";
/**
 * Off-screen page renderer used for exports and thumbnails. Builds a real
 * Konva stage from the same descriptors the editor uses, so output matches
 * the canvas exactly.
 */
import Konva from "konva";
import type { DesignElement, Page, ProjectDoc } from "@/lib/design/types";
import { buildNodes, describeBackground, describeElement, elementGroupConfig, iconKey, type RenderContext } from "@/lib/design/render";
import { loadImage, getCachedImage } from "@/lib/design/images";
import { iconDataUrl } from "@/lib/design/icons";
import { patternDataUrl } from "@/lib/design/patterns";
import { ensureFonts } from "@/lib/design/fonts";
import { elementBounds, unionBounds, type Box } from "@/lib/design/geometry";

const iconImages = new Map<string, HTMLImageElement>();

async function loadIcon(el: { icon: string; color: string; strokeWidth: number }) {
  const key = iconKey(el);
  if (iconImages.has(key)) return iconImages.get(key)!;
  const url = await iconDataUrl(el.icon, el.color, el.strokeWidth, 512);
  if (!url) return null;
  const img = await loadImage(url);
  iconImages.set(key, img);
  return img;
}

export function getIconImage(key: string) {
  return iconImages.get(key);
}
export { loadIcon };

/** Load every resource a page needs (images, icons, fonts, pattern tiles). */
export async function preloadPage(page: Page): Promise<HTMLImageElement | undefined> {
  const jobs: Promise<unknown>[] = [];
  const fonts = new Set<string>();
  for (const el of page.elements) {
    if (el.type === "image") jobs.push(loadImage(el.src).catch(() => null));
    if (el.type === "icon") jobs.push(loadIcon(el).catch(() => null));
    if (el.type === "text") fonts.add(el.fontFamily);
  }
  if (page.background.image?.src) jobs.push(loadImage(page.background.image.src).catch(() => null));
  let pattern: Promise<HTMLImageElement | null> = Promise.resolve(null);
  if (page.background.pattern) pattern = loadImage(patternDataUrl(page.background.pattern.kind, page.background.pattern.color)).catch(() => null);
  jobs.push(ensureFonts([...fonts]));
  await Promise.all(jobs);
  return (await pattern) ?? undefined;
}

export const renderContext: RenderContext = {
  getImage: (src) => getCachedImage(src),
  getIcon: (key) => iconImages.get(key),
};

export type RenderOptions = {
  pixelRatio?: number;
  transparent?: boolean;
  /** only render these element ids (cropped to their bounds) */
  onlyIds?: string[];
};

/** Render a page into a detached Konva stage. Caller must `destroy()` it. */
export async function renderPageStage(doc: Pick<ProjectDoc, "width" | "height">, page: Page, opts: RenderOptions = {}) {
  const patternImg = await preloadPage(page);
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-99999px;top:0;pointer-events:none;";
  document.body.appendChild(container);

  let region: Box = { x: 0, y: 0, width: doc.width, height: doc.height };
  let elements: DesignElement[] = page.elements.filter((e) => !e.hidden);
  if (opts.onlyIds?.length) {
    elements = elements.filter((e) => opts.onlyIds!.includes(e.id));
    region = unionBounds(elements.map(elementBounds)) ?? region;
  }
  const stage = new Konva.Stage({ container, width: Math.ceil(region.width), height: Math.ceil(region.height) });
  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);
  const root = new Konva.Group({ x: -region.x, y: -region.y, clip: { x: 0, y: 0, width: doc.width, height: doc.height } });
  layer.add(root);
  if (!opts.onlyIds?.length) {
    const bgPage = opts.transparent ? { ...page.background, transparent: true } : page.background;
    buildNodes(describeBackground(bgPage, doc.width, doc.height, renderContext, patternImg), root);
  }
  for (const el of elements) {
    const g = new Konva.Group({ ...elementGroupConfig(el), listening: false });
    root.add(g);
    buildNodes(describeElement(el, renderContext), g);
  }
  layer.draw();
  const destroy = () => {
    stage.destroy();
    container.remove();
  };
  return { stage, region, destroy };
}

export async function renderPageToDataUrl(doc: Pick<ProjectDoc, "width" | "height">, page: Page, opts: RenderOptions & { mimeType?: string; quality?: number } = {}) {
  const { stage, destroy } = await renderPageStage(doc, page, opts);
  try {
    return stage.toDataURL({ mimeType: opts.mimeType ?? "image/png", quality: opts.quality ?? 0.92, pixelRatio: opts.pixelRatio ?? 1 });
  } finally {
    destroy();
  }
}

/** Small JPEG thumbnail (used for dashboard cards & page strip). */
export async function renderThumbnail(doc: Pick<ProjectDoc, "width" | "height">, page: Page, maxSide = 360) {
  const ratio = Math.min(1, maxSide / Math.max(doc.width, doc.height));
  return renderPageToDataUrl(doc, page, { pixelRatio: ratio, mimeType: "image/jpeg", quality: 0.72 });
}
