"use client";
/** Helpers that build ready-to-insert elements sized relative to the design. */
import { createEmoji, createFrame, createIcon, createImage, createLine, createShape, createTextFromPreset, type TextPresetId } from "@/lib/design/factory";
import type { DesignElement, ImageElement, LineElement, Paint, ShapeElement, ShapeKind } from "@/lib/design/types";
import { measureTextWidth } from "@/lib/design/render";
import { useEditor } from "@/stores/editor-store";
import { canvasApi } from "@/components/editor/canvas/canvas-api";

export type InsertPayload =
  | { kind: "shape"; shape: ShapeKind; fill?: Paint; props?: Partial<ShapeElement> }
  | { kind: "line"; props?: Partial<LineElement> }
  | { kind: "text"; preset: TextPresetId; text?: string; fontFamily?: string }
  | { kind: "icon"; icon: string }
  | { kind: "emoji"; emoji: string }
  | { kind: "frame"; mask: ImageElement["mask"] }
  | { kind: "image"; src: string; width?: number; height?: number; name?: string; attribution?: string };

function designSize() {
  const doc = useEditor.getState().doc!;
  return { W: doc.width, H: doc.height, unit: Math.min(doc.width, doc.height) };
}

export function payloadToElement(p: InsertPayload): DesignElement {
  const { W, H, unit } = designSize();
  switch (p.kind) {
    case "shape": {
      const s = unit * 0.3;
      const isArrow = p.shape === "arrowShape";
      return createShape(p.shape, { width: isArrow ? s * 1.5 : s, height: isArrow ? s * 0.6 : s, fill: p.fill ?? "#7444ff", ...p.props });
    }
    case "line":
      return createLine({ width: unit * 0.4, height: Math.max(20, unit * 0.02), strokeWidth: Math.max(3, Math.round(unit * 0.006)), ...p.props });
    case "text": {
      const scale = unit / 1080;
      const el = createTextFromPreset(p.preset, p.text ? { text: p.text } : {});
      el.fontSize = Math.max(8, Math.round(el.fontSize * scale));
      el.letterSpacing *= scale;
      if (p.fontFamily) el.fontFamily = p.fontFamily;
      el.width = Math.min(W * 0.8, Math.max(40, measureTextWidth(el)));
      return el;
    }
    case "icon":
      return createIcon(p.icon, { width: unit * 0.16, height: unit * 0.16 });
    case "emoji":
      return createEmoji(p.emoji, { width: unit * 0.18, height: unit * 0.18 });
    case "frame":
      return createFrame(p.mask, { width: unit * 0.4, height: unit * (p.mask === "arch" ? 0.52 : 0.4) });
    case "image": {
      const nw = p.width || 800, nh = p.height || 600;
      const s = Math.min((W * 0.6) / nw, (H * 0.6) / nh, 1.5);
      return createImage(p.src, { width: nw * s, height: nh * s, naturalWidth: nw, naturalHeight: nh, name: p.name, attribution: p.attribution });
    }
  }
}

/** Insert a payload, centred in the current viewport (or at a given design point). */
export function insertPayload(p: InsertPayload, at?: { x: number; y: number }) {
  const store = useEditor.getState();
  if (!store.doc) return;
  // dropping an image onto a selected frame/image replaces its content
  if (p.kind === "image" && !at) {
    const sel = store.doc.pages.find((pg) => pg.id === store.activePageId)?.elements.filter((e) => store.selectedIds.includes(e.id));
    if (sel?.length === 1 && sel[0].type === "image" && sel[0].placeholder) {
      store.updateElement(sel[0].id, { src: p.src, naturalWidth: p.width, naturalHeight: p.height, placeholder: false, crop: undefined, attribution: p.attribution } as Partial<DesignElement>);
      return;
    }
  }
  const el = payloadToElement(p);
  const c = at ?? canvasApi.viewCenter() ?? { x: store.doc.width / 2, y: store.doc.height / 2 };
  el.x = c.x - el.width / 2;
  el.y = c.y - el.height / 2;
  store.addElements([el]);
}

/** Replace a frame/image under the drop point with the dropped image. Returns true if handled. */
export function dropImageIntoFrame(p: Extract<InsertPayload, { kind: "image" }>, at: { x: number; y: number }) {
  const store = useEditor.getState();
  const page = store.doc?.pages.find((pg) => pg.id === store.activePageId);
  if (!page) return false;
  for (let i = page.elements.length - 1; i >= 0; i--) {
    const e = page.elements[i];
    if (e.type !== "image" || !e.placeholder || e.locked) continue;
    if (at.x >= e.x && at.x <= e.x + e.width && at.y >= e.y && at.y <= e.y + e.height && !e.rotation) {
      store.updateElement(e.id, { src: p.src, naturalWidth: p.width, naturalHeight: p.height, placeholder: false, crop: undefined, attribution: p.attribution } as Partial<DesignElement>);
      store.select([e.id]);
      return true;
    }
  }
  return false;
}
