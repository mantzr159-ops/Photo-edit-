"use client";
import * as React from "react";
import { TEXT_PRESETS, type TextPresetId } from "@/lib/design/factory";
import { ensureFonts } from "@/lib/design/fonts";
import { insertPayload } from "@/lib/editor/insert";
import { createTextFromPreset } from "@/lib/design/factory";
import { useEditor } from "@/stores/editor-store";
import { measureTextWidth } from "@/lib/design/render";
import { Button } from "@/components/ui/button";
import { InsertTile, PanelHeading } from "./panel-ui";

const COMBOS: { heading: string; body: string; title: string; sub: string; accent?: string }[] = [
  { heading: "Playfair Display", body: "Inter", title: "Editorial Story", sub: "A refined serif with a clean sans" },
  { heading: "Bebas Neue", body: "Montserrat", title: "BIG ANNOUNCEMENT", sub: "Loud display for posters" },
  { heading: "Fraunces", body: "DM Sans", title: "Warm & Friendly", sub: "Soft serif, modern body" },
  { heading: "Space Grotesk", body: "Inter", title: "Future Forward", sub: "Technical and crisp" },
  { heading: "Great Vibes", body: "Cormorant Garamond", title: "Forever Yours", sub: "Elegant script pairing" },
  { heading: "Anton", body: "Poppins", title: "GAME DAY", sub: "Condensed impact headline" },
  { heading: "Caveat", body: "Nunito", title: "hello sunshine", sub: "Handwritten and casual" },
];

export function TextPanel() {
  React.useEffect(() => {
    void ensureFonts([...new Set(COMBOS.flatMap((c) => [c.heading, c.body]).concat(Object.values(TEXT_PRESETS).map((p) => p.props.fontFamily ?? "Inter")))]);
  }, []);

  const addCombo = (c: (typeof COMBOS)[number]) => {
    const doc = useEditor.getState().doc;
    if (!doc) return;
    const scale = Math.min(doc.width, doc.height) / 1080;
    const h = createTextFromPreset("heading", { text: c.title, fontFamily: c.heading, align: "center", fontSize: 96 * scale, fontWeight: c.heading === "Great Vibes" || c.heading === "Caveat" || c.heading === "Bebas Neue" || c.heading === "Anton" ? 400 : 800 });
    h.width = Math.min(doc.width * 0.85, measureTextWidth(h));
    const b = createTextFromPreset("body", { text: c.sub, fontFamily: c.body, align: "center", fontSize: 34 * scale, fill: "#4a4566" });
    b.width = Math.max(h.width, Math.min(doc.width * 0.8, measureTextWidth(b)));
    h.width = Math.max(h.width, b.width);
    const cx = doc.width / 2, cy = doc.height / 2;
    h.x = cx - h.width / 2;
    h.y = cy - 96 * scale;
    b.x = cx - b.width / 2;
    b.y = cy + 20 * scale;
    const gid = crypto.randomUUID();
    h.groupId = gid;
    b.groupId = gid;
    useEditor.getState().addElements([h, b]);
  };

  return (
    <div>
      <Button className="mb-4 w-full" variant="gradient" onClick={() => insertPayload({ kind: "text", preset: "body", text: "Your text here" })}>Add a text box</Button>
      <PanelHeading>Default text styles</PanelHeading>
      <div className="space-y-2">
        {(Object.keys(TEXT_PRESETS) as TextPresetId[]).map((id) => {
          const p = TEXT_PRESETS[id];
          const size = { heading: 26, subheading: 19, body: 14, caption: 11, quote: 17, decorative: 28 }[id];
          return (
            <InsertTile key={id} payload={{ kind: "text", preset: id }} className="w-full justify-start px-3 py-2.5 text-left" title={p.label}>
              <span
                className="truncate"
                style={{ fontFamily: `"${p.props.fontFamily}"`, fontSize: size, fontWeight: p.props.fontWeight, fontStyle: p.props.italic ? "italic" : undefined, letterSpacing: p.props.letterSpacing ? 2 : undefined, textTransform: p.props.textTransform === "uppercase" ? "uppercase" : undefined }}
              >
                {p.label}
              </span>
            </InsertTile>
          );
        })}
      </div>
      <PanelHeading>Font combinations</PanelHeading>
      <div className="grid grid-cols-2 gap-2">
        {COMBOS.map((c) => (
          <button key={c.title} onClick={() => addCombo(c)} className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border bg-card p-2 text-center transition hover:border-brand-300 hover:bg-accent">
            <span className="line-clamp-2 text-base leading-tight" style={{ fontFamily: `"${c.heading}"`, fontWeight: 700 }}>{c.title}</span>
            <span className="mt-1 line-clamp-1 text-[10px] text-muted-foreground" style={{ fontFamily: `"${c.body}"` }}>{c.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
