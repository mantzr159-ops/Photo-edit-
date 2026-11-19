"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Copy, Download, Eye, FilePlus2, Grid3x3, Keyboard, LayoutTemplate, Magnet, Maximize2, Redo2, Share2, Undo2, Save, PanelRight } from "lucide-react";
import { useEditor } from "@/stores/editor-store";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ThemeMenuItems } from "@/components/dashboard/shell";
import { useRepo } from "@/components/providers/repository-provider";
import { SaveIndicator } from "./save-indicator";
import { canvasApi } from "./canvas/canvas-api";

export function TopBar({ onExport, onShare, onResize, onSaveTemplate, onShortcuts, onSaveNow, onToggleInspector }: {
  onExport: () => void; onShare: () => void; onResize: () => void; onSaveTemplate: () => void; onShortcuts: () => void; onSaveNow: () => void; onToggleInspector?: () => void;
}) {
  const name = useEditor((s) => s.doc?.name ?? "");
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const zoom = useEditor((s) => s.zoom);
  const showGrid = useEditor((s) => s.showGrid);
  const snap = useEditor((s) => s.snapEnabled);
  const { repo, mode } = useRepo();
  const router = useRouter();
  const [draft, setDraft] = React.useState(name);
  React.useEffect(() => setDraft(name), [name]);
  const s = useEditor.getState;

  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b bg-card px-2 md:gap-2 md:px-3">
      <Tooltip content="Back to home">
        <Link href="/dashboard" className="rounded-lg p-1 transition hover:bg-accent" aria-label="Back to dashboard"><LogoMark className="h-7 w-7" /></Link>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">File <ChevronDown className="h-3 w-3" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuItem onClick={() => router.push("/dashboard?create=1")}><FilePlus2 /> New design</DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              if (!repo) return;
              onSaveNow();
              const id = s().doc!.id;
              try {
                const copy = await repo.duplicateProject(id);
                toast.success("Copy created", { action: { label: "Open", onClick: () => router.push(`/editor/${copy.id}`) } });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Copy failed");
              }
            }}
          >
            <Copy /> Make a copy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSaveNow}><Save /> Save now<span className="ml-auto text-xs text-muted-foreground">⌘S</span></DropdownMenuItem>
          <DropdownMenuItem onClick={onSaveTemplate}><LayoutTemplate /> Save as template</DropdownMenuItem>
          <DropdownMenuItem onClick={onResize}><Maximize2 /> Resize design</DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}><Download /> Download</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => s().toggleGrid()}><Grid3x3 /> {showGrid ? "Hide" : "Show"} grid</DropdownMenuItem>
          <DropdownMenuItem onClick={() => s().toggleSnap()}><Magnet /> {snap ? "Disable" : "Enable"} snapping</DropdownMenuItem>
          <DropdownMenuItem onClick={onShortcuts}><Keyboard /> Keyboard shortcuts<span className="ml-auto text-xs text-muted-foreground">?</span></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <ThemeMenuItems />
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="mx-1 hidden h-5 w-px bg-border md:block" />
      <Tooltip content="Undo (⌘Z)"><Button variant="ghost" size="icon-sm" disabled={!canUndo} onClick={() => s().undo()} aria-label="Undo"><Undo2 /></Button></Tooltip>
      <Tooltip content="Redo (⌘⇧Z)"><Button variant="ghost" size="icon-sm" disabled={!canRedo} onClick={() => s().redo()} aria-label="Redo"><Redo2 /></Button></Tooltip>
      <SaveIndicator mode={mode} />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const v = draft.trim().slice(0, 200) || "Untitled design";
          if (v !== name) s().setName(v);
          setDraft(v);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="mx-auto w-28 min-w-0 truncate rounded-md bg-transparent px-2 py-1 text-center text-sm font-medium outline-none hover:bg-accent focus:bg-accent focus:ring-2 focus:ring-ring sm:w-64"
        aria-label="Design name"
      />
      <span className="hidden w-12 text-right text-xs tabular-nums text-muted-foreground lg:inline">{Math.round(zoom * 100)}%</span>
      <Tooltip content="Fit to screen"><Button variant="ghost" size="icon-sm" className="hidden md:inline-flex" onClick={() => canvasApi.fit()} aria-label="Fit"><Maximize2 /></Button></Tooltip>
      <Tooltip content="Preview"><Button variant="ghost" size="icon-sm" onClick={() => s().setPreview(true)} aria-label="Preview"><Eye /></Button></Tooltip>
      {onToggleInspector && <Button variant="ghost" size="icon-sm" className="xl:hidden" onClick={onToggleInspector} aria-label="Toggle properties"><PanelRight /></Button>}
      <Button variant="outline" size="sm" onClick={onShare} className="hidden sm:inline-flex"><Share2 /> Share</Button>
      <Button variant="gradient" size="sm" onClick={onExport} data-testid="export-open"><Download /> <span className="hidden sm:inline">Download</span></Button>
    </header>
  );
}
