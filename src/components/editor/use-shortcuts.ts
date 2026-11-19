"use client";
import * as React from "react";
import { toast } from "sonner";
import { useEditor } from "@/stores/editor-store";
import { canvasApi } from "./canvas/canvas-api";
import { insertPayload } from "@/lib/editor/insert";
import type { DataRepository } from "@/lib/storage/types";
import { uploadImageFile } from "@/lib/assets";
import type { DesignElement } from "@/lib/design/types";

function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el?.closest?.("input, textarea, select, [contenteditable=true]");
}

/** Global editor keyboard shortcuts + clipboard paste (elements, images, plain text). */
export function useShortcuts(opts: { onSave: () => void; onShortcuts: () => void; repo: DataRepository | null }) {
  const { onSave, onShortcuts, repo } = opts;
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const s = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (s.previewMode) {
        if (k === "escape") s.setPreview(false);
        return;
      }
      if (s.editingTextId) return;
      const handled = () => e.preventDefault();

      if (mod && k === "z") return handled(), e.shiftKey ? s.redo() : s.undo();
      if (mod && k === "y") return handled(), s.redo();
      if (mod && k === "s") return handled(), onSave();
      if (mod && k === "c") return s.selectedIds.length ? (handled(), s.copySelected()) : undefined;
      if (mod && k === "x") return s.selectedIds.length ? (handled(), s.cutSelected()) : undefined;
      if (mod && k === "d") return handled(), s.duplicateSelected();
      if (mod && k === "a") return handled(), s.selectAll();
      if (mod && k === "g") return handled(), e.shiftKey ? s.ungroupSelected() : s.groupSelected();
      if (mod && k === "l") return handled(), s.toggleLockSelected();
      if (mod && (k === "]" || k === "}")) return handled(), s.arrange(e.shiftKey ? "front" : "forward");
      if (mod && (k === "[" || k === "{")) return handled(), s.arrange(e.shiftKey ? "back" : "backward");
      if (mod && (k === "=" || k === "+")) return handled(), canvasApi.zoomTo(s.zoom * 1.25);
      if (mod && k === "-") return handled(), canvasApi.zoomTo(s.zoom / 1.25);
      if (mod && k === "0") return handled(), canvasApi.fit();
      if (mod) return;

      if (k === "delete" || k === "backspace") return handled(), s.deleteSelected();
      if (k === "escape") return s.clearSelection();
      if (k === "?") return onShortcuts();
      if (k === "enter" && s.selectedIds.length === 1) {
        const el = s.doc?.pages.find((p) => p.id === s.activePageId)?.elements.find((x) => x.id === s.selectedIds[0]);
        if (el?.type === "text" && !el.locked) return handled(), s.setEditingText(el.id);
      }
      const step = e.shiftKey ? 10 : 1;
      if (k === "arrowleft") return handled(), s.nudge(-step, 0);
      if (k === "arrowright") return handled(), s.nudge(step, 0);
      if (k === "arrowup") return handled(), s.nudge(0, -step);
      if (k === "arrowdown") return handled(), s.nudge(0, step);
      if (k === "t") return handled(), insertPayload({ kind: "text", preset: "body", text: "Your text here" });
      if (k === "r") return handled(), insertPayload({ kind: "shape", shape: "rect" });
      if (k === "c") return handled(), insertPayload({ kind: "shape", shape: "ellipse" });
      if (k === "l") return handled(), insertPayload({ kind: "line" });
    };

    const onPaste = async (e: ClipboardEvent) => {
      if (isTyping(e.target)) return;
      const s = useEditor.getState();
      if (!s.doc || s.previewMode) return;
      const items = Array.from(e.clipboardData?.items ?? []);
      const file = items.find((i) => i.kind === "file" && i.type.startsWith("image/"))?.getAsFile();
      if (file && repo) {
        e.preventDefault();
        try {
          const a = await uploadImageFile(repo, file, { name: file.name || "pasted-image" });
          insertPayload({ kind: "image", src: a.src, width: a.width, height: a.height, name: a.name });
          window.dispatchEvent(new Event("lumora:assets-changed"));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Paste failed");
        }
        return;
      }
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed?.__lumora === 1 && Array.isArray(parsed.elements)) {
            e.preventDefault();
            s.paste(parsed.elements as DesignElement[]);
            return;
          }
        } catch {
          /* not our JSON */
        }
        e.preventDefault();
        if (s.clipboard.length && !text.trim()) return s.paste();
        insertPayload({ kind: "text", preset: "body", text: text.slice(0, 5000) });
        return;
      }
      if (s.clipboard.length) {
        e.preventDefault();
        s.paste();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
    };
  }, [onSave, onShortcuts, repo]);
}
