"use client";
import * as React from "react";
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignStartHorizontal, AlignStartVertical, ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine,
  ClipboardPaste, Copy, CopyPlus, FlipHorizontal, FlipVertical, Group, Lock, Scissors, Trash2, Ungroup, Unlock, Files,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu";
import { selectSelectedElements, useEditor } from "@/stores/editor-store";

const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

export function CanvasContextMenu({ children }: { children: React.ReactNode }) {
  const selected = useEditor(useShallow(selectSelectedElements));
  const pages = useEditor((s) => s.doc?.pages ?? []);
  const activePageId = useEditor((s) => s.activePageId);
  const clipboard = useEditor((s) => s.clipboard.length);
  const s = useEditor.getState;
  const has = selected.length > 0;
  const grouped = selected.some((e) => e.groupId);
  const allLocked = has && selected.every((e) => e.locked);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={!has} onSelect={() => s().copySelected()}><Copy /> Copy<ContextMenuShortcut>{mod}C</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled={!has} onSelect={() => s().cutSelected()}><Scissors /> Cut<ContextMenuShortcut>{mod}X</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled={!clipboard} onSelect={() => s().paste()}><ClipboardPaste /> Paste<ContextMenuShortcut>{mod}V</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled={!has} onSelect={() => s().duplicateSelected()}><CopyPlus /> Duplicate<ContextMenuShortcut>{mod}D</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled={!has} className="text-destructive" onSelect={() => s().deleteSelected()}><Trash2 /> Delete<ContextMenuShortcut>Del</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={!has} onSelect={() => s().arrange("forward")}><ArrowUp /> Bring forward<ContextMenuShortcut>{mod}]</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled={!has} onSelect={() => s().arrange("front")}><ArrowUpToLine /> Bring to front</ContextMenuItem>
        <ContextMenuItem disabled={!has} onSelect={() => s().arrange("backward")}><ArrowDown /> Send backward<ContextMenuShortcut>{mod}[</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled={!has} onSelect={() => s().arrange("back")}><ArrowDownToLine /> Send to back</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!has}><AlignCenterHorizontal /> Align</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={() => s().align("left")}><AlignStartVertical /> Left</ContextMenuItem>
            <ContextMenuItem onSelect={() => s().align("hcenter")}><AlignCenterVertical /> Center</ContextMenuItem>
            <ContextMenuItem onSelect={() => s().align("right")}><AlignEndVertical /> Right</ContextMenuItem>
            <ContextMenuItem onSelect={() => s().align("top")}><AlignStartHorizontal /> Top</ContextMenuItem>
            <ContextMenuItem onSelect={() => s().align("vcenter")}><AlignCenterHorizontal /> Middle</ContextMenuItem>
            <ContextMenuItem onSelect={() => s().align("bottom")}><AlignEndHorizontal /> Bottom</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        {grouped ? (
          <ContextMenuItem onSelect={() => s().ungroupSelected()}><Ungroup /> Ungroup<ContextMenuShortcut>{mod}⇧G</ContextMenuShortcut></ContextMenuItem>
        ) : (
          <ContextMenuItem disabled={selected.length < 2} onSelect={() => s().groupSelected()}><Group /> Group<ContextMenuShortcut>{mod}G</ContextMenuShortcut></ContextMenuItem>
        )}
        <ContextMenuItem disabled={!has} onSelect={() => s().toggleLockSelected()}>{allLocked ? <><Unlock /> Unlock</> : <><Lock /> Lock</>}<ContextMenuShortcut>{mod}L</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled={!has} onSelect={() => s().flipSelected("x")}><FlipHorizontal /> Flip horizontal</ContextMenuItem>
        <ContextMenuItem disabled={!has} onSelect={() => s().flipSelected("y")}><FlipVertical /> Flip vertical</ContextMenuItem>
        {pages.length > 1 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={!has}><Files /> Copy to page</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {pages.map((p, i) =>
                p.id === activePageId ? null : (
                  <ContextMenuItem key={p.id} onSelect={() => s().copySelectionToPage(p.id)}>
                    Page {i + 1}{p.name ? ` – ${p.name}` : ""}
                  </ContextMenuItem>
                ),
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
