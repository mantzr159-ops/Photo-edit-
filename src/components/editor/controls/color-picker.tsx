"use client";
import * as React from "react";
import { Pipette, Plus, Trash2 } from "lucide-react";
import type { DesignElement, LinearGradient, Paint, RadialGradient } from "@/lib/design/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GRADIENT_PRESETS, SOLID_SWATCHES } from "@/lib/design/patterns";
import { paintToCss, paintPrimary } from "@/lib/design/render-css-ext";
import { useEditor } from "@/stores/editor-store";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils/cn";

/** Colours used anywhere in the document (for quick reuse). */
function useDocumentColors() {
  const doc = useEditor((s) => s.doc);
  return React.useMemo(() => {
    const set = new Set<string>();
    const add = (p: Paint | undefined) => {
      if (!p) return;
      const colors = typeof p === "string" ? [p] : p.stops.map((s) => s.color);
      for (const c of colors) if (c.startsWith("#")) set.add(c.toLowerCase());
    };
    doc?.pages.forEach((pg) => {
      add(pg.background.fill);
      pg.elements.forEach((e: DesignElement) => {
        if (e.type === "shape") {
          add(e.fill);
          if (e.strokeWidth) add(e.stroke);
        }
        if (e.type === "text") add(e.fill);
        if (e.type === "icon") add(e.color);
        if (e.type === "line") add(e.stroke);
      });
    });
    return [...set].slice(0, 14);
  }, [doc]);
}

function HexInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  return (
    <input
      value={draft}
      aria-label="Hex colour"
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => e.stopPropagation()}
      onBlur={() => {
        const v = draft.startsWith("#") ? draft : `#${draft}`;
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) onChange(v.toLowerCase());
        else setDraft(value);
      }}
      className="h-8 w-full rounded-md border bg-background px-2 font-mono text-xs uppercase outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function SolidEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const docColors = useDocumentColors();
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  const eyeDropper = typeof window !== "undefined" && "EyeDropper" in window;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="relative h-8 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md border" style={{ background: value }}>
          <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Pick colour" />
        </label>
        <HexInput value={value} onChange={onChange} />
        {eyeDropper && (
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-accent"
            aria-label="Pick from screen"
            onClick={async () => {
              try {
                // @ts-expect-error EyeDropper is not yet in TS lib
                const r = await new window.EyeDropper().open();
                onChange(r.sRGBHex);
              } catch {
                /* cancelled */
              }
            }}
          >
            <Pipette className="h-4 w-4" />
          </button>
        )}
      </div>
      {docColors.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Document colours</p>
          <Swatches colors={docColors} value={value} onPick={onChange} />
        </div>
      )}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Default colours</p>
        <Swatches colors={SOLID_SWATCHES} value={value} onPick={onChange} />
      </div>
    </div>
  );
}

function Swatches({ colors, value, onPick }: { colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {colors.map((c) => (
        <button key={c} onClick={() => onPick(c)} aria-label={c} title={c} className={cn("aspect-square rounded-md border shadow-sm transition hover:scale-110", value.toLowerCase() === c.toLowerCase() && "ring-2 ring-brand-500 ring-offset-1")} style={{ background: c }} />
      ))}
    </div>
  );
}

function GradientEditor({ value, onChange }: { value: LinearGradient | RadialGradient; onChange: (p: Paint) => void }) {
  const [active, setActive] = React.useState(0);
  const stops = value.stops;
  const setStop = (i: number, patch: Partial<{ offset: number; color: string }>) => onChange({ ...value, stops: stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
        {(["linear", "radial"] as const).map((t) => (
          <button key={t} onClick={() => onChange(t === "linear" ? { type: "linear", angle: (value as LinearGradient).angle ?? 90, stops } : { type: "radial", stops })} className={cn("flex-1 rounded px-2 py-1 capitalize", value.type === t && "bg-background shadow-sm")}>
            {t}
          </button>
        ))}
      </div>
      <div className="h-6 rounded-md border" style={{ background: paintToCss({ type: "linear", angle: 0, stops }) }} />
      <div className="flex flex-wrap gap-1.5">
        {stops.map((s, i) => (
          <button key={i} onClick={() => setActive(i)} className={cn("h-7 w-7 rounded-md border", active === i && "ring-2 ring-brand-500 ring-offset-1")} style={{ background: s.color }} aria-label={`Stop ${i + 1}`} />
        ))}
        {stops.length < 5 && (
          <button onClick={() => onChange({ ...value, stops: [...stops, { offset: 1, color: stops[stops.length - 1].color }].map((s, i, arr) => ({ ...s, offset: i / (arr.length - 1) })) })} className="flex h-7 w-7 items-center justify-center rounded-md border hover:bg-accent" aria-label="Add stop">
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
        {stops.length > 2 && (
          <button onClick={() => { onChange({ ...value, stops: stops.filter((_, j) => j !== active) }); setActive(0); }} className="flex h-7 w-7 items-center justify-center rounded-md border hover:bg-accent" aria-label="Remove stop">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {stops[active] && (
        <>
          <div className="flex items-center gap-2">
            <label className="relative h-8 w-10 shrink-0 overflow-hidden rounded-md border" style={{ background: stops[active].color }}>
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(stops[active].color) ? stops[active].color : "#000000"} onChange={(e) => setStop(active, { color: e.target.value })} className="absolute inset-0 opacity-0" aria-label="Stop colour" />
            </label>
            <HexInput value={stops[active].color} onChange={(c) => setStop(active, { color: c })} />
          </div>
          <div className="space-y-1 text-xs">
            <span className="text-muted-foreground">Position {Math.round(stops[active].offset * 100)}%</span>
            <Slider value={[stops[active].offset * 100]} min={0} max={100} onValueChange={(v) => setStop(active, { offset: v[0] / 100 })} />
          </div>
        </>
      )}
      {value.type === "linear" && (
        <div className="space-y-1 text-xs">
          <span className="text-muted-foreground">Angle {Math.round(value.angle)}°</span>
          <Slider value={[value.angle]} min={0} max={360} onValueChange={(v) => onChange({ ...value, angle: v[0] })} />
        </div>
      )}
    </div>
  );
}

/** Swatch button + popover editor for solid colours or gradients. */
export function PaintPicker({ value, onChange, allowGradient = true, label, className }: { value: Paint; onChange: (p: Paint) => void; allowGradient?: boolean; label?: string; className?: string }) {
  const isGrad = typeof value !== "string";
  const [tab, setTab] = React.useState<"solid" | "gradient">(isGrad ? "gradient" : "solid");
  React.useEffect(() => setTab(typeof value !== "string" ? "gradient" : "solid"), [value]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("flex h-8 items-center gap-2 rounded-md border bg-background px-1.5 text-xs hover:bg-accent", className)} aria-label={label ?? "Colour"}>
          <span className="h-5 w-5 shrink-0 rounded border shadow-inner" style={{ background: paintToCss(value) }} />
          {label && <span className="truncate text-muted-foreground">{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" onKeyDown={(e) => e.stopPropagation()}>
        {allowGradient && (
          <div className="mb-3 flex gap-1 rounded-md bg-muted p-0.5 text-xs">
            {(["solid", "gradient"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  if (t === "gradient" && typeof value === "string") onChange({ type: "linear", angle: 90, stops: [{ offset: 0, color: value }, { offset: 1, color: "#ff6b5a" }] });
                  if (t === "solid" && typeof value !== "string") onChange(paintPrimary(value));
                }}
                className={cn("flex-1 rounded px-2 py-1 capitalize", tab === t && "bg-background shadow-sm")}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        {tab === "solid" || typeof value === "string" ? (
          <SolidEditor value={typeof value === "string" ? value : paintPrimary(value)} onChange={onChange} />
        ) : (
          <div className="space-y-3">
            <GradientEditor value={value} onChange={onChange} />
            <div className="grid grid-cols-8 gap-1.5 border-t pt-3">
              {GRADIENT_PRESETS.map((g, i) => (
                <button key={i} onClick={() => onChange(structuredClone(g))} className="aspect-square rounded-md border" style={{ background: paintToCss(g) }} aria-label={`Gradient preset ${i + 1}`} />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function ColorPicker({ value, onChange, label, className }: { value: string; onChange: (c: string) => void; label?: string; className?: string }) {
  return <PaintPicker value={value} onChange={(p) => onChange(typeof p === "string" ? p : paintPrimary(p))} allowGradient={false} label={label} className={className} />;
}
