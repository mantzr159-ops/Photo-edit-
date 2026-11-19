"use client";
import * as React from "react";
import type { TextElement } from "@/lib/design/types";
import { paintPrimary } from "@/lib/design/render";
import { resolveDirection } from "@/lib/design/fonts";
import { useEditor } from "@/stores/editor-store";

/** In-place text editing: a transparent textarea aligned exactly over the canvas text. */
export function TextEditorOverlay({ el, zoom, offset }: { el: TextElement; zoom: number; offset: { x: number; y: number } }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = React.useState(el.text);

  React.useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.focus();
    t.select();
  }, []);

  const finish = React.useCallback(() => {
    const s = useEditor.getState();
    s.setEditingText(null);
    if (!value.trim()) {
      s.select([el.id]);
      s.deleteSelected();
    }
  }, [value, el.id]);

  return (
    <textarea
      ref={ref}
      value={value}
      spellCheck
      dir={resolveDirection(value, el.direction)}
      aria-label="Edit text"
      onChange={(e) => {
        setValue(e.target.value);
        useEditor.getState().updateElement(el.id, { text: e.target.value }, `type:${el.id}`);
      }}
      onBlur={finish}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          finish();
        }
      }}
      style={{
        position: "absolute",
        left: offset.x + el.x * zoom,
        top: offset.y + (el.curve ? el.y + el.height / 2 - (el.fontSize * el.lineHeight) / 2 : el.y) * zoom,
        width: el.width * zoom,
        height: (el.curve ? el.fontSize * el.lineHeight : Math.max(el.height, el.fontSize * el.lineHeight)) * zoom + 4,
        fontFamily: `"${el.fontFamily}", sans-serif`,
        fontSize: el.fontSize * zoom,
        fontWeight: el.fontWeight,
        fontStyle: el.italic ? "italic" : "normal",
        lineHeight: el.lineHeight,
        letterSpacing: el.letterSpacing * zoom,
        textAlign: el.align === "justify" ? "justify" : el.align,
        textTransform: el.textTransform === "none" ? undefined : el.textTransform,
        textDecoration: [el.underline && "underline", el.strike && "line-through"].filter(Boolean).join(" ") || undefined,
        color: paintPrimary(el.fill),
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: "top left",
        background: el.curve ? "rgba(255,255,255,0.92)" : "transparent",
        border: "none",
        outline: "2px solid rgba(116,68,255,0.6)",
        outlineOffset: 2,
        padding: 0,
        margin: 0,
        resize: "none",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        caretColor: "#7444ff",
        zIndex: 10,
      }}
    />
  );
}
