"use client";
/**
 * Editor root: loads the project, wires autosave/shortcuts and lays out the
 * workspace. Desktop gets the full four-panel layout; on small screens the
 * tool panels and inspector become bottom sheets with a touch-friendly nav.
 */
import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, SlidersHorizontal, X, Trash2, CopyPlus, Undo2, Redo2 } from "lucide-react";
import { useEditor } from "@/stores/editor-store";
import { useRepo } from "@/components/providers/repository-provider";
import { Spinner, ErrorState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { TopBar } from "./top-bar";
import { LeftPanel, PANELS, PanelContent, usePanelState, type PanelId } from "./left-panel";
import { Inspector } from "./inspector/inspector";
import { PageBar } from "./page-bar";
import { ExportDialog } from "./dialogs/export-dialog";
import { ShareDialog } from "./dialogs/share-dialog";
import { ResizeDialog } from "./dialogs/resize-dialog";
import { SaveTemplateDialog } from "./dialogs/save-template-dialog";
import { ShortcutsDialog } from "./dialogs/shortcuts-dialog";
import { readBackup, useAutosave, backupKey } from "./use-autosave";
import { useShortcuts } from "./use-shortcuts";
import { canvasApi } from "./canvas/canvas-api";
import { cn } from "@/lib/utils/cn";

const EditorCanvas = dynamic(() => import("./canvas/editor-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[hsl(var(--workspace))] text-muted-foreground">
      <Spinner className="h-5 w-5" />
    </div>
  ),
});

function useIsMobile() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const h = () => setM(mq.matches);
    h();
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return m;
}

function PreviewOverlay() {
  const pages = useEditor((s) => s.doc?.pages ?? []);
  const active = useEditor((s) => s.activePageId);
  const idx = pages.findIndex((p) => p.id === active);
  const s = useEditor.getState;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 text-sm shadow-lift backdrop-blur">
        <span className="font-medium">Preview</span>
        <button disabled={idx <= 0} onClick={() => s().setActivePage(pages[idx - 1].id)} className="rounded-full p-1 hover:bg-accent disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        <span className="tabular-nums text-muted-foreground">{idx + 1}/{pages.length}</span>
        <button disabled={idx >= pages.length - 1} onClick={() => s().setActivePage(pages[idx + 1].id)} className="rounded-full p-1 hover:bg-accent disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        <Button size="sm" variant="secondary" className="h-7 rounded-full" onClick={() => s().setPreview(false)}><X /> Exit</Button>
      </div>
    </div>
  );
}

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[62vh] flex-col rounded-t-2xl border-t bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <span className="mx-auto h-1 w-10 rounded-full bg-border absolute left-1/2 top-1.5 -translate-x-1/2" />
        <h2 className="font-display text-sm font-semibold">{title}</h2>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-accent" aria-label="Close"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">{children}</div>
    </div>
  );
}

export function EditorApp({ projectId }: { projectId: string }) {
  const { repo, status, mode } = useRepo();
  const router = useRouter();
  const doc = useEditor((s) => s.doc);
  const previewMode = useEditor((s) => s.previewMode);
  const hasSelection = useEditor((s) => s.selectedIds.length > 0);
  const [error, setError] = React.useState<string | null>(null);
  const isMobile = useIsMobile();
  const [panel, setPanel] = usePanelState(null);
  const [inspectorOpen, setInspectorOpen] = React.useState(() => typeof window === "undefined" || window.innerWidth >= 1280);
  const [mobileProps, setMobileProps] = React.useState(false);
  const [dialog, setDialog] = React.useState<null | "export" | "share" | "resize" | "template" | "shortcuts">(null);
  const saveNow = useAutosave(repo);

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?next=/editor/${projectId}`);
  }, [status, router, projectId]);

  /* load project (+ offer recovery of unsaved local changes) */
  React.useEffect(() => {
    if (!repo) return;
    let alive = true;
    useEditor.getState().reset();
    repo
      .getProject(projectId)
      .then((found) => {
        if (!alive) return;
        if (!found) return setError("This design doesn’t exist or you don’t have access to it.");
        if (found.summary.trashed) toast.info("This design is in the trash. Restore it from the dashboard to keep it.");
        useEditor.getState().load(found.doc);
        const backup = readBackup(projectId);
        if (backup && backup.doc.revision >= found.doc.revision && new Date(backup.at) > new Date(found.doc.updatedAt)) {
          toast("Unsaved changes found", {
            description: "We kept a recovery copy from your last session.",
            duration: 20000,
            action: {
              label: "Restore",
              onClick: () => {
                const st = useEditor.getState();
                st.replacePages(backup.doc.pages, { width: backup.doc.width, height: backup.doc.height });
                st.setName(backup.doc.name);
              },
            },
            cancel: { label: "Discard", onClick: () => localStorage.removeItem(backupKey(projectId)) },
          });
        }
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Could not load design"));
    return () => {
      alive = false;
    };
  }, [repo, projectId]);

  React.useEffect(() => {
    const h = () => setDialog("resize");
    window.addEventListener("lumora:open-resize", h);
    return () => window.removeEventListener("lumora:open-resize", h);
  }, []);

  React.useEffect(() => {
    if (doc?.name) document.title = `${doc.name} · Lumora Studio`;
  }, [doc?.name]);

  const onSave = React.useCallback(() => void saveNow(), [saveNow]);
  const onShortcuts = React.useCallback(() => setDialog("shortcuts"), []);
  useShortcuts({ onSave, onShortcuts, repo });

  // re-fit when the side panels change the available area
  React.useEffect(() => {
    const t = setTimeout(() => canvasApi.fit(), 220);
    return () => clearTimeout(t);
  }, [panel === null, inspectorOpen, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error)
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <ErrorState title="Can’t open this design" description={error} />
          <Button asChild variant="outline"><Link href="/dashboard"><ArrowLeft /> Back to dashboard</Link></Button>
        </div>
      </div>
    );

  if (!doc)
    return (
      <div className="flex h-screen items-center justify-center gap-3 text-muted-foreground">
        <Spinner className="h-5 w-5" /> Opening your design…
      </div>
    );

  const dialogs = (
    <>
      <ExportDialog open={dialog === "export"} onOpenChange={(v) => setDialog(v ? "export" : null)} />
      <ShareDialog open={dialog === "share"} onOpenChange={(v) => setDialog(v ? "share" : null)} />
      <ResizeDialog open={dialog === "resize"} onOpenChange={(v) => setDialog(v ? "resize" : null)} />
      <SaveTemplateDialog open={dialog === "template"} onOpenChange={(v) => setDialog(v ? "template" : null)} />
      <ShortcutsDialog open={dialog === "shortcuts"} onOpenChange={(v) => setDialog(v ? "shortcuts" : null)} />
    </>
  );

  const topBar = (
    <TopBar
      onExport={() => setDialog("export")}
      onShare={() => setDialog("share")}
      onResize={() => setDialog("resize")}
      onSaveTemplate={() => setDialog("template")}
      onShortcuts={() => setDialog("shortcuts")}
      onSaveNow={onSave}
      onToggleInspector={isMobile ? undefined : () => setInspectorOpen((v) => !v)}
    />
  );

  /* ───────────── mobile ───────────── */
  if (isMobile) {
    const s = useEditor.getState;
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden" data-mode={mode}>
        {topBar}
        <div className="relative min-h-0 flex-1">
          <EditorCanvas />
          {previewMode && <PreviewOverlay />}
          {hasSelection && !panel && !mobileProps && (
            <div className="absolute inset-x-2 bottom-2 z-20 flex items-center justify-around rounded-2xl border bg-background/95 p-1.5 shadow-lift backdrop-blur">
              <Button size="sm" variant="ghost" onClick={() => setMobileProps(true)}><SlidersHorizontal /> Edit</Button>
              <Button size="icon-sm" variant="ghost" onClick={() => s().duplicateSelected()} aria-label="Duplicate"><CopyPlus /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => s().undo()} aria-label="Undo"><Undo2 /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => s().redo()} aria-label="Redo"><Redo2 /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => s().deleteSelected()} aria-label="Delete"><Trash2 /></Button>
            </div>
          )}
          {panel && (
            <BottomSheet title={PANELS.find((p) => p.id === panel)!.label} onClose={() => setPanel(null)}>
              <PanelContent id={panel} />
            </BottomSheet>
          )}
          {mobileProps && (
            <BottomSheet title="Edit" onClose={() => setMobileProps(false)}>
              <div className="-mx-4"><Inspector /></div>
            </BottomSheet>
          )}
        </div>
        <PageBar />
        <nav className="flex shrink-0 justify-around overflow-x-auto border-t bg-card px-1 pb-[env(safe-area-inset-bottom)]" aria-label="Editor tools">
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => { setMobileProps(false); setPanel(panel === p.id ? null : (p.id as PanelId)); }}
              className={cn("flex min-w-[56px] flex-col items-center gap-0.5 px-1 py-2 text-[10px] text-muted-foreground", panel === p.id && "text-brand-600")}
            >
              <p.icon className="h-5 w-5" />
              {p.label}
            </button>
          ))}
        </nav>
        {dialogs}
      </div>
    );
  }

  /* ───────────── desktop / tablet ───────────── */
  return (
    <div className="flex h-screen flex-col overflow-hidden" data-mode={mode}>
      {!previewMode && topBar}
      <div className="flex min-h-0 flex-1">
        {!previewMode && <LeftPanel panel={panel} setPanel={setPanel} />}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <EditorCanvas />
            {previewMode && <PreviewOverlay />}
          </div>
          {!previewMode && <PageBar />}
        </div>
        {!previewMode && inspectorOpen && (
          <aside className="w-[288px] shrink-0 border-l bg-card max-xl:absolute max-xl:bottom-[76px] max-xl:right-0 max-xl:top-14 max-xl:z-20 max-xl:shadow-lift" aria-label="Properties">
            <Inspector />
          </aside>
        )}
      </div>
      {dialogs}
    </div>
  );
}
