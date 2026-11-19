"use client";
import * as React from "react";
import { ImageOff, Layers } from "lucide-react";
import { useEditor, selectActivePage } from "@/stores/editor-store";
import { GRADIENT_PRESETS, PATTERNS, SOLID_SWATCHES, patternDataUrl } from "@/lib/design/patterns";
import { paintToCss } from "@/lib/design/render-css";
import { PaintPicker, ColorPicker } from "../controls/color-picker";
import { SliderField } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AssetImage } from "@/components/assets/asset-image";
import { PanelHeading } from "./panel-ui";
import { UploadsPanel } from "./uploads-panel";
import { cn } from "@/lib/utils/cn";

export function BackgroundPanel() {
  const page = useEditor(selectActivePage);
  const [pickImage, setPickImage] = React.useState(false);
  if (!page) return null;
  const bg = page.background;
  const set = useEditor.getState().setBackground;

  return (
    <div>
      <PanelHeading>Colour</PanelHeading>
      <PaintPicker value={bg.fill} onChange={(fill) => set({ fill })} label="Custom colour or gradient" className="mb-2 w-full" />
      <div className="grid grid-cols-7 gap-1.5">
        {SOLID_SWATCHES.map((c) => (
          <button key={c} aria-label={c} onClick={() => set({ fill: c, transparent: false })} className={cn("aspect-square rounded-md border", bg.fill === c && "ring-2 ring-brand-500 ring-offset-1")} style={{ background: c }} />
        ))}
      </div>
      <PanelHeading>Gradients</PanelHeading>
      <div className="grid grid-cols-6 gap-1.5">
        {GRADIENT_PRESETS.map((g, i) => (
          <button key={i} aria-label={`Gradient ${i + 1}`} onClick={() => set({ fill: structuredClone(g), transparent: false })} className="aspect-square rounded-md border" style={{ background: paintToCss(g) }} />
        ))}
      </div>

      <PanelHeading action={bg.image && <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => set({ image: null })}><ImageOff className="mr-1 inline h-3 w-3" />Remove</button>}>Image</PanelHeading>
      {bg.image ? (
        <div className="space-y-3">
          <div className="checkerboard aspect-video overflow-hidden rounded-lg border">
            <AssetImage src={bg.image.src} className="h-full w-full object-cover" />
          </div>
          <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
            {(["cover", "contain"] as const).map((f) => (
              <button key={f} onClick={() => set({ image: { ...bg.image!, fit: f } })} className={cn("flex-1 rounded px-2 py-1 capitalize", bg.image!.fit === f && "bg-background shadow-sm")}>{f === "cover" ? "Fill" : "Fit"}</button>
            ))}
          </div>
          <SliderField label="Blur" value={bg.image.blur} min={0} max={60} onChange={(blur) => set({ image: { ...bg.image!, blur } }, undefined, "bgblur")} />
          <SliderField label="Opacity" value={Math.round(bg.image.opacity * 100)} min={0} max={100} onChange={(v) => set({ image: { ...bg.image!, opacity: v / 100 } }, undefined, "bgop")} />
          <Button size="sm" variant="outline" className="w-full" onClick={() => setPickImage((v) => !v)}>Replace background image</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setPickImage((v) => !v)}>Choose from uploads</Button>
      )}
      {pickImage && (
        <div className="mt-3 rounded-lg border p-2">
          <p className="mb-2 text-xs text-muted-foreground">Click an upload to use it as the background. (Tip: right-click a photo in the Photos tab.)</p>
          <UploadsPanel mode="background" />
        </div>
      )}

      <PanelHeading action={bg.pattern && <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => set({ pattern: null })}>Remove</button>}>Pattern overlay</PanelHeading>
      <div className="grid grid-cols-6 gap-1.5">
        {PATTERNS.map((p) => (
          <button
            key={p}
            title={p}
            onClick={() => set({ pattern: { kind: p, color: bg.pattern?.color ?? "#16132b", opacity: bg.pattern?.opacity ?? 0.2, scale: bg.pattern?.scale ?? 1 } })}
            className={cn("aspect-square rounded-md border bg-white", bg.pattern?.kind === p && "ring-2 ring-brand-500")}
            style={{ backgroundImage: `url("${patternDataUrl(p, "#16132b")}")`, backgroundSize: "18px" }}
          />
        ))}
      </div>
      {bg.pattern && (
        <div className="mt-3 space-y-2">
          <ColorPicker value={bg.pattern.color} onChange={(color) => set({ pattern: { ...bg.pattern!, color } })} label="Pattern colour" className="w-full" />
          <SliderField label="Opacity" value={Math.round(bg.pattern.opacity * 100)} min={0} max={100} onChange={(v) => set({ pattern: { ...bg.pattern!, opacity: v / 100 } }, undefined, "patop")} />
          <SliderField label="Scale" value={bg.pattern.scale} min={0.25} max={6} step={0.05} onChange={(scale) => set({ pattern: { ...bg.pattern!, scale } }, undefined, "patsc")} />
        </div>
      )}

      <PanelHeading>Options</PanelHeading>
      <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
        <span>Transparent background<span className="block text-xs text-muted-foreground">Used for PNG / SVG export</span></span>
        <Switch checked={!!bg.transparent} onCheckedChange={(transparent) => set({ transparent })} />
      </label>
      <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => useEditor.getState().applyBackgroundToAll()}><Layers /> Apply background to all pages</Button>
    </div>
  );
}
