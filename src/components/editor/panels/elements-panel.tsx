"use client";
import * as React from "react";
import { FEATURED_ICONS, iconNodeToSvg, loadIconSet } from "@/lib/design/icons";
import { GRADIENT_PRESETS, PATTERNS, patternDataUrl } from "@/lib/design/patterns";
import { paintToCss } from "@/lib/design/render-css";
import { blobPath, heartPath, starPoints, arrowShapePath } from "@/lib/design/shapes";
import type { ShapeKind } from "@/lib/design/types";
import { useEditor } from "@/stores/editor-store";
import { InsertTile, PanelHeading, PanelSearch } from "./panel-ui";

const SHAPES: { kind: ShapeKind; label: string; svg: React.ReactNode; props?: Record<string, unknown> }[] = [
  { kind: "rect", label: "Square", svg: <rect x="6" y="6" width="36" height="36" /> },
  { kind: "rect", label: "Rounded square", svg: <rect x="6" y="6" width="36" height="36" rx="9" />, props: { cornerRadius: 40 } },
  { kind: "ellipse", label: "Circle", svg: <circle cx="24" cy="24" r="18" /> },
  { kind: "triangle", label: "Triangle", svg: <path d="M24 6 42 40H6Z" /> },
  { kind: "polygon", label: "Hexagon", svg: <path d="M24 5l16.5 9.5v19L24 43 7.5 33.5v-19Z" />, props: { sides: 6 } },
  { kind: "polygon", label: "Pentagon", svg: <path d="M24 5l18 13-7 22H13L6 18Z" />, props: { sides: 5 } },
  { kind: "star", label: "Star", svg: <path d={starPath(5, 0.45)} />, props: { sides: 5, innerRadiusRatio: 0.45 } },
  { kind: "star", label: "Burst", svg: <path d={starPath(12, 0.75)} />, props: { sides: 12, innerRadiusRatio: 0.75 } },
  { kind: "heart", label: "Heart", svg: <path d={heartPath(36, 33)} transform="translate(6 8)" /> },
  { kind: "blob", label: "Blob", svg: <path d={blobPath(36, 36)} transform="translate(6 6)" /> },
  { kind: "arrowShape", label: "Arrow", svg: <path d={arrowShapePath(40, 24)} transform="translate(4 12)" /> },
  { kind: "star", label: "Sparkle", svg: <path d={starPath(4, 0.3)} />, props: { sides: 4, innerRadiusRatio: 0.3 } },
];

function starPath(n: number, inner: number) {
  return starPoints(n, inner, 36, 36).map((p, i) => `${i ? "L" : "M"}${p[0] + 6} ${p[1] + 6}`).join(" ") + "Z";
}

const STICKERS = "🎉 ✨ 🔥 💡 ❤️ ⭐ 🌈 🚀 🎈 🎂 🎁 📚 🎓 🩺 💊 🧠 🫀 🧬 🔬 🌿 🌸 🌻 ☀️ 🌙 ☕ 🍕 🎵 📷 ✈️ 🏆 👍 👏 💬 📌 ✅ ⚡ 💎 🎯 🛒 💰".split(" ");

const FRAMES = [
  { mask: "none" as const, label: "Rectangle frame" },
  { mask: "rounded" as const, label: "Rounded frame" },
  { mask: "circle" as const, label: "Circle frame" },
  { mask: "hexagon" as const, label: "Hexagon frame" },
  { mask: "arch" as const, label: "Arch frame" },
  { mask: "blob" as const, label: "Blob frame" },
];

function IconPreview({ name, svg }: { name: string; svg: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={name} src={"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)} className="h-7 w-7 dark:invert" draggable={false} />;
}

export function ElementsPanel() {
  const [q, setQ] = React.useState("");
  const [icons, setIcons] = React.useState<Record<string, [string, Record<string, string | number>][]> | null>(null);
  const [showAllShapes, setShowAll] = React.useState(false);
  React.useEffect(() => {
    void loadIconSet().then(setIcons);
  }, []);
  const query = q.trim().toLowerCase();
  const iconNames = React.useMemo(() => {
    if (!icons) return [];
    if (!query) return FEATURED_ICONS.filter((n) => n in icons);
    return Object.keys(icons).filter((n) => n.toLowerCase().includes(query.replace(/\s+/g, ""))).slice(0, 120);
  }, [icons, query]);
  const shapeList = SHAPES.filter((s) => !query || s.label.toLowerCase().includes(query));

  return (
    <div>
      <PanelSearch value={q} onChange={setQ} placeholder="Search shapes, icons, stickers…" />
      {shapeList.length > 0 && (
        <>
          <PanelHeading action={!query && <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowAll((v) => !v)}>{showAllShapes ? "Less" : "See all"}</button>}>Shapes</PanelHeading>
          <div className="grid grid-cols-4 gap-2">
            {(showAllShapes || query ? shapeList : shapeList.slice(0, 8)).map((s) => (
              <InsertTile key={s.label} title={s.label} payload={{ kind: "shape", shape: s.kind, props: s.props }} className="aspect-square p-2">
                <svg viewBox="0 0 48 48" className="h-full w-full fill-brand-500">{s.svg}</svg>
              </InsertTile>
            ))}
          </div>
        </>
      )}
      {(!query || "line arrow".includes(query)) && (
        <>
          <PanelHeading>Lines & arrows</PanelHeading>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Line", props: {} },
              { label: "Dashed line", props: { dash: [12, 8] } },
              { label: "Arrow", props: { endCap: "arrow" as const } },
              { label: "Double arrow", props: { endCap: "arrow" as const, startCap: "arrow" as const } },
              { label: "Dot line", props: { endCap: "circle" as const, startCap: "circle" as const } },
              { label: "Curved arrow", props: { endCap: "arrow" as const, curved: true, height: 120 } },
            ].map((l) => (
              <InsertTile key={l.label} title={l.label} payload={{ kind: "line", props: l.props }} className="aspect-square p-2">
                <svg viewBox="0 0 48 48" className="h-full w-full stroke-foreground" fill="none" strokeWidth="3" strokeLinecap="round">
                  {l.props.curved ? <path d="M6 36 Q24 6 42 36" /> : <path d="M6 24 H42" strokeDasharray={"dash" in l.props ? "6 4" : undefined} />}
                  {"endCap" in l.props && l.props.endCap === "arrow" && <path d={l.props.curved ? "M36 30 l6 6 -1 -8" : "M35 17 l7 7 -7 7"} />}
                  {"startCap" in l.props && l.props.startCap === "arrow" && <path d="M13 17 l-7 7 7 7" />}
                  {"startCap" in l.props && l.props.startCap === "circle" && <><circle cx="6" cy="24" r="3" className="fill-foreground" /><circle cx="42" cy="24" r="3" className="fill-foreground" /></>}
                </svg>
              </InsertTile>
            ))}
          </div>
        </>
      )}
      {(!query || "frame photo".includes(query)) && (
        <>
          <PanelHeading>Frames</PanelHeading>
          <div className="grid grid-cols-3 gap-2">
            {FRAMES.map((f) => (
              <InsertTile key={f.mask} title={f.label} payload={{ kind: "frame", mask: f.mask }} className="aspect-square p-3">
                <span className="block h-full w-full bg-muted-foreground/25" style={{ borderRadius: f.mask === "circle" ? "50%" : f.mask === "rounded" ? 10 : f.mask === "arch" ? "999px 999px 0 0" : f.mask === "blob" ? "40% 60% 55% 45%" : 0, clipPath: f.mask === "hexagon" ? "polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)" : undefined }} />
              </InsertTile>
            ))}
          </div>
        </>
      )}
      {(!query || "gradient".includes(query)) && (
        <>
          <PanelHeading>Gradients</PanelHeading>
          <div className="grid grid-cols-4 gap-2">
            {GRADIENT_PRESETS.slice(0, 8).map((g, i) => (
              <InsertTile key={i} title="Gradient shape" payload={{ kind: "shape", shape: "rect", fill: g, props: { cornerRadius: 24 } }} className="aspect-square overflow-hidden p-0">
                <span className="h-full w-full" style={{ background: paintToCss(g) }} />
              </InsertTile>
            ))}
          </div>
        </>
      )}
      {(!query || "pattern".includes(query)) && (
        <>
          <PanelHeading>Patterns (page background)</PanelHeading>
          <div className="grid grid-cols-6 gap-2">
            {PATTERNS.map((p) => (
              <button
                key={p}
                title={p}
                onClick={() => useEditor.getState().setBackground({ pattern: { kind: p, color: "#7444ff", opacity: 0.25, scale: 1 } })}
                className="aspect-square rounded-lg border bg-white hover:border-brand-300"
                style={{ backgroundImage: `url("${patternDataUrl(p, "#7444ff")}")`, backgroundSize: "20px" }}
              />
            ))}
          </div>
        </>
      )}
      {(!query || "sticker emoji".includes(query)) && (
        <>
          <PanelHeading>Stickers</PanelHeading>
          <div className="grid grid-cols-6 gap-1.5">
            {STICKERS.map((e) => (
              <InsertTile key={e} title={`Sticker ${e}`} payload={{ kind: "emoji", emoji: e }} className="aspect-square border-transparent bg-transparent text-2xl">
                {e}
              </InsertTile>
            ))}
          </div>
        </>
      )}
      <PanelHeading>{query ? `Icons matching “${q}”` : "Icons"}</PanelHeading>
      {!icons ? (
        <p className="text-xs text-muted-foreground">Loading icons…</p>
      ) : iconNames.length ? (
        <div className="grid grid-cols-6 gap-1.5">
          {iconNames.map((n) => (
            <InsertTile key={n} title={n} payload={{ kind: "icon", icon: n }} className="aspect-square border-transparent">
              <IconPreview name={n} svg={iconNodeToSvg(icons[n], "#16132b", 2, 28)} />
            </InsertTile>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No icons found.</p>
      )}
      <p className="mt-4 text-[11px] text-muted-foreground">Icons: Lucide (ISC licence). All shapes and patterns are generated in-app.</p>
    </div>
  );
}
