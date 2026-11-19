"use client";
/**
 * Autosave: debounced persistence of the document via the repository, with
 *  - optimistic-concurrency (revision) conflict handling
 *  - offline detection & retry
 *  - a local recovery copy (localStorage) written on every change and cleared after a successful save
 *  - periodic thumbnail generation for the dashboard
 */
import * as React from "react";
import { toast } from "sonner";
import { useEditor } from "@/stores/editor-store";
import type { DataRepository } from "@/lib/storage/types";
import { ConflictError } from "@/lib/storage/types";
import type { ProjectDoc } from "@/lib/design/types";

const DEBOUNCE = 1200;
const THUMB_EVERY = 8000;
export const backupKey = (id: string) => `lumora:recovery:${id}`;

export function readBackup(id: string): { doc: ProjectDoc; at: string } | null {
  try {
    const raw = localStorage.getItem(backupKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAutosave(repo: DataRepository | null) {
  const saving = React.useRef(false);
  const pending = React.useRef(false);
  const lastThumb = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const backupTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = React.useCallback(async (opts: { force?: boolean } = {}) => {
    const st = useEditor.getState();
    const doc = st.doc;
    if (!repo || !doc) return;
    if (saving.current) {
      pending.current = true;
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine && repo.mode === "cloud") {
      st.setSaveStatus("offline");
      return;
    }
    saving.current = true;
    const versionAtStart = st.version;
    st.setSaveStatus("saving");
    try {
      let thumb: string | null = null;
      if (Date.now() - lastThumb.current > THUMB_EVERY) {
        lastThumb.current = Date.now();
        const { renderThumbnail } = await import("@/lib/export/render-page");
        thumb = await renderThumbnail(doc, doc.pages[0], 480).catch(() => null);
      }
      const res = await repo.saveProject(opts.force ? { ...doc, revision: Number.MAX_SAFE_INTEGER } : doc, thumb);
      const now = useEditor.getState();
      now.setRevision(res.revision, res.updatedAt);
      if (now.version === versionAtStart) {
        now.setSaveStatus("saved", res.updatedAt);
        try {
          localStorage.removeItem(backupKey(doc.id));
        } catch {
          /* ignore */
        }
      } else {
        now.setSaveStatus("unsaved");
        pending.current = true;
      }
    } catch (e) {
      if (e instanceof ConflictError) {
        useEditor.getState().setSaveStatus("error");
        toast.error("This design was changed in another tab or by a collaborator.", {
          duration: Infinity,
          action: { label: "Keep my version", onClick: () => void saveNow({ force: true }) },
          cancel: { label: "Reload", onClick: () => window.location.reload() },
        });
      } else {
        console.error("[autosave]", e);
        useEditor.getState().setSaveStatus(navigator.onLine ? "error" : "offline");
        // retry later
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void saveNow(), 8000);
      }
    } finally {
      saving.current = false;
      if (pending.current) {
        pending.current = false;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void saveNow(), DEBOUNCE);
      }
    }
  }, [repo]);

  React.useEffect(() => {
    if (!repo) return;
    const unsub = useEditor.subscribe((s, prev) => {
      if (s.version === prev.version || !s.doc) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void saveNow(), DEBOUNCE);
      if (backupTimer.current) clearTimeout(backupTimer.current);
      backupTimer.current = setTimeout(() => {
        try {
          const d = useEditor.getState().doc;
          if (d) localStorage.setItem(backupKey(d.id), JSON.stringify({ doc: d, at: new Date().toISOString() }));
        } catch {
          /* quota exceeded: recovery copy is best-effort */
        }
      }, 400);
    });
    const online = () => {
      if (useEditor.getState().saveStatus === "offline" || useEditor.getState().saveStatus === "error") void saveNow();
    };
    const offline = () => useEditor.getState().setSaveStatus("offline");
    const beforeUnload = (e: BeforeUnloadEvent) => {
      const st = useEditor.getState().saveStatus;
      if (st === "unsaved" || st === "saving" || st === "error" || st === "offline") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      unsub();
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("beforeunload", beforeUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [repo, saveNow]);

  return saveNow;
}
