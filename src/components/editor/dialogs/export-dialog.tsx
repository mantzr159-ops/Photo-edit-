"use client";
import * as React from "react";
import { toast } from "sonner";
import { Download, FileImage, FileText, FileCode2, Image as ImageIcon } from "lucide-react";
import { useEditor } from "@/stores/editor-store";
import { exportDesign, MAX_EXPORT_PIXELS, type ExportFormat, type ExportScope } from "@/lib/export/exporter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

const FORMATS: { id: ExportFormat; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "png", label: "PNG", desc: "Best quality, supports transparency", icon: FileImage },
  { id: "jpg", label: "JPG", desc: "Small file size for photos", icon: ImageIcon },
  { id: "pdf", label: "PDF", desc: "Multi-page document for print & sharing", icon: FileText },
  { id: "svg", label: "SVG", desc: "Scalable vector (text, shapes, embedded images)", icon: FileCode2 },
];

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const doc = useEditor((s) => s.doc);
  const selectedIds = useEditor((s) => s.selectedIds);
  const activePageId = useEditor((s) => s.activePageId);
  const [format, setFormat] = React.useState<ExportFormat>("png");
  const [scope, setScope] = React.useState<ExportScope>("current");
  const [scale, setScale] = React.useState(1);
  const [transparent, setTransparent] = React.useState(false);
  const [quality, setQuality] = React.useState(0.9);
  const [progress, setProgress] = React.useState<string | null>(null);
  if (!doc) return null;
  const outW = Math.round(doc.width * scale), outH = Math.round(doc.height * scale);
  const tooBig = outW * outH > MAX_EXPORT_PIXELS;

  const run = async () => {
    setProgress("Preparing…");
    try {
      await exportDesign(doc, { format, scope, scale, transparent, quality, selectedIds, activePageId }, (d, t) => setProgress(`Rendering page ${d} of ${t}…`));
      toast.success("Export complete");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Download</DialogTitle>
          <DialogDescription>Exports are rendered at full quality in your browser.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((f) => (
            <button key={f.id} onClick={() => setFormat(f.id)} className={cn("flex items-start gap-3 rounded-xl border p-3 text-left transition hover:bg-accent", format === f.id && "border-brand-500 ring-2 ring-brand-500/20")}>
              <f.icon className="mt-0.5 h-5 w-5 text-brand-500" />
              <span>
                <span className="block text-sm font-semibold">{f.label}</span>
                <span className="block text-[11px] text-muted-foreground">{f.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Pages</p>
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
            {([["current", "Current page"], ["all", `All pages (${doc.pages.length})`], ["selection", "Selected elements"]] as const).map(([id, label]) => (
              <button key={id} disabled={id === "selection" && !selectedIds.length} onClick={() => setScope(id)} className={cn("flex-1 rounded-md px-2 py-1.5 disabled:opacity-40", scope === id && "bg-background shadow-sm")}>{label}</button>
            ))}
          </div>
          {scope === "all" && format !== "pdf" && doc.pages.length > 1 && <p className="text-[11px] text-muted-foreground">Multiple pages download as a .zip archive.</p>}
        </div>
        {format !== "svg" && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-muted-foreground">Size ×{scale}</span>
              <span className="tabular-nums text-muted-foreground">{outW} × {outH} px</span>
            </div>
            <div className="flex gap-1">
              {[0.5, 1, 2, 3, 4].map((s) => (
                <button key={s} onClick={() => setScale(s)} className={cn("flex-1 rounded-md border py-1 text-xs", scale === s && "border-brand-500 bg-brand-500/10")}>{s}×</button>
              ))}
            </div>
            <Slider value={[scale]} min={0.25} max={6} step={0.25} onValueChange={(v) => setScale(v[0])} aria-label="Custom scale" />
            {tooBig && <p className="text-[11px] text-amber-600">Very large — output will be capped at ~64 megapixels to stay within browser limits.</p>}
          </div>
        )}
        {format === "jpg" && (
          <div className="space-y-1 text-xs">
            <span className="font-medium text-muted-foreground">Quality {Math.round(quality * 100)}%</span>
            <Slider value={[quality]} min={0.4} max={1} step={0.01} onValueChange={(v) => setQuality(v[0])} />
          </div>
        )}
        {(format === "png" || format === "svg") && (
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
            Transparent background
            <Switch checked={transparent} onCheckedChange={setTransparent} />
          </label>
        )}
        <Button variant="gradient" size="lg" onClick={() => void run()} disabled={!!progress} data-testid="export-run">
          {progress ? <><Spinner /> {progress}</> : <><Download /> Download {format.toUpperCase()}</>}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
