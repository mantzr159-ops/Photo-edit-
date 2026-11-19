"use client";
import * as React from "react";
import { LayoutTemplate, Palette, Shapes, Type, UploadCloud, Image as ImageIcon, PaintBucket, Sparkles, X } from "lucide-react";
import { TemplatesPanel } from "./panels/templates-panel";
import { DesignPanel } from "./panels/design-panel";
import { ElementsPanel } from "./panels/elements-panel";
import { TextPanel } from "./panels/text-panel";
import { UploadsPanel } from "./panels/uploads-panel";
import { PhotosPanel } from "./panels/photos-panel";
import { BackgroundPanel } from "./panels/background-panel";
import { AIPanel } from "./panels/ai-panel";
import { cn } from "@/lib/utils/cn";

export const PANELS = [
  { id: "templates", label: "Templates", icon: LayoutTemplate, C: TemplatesPanel },
  { id: "design", label: "Design", icon: Palette, C: DesignPanel },
  { id: "elements", label: "Elements", icon: Shapes, C: ElementsPanel },
  { id: "text", label: "Text", icon: Type, C: TextPanel },
  { id: "uploads", label: "Uploads", icon: UploadCloud, C: UploadsPanel },
  { id: "photos", label: "Photos", icon: ImageIcon, C: PhotosPanel },
  { id: "background", label: "Background", icon: PaintBucket, C: BackgroundPanel },
  { id: "ai", label: "AI", icon: Sparkles, C: AIPanel },
] as const;

export type PanelId = (typeof PANELS)[number]["id"];

export function usePanelState(initial: PanelId | null) {
  const [panel, setPanel] = React.useState<PanelId | null>(initial);
  React.useEffect(() => {
    const h = (e: Event) => setPanel((e as CustomEvent<PanelId>).detail);
    window.addEventListener("lumora:open-panel", h);
    return () => window.removeEventListener("lumora:open-panel", h);
  }, []);
  return [panel, setPanel] as const;
}

export function PanelContent({ id }: { id: PanelId }) {
  const P = PANELS.find((p) => p.id === id)!;
  // keep panels mounted state simple: remount on switch
  return <P.C />;
}

/** Desktop: icon rail + collapsible panel. */
export function LeftPanel({ panel, setPanel }: { panel: PanelId | null; setPanel: (p: PanelId | null) => void }) {
  const current = PANELS.find((p) => p.id === panel);
  return (
    <div className="flex h-full">
      <nav className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r bg-card py-2" aria-label="Editor tools">
        {PANELS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPanel(panel === p.id ? null : p.id)}
            className={cn("flex w-16 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground", panel === p.id && "bg-accent text-foreground")}
            aria-pressed={panel === p.id}
          >
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", p.id === "ai" ? "bg-brand-gradient text-white" : panel === p.id && "bg-brand-500/15 text-brand-600 dark:text-brand-300")}>
              <p.icon className="h-[18px] w-[18px]" />
            </span>
            {p.label}
          </button>
        ))}
      </nav>
      {current && (
        <div className="relative flex w-[320px] flex-col border-r bg-background animate-in slide-in-from-left-4 duration-150">
          <div className="flex h-12 shrink-0 items-center justify-between px-4">
            <h2 className="font-display text-sm font-semibold">{current.label === "AI" ? "AI design assistant" : current.label}</h2>
            <button onClick={() => setPanel(null)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Close panel"><X className="h-4 w-4" /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 scrollbar-thin">
            <PanelContent id={current.id} />
          </div>
        </div>
      )}
    </div>
  );
}
