"use client";
import * as React from "react";
import { getCachedImage, loadImage } from "@/lib/design/images";
import { iconKey } from "@/lib/design/render";
import { getIconImage, loadIcon } from "@/lib/export/render-page";
import { patternDataUrl } from "@/lib/design/patterns";
import type { PatternKind } from "@/lib/design/types";

/** Load an image for canvas use; re-renders when ready. */
export function useCanvasImage(src: string | undefined | null) {
  const [img, setImg] = React.useState<HTMLImageElement | undefined>(() => (src ? getCachedImage(src) : undefined));
  React.useEffect(() => {
    if (!src) {
      setImg(undefined);
      return;
    }
    const cached = getCachedImage(src);
    if (cached) {
      setImg(cached);
      return;
    }
    let alive = true;
    loadImage(src).then((i) => alive && setImg(i)).catch(() => alive && setImg(undefined));
    return () => {
      alive = false;
    };
  }, [src]);
  return img;
}

export function useIconImage(el: { icon: string; color: string; strokeWidth: number } | null) {
  const key = el ? iconKey(el) : "";
  const [img, setImg] = React.useState<HTMLImageElement | undefined>(() => (key ? getIconImage(key) : undefined));
  React.useEffect(() => {
    if (!el) return;
    const hit = getIconImage(key);
    if (hit) {
      setImg(hit);
      return;
    }
    let alive = true;
    loadIcon(el).then((i) => alive && i && setImg(i)).catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return img;
}

export function usePatternImage(p: { kind: PatternKind; color: string } | null | undefined) {
  return useCanvasImage(p ? patternDataUrl(p.kind, p.color) : null);
}
