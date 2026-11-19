"use client";
/**
 * Upload pipeline: type/size validation, SVG sanitisation, dimension probing,
 * optional downscaling of huge rasters, then persistence via the repository.
 */
import type { Asset } from "@/lib/design/types";
import type { DataRepository } from "@/lib/storage/types";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "@/lib/storage/types";
import { sanitizeSvg } from "@/lib/security/svg";

const MAX_DIMENSION = 6000;

export class UploadError extends Error {}

async function probe(blob: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { width: img.naturalWidth || 800, height: img.naturalHeight || 600 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function downscale(blob: Blob, w: number, h: number): Promise<{ blob: Blob; width: number; height: number }> {
  const s = MAX_DIMENSION / Math.max(w, h);
  if (s >= 1) return { blob, width: w, height: h };
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas");
  c.width = Math.round(w * s);
  c.height = Math.round(h * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const type = blob.type === "image/jpeg" ? "image/jpeg" : "image/png";
  const out = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), type, 0.92));
  return { blob: out, width: c.width, height: c.height };
}

/** Detect the real image type from magic bytes (don't trust the extension). */
async function sniff(file: Blob): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  const hex = Array.from(head.slice(0, 12)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.startsWith("89504e47")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("47494638")) return "image/gif";
  if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") return "image/webp";
  const text = new TextDecoder().decode(head).trimStart().toLowerCase();
  if (text.startsWith("<svg") || (text.startsWith("<?xml") && text.includes("<svg"))) return "image/svg+xml";
  return null;
}

export async function uploadImageFile(repo: DataRepository, file: File | Blob, opts: { name?: string; source?: Asset["source"]; folder?: string | null } = {}): Promise<Asset> {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`File is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`);
  if (file.size === 0) throw new UploadError("File is empty.");
  const type = await sniff(file);
  if (!type || !ALLOWED_UPLOAD_TYPES.includes(type)) throw new UploadError("Unsupported file. Upload PNG, JPEG, WebP, GIF or SVG images.");
  let blob: Blob = file.type === type ? file : new Blob([file], { type });
  if (type === "image/svg+xml") {
    const clean = sanitizeSvg(await blob.text());
    if (!clean) throw new UploadError("This SVG could not be safely processed.");
    blob = new Blob([clean], { type });
  }
  let { width, height } = await probe(blob);
  if (type !== "image/svg+xml" && type !== "image/gif") ({ blob, width, height } = await downscale(blob, width, height));
  const name = opts.name ?? ("name" in file ? (file as File).name : "image");
  return repo.uploadAsset(blob, { name, width, height, source: opts.source ?? "upload", folder: opts.folder ?? null });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
