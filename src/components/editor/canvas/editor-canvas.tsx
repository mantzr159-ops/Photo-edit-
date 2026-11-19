"use client";
/**
 * Interactive design canvas (react-konva).
 *  - zoom (ctrl/⌘ + wheel, pinch) and pan (wheel, space+drag, middle mouse)
 *  - click / shift-click / marquee selection, group-aware
 *  - drag with smart snapping guides, multi-element drag
 *  - transformer for resize / rotate (text reflows; corners scale type)
 *  - inline text editing, context menu, drag-and-drop from panels & desktop
 */
import * as React from "react";
import { Group, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import Konva from "konva";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { selectActivePage, useEditor, registerTextMeasurer } from "@/stores/editor-store";
import type { DesignElement, TextElement } from "@/lib/design/types";
import { elementBounds, snapBox, unionBounds, boxesIntersect, type Guide } from "@/lib/design/geometry";
import { measureTextBox } from "@/lib/design/render";
import { ensureFonts, onFontsLoaded } from "@/lib/design/fonts";
import { ElementNode, type ElementHandlers } from "./element-node";
import { PageBackgroundNode } from "./page-background";
import { TextEditorOverlay } from "./text-editor-overlay";
import { CanvasContextMenu } from "./canvas-context-menu";
import { canvasApi, DND_MIME } from "./canvas-api";
import { dropImageIntoFrame, insertPayload, type InsertPayload } from "@/lib/editor/insert";
import { useRepo } from "@/components/providers/repository-provider";
import { uploadImageFile } from "@/lib/assets";

registerTextMeasurer(measureTextBox);
Konva.pixelRatio = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;

const PAD = 64;
const SNAP_PX = 6;

export default function EditorCanvas() {
  const { repo } = useRepo();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<Konva.Stage>(null);
  const trRef = React.useRef<Konva.Transformer>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [guides, setGuides] = React.useState<Guide[]>([]);
  const [marquee, setMarquee] = React.useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [panning, setPanning] = React.useState(false);
  const spaceDown = React.useRef(false);
  const panStart = React.useRef<{ cx: number; cy: number; x: number; y: number } | null>(null);
  const pinch = React.useRef<{ dist: number; zoom: number; cx: number; cy: number; x: number; y: number } | null>(null);
  const drag = React.useRef<{ start: Map<string, { x: number; y: number }>; box: ReturnType<typeof unionBounds>; others: ReturnType<typeof elementBounds>[] } | null>(null);

  const { doc, page, selectedIds, editingTextId, zoom, showGrid, snapEnabled, previewMode, hoveredId } = useEditor(
    useShallow((s) => ({
      doc: s.doc,
      page: selectActivePage(s),
      selectedIds: s.selectedIds,
      editingTextId: s.editingTextId,
      zoom: s.zoom,
      showGrid: s.showGrid,
      snapEnabled: s.snapEnabled,
      previewMode: s.previewMode,
      hoveredId: s.hoveredId,
    })),
  );
  const W = doc?.width ?? 1, H = doc?.height ?? 1;
  const posRef = React.useRef(pos);
  posRef.current = pos;
  const zoomRef = React.useRef(zoom);
  zoomRef.current = zoom;

  /* ───────────── sizing & viewport ───────────── */
  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fit = React.useCallback(() => {
    if (!size.w || !size.h) return;
    const pad = size.w < 640 ? 24 : PAD;
    const z = Math.max(0.02, Math.min((size.w - pad * 2) / W, (size.h - pad * 2) / H));
    useEditor.getState().setZoom(z);
    useEditor.getState().setFitZoom(z);
    setPos({ x: (size.w - W * z) / 2, y: (size.h - H * z) / 2 });
  }, [size.w, size.h, W, H]);

  React.useEffect(() => {
    fit();
  }, [fit]);

  const zoomAt = React.useCallback((next: number, cx?: number, cy?: number) => {
    const z0 = zoomRef.current;
    const z = Math.min(8, Math.max(0.05, next));
    const el = containerRef.current;
    const px = cx ?? (el?.clientWidth ?? 0) / 2;
    const py = cy ?? (el?.clientHeight ?? 0) / 2;
    const p = posRef.current;
    const wx = (px - p.x) / z0, wy = (py - p.y) / z0;
    useEditor.getState().setZoom(z);
    setPos({ x: px - wx * z, y: py - wy * z });
  }, []);

  React.useEffect(() => {
    canvasApi.stage = stageRef.current;
    canvasApi.fit = fit;
    canvasApi.zoomTo = (z) => zoomAt(z);
    canvasApi.toWorld = (clientX, clientY) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return { x: (clientX - rect.left - posRef.current.x) / zoomRef.current, y: (clientY - rect.top - posRef.current.y) / zoomRef.current };
    };
    canvasApi.viewCenter = () => {
      const el = containerRef.current;
      if (!el) return null;
      const c = { x: (el.clientWidth / 2 - posRef.current.x) / zoomRef.current, y: (el.clientHeight / 2 - posRef.current.y) / zoomRef.current };
      // keep inserts on the page
      return { x: Math.min(W * 0.9, Math.max(W * 0.1, c.x)), y: Math.min(H * 0.9, Math.max(H * 0.1, c.y)) };
    };
  }, [fit, zoomAt, W, H]);

  /* ───────────── fonts: re-measure text once faces arrive ───────────── */
  React.useEffect(() => {
    if (!doc) return;
    const fams = new Set<string>();
    doc.pages.forEach((p) => p.elements.forEach((e) => e.type === "text" && fams.add(e.fontFamily)));
    void ensureFonts([...fams]).then(() => useEditor.getState().refitAllText());
    return onFontsLoaded(() => {
      useEditor.getState().refitAllText();
      stageRef.current?.batchDraw();
    }) as () => void;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id, page?.id]);

  /* ───────────── space key for panning ───────────── */
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target as HTMLElement)?.closest("input,textarea,[contenteditable=true]")) {
        spaceDown.current = true;
        if (containerRef.current) containerRef.current.style.cursor = "grab";
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDown.current = false;
        if (containerRef.current) containerRef.current.style.cursor = "";
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* ───────────── transformer binding ───────────── */
  const selected = React.useMemo(() => page?.elements.filter((e) => selectedIds.includes(e.id)) ?? [], [page, selectedIds]);
  const transformable = selected.filter((e) => !e.locked && !e.hidden && e.id !== editingTextId);
  const onlyLines = transformable.length > 0 && transformable.every((e) => e.type === "line");
  const keepRatio = transformable.some((e) => e.type === "image" || e.type === "icon" || e.type === "emoji" || e.type === "text") || transformable.length > 1;

  React.useEffect(() => {
    const tr = trRef.current, stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = transformable.map((e) => stage.findOne(`#${e.id}`)).filter(Boolean) as Konva.Node[];
    tr.nodes(previewMode ? [] : nodes);
    tr.getLayer()?.batchDraw();
  });

  /* ───────────── element handlers (stable object keeps memo working) ───────────── */
  const handlers = React.useMemo<ElementHandlers>(() => {
    const getStage = () => stageRef.current!;
    return {
      onMouseDown: (e, el) => {
        if (spaceDown.current || ("button" in e.evt && e.evt.button === 1)) return;
        e.cancelBubble = true;
        const s = useEditor.getState();
        const shift = "shiftKey" in e.evt && (e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
        if (shift) s.select([el.id], { toggle: true });
        else if (!s.selectedIds.includes(el.id)) s.select([el.id]);
      },
      onDblClick: (el) => {
        if (el.locked) return;
        if (el.type === "text") useEditor.getState().setEditingText(el.id);
        else if (el.type === "image" && el.placeholder) window.dispatchEvent(new CustomEvent("lumora:open-panel", { detail: "uploads" }));
      },
      onDragStart: (e, el) => {
        const s = useEditor.getState();
        const pg = selectActivePage(s)!;
        if (!s.selectedIds.includes(el.id)) s.select([el.id]);
        const ids = useEditor.getState().selectedIds;
        const start = new Map<string, { x: number; y: number }>();
        const movingEls = pg.elements.filter((x) => ids.includes(x.id) && !x.locked);
        movingEls.forEach((x) => start.set(x.id, { x: x.x, y: x.y }));
        drag.current = {
          start,
          box: unionBounds(movingEls.map(elementBounds)),
          others: pg.elements.filter((x) => !ids.includes(x.id) && !x.hidden).map(elementBounds),
        };
        void e;
      },
      onDragMove: (e, el) => {
        const d = drag.current;
        if (!d) return;
        const node = e.target;
        const st = d.start.get(el.id);
        if (!st) return;
        let dx = node.x() - st.x, dy = node.y() - st.y;
        const s = useEditor.getState();
        if (s.snapEnabled && d.box && !(e.evt as MouseEvent).altKey) {
          const moving = { ...d.box, x: d.box.x + dx, y: d.box.y + dy };
          const snap = snapBox(moving, d.others, { width: s.doc!.width, height: s.doc!.height }, SNAP_PX / s.zoom);
          dx += snap.dx;
          dy += snap.dy;
          setGuides(snap.guides);
        }
        node.position({ x: st.x + dx, y: st.y + dy });
        const stage = getStage();
        d.start.forEach((p, id) => {
          if (id === el.id) return;
          stage.findOne(`#${id}`)?.position({ x: p.x + dx, y: p.y + dy });
        });
      },
      onDragEnd: () => {
        const d = drag.current;
        drag.current = null;
        setGuides([]);
        if (!d) return;
        const stage = getStage();
        const moves = [...d.start.keys()].map((id) => {
          const n = stage.findOne(`#${id}`)!;
          return { id, x: n.x(), y: n.y() };
        });
        useEditor.getState().moveElements(moves);
      },
      onHover: (id) => useEditor.getState().setHovered(id),
    };
  }, []);

  /* ───────────── transform end → commit sizes ───────────── */
  const onTransformEnd = () => {
    const tr = trRef.current;
    const s = useEditor.getState();
    const pg = selectActivePage(s);
    if (!tr || !pg) return;
    const anchor = tr.getActiveAnchor() ?? "";
        const patches = tr.nodes().map((node) => {
      const el = pg.elements.find((e) => e.id === node.id())!;
      const sx = node.scaleX(), sy = node.scaleY();
      node.scale({ x: 1, y: 1 });
      const patch: Partial<DesignElement> = { x: node.x(), y: node.y(), rotation: Math.round(node.rotation() * 100) / 100 };
      if (el.type === "line") {
        patch.width = Math.max(10, el.width * sx);
      } else if (el.type === "text") {
        const t = patch as Partial<TextElement>;
        if (el.curve) {
          // curved text box is derived from the arc: any handle scales the type
          const f = anchor === "top-center" || anchor === "bottom-center" ? sy : sx;
          t.fontSize = Math.max(4, Math.round(el.fontSize * f * 10) / 10);
          t.letterSpacing = el.letterSpacing * f;
        } else if (anchor === "middle-left" || anchor === "middle-right") {
          t.width = Math.max(20, el.width * sx); // reflow, keep type size
        } else if (anchor === "top-center" || anchor === "bottom-center") {
          t.fontSize = Math.max(4, Math.round(el.fontSize * sy * 10) / 10); // scale type, keep width
          t.letterSpacing = el.letterSpacing * sy;
        } else {
          t.width = Math.max(20, el.width * sx); // corner: uniform scale
          t.fontSize = Math.max(4, Math.round(el.fontSize * sx * 10) / 10);
          t.letterSpacing = el.letterSpacing * sx;
        }
      } else {
        patch.width = Math.max(4, el.width * sx);
        patch.height = Math.max(4, el.height * sy);
      }
      return { id: el.id, patch };
    });
    s.patchElements(patches);
  };

  /* ───────────── stage pointer handlers (marquee, pan, deselect) ───────────── */
  const isEmptyTarget = (t: Konva.Node) => t === stageRef.current || t.name() === "background" || t.name() === "workspace";

  const onStageDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const evt = e.evt as MouseEvent;
    if (spaceDown.current || evt.button === 1) {
      panStart.current = { cx: evt.clientX, cy: evt.clientY, x: posRef.current.x, y: posRef.current.y };
      setPanning(true);
      return;
    }
    if (!isEmptyTarget(e.target)) return;
    const s = useEditor.getState();
    if (s.editingTextId) s.setEditingText(null);
    if (!evt.shiftKey) s.clearSelection();
    if (e.evt.type.startsWith("touch")) return;
    const p = stageRef.current!.getRelativePointerPosition()!;
    setMarquee({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  };

  const onStageMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (panStart.current) {
      const evt = e.evt as MouseEvent;
      setPos({ x: panStart.current.x + evt.clientX - panStart.current.cx, y: panStart.current.y + evt.clientY - panStart.current.cy });
      return;
    }
    if (marquee) {
      const p = stageRef.current!.getRelativePointerPosition()!;
      setMarquee((m) => (m ? { ...m, x2: p.x, y2: p.y } : m));
    }
  };

  const onStageUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (panStart.current) {
      panStart.current = null;
      setPanning(false);
      return;
    }
    if (marquee && page) {
      const box = { x: Math.min(marquee.x1, marquee.x2), y: Math.min(marquee.y1, marquee.y2), width: Math.abs(marquee.x2 - marquee.x1), height: Math.abs(marquee.y2 - marquee.y1) };
      if (box.width > 3 || box.height > 3) {
        const ids = page.elements.filter((el) => !el.locked && !el.hidden && boxesIntersect(box, elementBounds(el))).map((el) => el.id);
        useEditor.getState().select(ids, { additive: (e.evt as MouseEvent).shiftKey });
      }
      setMarquee(null);
    }
  };

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const evt = e.evt;
    const rect = containerRef.current!.getBoundingClientRect();
    if (evt.ctrlKey || evt.metaKey) {
      const factor = Math.exp(-evt.deltaY * (evt.deltaMode === 1 ? 0.05 : 0.0025));
      zoomAt(zoomRef.current * factor, evt.clientX - rect.left, evt.clientY - rect.top);
    } else {
      setPos((p) => ({ x: p.x - (evt.shiftKey ? evt.deltaY : evt.deltaX), y: p.y - (evt.shiftKey ? 0 : evt.deltaY) }));
    }
  };

  /* ───────────── touch: pinch zoom / two-finger pan ───────────── */
  const onTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const t = e.evt.touches;
    if (t.length !== 2) {
      onStageMove(e);
      return;
    }
    e.evt.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const cx = (t[0].clientX + t[1].clientX) / 2 - rect.left, cy = (t[0].clientY + t[1].clientY) / 2 - rect.top;
    const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    if (!pinch.current) {
      pinch.current = { dist, zoom: zoomRef.current, cx, cy, x: posRef.current.x, y: posRef.current.y };
      stageRef.current?.find(".element").forEach((n) => n.stopDrag?.());
      return;
    }
    const p0 = pinch.current;
    const z = Math.min(8, Math.max(0.05, p0.zoom * (dist / p0.dist)));
    const wx = (p0.cx - p0.x) / p0.zoom, wy = (p0.cy - p0.y) / p0.zoom;
    useEditor.getState().setZoom(z);
    setPos({ x: cx - wx * z, y: cy - wy * z });
  };

  /* ───────────── drag & drop from panels / desktop ───────────── */
  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(DND_MIME) || e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const at = canvasApi.toWorld(e.clientX, e.clientY);
    if (!at) return;
    const raw = e.dataTransfer.getData(DND_MIME);
    if (raw) {
      try {
        const payload = JSON.parse(raw) as InsertPayload;
        if (payload.kind === "image" && dropImageIntoFrame(payload, at)) return;
        insertPayload(payload, at);
      } catch {
        /* ignore malformed payloads */
      }
      return;
    }
    const files = Array.from(e.dataTransfer.files).slice(0, 10);
    if (!files.length || !repo) return;
    for (const [i, f] of files.entries()) {
      try {
        const asset = await uploadImageFile(repo, f);
        const payload: InsertPayload = { kind: "image", src: asset.src, width: asset.width, height: asset.height, name: asset.name };
        if (!dropImageIntoFrame(payload, at)) insertPayload(payload, { x: at.x + i * 24, y: at.y + i * 24 });
      } catch (err) {
        toast.error(`${f.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
    }
    window.dispatchEvent(new Event("lumora:assets-changed"));
  };

  if (!doc || !page) return null;

  const gridStep = niceStep(Math.max(W, H) / 24);
  const hovered = hoveredId && !selectedIds.includes(hoveredId) ? page.elements.find((e) => e.id === hoveredId) : null;
  const editingEl = editingTextId ? (page.elements.find((e) => e.id === editingTextId) as TextElement | undefined) : undefined;

  return (
    <CanvasContextMenu>
      <div
        ref={containerRef}
        className="relative h-full w-full touch-none overflow-hidden bg-[hsl(var(--workspace))]"
        style={{ cursor: panning ? "grabbing" : undefined }}
        onDragOver={onDragOver}
        onDrop={(e) => void onDrop(e)}
        data-testid="editor-canvas"
      >
        {size.w > 0 && (
          <Stage
            ref={stageRef}
            width={size.w}
            height={size.h}
            x={pos.x}
            y={pos.y}
            scaleX={zoom}
            scaleY={zoom}
            onMouseDown={onStageDown}
            onTouchStart={onStageDown}
            onMouseMove={onStageMove}
            onTouchMove={onTouchMove}
            onMouseUp={onStageUp}
            onTouchEnd={(e) => {
              pinch.current = null;
              onStageUp(e);
            }}
            onWheel={onWheel}
            onContextMenu={(e) => {
              const target = e.target;
              let node: Konva.Node | null = target;
              while (node && node.name() !== "element") node = node.getParent();
              const s = useEditor.getState();
              if (node && !s.selectedIds.includes(node.id())) s.select([node.id()]);
              if (!node && isEmptyTarget(target)) s.clearSelection();
            }}
          >
            <Layer>
              <Rect name="workspace" x={-1e5} y={-1e5} width={2e5} height={2e5} fill="rgba(0,0,0,0)" />
              <Rect x={0} y={0} width={W} height={H} fill="#ffffff" shadowColor="#1a1040" shadowBlur={30 / zoom} shadowOpacity={0.12} shadowOffsetY={6 / zoom} listening={false} />
              {page.background.transparent && <TransparentChecker w={W} h={H} zoom={zoom} />}
              <Group clipX={0} clipY={0} clipWidth={W} clipHeight={H}>
                <PageBackgroundNode bg={page.background} width={W} height={H} />
                {page.elements.map((el) => (
                  <ElementNode key={el.id} el={el} handlers={handlers} interactive={!previewMode} editing={el.id === editingTextId} />
                ))}
              </Group>
            </Layer>
            <Layer>
              {showGrid && !previewMode && <GridLines w={W} h={H} step={gridStep} zoom={zoom} />}
              {hovered && !previewMode && (
                <Rect x={hovered.x} y={hovered.y} width={hovered.width} height={hovered.height} rotation={hovered.rotation} stroke="#7444ff" strokeWidth={1.5 / zoom} listening={false} />
              )}
              {!previewMode &&
                selected
                  .filter((e) => e.locked || selected.length > 1)
                  .map((e) => (
                    <Rect key={e.id} x={e.x} y={e.y} width={e.width} height={e.height} rotation={e.rotation} stroke={e.locked ? "#ff6b5a" : "#7444ff"} dash={[4 / zoom, 3 / zoom]} strokeWidth={1 / zoom} listening={false} />
                  ))}
              <Transformer
                ref={trRef}
                rotateEnabled={!previewMode}
                keepRatio={keepRatio}
                enabledAnchors={onlyLines ? ["middle-left", "middle-right"] : ["top-left", "top-center", "top-right", "middle-right", "middle-left", "bottom-left", "bottom-center", "bottom-right"]}
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                rotationSnapTolerance={4}
                anchorSize={9}
                anchorCornerRadius={5}
                anchorStroke="#7444ff"
                anchorFill="#ffffff"
                borderStroke="#7444ff"
                borderStrokeWidth={1.5}
                rotateAnchorOffset={26}
                padding={2}
                ignoreStroke
                boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 6 || Math.abs(newBox.height) < 4 ? oldBox : newBox)}
                onTransformEnd={onTransformEnd}
              />
              {guides.map((g, i) =>
                g.orientation === "V" ? (
                  <Line key={i} points={[g.position, -H, g.position, H * 2]} stroke="#ff3b6b" strokeWidth={1 / zoom} dash={[4 / zoom, 4 / zoom]} listening={false} />
                ) : (
                  <Line key={i} points={[-W, g.position, W * 2, g.position]} stroke="#ff3b6b" strokeWidth={1 / zoom} dash={[4 / zoom, 4 / zoom]} listening={false} />
                ),
              )}
              {marquee && (
                <Rect
                  x={Math.min(marquee.x1, marquee.x2)}
                  y={Math.min(marquee.y1, marquee.y2)}
                  width={Math.abs(marquee.x2 - marquee.x1)}
                  height={Math.abs(marquee.y2 - marquee.y1)}
                  fill="rgba(116,68,255,0.08)"
                  stroke="#7444ff"
                  strokeWidth={1 / zoom}
                  listening={false}
                />
              )}
            </Layer>
          </Stage>
        )}
        {editingEl && <TextEditorOverlay el={editingEl} zoom={zoom} offset={pos} />}
        {snapEnabled ? null : <span className="pointer-events-none absolute left-3 top-3 rounded bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">Snapping off</span>}
      </div>
    </CanvasContextMenu>
  );
}

function niceStep(raw: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  return (n < 1.5 ? 1 : n < 3.5 ? 2.5 : n < 7.5 ? 5 : 10) * pow;
}

const GridLines = React.memo(function GridLines({ w, h, step, zoom }: { w: number; h: number; step: number; zoom: number }) {
  const lines: React.ReactNode[] = [];
  for (let x = step; x < w; x += step) lines.push(<Line key={`v${x}`} points={[x, 0, x, h]} stroke="rgba(116,68,255,0.25)" strokeWidth={1 / zoom} listening={false} />);
  for (let y = step; y < h; y += step) lines.push(<Line key={`h${y}`} points={[0, y, w, y]} stroke="rgba(116,68,255,0.25)" strokeWidth={1 / zoom} listening={false} />);
  lines.push(<Line key="cx" points={[w / 2, 0, w / 2, h]} stroke="rgba(255,59,107,0.35)" strokeWidth={1 / zoom} listening={false} />);
  lines.push(<Line key="cy" points={[0, h / 2, w, h / 2]} stroke="rgba(255,59,107,0.35)" strokeWidth={1 / zoom} listening={false} />);
  return <>{lines}</>;
});

const TransparentChecker = React.memo(function TransparentChecker({ w, h, zoom }: { w: number; h: number; zoom: number }) {
  const img = React.useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const x = c.getContext("2d")!;
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, 16, 16);
    x.fillStyle = "#e2e0ea";
    x.fillRect(0, 0, 8, 8);
    x.fillRect(8, 8, 8, 8);
    return c as unknown as HTMLImageElement;
  }, []);
  return <Rect width={w} height={h} fillPatternImage={img} fillPatternScale={{ x: 1 / zoom, y: 1 / zoom }} listening={false} />;
});
