"use client";
/** Renders render-descriptors (lib/design/render.ts) as react-konva nodes. */
import * as React from "react";
import { Arrow, Circle, Ellipse, Group, Image as KImage, Line, Path, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { NodeDesc, NodeKind } from "@/lib/design/render";

const COMPONENTS: Record<NodeKind, React.ElementType> = {
  Group, Rect, Ellipse, Path, Line, Arrow, Text, Image: KImage, Circle,
};

function CachedNode({ desc }: { desc: NodeDesc }) {
  const ref = React.useRef<Konva.Node>(null);
  const C = COMPONENTS[desc.kind];
  React.useEffect(() => {
    const n = ref.current;
    if (!n) return;
    if (desc.cache) {
      n.cache();
      n.getLayer()?.batchDraw();
    } else if (n.isCached()) n.clearCache();
  });
  return (
    <C ref={ref} {...desc.config}>
      {desc.children?.map((c) => <KNode key={c.key} desc={c} />)}
    </C>
  );
}

export function KNode({ desc }: { desc: NodeDesc }) {
  if (desc.cache) return <CachedNode desc={desc} />;
  const C = COMPONENTS[desc.kind];
  return <C {...desc.config}>{desc.children?.map((c) => <KNode key={c.key} desc={c} />)}</C>;
}
