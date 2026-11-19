"use client";
import * as React from "react";
import { useShallow } from "zustand/react/shallow";
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalSpaceAround, AlignStartHorizontal, AlignStartVertical, AlignVerticalSpaceAround,
  ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, CopyPlus, Eye, EyeOff, Group, GripVertical, Lock, Trash2, Ungroup, Unlock, Grid3x3, Magnet, Maximize2,
} from "lucide-react";
import { selectActivePage, selectSelectedElements, useEditor } from "@/stores/editor-store";
import type { DesignElement, IconElement, ImageElement, LineElement, ShapeElement, TextElement } from "@/lib/design/types";
import { elementLabel } from "@/lib/design/factory";
import { NumberField, Section, IconToggle } from "../controls/fields";
import { PaintPicker } from "../controls/color-picker";
import { SliderField } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconSection, ImageSection, LineSection, ShadowSection, ShapeSection, TextSection, useUpdateSelected } from "./element-sections";
import { cn } from "@/lib/utils/cn";

function ArrangeSection({ selected }: { selected: DesignElement[] }) {
  const s = useEditor.getState;
  const multi = selected.length > 1;
  const grouped = selected.some((e) => e.groupId);
  const locked = selected.every((e) => e.locked);
  return (
    <Section title={multi ? `${selected.length} elements` : elementLabel(selected[0])}>
      <div className="flex flex-wrap gap-1">
        <IconToggle label="Align left" onClick={() => s().align("left")}><AlignStartVertical /></IconToggle>
        <IconToggle label="Align centre" onClick={() => s().align("hcenter")}><AlignCenterVertical /></IconToggle>
        <IconToggle label="Align right" onClick={() => s().align("right")}><AlignEndVertical /></IconToggle>
        <IconToggle label="Align top" onClick={() => s().align("top")}><AlignStartHorizontal /></IconToggle>
        <IconToggle label="Align middle" onClick={() => s().align("vcenter")}><AlignCenterHorizontal /></IconToggle>
        <IconToggle label="Align bottom" onClick={() => s().align("bottom")}><AlignEndHorizontal /></IconToggle>
        {selected.length > 2 && (
          <>
            <IconToggle label="Distribute horizontally" onClick={() => s().distribute("horizontal")}><AlignHorizontalSpaceAround /></IconToggle>
            <IconToggle label="Distribute vertically" onClick={() => s().distribute("vertical")}><AlignVerticalSpaceAround /></IconToggle>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <IconToggle label="Bring forward" onClick={() => s().arrange("forward")}><ArrowUp /></IconToggle>
        <IconToggle label="Bring to front" onClick={() => s().arrange("front")}><ArrowUpToLine /></IconToggle>
        <IconToggle label="Send backward" onClick={() => s().arrange("backward")}><ArrowDown /></IconToggle>
        <IconToggle label="Send to back" onClick={() => s().arrange("back")}><ArrowDownToLine /></IconToggle>
        <span className="mx-0.5 w-px bg-border" />
        {grouped ? (
          <IconToggle label="Ungroup" onClick={() => s().ungroupSelected()}><Ungroup /></IconToggle>
        ) : (
          <IconToggle label="Group" disabled={!multi} onClick={() => s().groupSelected()}><Group /></IconToggle>
        )}
        <IconToggle label={locked ? "Unlock" : "Lock"} active={locked} onClick={() => s().toggleLockSelected()}>{locked ? <Lock /> : <Unlock />}</IconToggle>
        <IconToggle label="Duplicate" onClick={() => s().duplicateSelected()}><CopyPlus /></IconToggle>
        <IconToggle label="Delete" onClick={() => s().deleteSelected()}><Trash2 /></IconToggle>
      </div>
    </Section>
  );
}

function GeometrySection({ el, update }: { el: DesignElement; update: (p: Partial<DesignElement>, key?: string) => void }) {
  return (
    <Section title="Position & size">
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={el.x} onChange={(x) => update({ x })} />
        <NumberField label="Y" value={el.y} onChange={(y) => update({ y })} />
        <NumberField label="W" value={el.width} min={1} onChange={(width) => update(el.type === "text" ? { width } : { width })} />
        <NumberField label="H" value={el.height} min={1} onChange={(height) => el.type !== "text" && update({ height })} className={el.type === "text" ? "opacity-60" : ""} />
        <NumberField label="Rotate" value={el.rotation} suffix="°" decimals={1} onChange={(rotation) => update({ rotation: ((rotation % 360) + 360) % 360 })} />
      </div>
      <SliderField label="Opacity" value={Math.round(el.opacity * 100)} min={0} max={100} onChange={(v) => update({ opacity: v / 100 }, "opacity")} />
    </Section>
  );
}

function PageSection() {
  const page = useEditor(selectActivePage);
  const doc = useEditor((s) => s.doc);
  const { showGrid, snapEnabled } = useEditor(useShallow((s) => ({ showGrid: s.showGrid, snapEnabled: s.snapEnabled })));
  if (!page || !doc) return null;
  const s = useEditor.getState;
  return (
    <>
      <Section title="Page">
        <input
          value={page.name ?? ""}
          placeholder={`Page ${doc.pages.indexOf(page) + 1}`}
          onChange={(e) => s().renamePage(page.id, e.target.value.slice(0, 60))}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-8 w-full rounded-md border bg-background px-2 text-sm"
          aria-label="Page name"
        />
        <p className="text-xs text-muted-foreground">{doc.width} × {doc.height} px</p>
        <Button size="sm" variant="outline" className="w-full" onClick={() => window.dispatchEvent(new Event("lumora:open-resize"))}><Maximize2 /> Resize design</Button>
      </Section>
      <Section title="Background">
        <PaintPicker value={page.background.fill} onChange={(fill) => s().setBackground({ fill })} label="Colour" className="w-full" />
        <label className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Transparent background</span>
          <Switch checked={!!page.background.transparent} onCheckedChange={(transparent) => s().setBackground({ transparent })} />
        </label>
        <Button size="sm" variant="ghost" className="w-full" onClick={() => window.dispatchEvent(new CustomEvent("lumora:open-panel", { detail: "background" }))}>More background options</Button>
      </Section>
      <Section title="Canvas">
        <label className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-muted-foreground"><Grid3x3 className="h-3.5 w-3.5" /> Show grid</span><Switch checked={showGrid} onCheckedChange={() => s().toggleGrid()} /></label>
        <label className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-muted-foreground"><Magnet className="h-3.5 w-3.5" /> Snap to guides</span><Switch checked={snapEnabled} onCheckedChange={() => s().toggleSnap()} /></label>
        <p className="text-[11px] text-muted-foreground">Hold Alt while dragging to temporarily disable snapping.</p>
      </Section>
    </>
  );
}

export function LayersList() {
  const page = useEditor(selectActivePage);
  const selectedIds = useEditor((s) => s.selectedIds);
  const [dragId, setDragId] = React.useState<string | null>(null);
  if (!page) return null;
  const s = useEditor.getState;
  const items = [...page.elements].reverse(); // top-most first
  if (!items.length) return <p className="p-4 text-sm text-muted-foreground">No elements on this page yet.</p>;
  return (
    <ul className="space-y-0.5 p-2" aria-label="Layers">
      {items.map((el) => (
        <li
          key={el.id}
          draggable
          onDragStart={() => setDragId(el.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragId && dragId !== el.id) s().reorderElement(dragId, page.elements.findIndex((x) => x.id === el.id));
            setDragId(null);
          }}
          onClick={(e) => s().select([el.id], { toggle: e.shiftKey || e.metaKey })}
          onMouseEnter={() => s().setHovered(el.id)}
          onMouseLeave={() => s().setHovered(null)}
          className={cn("group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent", selectedIds.includes(el.id) && "bg-brand-500/10 text-brand-700 dark:text-brand-200", el.hidden && "opacity-50")}
        >
          <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground" />
          <span className="w-12 shrink-0 text-[10px] uppercase text-muted-foreground">{el.type}</span>
          <span className="min-w-0 flex-1 truncate">{elementLabel(el)}</span>
          {el.groupId && <Group className="h-3.5 w-3.5 text-muted-foreground" aria-label="Grouped" />}
          <button onClick={(e) => { e.stopPropagation(); s().updateElement(el.id, { hidden: !el.hidden }); }} className="rounded p-0.5 opacity-60 hover:opacity-100" aria-label={el.hidden ? "Show" : "Hide"}>
            {el.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); s().updateElement(el.id, { locked: !el.locked }); }} className={cn("rounded p-0.5 hover:opacity-100", el.locked ? "text-coral-500 opacity-100" : "opacity-60")} aria-label={el.locked ? "Unlock" : "Lock"}>
            {el.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function Inspector() {
  const selected = useEditor(useShallow(selectSelectedElements));
  const update = useUpdateSelected();
  const el = selected.length === 1 ? selected[0] : null;
  const allSameType = selected.length > 1 && selected.every((e) => e.type === selected[0].type) ? selected[0] : null;
  const typed = el ?? allSameType;

  return (
    <Tabs defaultValue="props" className="flex h-full flex-col">
      <div className="border-b px-3 pb-2 pt-3">
        <TabsList className="w-full">
          <TabsTrigger value="props">{selected.length ? "Properties" : "Page"}</TabsTrigger>
          <TabsTrigger value="layers">Layers</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="props" className="mt-0 min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {!selected.length ? (
          <PageSection />
        ) : (
          <div key={selected.map((e) => e.id).join()}>
            <ArrangeSection selected={selected} />
            {el && <GeometrySection el={el} update={update} />}
            {!el && <Section title="Opacity"><SliderField label="Opacity" value={Math.round(selected[0].opacity * 100)} min={0} max={100} onChange={(v) => update({ opacity: v / 100 }, "opacity")} /></Section>}
            {typed?.type === "text" && <TextSection el={typed as TextElement} update={update as never} />}
            {typed?.type === "shape" && <ShapeSection el={typed as ShapeElement} update={update as never} />}
            {typed?.type === "line" && <LineSection el={typed as LineElement} update={update as never} />}
            {typed?.type === "icon" && <IconSection el={typed as IconElement} update={update as never} />}
            {el?.type === "image" && <ImageSection el={el as ImageElement} update={update as never} />}
            {typed && typed.type !== "line" && <ShadowSection el={typed} update={update} />}
          </div>
        )}
      </TabsContent>
      <TabsContent value="layers" className="mt-0 min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <LayersList />
      </TabsContent>
    </Tabs>
  );
}
