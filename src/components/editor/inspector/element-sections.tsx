"use client";
/** Type-specific inspector sections (text, shape, line, image, icon). */
import * as React from "react";
import { toast } from "sonner";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, CaseSensitive, CaseUpper, CaseLower, Italic, Strikethrough, Underline, Eraser, ImageUp, Sparkles, FlipHorizontal, FlipVertical, Crop,
} from "lucide-react";
import type { DesignElement, ImageElement, ImageMask, IconElement, LineElement, ShapeElement, TextElement } from "@/lib/design/types";
import { FONTS, resolveDirection } from "@/lib/design/fonts";
import { EFFECT_PRESETS, defaultEffect, effectControls } from "@/lib/design/text-effects";
import type { TextEffectType } from "@/lib/design/types";
import { useEditor } from "@/stores/editor-store";
import { NumberField, Section, IconToggle } from "../controls/fields";
import { ColorPicker, PaintPicker } from "../controls/color-picker";
import { FontPicker } from "../controls/font-picker";
import { SliderField } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { useRepo } from "@/components/providers/repository-provider";
import { loadImage, resolveSrc } from "@/lib/design/images";
import { removeBackgroundLocal } from "@/lib/image/remove-bg-local";
import { uploadImageFile } from "@/lib/assets";
import { coverCrop } from "@/lib/design/render";
import { cn } from "@/lib/utils/cn";

type Upd<T> = (patch: Partial<T>, key?: string) => void;

export function TextSection({ el, update }: { el: TextElement; update: Upd<TextElement> }) {
  const weights = FONTS.find((f) => f.family === el.fontFamily)?.weights ?? [400, 700];
  return (
    <>
      <Section title="Text">
        <FontPicker value={el.fontFamily} onChange={(fontFamily) => update({ fontFamily, fontWeight: weights.includes(el.fontWeight) ? el.fontWeight : FONTS.find((f) => f.family === fontFamily)?.weights.includes(el.fontWeight) ? el.fontWeight : 400 })} />
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Size" value={el.fontSize} min={4} max={2000} decimals={1} onChange={(fontSize) => update({ fontSize })} />
          <select
            aria-label="Font weight"
            value={el.fontWeight}
            onChange={(e) => update({ fontWeight: Number(e.target.value) })}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            {(FONTS.find((f) => f.family === el.fontFamily)?.weights ?? [100, 200, 300, 400, 500, 600, 700, 800, 900]).map((w) => (
              <option key={w} value={w}>{({ 100: "Thin", 200: "Extra light", 300: "Light", 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold", 800: "Extra bold", 900: "Black" } as Record<number, string>)[w]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-1">
          <IconToggle label="Bold" active={el.fontWeight >= 700} onClick={() => update({ fontWeight: el.fontWeight >= 700 ? 400 : weights.includes(700) ? 700 : Math.max(...weights) })}><Bold /></IconToggle>
          <IconToggle label="Italic" active={el.italic} onClick={() => update({ italic: !el.italic })}><Italic /></IconToggle>
          <IconToggle label="Underline" active={el.underline} onClick={() => update({ underline: !el.underline })}><Underline /></IconToggle>
          <IconToggle label="Strikethrough" active={el.strike} onClick={() => update({ strike: !el.strike })}><Strikethrough /></IconToggle>
          <span className="mx-0.5 w-px bg-border" />
          {(["left", "center", "right", "justify"] as const).map((a) => (
            <IconToggle key={a} label={`Align ${a}`} active={el.align === a} onClick={() => update({ align: a })}>
              {a === "left" ? <AlignLeft /> : a === "center" ? <AlignCenter /> : a === "right" ? <AlignRight /> : <AlignJustify />}
            </IconToggle>
          ))}
        </div>
        <div className="flex gap-1">
          <IconToggle label="Normal case" active={!el.textTransform || el.textTransform === "none"} onClick={() => update({ textTransform: "none" })}><CaseSensitive /></IconToggle>
          <IconToggle label="Uppercase" active={el.textTransform === "uppercase"} onClick={() => update({ textTransform: "uppercase" })}><CaseUpper /></IconToggle>
          <IconToggle label="Lowercase" active={el.textTransform === "lowercase"} onClick={() => update({ textTransform: "lowercase" })}><CaseLower /></IconToggle>
          <PaintPicker value={el.fill} onChange={(fill) => update({ fill })} label="Color" className="ml-auto" />
        </div>
        <SliderField label="Line height" value={el.lineHeight} min={0.6} max={3} step={0.05} onChange={(lineHeight) => update({ lineHeight }, "lh")} />
        <SliderField label="Letter spacing" value={el.letterSpacing} min={-20} max={Math.max(60, el.fontSize)} step={0.5} onChange={(letterSpacing) => update({ letterSpacing }, "ls")} />
      </Section>
      <TextEffectsSection el={el} update={update} />
      <Section
        title="Highlight"
        action={<Switch checked={!!el.background} onCheckedChange={(v) => update({ background: v ? { color: "#ffd23f", padding: Math.round(el.fontSize * 0.25), radius: Math.round(el.fontSize * 0.15) } : null })} aria-label="Text background" />}
      >
        {el.background && (
          <>
            <ColorPicker value={el.background.color} onChange={(color) => update({ background: { ...el.background!, color } })} label="Background" className="w-full" />
            <SliderField label="Padding" value={el.background.padding} min={0} max={Math.max(100, el.fontSize)} onChange={(padding) => update({ background: { ...el.background!, padding } }, "bgpad")} />
            <SliderField label="Roundness" value={el.background.radius} min={0} max={Math.max(100, el.fontSize)} onChange={(radius) => update({ background: { ...el.background!, radius } }, "bgrad")} />
          </>
        )}
      </Section>
      <Section title="Outline" action={<Switch checked={!!el.strokeWidth} onCheckedChange={(v) => update({ strokeWidth: v ? Math.max(1, Math.round(el.fontSize / 24)) : 0, stroke: el.stroke ?? "#000000" })} aria-label="Text outline" />}>
        {!!el.strokeWidth && (
          <div className="flex items-center gap-2">
            <ColorPicker value={el.stroke ?? "#000000"} onChange={(stroke) => update({ stroke })} />
            <SliderField label="Width" value={el.strokeWidth} min={0.5} max={Math.max(20, el.fontSize / 4)} step={0.5} onChange={(strokeWidth) => update({ strokeWidth }, "tsw")} />
          </div>
        )}
      </Section>
    </>
  );
}

const DASHES: { label: string; value: number[] | undefined }[] = [
  { label: "Solid", value: undefined },
  { label: "Dashed", value: [12, 8] },
  { label: "Dotted", value: [2, 6] },
];

export function ShapeSection({ el, update }: { el: ShapeElement; update: Upd<ShapeElement> }) {
  return (
    <>
      <Section title="Fill">
        <PaintPicker value={el.fill} onChange={(fill) => update({ fill })} label="Fill" className="w-full" />
        {el.shape === "rect" && <SliderField label="Corner radius" value={el.cornerRadius ?? 0} min={0} max={Math.min(el.width, el.height) / 2} onChange={(cornerRadius) => update({ cornerRadius }, "radius")} />}
        {(el.shape === "polygon" || el.shape === "star") && <SliderField label={el.shape === "star" ? "Points" : "Sides"} value={el.sides ?? 5} min={3} max={24} onChange={(sides) => update({ sides: Math.round(sides) }, "sides")} />}
        {el.shape === "star" && <SliderField label="Inner radius" value={el.innerRadiusRatio ?? 0.45} min={0.1} max={0.95} step={0.01} onChange={(innerRadiusRatio) => update({ innerRadiusRatio }, "inner")} />}
      </Section>
      <BorderSection stroke={el.stroke} strokeWidth={el.strokeWidth} dash={el.dash} max={Math.min(el.width, el.height) / 2} onChange={(p, k) => update(p, k)} />
    </>
  );
}

function dashMatches(a?: number[], b?: number[]) {
  if (!a?.length || !b?.length) return !a?.length && !b?.length;
  return a[0] > a[1] === b[0] > b[1];
}

function BorderSection({ stroke, strokeWidth, dash, onChange, max }: { stroke: string; strokeWidth: number; dash?: number[]; max: number; onChange: (p: { stroke?: string; strokeWidth?: number; dash?: number[] }, key?: string) => void }) {
  return (
    <Section title="Border" action={<Switch checked={strokeWidth > 0} onCheckedChange={(v) => onChange({ strokeWidth: v ? 4 : 0 })} aria-label="Border" />}>
      {strokeWidth > 0 && (
        <>
          <div className="flex items-center gap-2">
            <ColorPicker value={stroke} onChange={(s) => onChange({ stroke: s })} />
            <div className="flex flex-1 gap-1">
              {DASHES.map((d) => (
                <button key={d.label} onClick={() => onChange({ dash: d.value?.map((v) => v * Math.max(1, strokeWidth / 4)) })} className={cn("flex-1 rounded-md border px-1 py-1 text-[11px] hover:bg-accent", dashMatches(dash, d.value) && "border-brand-500 bg-brand-500/10")}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <SliderField label="Width" value={strokeWidth} min={0.5} max={Math.max(40, max)} step={0.5} onChange={(w) => onChange({ strokeWidth: w }, "sw")} />
        </>
      )}
    </Section>
  );
}

export function LineSection({ el, update }: { el: LineElement; update: Upd<LineElement> }) {
  const caps: LineElement["endCap"][] = ["none", "arrow", "circle"];
  return (
    <Section title="Line">
      <div className="flex items-center gap-2">
        <ColorPicker value={el.stroke} onChange={(stroke) => update({ stroke })} label="Color" />
        <div className="flex flex-1 gap-1">
          {DASHES.map((d) => (
            <button key={d.label} onClick={() => update({ dash: d.value?.map((v) => v * Math.max(1, el.strokeWidth / 4)) })} className={cn("flex-1 rounded-md border py-1 text-[11px] hover:bg-accent", dashMatches(el.dash, d.value) && "border-brand-500")}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <SliderField label="Thickness" value={el.strokeWidth} min={1} max={80} onChange={(strokeWidth) => update({ strokeWidth, height: Math.max(el.height, strokeWidth * 4) }, "lw")} />
      <div className="grid grid-cols-2 gap-2 text-xs">
        {(["startCap", "endCap"] as const).map((k) => (
          <label key={k} className="space-y-1">
            <span className="text-muted-foreground">{k === "startCap" ? "Start" : "End"}</span>
            <select value={el[k]} onChange={(e) => update({ [k]: e.target.value } as Partial<LineElement>)} className="h-8 w-full rounded-md border bg-background px-2 capitalize">
              {caps.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        ))}
      </div>
      <label className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Curved</span>
        <Switch checked={!!el.curved} onCheckedChange={(curved) => update({ curved, height: curved ? Math.max(el.height, el.width * 0.3) : Math.max(20, el.strokeWidth * 4) })} />
      </label>
    </Section>
  );
}

export function IconSection({ el, update }: { el: IconElement; update: Upd<IconElement> }) {
  return (
    <Section title="Icon">
      <ColorPicker value={el.color} onChange={(color) => update({ color })} label="Color" className="w-full" />
      <SliderField label="Stroke" value={el.strokeWidth} min={0.5} max={4} step={0.25} onChange={(strokeWidth) => update({ strokeWidth }, "isw")} />
    </Section>
  );
}

const MASKS: { id: ImageMask; label: string }[] = [
  { id: "none", label: "None" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "hexagon", label: "Hexagon" },
  { id: "arch", label: "Arch" },
  { id: "blob", label: "Blob" },
];

export function ImageSection({ el, update }: { el: ImageElement; update: Upd<ImageElement> }) {
  const { repo, mode } = useRepo();
  const [busy, setBusy] = React.useState<string | null>(null);
  const f = el.filters ?? {};
  const setF = (patch: Partial<NonNullable<ImageElement["filters"]>>, key?: string) => update({ filters: { ...f, ...patch } }, key);

  const nw = el.naturalWidth || el.width, nh = el.naturalHeight || el.height;
  const cover = coverCrop(nw, nh, el.width, el.height);
  const crop = el.crop ?? cover;
  // crop expressed as zoom + focal point
  const zoom = cover.width / crop.width;
  const fx = crop.width >= nw ? 0.5 : (crop.x + crop.width / 2) / nw;
  const fy = crop.height >= nh ? 0.5 : (crop.y + crop.height / 2) / nh;
  const setCrop = (z: number, cx: number, cy: number) => {
    const cw = cover.width / z, ch = cover.height / z;
    const x = Math.min(nw - cw, Math.max(0, cx * nw - cw / 2));
    const y = Math.min(nh - ch, Math.max(0, cy * nh - ch / 2));
    update({ crop: { x, y, width: cw, height: ch } }, "crop");
  };

  const removeBg = async (cloud: boolean) => {
    if (!repo) return;
    setBusy(cloud ? "cloud" : "local");
    try {
      let blob: Blob;
      if (cloud) {
        const src = await resolveSrc(el.src);
        const original = await (await fetch(src)).blob();
        const form = new FormData();
        form.append("image", original);
        const res = await fetch("/api/ai/remove-bg", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.setup ? `${body.error} ${body.setup}` : body.error ?? "Background removal failed");
        }
        blob = await res.blob();
      } else {
        blob = await removeBackgroundLocal(await loadImage(el.src));
      }
      const asset = await uploadImageFile(repo, new File([blob], `${el.name ?? "image"}-cutout.png`, { type: "image/png" }), { source: "ai" });
      update({ src: asset.src, naturalWidth: asset.width, naturalHeight: asset.height });
      window.dispatchEvent(new Event("lumora:assets-changed"));
      toast.success("Background removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Background removal failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Section title="Image">
        {el.placeholder && <p className="rounded-md bg-brand-500/10 p-2 text-xs text-brand-700 dark:text-brand-300">Empty frame — drag an image onto it, or pick one from Uploads / Photos while it’s selected.</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent("lumora:open-panel", { detail: "uploads" }))}><ImageUp /> Replace</Button>
          <Button size="sm" variant="outline" onClick={() => update({ crop: undefined })} disabled={!el.crop}><Crop /> Reset crop</Button>
        </div>
        <div className="space-y-2">
          <SliderField label="Crop zoom" value={zoom} min={1} max={5} step={0.01} onChange={(z) => setCrop(z, fx, fy)} />
          <SliderField label="Focus X" value={fx} min={0} max={1} step={0.01} onChange={(x) => setCrop(zoom, x, fy)} />
          <SliderField label="Focus Y" value={fy} min={0} max={1} step={0.01} onChange={(y) => setCrop(zoom, fx, y)} />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Shape</p>
          <div className="grid grid-cols-3 gap-1">
            {MASKS.map((m) => (
              <button key={m.id} onClick={() => update({ mask: m.id })} className={cn("rounded-md border px-1 py-1.5 text-[11px] hover:bg-accent", el.mask === m.id && "border-brand-500 bg-brand-500/10")}>{m.label}</button>
            ))}
          </div>
        </div>
        {(el.mask === "none" || el.mask === "rounded") && <SliderField label="Corner radius" value={el.cornerRadius} min={0} max={Math.min(el.width, el.height) / 2} onChange={(cornerRadius) => update({ cornerRadius, mask: cornerRadius > 0 && el.mask === "none" ? "rounded" : el.mask }, "ir")} />}
        <div className="flex gap-1">
          <IconToggle label="Flip horizontal" active={el.flipX} onClick={() => update({ flipX: !el.flipX })}><FlipHorizontal /></IconToggle>
          <IconToggle label="Flip vertical" active={el.flipY} onClick={() => update({ flipY: !el.flipY })}><FlipVertical /></IconToggle>
        </div>
        {el.attribution && <p className="text-[11px] leading-snug text-muted-foreground">{el.attribution}</p>}
      </Section>
      <Section title="Background removal">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={() => void removeBg(false)} disabled={!!busy || el.placeholder}>{busy === "local" ? <Spinner /> : <Eraser />} Basic</Button>
          <Button size="sm" variant="outline" onClick={() => void removeBg(true)} disabled={!!busy || el.placeholder}>{busy === "cloud" ? <Spinner /> : <Sparkles />} AI (cloud)</Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Basic removes plain backgrounds in your browser. AI uses the server’s remove.bg integration{mode === "local" ? "" : ""}.</p>
      </Section>
      <Section title="Adjust" action={<button className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => update({ filters: {} })}>Reset</button>}>
        <SliderField label="Brightness" value={f.brightness ?? 0} min={-1} max={1} step={0.01} onChange={(brightness) => setF({ brightness }, "fb")} />
        <SliderField label="Contrast" value={f.contrast ?? 0} min={-100} max={100} onChange={(contrast) => setF({ contrast }, "fc")} />
        <SliderField label="Saturation" value={f.saturation ?? 0} min={-2} max={4} step={0.05} onChange={(saturation) => setF({ saturation }, "fs")} />
        <SliderField label="Blur" value={f.blur ?? 0} min={0} max={40} onChange={(blur) => setF({ blur }, "fbl")} />
        <div className="flex gap-4 text-xs">
          <label className="flex items-center gap-2"><Switch checked={!!f.grayscale} onCheckedChange={(grayscale) => setF({ grayscale })} /> Grayscale</label>
          <label className="flex items-center gap-2"><Switch checked={!!f.sepia} onCheckedChange={(sepia) => setF({ sepia })} /> Sepia</label>
        </div>
      </Section>
      <BorderSection stroke={el.stroke ?? "#ffffff"} strokeWidth={el.strokeWidth ?? 0} max={Math.min(el.width, el.height) / 4} onChange={(p, k) => update(p as Partial<ImageElement>, k)} />
    </>
  );
}

export function ShadowSection({ el, update }: { el: DesignElement; update: Upd<DesignElement> }) {
  const sh = el.shadow ?? { enabled: false, color: "#000000", blur: 16, offsetX: 0, offsetY: 8, opacity: 0.3 };
  const set = (p: Partial<typeof sh>, key?: string) => update({ shadow: { ...sh, ...p } }, key);
  return (
    <Section title="Shadow" action={<Switch checked={sh.enabled} onCheckedChange={(enabled) => set({ enabled })} aria-label="Shadow" />}>
      {sh.enabled && (
        <>
          <ColorPicker value={sh.color} onChange={(color) => set({ color })} label="Color" className="w-full" />
          <SliderField label="Blur" value={sh.blur} min={0} max={120} onChange={(blur) => set({ blur }, "shb")} />
          <SliderField label="Offset X" value={sh.offsetX} min={-100} max={100} onChange={(offsetX) => set({ offsetX }, "shx")} />
          <SliderField label="Offset Y" value={sh.offsetY} min={-100} max={100} onChange={(offsetY) => set({ offsetY }, "shy")} />
          <SliderField label="Opacity" value={sh.opacity} min={0} max={1} step={0.01} onChange={(opacity) => set({ opacity }, "sho")} />
        </>
      )}
    </Section>
  );
}

export function useUpdateSelected() {
  return React.useCallback((patch: Partial<DesignElement>, key?: string) => {
    const s = useEditor.getState();
    s.updateElements(s.selectedIds, patch, key);
  }, []);
}

/** Writing direction, curved text and Canva-style text effects. */
function TextEffectsSection({ el, update }: { el: TextElement; update: Upd<TextElement> }) {
  const dir = resolveDirection(el.text, el.direction);
  const fx = el.effect;
  const ctl = effectControls(fx?.type ?? "none");
  const setFx = (patch: Partial<NonNullable<TextElement["effect"]>>, key?: string) => fx && update({ effect: { ...fx, ...patch } }, key);
  const isRtl = dir === "rtl";
  return (
    <Section title="Effects">
      <div className="grid grid-cols-3 gap-1.5">
        {EFFECT_PRESETS.map((p) => (
          <button
            key={p.type}
            onClick={() => update({ effect: defaultEffect(p.type as TextEffectType) })}
            className={cn("flex flex-col items-center gap-1 rounded-lg border p-1.5 text-[10px] hover:bg-accent", (fx?.type ?? "none") === p.type && "border-brand-500 bg-brand-500/10")}
            aria-pressed={(fx?.type ?? "none") === p.type}
          >
            <EffectSwatch type={p.type as TextEffectType} />
            {p.label}
          </button>
        ))}
      </div>
      {fx && (
        <div className="space-y-2">
          {ctl.color && <ColorPicker value={fx.color} onChange={(color) => setFx({ color })} label="Effect colour" className="w-full" />}
          {ctl.offset && <SliderField label="Offset" value={fx.offset} min={0} max={100} onChange={(offset) => setFx({ offset }, "fxo")} />}
          {ctl.direction && <SliderField label="Direction" value={fx.direction} min={-180} max={180} onChange={(direction) => setFx({ direction }, "fxd")} />}
          {ctl.intensity && <SliderField label={fx.type === "hollow" || fx.type === "outline" || fx.type === "splice" ? "Thickness" : "Intensity"} value={fx.intensity} min={0} max={100} onChange={(intensity) => setFx({ intensity }, "fxi")} />}
        </div>
      )}
      <div className="space-y-1 pt-1">
        <SliderField label="Curve" value={el.curve ?? 0} min={-100} max={100} onChange={(curve) => update({ curve: Math.round(curve) }, "curve")} />
        {isRtl && !!el.curve && <p className="text-[11px] text-amber-600">Curved Arabic text is drawn letter by letter, so letters may not join. Keep Arabic text straight for correct shaping.</p>}
      </div>
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Direction</p>
        <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
          {([["auto", "Auto"], ["ltr", "LTR →"], ["rtl", "← RTL"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => update({ direction: v, ...(v === "rtl" && el.align === "left" ? { align: "right" as const } : v === "ltr" && el.align === "right" ? { align: "left" as const } : {}) })}
              className={cn("flex-1 rounded px-2 py-1", (el.direction ?? "auto") === v && "bg-background shadow-sm")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}

function EffectSwatch({ type }: { type: TextEffectType }) {
  const base = "font-display text-lg font-extrabold leading-none";
  switch (type) {
    case "shadow": return <span className={base} style={{ textShadow: "2px 2px 2px rgba(0,0,0,.5)" }}>Ag</span>;
    case "lift": return <span className={base} style={{ textShadow: "0 3px 6px rgba(0,0,0,.35)" }}>Ag</span>;
    case "hollow": return <span className={base} style={{ color: "transparent", WebkitTextStroke: "1px currentColor" }}>Ag</span>;
    case "splice": return <span className={base} style={{ color: "transparent", WebkitTextStroke: "1px currentColor", textShadow: "2px 2px 0 #ffb4c8" }}>Ag</span>;
    case "outline": return <span className={base} style={{ WebkitTextStroke: "1.5px #7444ff" }}>Ag</span>;
    case "echo": return <span className={base} style={{ textShadow: "2px 2px 0 rgba(0,0,0,.35), 4px 4px 0 rgba(0,0,0,.18)" }}>Ag</span>;
    case "glitch": return <span className={base} style={{ textShadow: "-2px 0 #00f0ff, 2px 0 #ff1f6b" }}>Ag</span>;
    case "neon": return <span className={base} style={{ color: "#ffe6fa", textShadow: "0 0 4px #ff3bd4, 0 0 8px #ff3bd4" }}>Ag</span>;
    default: return <span className={base}>Ag</span>;
  }
}
