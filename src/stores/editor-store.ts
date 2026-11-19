"use client";
/**
 * Editor state (Zustand + Immer).
 *
 * History model: before every document mutation we push a snapshot of the
 * pages (structural sharing via Immer keeps this cheap). Rapid successive
 * edits with the same `historyKey` (e.g. slider drags, typing) are coalesced
 * into a single undo step.
 */
import { create } from "zustand";
import { produce, type Draft } from "immer";
import type { DesignElement, Page, PageBackground, ProjectDoc } from "@/lib/design/types";
import { cloneElement, clonePage, createPage } from "@/lib/design/factory";
import { alignDeltas, distributeDeltas, elementBounds, unionBounds, type AlignKind } from "@/lib/design/geometry";
import { uid } from "@/lib/utils/id";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error" | "offline";

type Snapshot = { pages: Page[]; width: number; height: number; activePageId: string };

const HISTORY_LIMIT = 100;
const COALESCE_MS = 900;

/** Text height measurement is injected by the canvas (needs the DOM). */
let measureText: (el: Extract<DesignElement, { type: "text" }>) => number | { width: number; height: number } = (el) => el.height;
export function registerTextMeasurer(fn: typeof measureText) {
  measureText = fn;
}

export interface EditorState {
  doc: ProjectDoc | null;
  activePageId: string;
  selectedIds: string[];
  editingTextId: string | null;
  hoveredId: string | null;
  zoom: number;
  fitZoom: number;
  showGrid: boolean;
  snapEnabled: boolean;
  previewMode: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  /** bumps whenever the document changes; used by autosave */
  version: number;
  past: Snapshot[];
  future: Snapshot[];
  lastHistoryKey: string | null;
  lastHistoryAt: number;
  clipboard: DesignElement[];

  // lifecycle
  load: (doc: ProjectDoc) => void;
  reset: () => void;
  setName: (name: string) => void;
  setSaveStatus: (s: SaveStatus, savedAt?: string) => void;

  // view
  setZoom: (z: number) => void;
  setFitZoom: (z: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setPreview: (v: boolean) => void;
  setHovered: (id: string | null) => void;

  // selection
  select: (ids: string[], opts?: { additive?: boolean; toggle?: boolean }) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setEditingText: (id: string | null) => void;

  // elements
  addElements: (els: DesignElement[], opts?: { select?: boolean; center?: boolean; pageId?: string }) => void;
  updateElement: (id: string, patch: Partial<DesignElement>, historyKey?: string | false) => void;
  updateElements: (ids: string[], patch: Partial<DesignElement> | ((el: Draft<DesignElement>) => void), historyKey?: string | false) => void;
  moveElements: (moves: { id: string; x: number; y: number }[]) => void;
  /** different patches per element in a single undo step */
  patchElements: (patches: { id: string; patch: Partial<DesignElement> }[], historyKey?: string | false) => void;
  /** re-measure text heights (after fonts load); not recorded in history */
  refitAllText: () => void;
  setRevision: (revision: number, updatedAt: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  paste: (elements?: DesignElement[]) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  toggleLockSelected: () => void;
  arrange: (dir: "forward" | "backward" | "front" | "back") => void;
  reorderElement: (id: string, toIndex: number) => void;
  align: (kind: AlignKind) => void;
  distribute: (axis: "horizontal" | "vertical") => void;
  nudge: (dx: number, dy: number) => void;
  flipSelected: (axis: "x" | "y") => void;

  // pages
  setActivePage: (id: string) => void;
  addPage: (afterId?: string, page?: Page) => void;
  duplicatePage: (id: string) => void;
  deletePage: (id: string) => void;
  movePage: (from: number, to: number) => void;
  renamePage: (id: string, name: string) => void;
  copySelectionToPage: (pageId: string) => void;
  setBackground: (patch: Partial<PageBackground>, pageId?: string, historyKey?: string) => void;
  applyBackgroundToAll: () => void;
  replacePages: (pages: Page[], size?: { width: number; height: number }) => void;
  appendPages: (pages: Page[]) => void;
  resizeDesign: (width: number, height: number, scaleContent: boolean) => void;

  // history
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const initialView = {
  doc: null as ProjectDoc | null,
  activePageId: "",
  selectedIds: [] as string[],
  editingTextId: null as string | null,
  hoveredId: null as string | null,
  zoom: 0.5,
  fitZoom: 0.5,
  previewMode: false,
  saveStatus: "idle" as SaveStatus,
  lastSavedAt: null as string | null,
  version: 0,
  past: [] as Snapshot[],
  future: [] as Snapshot[],
  lastHistoryKey: null as string | null,
  lastHistoryAt: 0,
};

export const useEditor = create<EditorState>()((set, get) => {
  /** Snapshot current doc into history (with coalescing). */
  const pushHistory = (key?: string | false) => {
    if (key === false) return;
    const s = get();
    if (!s.doc) return;
    const now = Date.now();
    if (key && key === s.lastHistoryKey && now - s.lastHistoryAt < COALESCE_MS) {
      set({ lastHistoryAt: now });
      return;
    }
    const snap: Snapshot = { pages: s.doc.pages, width: s.doc.width, height: s.doc.height, activePageId: s.activePageId };
    set({ past: [...s.past.slice(-HISTORY_LIMIT + 1), snap], future: [], lastHistoryKey: key ?? null, lastHistoryAt: now });
  };

  /** Apply an Immer recipe to the document and mark it dirty. */
  const mutate = (recipe: (doc: Draft<ProjectDoc>) => void, key?: string | false) => {
    const s = get();
    if (!s.doc) return;
    pushHistory(key);
    const next = produce(s.doc, recipe);
    if (next === s.doc) return;
    set({ doc: next, version: s.version + 1, saveStatus: "unsaved" });
  };

  const activePage = (doc: Draft<ProjectDoc> | ProjectDoc) => doc.pages.find((p) => p.id === get().activePageId) ?? doc.pages[0];

  /** Expand ids so selecting one member of a group selects the whole group. */
  const expandGroups = (ids: string[]) => {
    const doc = get().doc;
    if (!doc) return ids;
    const page = activePage(doc);
    const groups = new Set(page.elements.filter((e) => ids.includes(e.id) && e.groupId).map((e) => e.groupId));
    if (!groups.size) return ids;
    const all = new Set(ids);
    page.elements.forEach((e) => e.groupId && groups.has(e.groupId) && all.add(e.id));
    return page.elements.filter((e) => all.has(e.id)).map((e) => e.id);
  };

  const refitText = (el: Draft<DesignElement>) => {
    if (el.type === "text") {
      const m = measureText(el as Extract<DesignElement, { type: "text" }>);
      if (typeof m === "number") {
        if (m && Math.abs(m - el.height) > 0.5) el.height = m;
      } else if (Math.abs(m.width - el.width) > 0.5 || Math.abs(m.height - el.height) > 0.5) {
        // curved text: keep the box centred while its arc size changes
        el.x += (el.width - m.width) / 2;
        el.width = m.width;
        el.height = m.height;
      }
    }
  };

  return {
    ...initialView,
    showGrid: false,
    snapEnabled: true,
    clipboard: [],

    load: (doc) =>
      set({ ...initialView, doc, activePageId: doc.pages[0]?.id ?? "", saveStatus: "saved", lastSavedAt: doc.updatedAt }),
    reset: () => set({ ...initialView }),
    setName: (name) => {
      const s = get();
      if (!s.doc) return;
      set({ doc: { ...s.doc, name }, version: s.version + 1, saveStatus: "unsaved" });
    },
    setSaveStatus: (saveStatus, savedAt) => set(savedAt ? { saveStatus, lastSavedAt: savedAt } : { saveStatus }),

    setZoom: (z) => set({ zoom: Math.min(8, Math.max(0.05, z)) }),
    setFitZoom: (z) => set({ fitZoom: z }),
    toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
    setPreview: (previewMode) => set({ previewMode, selectedIds: [], editingTextId: null }),
    setHovered: (hoveredId) => set({ hoveredId }),

    select: (ids, opts) => {
      const cur = get().selectedIds;
      let next: string[];
      if (opts?.toggle) {
        const expanded = expandGroups(ids);
        const allIn = expanded.every((id) => cur.includes(id));
        next = allIn ? cur.filter((id) => !expanded.includes(id)) : [...new Set([...cur, ...expanded])];
      } else if (opts?.additive) next = expandGroups([...new Set([...cur, ...ids])]);
      else next = expandGroups(ids);
      set({ selectedIds: next, editingTextId: null });
    },
    selectAll: () => {
      const doc = get().doc;
      if (!doc) return;
      set({ selectedIds: activePage(doc).elements.filter((e) => !e.locked && !e.hidden).map((e) => e.id) });
    },
    clearSelection: () => set({ selectedIds: [], editingTextId: null }),
    setEditingText: (editingTextId) => set({ editingTextId }),

    addElements: (els, opts) => {
      const doc = get().doc;
      if (!doc || !els.length) return;
      const pageId = opts?.pageId ?? get().activePageId;
      mutate((d) => {
        const page = d.pages.find((p) => p.id === pageId) ?? d.pages[0];
        const placed = els.map((el) => {
          const copy = { ...el } as DesignElement;
          refitText(copy as Draft<DesignElement>);
          return copy;
        });
        if (opts?.center) {
          const b = unionBounds(placed.map(elementBounds))!;
          const dx = d.width / 2 - (b.x + b.width / 2);
          const dy = d.height / 2 - (b.y + b.height / 2);
          placed.forEach((p) => {
            p.x += dx;
            p.y += dy;
          });
        }
        page.elements.push(...(placed as Draft<DesignElement>[]));
      });
      if (opts?.select !== false) set({ selectedIds: els.map((e) => e.id), activePageId: pageId });
    },

    updateElement: (id, patch, historyKey) => get().updateElements([id], patch, historyKey),

    updateElements: (ids, patch, historyKey) => {
      if (!ids.length) return;
      mutate((d) => {
        for (const page of d.pages) {
          for (const el of page.elements) {
            if (!ids.includes(el.id)) continue;
            if (typeof patch === "function") patch(el);
            else Object.assign(el, patch);
            refitText(el);
          }
        }
      }, historyKey);
    },

    moveElements: (moves) => {
      mutate((d) => {
        const page = activePage(d);
        for (const m of moves) {
          const el = page.elements.find((e) => e.id === m.id);
          if (el) {
            el.x = m.x;
            el.y = m.y;
          }
        }
      });
    },

    patchElements: (patches, historyKey) => {
      if (!patches.length) return;
      const map = new Map(patches.map((p) => [p.id, p.patch]));
      mutate((d) => {
        for (const page of d.pages)
          for (const el of page.elements) {
            const patch = map.get(el.id);
            if (patch) {
              Object.assign(el, patch);
              refitText(el);
            }
          }
      }, historyKey);
    },

    refitAllText: () => {
      const s = get();
      if (!s.doc) return;
      const next = produce(s.doc, (d) => {
        d.pages.forEach((p) => p.elements.forEach((el) => refitText(el)));
      });
      if (next !== s.doc) set({ doc: next });
    },

    setRevision: (revision, updatedAt) => {
      const s = get();
      if (!s.doc) return;
      set({ doc: { ...s.doc, revision, updatedAt } });
    },

    deleteSelected: () => {
      const ids = get().selectedIds;
      if (!ids.length) return;
      mutate((d) => {
        const page = activePage(d);
        page.elements = page.elements.filter((e) => !ids.includes(e.id) || e.locked);
      });
      set({ selectedIds: [], editingTextId: null });
    },

    duplicateSelected: () => {
      const s = get();
      if (!s.doc || !s.selectedIds.length) return;
      const page = activePage(s.doc);
      const groupMap = new Map<string, string>();
      const copies = page.elements
        .filter((e) => s.selectedIds.includes(e.id))
        .map((e) => ({ ...cloneElement(e, groupMap), x: e.x + 24, y: e.y + 24, locked: false }));
      get().addElements(copies);
    },

    copySelected: () => {
      const s = get();
      if (!s.doc) return;
      const page = activePage(s.doc);
      const els = page.elements.filter((e) => s.selectedIds.includes(e.id));
      if (!els.length) return;
      set({ clipboard: structuredClone(els) });
      try {
        void navigator.clipboard?.writeText(JSON.stringify({ __lumora: 1, elements: els }));
      } catch {
        /* clipboard permission denied: in-memory clipboard still works */
      }
    },

    cutSelected: () => {
      get().copySelected();
      get().deleteSelected();
    },

    paste: (elements) => {
      const src = elements ?? get().clipboard;
      if (!src.length) return;
      const groupMap = new Map<string, string>();
      const copies = src.map((e) => ({ ...cloneElement(e, groupMap), x: e.x + 24, y: e.y + 24 }));
      get().addElements(copies);
      // next paste offsets again
      set({ clipboard: copies.map((c) => structuredClone(c)) });
    },

    groupSelected: () => {
      const ids = get().selectedIds;
      if (ids.length < 2) return;
      const gid = uid();
      get().updateElements(ids, { groupId: gid });
    },

    ungroupSelected: () => {
      const ids = get().selectedIds;
      get().updateElements(ids, { groupId: null });
    },

    toggleLockSelected: () => {
      const s = get();
      if (!s.doc) return;
      const page = activePage(s.doc);
      const els = page.elements.filter((e) => s.selectedIds.includes(e.id));
      const lock = !els.every((e) => e.locked);
      get().updateElements(s.selectedIds, { locked: lock });
    },

    arrange: (dir) => {
      const ids = get().selectedIds;
      if (!ids.length) return;
      mutate((d) => {
        const page = activePage(d);
        const els = page.elements;
        const selected = els.filter((e) => ids.includes(e.id));
        const rest = els.filter((e) => !ids.includes(e.id));
        if (dir === "front") page.elements = [...rest, ...selected];
        else if (dir === "back") page.elements = [...selected, ...rest];
        else if (dir === "forward") {
          for (let i = els.length - 2; i >= 0; i--) {
            if (ids.includes(els[i].id) && !ids.includes(els[i + 1].id)) [els[i], els[i + 1]] = [els[i + 1], els[i]];
          }
        } else {
          for (let i = 1; i < els.length; i++) {
            if (ids.includes(els[i].id) && !ids.includes(els[i - 1].id)) [els[i], els[i - 1]] = [els[i - 1], els[i]];
          }
        }
      });
    },

    reorderElement: (id, toIndex) => {
      mutate((d) => {
        const page = activePage(d);
        const from = page.elements.findIndex((e) => e.id === id);
        if (from < 0) return;
        const [el] = page.elements.splice(from, 1);
        page.elements.splice(Math.max(0, Math.min(page.elements.length, toIndex)), 0, el);
      });
    },

    align: (kind) => {
      const s = get();
      if (!s.doc || !s.selectedIds.length) return;
      const page = activePage(s.doc);
      const els = page.elements.filter((e) => s.selectedIds.includes(e.id) && !e.locked);
      // a single element or a single group aligns to the page
      const groupIds = new Set(els.map((e) => e.groupId ?? e.id));
      const toPage = groupIds.size === 1;
      const deltas = toPage
        ? (() => {
            const b = unionBounds(els.map(elementBounds))!;
            const pseudo = { x: b.x, y: b.y, width: b.width, height: b.height, rotation: 0 } as DesignElement;
            const [d] = alignDeltas([pseudo], kind, s.doc!, true);
            return els.map(() => d);
          })()
        : alignDeltas(els, kind, s.doc, false);
      mutate((d) => {
        const p = activePage(d);
        els.forEach((el, i) => {
          const t = p.elements.find((e) => e.id === el.id)!;
          t.x += deltas[i].dx;
          t.y += deltas[i].dy;
        });
      });
    },

    distribute: (axis) => {
      const s = get();
      if (!s.doc) return;
      const page = activePage(s.doc);
      const els = page.elements.filter((e) => s.selectedIds.includes(e.id) && !e.locked);
      const deltas = distributeDeltas(els, axis);
      mutate((d) => {
        const p = activePage(d);
        els.forEach((el, i) => {
          const t = p.elements.find((e) => e.id === el.id)!;
          t.x += deltas[i].dx;
          t.y += deltas[i].dy;
        });
      });
    },

    nudge: (dx, dy) => {
      const ids = get().selectedIds;
      if (!ids.length) return;
      mutate((d) => {
        const page = activePage(d);
        page.elements.forEach((e) => {
          if (ids.includes(e.id) && !e.locked) {
            e.x += dx;
            e.y += dy;
          }
        });
      }, "nudge");
    },

    flipSelected: (axis) => {
      get().updateElements(get().selectedIds, (el) => {
        if (axis === "x") el.flipX = !el.flipX;
        else el.flipY = !el.flipY;
      });
    },

    setActivePage: (id) => set({ activePageId: id, selectedIds: [], editingTextId: null }),

    addPage: (afterId, page) => {
      const p = page ?? createPage({ background: { ...activePage(get().doc!).background, image: null } });
      mutate((d) => {
        const idx = afterId ? d.pages.findIndex((x) => x.id === afterId) : d.pages.length - 1;
        d.pages.splice(idx + 1, 0, p as Draft<Page>);
      });
      set({ activePageId: p.id, selectedIds: [] });
    },

    duplicatePage: (id) => {
      const doc = get().doc;
      const src = doc?.pages.find((p) => p.id === id);
      if (!src) return;
      get().addPage(id, clonePage(src));
    },

    deletePage: (id) => {
      const doc = get().doc;
      if (!doc || doc.pages.length <= 1) return;
      const idx = doc.pages.findIndex((p) => p.id === id);
      mutate((d) => {
        d.pages = d.pages.filter((p) => p.id !== id);
      });
      const pages = get().doc!.pages;
      if (get().activePageId === id) set({ activePageId: pages[Math.max(0, idx - 1)].id, selectedIds: [] });
    },

    movePage: (from, to) => {
      mutate((d) => {
        if (to < 0 || to >= d.pages.length) return;
        const [p] = d.pages.splice(from, 1);
        d.pages.splice(to, 0, p);
      });
    },

    renamePage: (id, name) =>
      mutate((d) => {
        const p = d.pages.find((x) => x.id === id);
        if (p) p.name = name;
      }, "rename-page"),

    copySelectionToPage: (pageId) => {
      const s = get();
      if (!s.doc) return;
      const page = activePage(s.doc);
      const groupMap = new Map<string, string>();
      const copies = page.elements.filter((e) => s.selectedIds.includes(e.id)).map((e) => cloneElement(e, groupMap));
      get().addElements(copies, { pageId, select: false });
    },

    setBackground: (patch, pageId, historyKey) =>
      mutate((d) => {
        const p = d.pages.find((x) => x.id === (pageId ?? get().activePageId)) ?? d.pages[0];
        Object.assign(p.background, patch);
      }, historyKey),

    applyBackgroundToAll: () => {
      const doc = get().doc;
      if (!doc) return;
      const bg = activePage(doc).background;
      mutate((d) => {
        d.pages.forEach((p) => (p.background = structuredClone(bg) as Draft<PageBackground>));
      });
    },

    replacePages: (pages, size) => {
      mutate((d) => {
        d.pages = structuredClone(pages) as Draft<Page>[];
        if (size) {
          d.width = size.width;
          d.height = size.height;
        }
      });
      const keep = pages.some((p) => p.id === get().activePageId);
      set({ activePageId: keep ? get().activePageId : pages[0].id, selectedIds: [] });
    },

    appendPages: (pages) => {
      mutate((d) => {
        d.pages.push(...(structuredClone(pages) as Draft<Page>[]));
      });
      set({ activePageId: pages[0].id, selectedIds: [] });
    },

    resizeDesign: (width, height, scaleContent) => {
      const doc = get().doc;
      if (!doc) return;
      const sx = width / doc.width, sy = height / doc.height;
      const s = Math.min(sx, sy);
      mutate((d) => {
        if (scaleContent) {
          const ox = (width - doc.width * s) / 2, oy = (height - doc.height * s) / 2;
          d.pages.forEach((p) =>
            p.elements.forEach((e) => {
              e.x = e.x * s + ox;
              e.y = e.y * s + oy;
              e.width *= s;
              e.height *= s;
              if (e.type === "text") e.fontSize *= s;
              if (e.type === "shape" || e.type === "line") e.strokeWidth *= s;
            }),
          );
        }
        d.width = Math.round(width);
        d.height = Math.round(height);
      });
    },

    undo: () => {
      const s = get();
      if (!s.doc || !s.past.length) return;
      const prev = s.past[s.past.length - 1];
      const cur: Snapshot = { pages: s.doc.pages, width: s.doc.width, height: s.doc.height, activePageId: s.activePageId };
      set({
        doc: { ...s.doc, pages: prev.pages, width: prev.width, height: prev.height },
        activePageId: prev.pages.some((p) => p.id === s.activePageId) ? s.activePageId : prev.activePageId,
        past: s.past.slice(0, -1),
        future: [cur, ...s.future],
        version: s.version + 1,
        saveStatus: "unsaved",
        lastHistoryKey: null,
        selectedIds: s.selectedIds.filter((id) => prev.pages.some((p) => p.elements.some((e) => e.id === id))),
        editingTextId: null,
      });
    },

    redo: () => {
      const s = get();
      if (!s.doc || !s.future.length) return;
      const next = s.future[0];
      const cur: Snapshot = { pages: s.doc.pages, width: s.doc.width, height: s.doc.height, activePageId: s.activePageId };
      set({
        doc: { ...s.doc, pages: next.pages, width: next.width, height: next.height },
        activePageId: next.pages.some((p) => p.id === s.activePageId) ? s.activePageId : next.activePageId,
        past: [...s.past, cur],
        future: s.future.slice(1),
        version: s.version + 1,
        saveStatus: "unsaved",
        lastHistoryKey: null,
        selectedIds: s.selectedIds.filter((id) => next.pages.some((p) => p.elements.some((e) => e.id === id))),
      });
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});

/* ───────────── selectors (stable references avoid re-renders) ───────────── */

export const selectActivePage = (s: EditorState): Page | undefined =>
  s.doc?.pages.find((p) => p.id === s.activePageId) ?? s.doc?.pages[0];

export const selectSelectedElements = (s: EditorState): DesignElement[] => {
  const page = selectActivePage(s);
  if (!page) return [];
  return page.elements.filter((e) => s.selectedIds.includes(e.id));
};
