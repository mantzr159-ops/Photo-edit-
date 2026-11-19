"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { ProjectGrid, ProjectGridSkeleton } from "@/components/dashboard/project-grid";
import { TemplateBrowser } from "@/components/dashboard/template-browser";
import { EmptyState } from "@/components/ui/misc";

function Inner() {
  const q = useSearchParams().get("q") ?? "";
  const { repo } = useRepo();
  const projects = useAsync(() => repo!.listProjects({ search: q }), [repo, q]);
  const folders = useAsync(() => repo!.listFolders(), [repo]);
  return (
    <div className="space-y-10">
      <h1 className="font-display text-2xl font-bold">Results for “{q}”</h1>
      <section>
        <h2 className="mb-4 font-semibold">Your designs</h2>
        {projects.loading ? <ProjectGridSkeleton count={4} /> : projects.data?.length ? (
          <ProjectGrid projects={projects.data} folders={folders.data ?? []} onChanged={projects.reload} />
        ) : (
          <EmptyState icon={<Search />} title="No matching designs" />
        )}
      </section>
      <section>
        <h2 className="mb-4 font-semibold">Templates</h2>
        <TemplateBrowser key={q} initialQuery={q} />
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
