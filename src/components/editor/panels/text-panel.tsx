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
import { defaultEffect } from "@/lib/design/text-effects";
import type { TextElement } from "@/lib/design/types";

const ARABIC_STYLES: { label: string; preset: TextPresetId; text: string; props: Partial<TextElement> }[] = [
  { label: "عنوان رئيسي", preset: "heading", text: "عنوان رئيسي", props: { fontFamily: "Cairo", fontWeight: 800, fontSize: 96, align: "right", direction: "rtl", letterSpacing: 0, lineHeight: 1.3 } },
  { label: "عنوان فرعي", preset: "subheading", text: "عنوان فرعي", props: { fontFamily: "Tajawal", fontWeight: 700, fontSize: 56, align: "right", direction: "rtl", lineHeight: 1.4 } },
  { label: "نص عادي للفقرات", preset: "body", text: "أضف نصاً هنا لكتابة فقرة قصيرة", props: { fontFamily: "Almarai", fontWeight: 400, fontSize: 32, align: "right", direction: "rtl", lineHeight: 1.7 } },
  { label: "خط نسخ", preset: "quote", text: "«الإبداع هو الذكاء وهو يستمتع»", props: { fontFamily: "Amiri", fontWeight: 400, italic: false, fontSize: 52, align: "right", direction: "rtl", lineHeight: 1.6 } },
  { label: "خط رقعة", preset: "decorative", text: "مبارك", props: { fontFamily: "Aref Ruqaa", fontWeight: 700, fontSize: 110, align: "center", direction: "rtl", lineHeight: 1.4 } },
  { label: "خط كوفي", preset: "heading", text: "تخفيضات", props: { fontFamily: "Reem Kufi", fontWeight: 700, fontSize: 100, align: "center", direction: "rtl", letterSpacing: 0, lineHeight: 1.3 } },
  { label: "خط عريض", preset: "heading", text: "عرض خاص", props: { fontFamily: "Lalezar", fontWeight: 400, fontSize: 110, align: "center", direction: "rtl", letterSpacing: 0, lineHeight: 1.3 } },
];

const EFFECT_STYLES: { label: string; text: string; props: Partial<TextElement>; css: React.CSSProperties }[] = [
  { label: "Curved", text: "CURVED TEXT", props: { fontFamily: "Montserrat", fontWeight: 800, fontSize: 64, curve: 45, letterSpacing: 4 }, css: { fontFamily: '"Montserrat"', fontWeight: 800, letterSpacing: 2 } },
  { label: "Neon", text: "Neon Nights", props: { fontFamily: "Righteous", fontWeight: 400, fontSize: 96, fill: "#ffe6fa", effect: defaultEffect("neon") }, css: { fontFamily: '"Righteous"', color: "#ffe6fa", textShadow: "0 0 6px #ff3bd4, 0 0 12px #ff3bd4", background: "#1a0b2e" } },
  { label: "Hollow", text: "HOLLOW", props: { fontFamily: "Anton", fontWeight: 400, fontSize: 120, effect: defaultEffect("hollow") }, css: { fontFamily: '"Anton"', color: "transparent", WebkitTextStroke: "1.5px #16132b" } },
  { label: "Splice", text: "SPLICE", props: { fontFamily: "Archivo Black", fontWeight: 400, fontSize: 110, effect: defaultEffect("splice") }, css: { fontFamily: '"Archivo Black"', color: "transparent", WebkitTextStroke: "1.5px #16132b", textShadow: "3px 3px 0 #ffb4c8" } },
  { label: "Glitch", text: "GLITCH", props: { fontFamily: "Bungee", fontWeight: 400, fontSize: 100, effect: defaultEffect("glitch") }, css: { fontFamily: '"Bungee"', textShadow: "-3px 0 #00f0ff, 3px 0 #ff1f6b" } },
  { label: "Echo", text: "Echo", props: { fontFamily: "Poppins", fontWeight: 900, fontSize: 110, fill: "#7444ff", effect: { ...defaultEffect("echo")!, color: "#7444ff" } }, css: { fontFamily: '"Poppins"', fontWeight: 900, color: "#7444ff", textShadow: "3px 3px 0 rgba(116,68,255,.45), 6px 6px 0 rgba(116,68,255,.2)" } },
];

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
    void ensureFonts([
      ...new Set(
        COMBOS.flatMap((c) => [c.heading, c.body])
          .concat(Object.values(TEXT_PRESETS).map((p) => p.props.fontFamily ?? "Inter"))
          .concat(ARABIC_STYLES.map((a) => a.props.fontFamily!), EFFECT_STYLES.map((e) => e.props.fontFamily!)),
      ),
    ]);
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
      <PanelHeading>النصوص العربية · Arabic</PanelHeading>
      <div className="space-y-2" dir="rtl">
        {ARABIC_STYLES.map((a) => (
          <InsertTile key={a.label} payload={{ kind: "text", preset: a.preset, text: a.text, props: a.props }} className="w-full justify-start px-3 py-2.5 text-right" title={a.label}>
            <span className="truncate" style={{ fontFamily: `"${a.props.fontFamily}"`, fontSize: Math.min(26, (a.props.fontSize ?? 40) / 4), fontWeight: a.props.fontWeight }}>{a.label}</span>
          </InsertTile>
        ))}
      </div>
      <PanelHeading>Text effects</PanelHeading>
      <div className="grid grid-cols-2 gap-2">
        {EFFECT_STYLES.map((e) => (
          <InsertTile key={e.label} payload={{ kind: "text", preset: "heading", text: e.text, props: e.props }} className="aspect-[4/3] overflow-hidden p-1" title={`${e.label} text`}>
            <span className="flex h-full w-full items-center justify-center rounded-md text-xl" style={e.css}>{e.label === "Curved" ? "⌒ Curved" : e.label}</span>
          </InsertTile>
        ))}
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
