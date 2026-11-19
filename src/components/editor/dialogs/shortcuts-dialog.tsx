"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ROWS: [string, string][] = [
  ["Undo / Redo", "⌘Z / ⌘⇧Z"], ["Copy / Cut / Paste", "⌘C / ⌘X / ⌘V"], ["Duplicate", "⌘D"], ["Delete", "Del / ⌫"], ["Select all", "⌘A"],
  ["Group / Ungroup", "⌘G / ⌘⇧G"], ["Lock / Unlock", "⌘L"], ["Bring forward / Send backward", "⌘] / ⌘["], ["To front / To back", "⌘⇧] / ⌘⇧["],
  ["Nudge (×10 with Shift)", "Arrow keys"], ["Edit text", "Enter / double-click"], ["Add text / rectangle / circle / line", "T / R / C / L"],
  ["Zoom in / out / fit", "⌘+ / ⌘- / ⌘0"], ["Pan", "Space + drag, or scroll"], ["Zoom at cursor", "⌘ + scroll / pinch"], ["Disable snapping while dragging", "Hold Alt"],
  ["Save now", "⌘S"], ["Deselect / exit preview", "Esc"], ["Show shortcuts", "?"],
];

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Keyboard shortcuts</DialogTitle></DialogHeader>
        <div className="divide-y text-sm">
          {ROWS.map(([a, b]) => (
            <div key={a} className="flex justify-between gap-4 py-1.5"><span>{a}</span><kbd className="rounded bg-muted px-1.5 font-mono text-xs">{b}</kbd></div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">On Windows/Linux use Ctrl instead of ⌘.</p>
      </DialogContent>
    </Dialog>
  );
}
