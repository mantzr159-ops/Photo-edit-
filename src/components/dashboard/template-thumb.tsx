"use client";
/**
 * Lazily renders a live preview of a template/page with the real canvas
 * renderer (same pipeline as exports). Rendering is queued so long grids
 * don't block the main thread.
 */
import * as React from "react";
import type { Page } from "@/lib/design/types";
import { paintToCss } from "@/lib/design/render-css";
import { cn } from "@/lib/utils/cn";

const cache = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const p = queue.then(job, job);
  queue = p.catch(() => undefined);
  return p;
}

export function PageThumb({ cacheKey, page, width, height, className, maxSide = 420 }: { cacheKey: string; page: Page; width: number; height: number; className?: string; maxSide?: number }) {
  const [src, setSrc] = React.useState(() => cache.get(cacheKey) ?? null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (cache.has(cacheKey)) {
      setSrc(cache.get(cacheKey)!);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        enqueue(async () => {
          if (cancelled) return;
          const { renderThumbnail } = await import("@/lib/export/render-page");
          const url = await renderThumbnail({ width, height }, page, maxSide);
          cache.set(cacheKey, url);
          if (!cancelled) setSrc(url);
        }).catch(() => undefined);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [cacheKey, page, width, height, maxSide]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} style={{ aspectRatio: `${width} / ${height}`, background: src ? undefined : paintToCss(page.background.fill) }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-white/10" />
      )}
    </div>
  );
}

export function invalidateThumb(key: string) {
  cache.delete(key);
}
