"use client";
import * as React from "react";
import type { PageBackground } from "@/lib/design/types";
import { describeBackground } from "@/lib/design/render";
import { useCanvasImage, usePatternImage } from "./use-canvas-image";
import { KNode } from "./knode";

export const PageBackgroundNode = React.memo(function PageBackgroundNode({ bg, width, height }: { bg: PageBackground; width: number; height: number }) {
  const img = useCanvasImage(bg.image?.src);
  const pattern = usePatternImage(bg.pattern);
  const descs = React.useMemo(() => describeBackground(bg, width, height, { getImage: () => img, getIcon: () => undefined }, pattern), [bg, width, height, img, pattern]);
  return (
    <>
      {descs.map((d) => (
        <KNode key={d.key} desc={d} />
      ))}
    </>
  );
});
