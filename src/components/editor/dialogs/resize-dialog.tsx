"use client";
import * as React from "react";
import { useEditor } from "@/stores/editor-store";
import { DESIGN_SIZES } from "@/lib/design/factory";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function ResizeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const doc = useEditor((s) => s.doc);
  const [w, setW] = React.useState(doc?.width ?? 1080);
  const [h, setH] = React.useState(doc?.height ?? 1080);
  const [scale, setScale] = React.useState(true);
  React.useEffect(() => {
    if (open && doc) {
      setW(doc.width);
      setH(doc.height);
    }
  }, [open, doc]);
  const valid = w >= 16 && w <= 10000 && h >= 16 && h <= 10000;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resize design</DialogTitle>
          <DialogDescription>All pages share the same size. Undo is available.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto scrollbar-thin">
          {DESIGN_SIZES.map((s) => (
            <button key={s.id} onClick={() => { setW(s.width); setH(s.height); }} className="rounded-lg border px-2 py-1.5 text-left text-xs hover:bg-accent">
              <span className="block font-medium">{s.label}</span>
              <span className="text-muted-foreground">{s.width}×{s.height}</span>
            </button>
          ))}
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1"><Label htmlFor="rw">Width</Label><Input id="rw" type="number" value={w} onChange={(e) => setW(Number(e.target.value))} className="w-28" /></div>
          <div className="space-y-1"><Label htmlFor="rh">Height</Label><Input id="rh" type="number" value={h} onChange={(e) => setH(Number(e.target.value))} className="w-28" /></div>
        </div>
        <label className="flex items-center justify-between rounded-lg border p-3 text-sm">Scale content to fit<Switch checked={scale} onCheckedChange={setScale} /></label>
        <Button
          variant="gradient"
          disabled={!valid}
          onClick={() => {
            useEditor.getState().resizeDesign(w, h, scale);
            onOpenChange(false);
          }}
        >
          Resize
        </Button>
      </DialogContent>
    </Dialog>
  );
}
