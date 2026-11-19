"use client";
/**
 * Basic in-browser background removal (no AI): estimates the background
 * colour from the image border and flood-fills similar pixels from the edges,
 * with a soft alpha ramp for anti-aliased edges. Works well for product shots
 * and logos on plain backgrounds; complex photos need the cloud remover.
 */
export async function removeBackgroundLocal(img: HTMLImageElement, tolerance = 42): Promise<Blob> {
  const maxSide = 2048;
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // sample border to estimate background colour (median per channel)
  const samples: number[][] = [];
  const step = Math.max(1, Math.floor((w + h) / 400));
  for (let x = 0; x < w; x += step) samples.push(rgbAt(px, w, x, 0), rgbAt(px, w, x, h - 1));
  for (let y = 0; y < h; y += step) samples.push(rgbAt(px, w, 0, y), rgbAt(px, w, w - 1, y));
  const med = [0, 1, 2].map((c) => samples.map((p) => p[c]).sort((a, b) => a - b)[Math.floor(samples.length / 2)]);

  const dist = (i: number) => {
    const dr = px[i] - med[0], dg = px[i + 1] - med[1], db = px[i + 2] - med[2];
    return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11) * 1.6;
  };

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const pushIf = (x: number, y: number) => {
    const k = y * w + x;
    if (!visited[k] && dist(k * 4) < tolerance * 1.6) {
      visited[k] = 1;
      stack.push(k);
    }
  };
  for (let x = 0; x < w; x++) {
    pushIf(x, 0);
    pushIf(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIf(0, y);
    pushIf(w - 1, y);
  }
  while (stack.length) {
    const k = stack.pop()!;
    const x = k % w, y = (k / w) | 0;
    const d = dist(k * 4);
    // soft edge: fully transparent well inside tolerance, ramp near the boundary
    const a = d < tolerance ? 0 : Math.min(1, (d - tolerance) / (tolerance * 0.6));
    px[k * 4 + 3] = Math.round(px[k * 4 + 3] * a);
    if (x > 0) pushIf(x - 1, y);
    if (x < w - 1) pushIf(x + 1, y);
    if (y > 0) pushIf(x, y - 1);
    if (y < h - 1) pushIf(x, y + 1);
  }
  ctx.putImageData(data, 0, 0);
  return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Encoding failed"))), "image/png"));
}

function rgbAt(px: Uint8ClampedArray, w: number, x: number, y: number) {
  const i = (y * w + x) * 4;
  return [px[i], px[i + 1], px[i + 2]];
}
