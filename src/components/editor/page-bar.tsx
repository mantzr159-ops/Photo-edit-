"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight, Copy, Plus, Trash2, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useEditor } from "@/stores/editor-store";
import type { Page } from "@/lib/design/types";
import { Tooltip } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { canvasApi } from "./canvas/canvas-api";
import { cn } from "@/lib/utils/cn";

/** Live page thumbnail, re-rendered (debounced) when the page changes. */
function LiveThumb({ page, width, height }: { page: Page; width: number; height: number }) {
  const [src, setSrc] = React.useState<string | null>(null);
  React.useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const { renderThumbnail } = await import("@/lib/export/render-page");
      const url = await renderThumbnail({ width, height }, page, 160).catch(() => null);
      if (alive && url) setSrc(url);
    }, 500);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [page, width, height]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
  ) : (
    <div className="h-full w-full bg-white" />
  );
}

export function PageBar() {
  const { pages, activePageId, width, height, zoom, fitZoom } = useEditor(
    useShallow((s) => ({ pages: s.doc?.pages ?? [], activePageId: s.activePageId, width: s.doc?.width ?? 1, height: s.doc?.height ?? 1, zoom: s.zoom, fitZoom: s.fitZoom })),
  );
  const s = useEditor.getState;
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const idx = pages.findIndex((p) => p.id === activePageId);
  const ratio = width / height;
  const thumbH = 52;
  const thumbW = Math.min(110, Math.max(30, thumbH * ratio));

  return (
    <div className="flex h-[76px] shrink-0 items-center gap-3 border-t bg-card px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 scrollbar-thin" role="list" aria-label="Pages">
        {pages.map((p, i) => (
          <div
            key={p.id}
            role="listitem"
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIdx !== null && dragIdx !== i) s().movePage(dragIdx, i);
              setDragIdx(null);
            }}
            className="group relative shrink-0"
          >
            <button
              onClick={() => s().setActivePage(p.id)}
              className={cn("block overflow-hidden rounded-md border-2 bg-white shadow-sm transition", p.id === activePageId ? "border-brand-500" : "border-transparent hover:border-brand-200")}
              style={{ width: thumbW, height: thumbH }}
              aria-label={`Page ${i + 1}`}
              aria-current={p.id === activePageId}
            >
              <LiveThumb page={p} width={width} height={height} />
            </button>
            <span className="absolute bottom-0.5 left-1 rounded bg-black/50 px-1 text-[9px] text-white">{i + 1}</span>
            <div className="absolute -right-1 -top-1 hidden gap-0.5 group-hover:flex">
              <button onClick={() => s().duplicatePage(p.id)} className="rounded bg-background p-0.5 shadow" aria-label="Duplicate page"><Copy className="h-3 w-3" /></button>
              {pages.length > 1 && <button onClick={() => s().deletePage(p.id)} className="rounded bg-background p-0.5 shadow hover:text-destructive" aria-label="Delete page"><Trash2 className="h-3 w-3" /></button>}
            </div>
          </div>
        ))}
        <Tooltip content="Add page">
          <button onClick={() => s().addPage(activePageId)} className="flex shrink-0 items-center justify-center rounded-md border-2 border-dashed text-muted-foreground hover:border-brand-300 hover:text-foreground" style={{ width: thumbW, height: thumbH }} aria-label="Add page">
            <Plus className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
      <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
        <button disabled={idx <= 0} onClick={() => s().setActivePage(pages[idx - 1].id)} className="rounded p-1 hover:bg-accent disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        <span className="tabular-nums">{idx + 1} / {pages.length}</span>
        <button disabled={idx >= pages.length - 1} onClick={() => s().setActivePage(pages[idx + 1].id)} className="rounded p-1 hover:bg-accent disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        {idx > 0 && <button onClick={() => s().movePage(idx, idx - 1)} className="ml-1 rounded px-1.5 py-0.5 hover:bg-accent" title="Move page left">◀ Move</button>}
        {idx < pages.length - 1 && <button onClick={() => s().movePage(idx, idx + 1)} className="rounded px-1.5 py-0.5 hover:bg-accent" title="Move page right">Move ▶</button>}
      </div>
      <div className="hidden items-center gap-2 lg:flex">
        <button onClick={() => canvasApi.zoomTo(zoom / 1.25)} className="rounded p-1 hover:bg-accent" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
        <Slider className="w-28" value={[Math.log(zoom)]} min={Math.log(0.05)} max={Math.log(8)} step={0.01} onValueChange={(v) => canvasApi.zoomTo(Math.exp(v[0]))} aria-label="Zoom" />
        <button onClick={() => canvasApi.zoomTo(zoom * 1.25)} className="rounded p-1 hover:bg-accent" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
        <button onClick={() => canvasApi.fit()} className={cn("w-12 rounded px-1 py-0.5 text-xs tabular-nums hover:bg-accent", Math.abs(zoom - fitZoom) < 0.001 && "text-brand-600")} title="Fit to screen">{Math.round(zoom * 100)}%</button>
        <button onClick={() => canvasApi.fit()} className="rounded p-1 hover:bg-accent" aria-label="Fit to screen"><Maximize className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
