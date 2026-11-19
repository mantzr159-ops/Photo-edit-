"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, FolderInput, MoreHorizontal, Pencil, RotateCcw, Star, Trash2, ExternalLink, FolderX } from "lucide-react";
import type { Folder, ProjectSummary } from "@/lib/design/types";
import { useRepo } from "@/components/providers/repository-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/misc";
import { timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function ProjectGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ProjectCard({ p, folders, onChanged }: { p: ProjectSummary; folders: Folder[]; onChanged: () => void }) {
  const { repo } = useRepo();
  const act = async (fn: () => Promise<unknown>, msg?: string) => {
    try {
      await fn();
      if (msg) toast.success(msg);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };
  if (!repo) return null;
  const ratio = p.width / p.height;

  return (
    <div className="group relative">
      <Link
        href={p.trashed ? "#" : `/editor/${p.id}`}
        onClick={(e) => p.trashed && e.preventDefault()}
        className={cn("block overflow-hidden rounded-xl border bg-muted/40 transition hover:shadow-lift", p.trashed && "cursor-default opacity-70")}
      >
        <div className="flex aspect-[4/3] items-center justify-center bg-[hsl(var(--workspace))] p-3">
          {p.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.thumbnail} alt="" className="max-h-full max-w-full rounded-sm object-contain shadow-soft" style={{ aspectRatio: ratio }} />
          ) : (
            <div className="rounded-sm bg-white shadow-soft dark:bg-white/90" style={{ aspectRatio: ratio, height: ratio < 1.33 ? "100%" : undefined, width: ratio >= 1.33 ? "100%" : undefined }} />
          )}
        </div>
      </Link>
      <div className="mt-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{p.name}</p>
          <p className="text-xs text-muted-foreground">
            {p.width}×{p.height} · {p.pageCount} page{p.pageCount === 1 ? "" : "s"} · {timeAgo(p.updatedAt)}
          </p>
        </div>
        {!p.trashed && (
          <button
            onClick={() => act(() => repo.updateProjectMeta(p.id, { starred: !p.starred }))}
            className={cn("rounded-md p-1 transition hover:bg-accent", p.starred ? "text-amber-500" : "text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100")}
            aria-label={p.starred ? "Unstar" : "Star"}
          >
            <Star className={cn("h-4 w-4", p.starred && "fill-current")} />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md p-1 text-muted-foreground hover:bg-accent" aria-label="Project actions">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {p.trashed ? (
              <>
                <DropdownMenuItem onClick={() => act(() => repo.updateProjectMeta(p.id, { trashed: false }), "Restored")}><RotateCcw /> Restore</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => window.confirm(`Delete “${p.name}” forever? This cannot be undone.`) && act(() => repo.deleteProjectForever(p.id), "Deleted permanently")}
                >
                  <Trash2 /> Delete forever
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild><Link href={`/editor/${p.id}`}><ExternalLink /> Open</Link></DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const name = window.prompt("Rename design", p.name);
                    if (name?.trim()) void act(() => repo.updateProjectMeta(p.id, { name: name.trim() }), "Renamed");
                  }}
                >
                  <Pencil /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => act(() => repo.duplicateProject(p.id), "Duplicated")}><Copy /> Duplicate</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger><FolderInput /> Move to folder</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {folders.map((f) => (
                      <DropdownMenuItem key={f.id} onClick={() => act(() => repo.updateProjectMeta(p.id, { folderId: f.id }), `Moved to ${f.name}`)}>
                        {f.name}
                      </DropdownMenuItem>
                    ))}
                    {!folders.length && <DropdownMenuItem disabled>No folders — create one in the sidebar</DropdownMenuItem>}
                    {p.folderId && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => act(() => repo.updateProjectMeta(p.id, { folderId: null }), "Removed from folder")}><FolderX /> Remove from folder</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => act(() => repo.updateProjectMeta(p.id, { trashed: true }), "Moved to trash")}>
                  <Trash2 /> Move to trash
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function ProjectGrid({ projects, folders, onChanged }: { projects: ProjectSummary[]; folders: Folder[]; onChanged: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {projects.map((p) => (
        <ProjectCard key={p.id} p={p} folders={folders} onChanged={onChanged} />
      ))}
    </div>
  );
}
