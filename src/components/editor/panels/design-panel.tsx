"use client";
import * as React from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { useEditor, selectActivePage } from "@/stores/editor-store";
import { applyFontPair, recolorPage, smartTidy } from "@/lib/editor/style-tools";
import { harmony, type HarmonyKind } from "@/lib/utils/color";
import { ensureFonts } from "@/lib/design/fonts";
import { Button } from "@/components/ui/button";
import { PanelHeading } from "./panel-ui";

export const CURATED_PALETTES: { name: string; colors: string[] }[] = [
  { name: "Lumora", colors: ["#16132b", "#7444ff", "#b14dff", "#ff6b5a", "#f4f2fb"] },
  { name: "Ocean", colors: ["#03263a", "#0077b6", "#00b4d8", "#90e0ef", "#f1fbff"] },
  { name: "Forest", colors: ["#1b2a1e", "#3a5a40", "#588157", "#a3b18a", "#f1f5ee"] },
  { name: "Sunset", colors: ["#2b0f2e", "#c1121f", "#f77f00", "#fcbf49", "#fff4e0"] },
  { name: "Clinical", colors: ["#14213d", "#0f4c81", "#00a6fb", "#c1121f", "#f5fbff"] },
  { name: "Pastel", colors: ["#4a4566", "#a0c4ff", "#ffc6ff", "#caffbf", "#fffcf2"] },
  { name: "Mono", colors: ["#0d0d0d", "#3d3d3d", "#8a8a8a", "#d4d4d4", "#ffffff"] },
  { name: "Neon", colors: ["#0b0820", "#ff0050", "#00f2ea", "#d4ff3f", "#ffffff"] },
];

const PAIRS: [string, string][] = [
  ["Playfair Display", "Inter"], ["Plus Jakarta Sans", "Inter"], ["Bebas Neue", "Montserrat"], ["Fraunces", "DM Sans"],
  ["Space Grotesk", "Inter"], ["Cormorant Garamond", "Lato"], ["Anton", "Poppins"], ["DM Serif Display", "DM Sans"],
];

export function applyPaletteToPage(colors: string[], all = false) {
  const s = useEditor.getState();
  if (!s.doc) return;
  const pages = s.doc.pages.map((p) => (all || p.id === s.activePageId ? recolorPage(p, colors) : p));
  s.replacePages(pages);

}

export function DesignPanel() {
  const page = useEditor(selectActivePage);
  const [base, setBase] = React.useState("#7444ff");
  const [kind, setKind] = React.useState<HarmonyKind>("analogous");
  React.useEffect(() => void ensureFonts([...new Set(PAIRS.flat())]), []);
  if (!page) return null;
  const generated = harmony(base, kind);

  return (
    <div>
      <PanelHeading>Smart tidy</PanelHeading>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          const doc = useEditor.getState().doc!;
          const patches = smartTidy(page, doc.width, doc.height);
          if (!patches.length) return toast.info("Layout already looks tidy.");
          useEditor.getState().patchElements(patches);
          toast.success(`Tidied ${patches.length} element${patches.length > 1 ? "s" : ""} — undo with Ctrl/⌘+Z`);
        }}
      >
        <Wand2 /> Improve alignment & spacing
      </Button>
      <p className="mt-1.5 text-[11px] text-muted-foreground">Snaps near-aligned edges, centres nearly-centred items, keeps content inside safe margins and evens out vertical spacing.</p>

      <PanelHeading>Colour palettes</PanelHeading>
      <div className="space-y-2">
        {CURATED_PALETTES.map((p) => (
          <button key={p.name} onClick={() => applyPaletteToPage(p.colors)} className="flex w-full items-center gap-2 rounded-lg border p-1.5 text-left hover:border-brand-300 hover:bg-accent">
            <span className="flex h-7 flex-1 overflow-hidden rounded-md">
              {p.colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
            </span>
            <span className="w-16 text-xs">{p.name}</span>
          </button>
        ))}
      </div>
      <PanelHeading>Generate from a colour</PanelHeading>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-12 overflow-hidden rounded-md border" style={{ background: base }}>
          <input type="color" value={base} onChange={(e) => setBase(e.target.value)} className="absolute inset-0 opacity-0" aria-label="Base colour" />
        </label>
        <select value={kind} onChange={(e) => setKind(e.target.value as HarmonyKind)} className="h-9 flex-1 rounded-md border bg-background px-2 text-sm" aria-label="Harmony">
          {(["analogous", "complementary", "triadic", "split", "tetradic", "monochrome"] as const).map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}
        </select>
      </div>
      <button onClick={() => applyPaletteToPage(generated)} className="mt-2 flex h-9 w-full overflow-hidden rounded-lg border hover:ring-2 hover:ring-brand-300" aria-label="Apply generated palette">
        {generated.map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
      </button>
      <Button size="sm" variant="ghost" className="mt-1 w-full" onClick={() => applyPaletteToPage(generated, true)}>Apply to all pages</Button>

      <PanelHeading>Font pairings</PanelHeading>
      <div className="grid grid-cols-2 gap-2">
        {PAIRS.map(([h, b]) => (
          <button
            key={h + b}
            onClick={() => {
              const s = useEditor.getState();
              s.replacePages(s.doc!.pages.map((p) => (p.id === s.activePageId ? applyFontPair(p, h, b) : p)));

            }}
            className="rounded-lg border p-2 text-left hover:border-brand-300 hover:bg-accent"
          >
            <span className="block truncate text-base" style={{ fontFamily: `"${h}"`, fontWeight: 700 }}>{h}</span>
            <span className="block truncate text-[11px] text-muted-foreground" style={{ fontFamily: `"${b}"` }}>{b}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
