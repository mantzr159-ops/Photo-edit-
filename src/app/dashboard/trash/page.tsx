"use client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { ProjectGrid, ProjectGridSkeleton } from "@/components/dashboard/project-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function TrashPage() {
  const { repo } = useRepo();
  const projects = useAsync(() => repo!.listProjects({ view: "trash" }), [repo]);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Trash</h1>
          <p className="text-sm text-muted-foreground">Restore designs or delete them permanently.</p>
        </div>
        {!!projects.data?.length && (
          <Button
            variant="destructive"
            className="ml-auto"
            onClick={async () => {
              if (!window.confirm("Permanently delete everything in the trash?")) return;
              await repo!.emptyTrash();
              toast.success("Trash emptied");
              projects.reload();
            }}
          >
            <Trash2 /> Empty trash
          </Button>
        )}
      </div>
      {projects.loading ? <ProjectGridSkeleton /> : projects.data?.length ? (
        <ProjectGrid projects={projects.data} folders={[]} onChanged={projects.reload} />
      ) : (
        <EmptyState icon={<Trash2 />} title="Trash is empty" description="Designs you delete show up here." />
      )}
    </div>
  );
}
