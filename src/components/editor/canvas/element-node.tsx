"use client";
import * as React from "react";
import { Group } from "react-konva";
import type Konva from "konva";
import type { DesignElement } from "@/lib/design/types";
import { describeElement, elementGroupConfig, iconKey, type RenderContext } from "@/lib/design/render";
import { useCanvasImage, useIconImage } from "./use-canvas-image";
import { KNode } from "./knode";

export type ElementHandlers = {
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>, el: DesignElement) => void;
  onDblClick: (el: DesignElement) => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>, el: DesignElement) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>, el: DesignElement) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, el: DesignElement) => void;
  onHover: (id: string | null) => void;
};

/**
 * One canvas element. Memoised on the element object: Immer structural
 * sharing means untouched elements keep their identity, so editing one
 * element never re-renders the others.
 */
export const ElementNode = React.memo(function ElementNode({ el, handlers, interactive, editing }: { el: DesignElement; handlers: ElementHandlers; interactive: boolean; editing: boolean }) {
  const img = useCanvasImage(el.type === "image" ? el.src : null);
  const icon = useIconImage(el.type === "icon" ? el : null);
  const ctx: RenderContext = React.useMemo(
    () => ({ getImage: () => img, getIcon: (k) => (el.type === "icon" && k === iconKey(el) ? icon : undefined) }),
    [img, icon, el],
  );
  const children = React.useMemo(() => describeElement(el, ctx), [el, ctx]);
  const cfg = elementGroupConfig(el);
  return (
    <Group
      {...cfg}
      opacity={editing ? 0 : el.opacity}
      draggable={interactive && !el.locked && !editing}
      listening={interactive}
      onMouseDown={(e) => handlers.onMouseDown(e, el)}
      onTouchStart={(e) => handlers.onMouseDown(e, el)}
      onDblClick={() => handlers.onDblClick(el)}
      onDblTap={() => handlers.onDblClick(el)}
      onDragStart={(e) => handlers.onDragStart(e, el)}
      onDragMove={(e) => handlers.onDragMove(e, el)}
      onDragEnd={(e) => handlers.onDragEnd(e, el)}
      onMouseEnter={() => handlers.onHover(el.id)}
      onMouseLeave={() => handlers.onHover(null)}
    >
      {children.map((d) => (
        <KNode key={d.key} desc={d} />
      ))}
    </Group>
  );
});
