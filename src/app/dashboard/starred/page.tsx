"use client";
import { Star } from "lucide-react";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { ProjectGrid, ProjectGridSkeleton } from "@/components/dashboard/project-grid";
import { EmptyState } from "@/components/ui/misc";

export default function StarredPage() {
  const { repo } = useRepo();
  const projects = useAsync(() => repo!.listProjects({ view: "starred" }), [repo]);
  const folders = useAsync(() => repo!.listFolders(), [repo]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Starred</h1>
      {projects.loading ? <ProjectGridSkeleton /> : projects.data?.length ? (
        <ProjectGrid projects={projects.data} folders={folders.data ?? []} onChanged={projects.reload} />
      ) : (
        <EmptyState icon={<Star />} title="Nothing starred yet" description="Star your favourite designs to find them quickly." />
      )}
    </div>
  );
}
