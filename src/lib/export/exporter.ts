"use client";
/** Export orchestration: PNG / JPG / PDF / SVG for current page, all pages, or a selection. */
import { jsPDF } from "jspdf";
import { zipSync, strToU8 } from "fflate";
import type { Page, ProjectDoc } from "@/lib/design/types";
import { renderPageStage } from "./render-page";
import { pageToSvg } from "./svg";
import { resolveSrc } from "@/lib/design/images";
import { loadIconSet } from "@/lib/design/icons";
import { slugify } from "@/lib/utils/format";

export type ExportFormat = "png" | "jpg" | "pdf" | "svg";
export type ExportScope = "current" | "all" | "selection";

export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  /** output scale multiplier relative to design size (1 = design px) */
  scale: number;
  transparent: boolean;
  quality: number; // jpg 0..1
  selectedIds?: string[];
  activePageId: string;
}

export const MAX_EXPORT_PIXELS = 64_000_000; // guard against browser canvas limits

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function dataUrlToBytes(dataUrl: string) {
  const b64 = dataUrl.split(",")[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Resolve an image src into an embeddable data URL (for self-contained SVG). */
async function embedImage(src: string): Promise<string | null> {
  try {
    if (src.startsWith("data:")) return src;
    const url = await resolveSrc(src);
    const res = await fetch(url);
    if (!res.ok) return null;
    return await blobToDataUrl(await res.blob());
  } catch {
    return null;
  }
}

async function iconInner(el: { icon: string }) {
  const set = await loadIconSet();
  const node = set[el.icon];
  if (!node) return null;
  return node
    .filter(([tag]) => /^[a-z]+$/.test(tag))
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => /^[a-zA-Z-]+$/.test(k)).map(([k, v]) => `${k}="${String(v).replace(/"/g, "&quot;")}"`).join(" ")}/>`)
    .join("");
}

async function rasterPage(doc: ProjectDoc, page: Page, opts: ExportOptions, mime: "image/png" | "image/jpeg") {
  const transparent = mime === "image/png" && opts.transparent;
  const onlyIds = opts.scope === "selection" ? opts.selectedIds : undefined;
  const { stage, region, destroy } = await renderPageStage(doc, page, { transparent, onlyIds });
  try {
    let scale = opts.scale;
    const px = region.width * region.height * scale * scale;
    if (px > MAX_EXPORT_PIXELS) scale = Math.sqrt(MAX_EXPORT_PIXELS / (region.width * region.height));
    if (mime === "image/jpeg") {
      // JPEG has no alpha: paint white under transparent regions
      const layer = stage.getLayers()[0];
      const Konva = (await import("konva")).default;
      const white = new Konva.Rect({ x: 0, y: 0, width: stage.width(), height: stage.height(), fill: "#ffffff", listening: false });
      layer.add(white);
      white.moveToBottom();
      layer.draw();
    }
    return { dataUrl: stage.toDataURL({ mimeType: mime, quality: opts.quality, pixelRatio: scale }), width: region.width * scale, height: region.height * scale };
  } finally {
    destroy();
  }
}

export async function exportDesign(doc: ProjectDoc, opts: ExportOptions, onProgress?: (done: number, total: number) => void) {
  const base = slugify(doc.name);
  const pages = opts.scope === "all" ? doc.pages : doc.pages.filter((p) => p.id === opts.activePageId);
  if (!pages.length) throw new Error("Nothing to export");
  if (opts.scope === "selection" && !opts.selectedIds?.length) throw new Error("Select one or more elements to export a selection.");
  const total = pages.length;

  if (opts.format === "pdf") {
    const first = pages[0];
    const w = doc.width, h = doc.height;
    const pdf = new jsPDF({ orientation: w >= h ? "landscape" : "portrait", unit: "px", format: [w, h], hotfixes: ["px_scaling"], compress: true });
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage([w, h], w >= h ? "landscape" : "portrait");
      const r = await rasterPage(doc, pages[i], { ...opts, scope: opts.scope === "selection" ? "selection" : "current" }, "image/jpeg");
      pdf.addImage(r.dataUrl, "JPEG", 0, 0, w, h, undefined, "FAST");
      onProgress?.(i + 1, total);
    }
    void first;
    download(pdf.output("blob"), `${base}.pdf`);
    return;
  }

  const ext = opts.format;
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const name = pages.length > 1 ? `${base}-page-${String(doc.pages.indexOf(page) + 1).padStart(2, "0")}.${ext}` : `${base}.${ext}`;
    if (opts.format === "svg") {
      const svg = await pageToSvg(doc, page, { transparent: opts.transparent, resolveImage: embedImage, iconSvg: iconInner });
      files[name] = strToU8(svg);
    } else {
      const r = await rasterPage(doc, page, opts, opts.format === "png" ? "image/png" : "image/jpeg");
      files[name] = dataUrlToBytes(r.dataUrl);
    }
    onProgress?.(i + 1, total);
  }
  const names = Object.keys(files);
  const mime = { png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml" }[ext];
  if (names.length === 1) download(new Blob([files[names[0]] as BlobPart], { type: mime }), names[0]);
  else download(new Blob([zipSync(files, { level: 0 }) as BlobPart], { type: "application/zip" }), `${base}-${ext}.zip`);
}
