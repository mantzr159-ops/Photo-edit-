"use client";
import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FolderClosed, Pencil, Shapes, Trash2 } from "lucide-react";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { ProjectGrid, ProjectGridSkeleton } from "@/components/dashboard/project-grid";
import { CreateDesignDialog } from "@/components/dashboard/create-design-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

function ProjectsInner() {
  const { repo } = useRepo();
  const router = useRouter();
  const params = useSearchParams();
  const folderId = params.get("folder");
  const folders = useAsync(() => repo!.listFolders(), [repo]);
  const projects = useAsync(() => repo!.listProjects({ view: "all", folderId: folderId ?? undefined }), [repo, folderId]);
  const folder = folders.data?.find((f) => f.id === folderId);
  const notify = () => window.dispatchEvent(new Event("lumora:folders-changed"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          {folder ? <FolderClosed className="h-6 w-6 text-brand-500" /> : null}
          {folder ? folder.name : "All projects"}
        </h1>
        {folder && (
          <div className="flex gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Rename folder"
              onClick={async () => {
                const n = window.prompt("Rename folder", folder.name);
                if (!n?.trim()) return;
                await repo!.renameFolder(folder.id, n.trim());
                folders.reload();
                notify();
              }}
            >
              <Pencil />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Delete folder"
              onClick={async () => {
                if (!window.confirm(`Delete folder “${folder.name}”? Designs inside are kept.`)) return;
                await repo!.deleteFolder(folder.id);
                toast.success("Folder deleted");
                notify();
                router.push("/dashboard/projects");
              }}
            >
              <Trash2 />
            </Button>
          </div>
        )}
        <div className="ml-auto">
          <CreateDesignDialog folderId={folderId} />
        </div>
      </div>
      {!folderId && !!folders.data?.length && (
        <div className="flex flex-wrap gap-2">
          {folders.data.map((f) => (
            <button key={f.id} onClick={() => router.push(`/dashboard/projects?folder=${f.id}`)} className={cn("inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium hover:bg-accent")}>
              <FolderClosed className="h-4 w-4 text-brand-500" /> {f.name}
            </button>
          ))}
        </div>
      )}
      {projects.loading ? (
        <ProjectGridSkeleton />
      ) : projects.error ? (
        <ErrorState description={projects.error.message} onRetry={projects.reload} />
      ) : projects.data?.length ? (
        <ProjectGrid projects={projects.data} folders={folders.data ?? []} onChanged={projects.reload} />
      ) : (
        <EmptyState icon={<Shapes />} title={folder ? "This folder is empty" : "No designs yet"} description={folder ? "Create a design here, or move existing designs into this folder." : "Your designs will appear here."} action={<CreateDesignDialog folderId={folderId} />} />
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectGridSkeleton />}>
      <ProjectsInner />
    </Suspense>
  );
}
