"use client";
import * as React from "react";
import { toast } from "sonner";
import { TEMPLATE_CATEGORIES, type Page, type TemplateCategory, type TemplateDef } from "@/lib/design/types";
import { instantiateTemplate, searchTemplates } from "@/lib/templates";
import { useTemplates } from "@/components/dashboard/template-browser";
import { PageThumb } from "@/components/dashboard/template-thumb";
import { useEditor } from "@/stores/editor-store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PanelSearch } from "./panel-ui";
import { cn } from "@/lib/utils/cn";

/** Scale template pages uniformly to fit a different design size (centred). */
export function fitPagesToSize(pages: Page[], from: { width: number; height: number }, to: { width: number; height: number }): Page[] {
  if (from.width === to.width && from.height === to.height) return pages;
  const s = Math.min(to.width / from.width, to.height / from.height);
  const ox = (to.width - from.width * s) / 2, oy = (to.height - from.height * s) / 2;
  return pages.map((p) => ({
    ...p,
    elements: p.elements.map((e) => {
      const c = { ...e, x: e.x * s + ox, y: e.y * s + oy, width: e.width * s, height: e.height * s };
      if (c.type === "text") Object.assign(c, { fontSize: c.fontSize * s, letterSpacing: c.letterSpacing * s });
      if ((c.type === "shape" || c.type === "line") && c.strokeWidth) c.strokeWidth *= s;
      return c;
    }),
  }));
}

export function TemplatesPanel() {
  const { all } = useTemplates();
  const doc = useEditor((s) => s.doc);
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<TemplateCategory | "All">("All");
  const [pending, setPending] = React.useState<TemplateDef | null>(null);
  if (!doc) return null;
  const sameRatio = (t: TemplateDef) => Math.abs(t.width / t.height - doc.width / doc.height) < 0.02;
  const list = searchTemplates(all, q, cat).sort((a, b) => Number(sameRatio(b)) - Number(sameRatio(a)));

  const apply = (mode: "replace" | "append" | "resize") => {
    if (!pending) return;
    const s = useEditor.getState();
    const pages = instantiateTemplate(pending);
    if (mode === "resize") s.replacePages(pages, { width: pending.width, height: pending.height });
    else if (mode === "replace") s.replacePages(fitPagesToSize(pages, pending, doc));
    else s.appendPages(fitPagesToSize(pages, pending, doc));
    toast.success(`Applied “${pending.name}”`);
    setPending(null);
  };

  return (
    <div className="space-y-3">
      <PanelSearch value={q} onChange={setQ} placeholder="Search templates" />
      <select value={cat} onChange={(e) => setCat(e.target.value as TemplateCategory | "All")} className="h-9 w-full rounded-lg border bg-background px-2 text-sm" aria-label="Category">
        <option value="All">All categories</option>
        {TEMPLATE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        {list.map((t) => (
          <button key={t.id} onClick={() => setPending(t)} className="group text-left" title={t.name}>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted/50 p-1.5 transition group-hover:border-brand-300">
              <div className={cn("overflow-hidden rounded shadow-sm", t.width >= t.height ? "w-full" : "h-full")} style={{ aspectRatio: `${t.width}/${t.height}` }}>
                <PageThumb cacheKey={`tpl:${t.id}`} page={t.pages[0]} width={t.width} height={t.height} className="h-full w-full" />
              </div>
            </div>
            <p className="mt-1 truncate text-xs">{t.name}</p>
          </button>
        ))}
      </div>
      <Dialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply “{pending?.name}”</DialogTitle>
            <DialogDescription>
              Template is {pending?.width}×{pending?.height}px with {pending?.pages.length} page(s). Your design is {doc.width}×{doc.height}px. Replacing can be undone with Ctrl/⌘+Z.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button variant="gradient" onClick={() => apply("append")}>Add as new page{(pending?.pages.length ?? 1) > 1 ? "s" : ""}</Button>
            <Button variant="outline" onClick={() => apply("replace")}>Replace all pages (fit to current size)</Button>
            {pending && (pending.width !== doc.width || pending.height !== doc.height) && (
              <Button variant="outline" onClick={() => apply("resize")}>Replace & resize design to {pending.width}×{pending.height}</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
