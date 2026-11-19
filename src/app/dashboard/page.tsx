"use client";
import Link from "next/link";
import { ArrowRight, Sparkles, Shapes } from "lucide-react";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { ProjectGrid, ProjectGridSkeleton } from "@/components/dashboard/project-grid";
import { TemplateBrowser } from "@/components/dashboard/template-browser";
import { CreateDesignDialog } from "@/components/dashboard/create-design-dialog";
import { QuickCreate } from "@/components/dashboard/quick-create";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/misc";

export default function DashboardHome() {
  const { repo } = useRepo();
  const recent = useAsync(() => repo!.listProjects({ view: "recent", limit: 8 }), [repo]);
  const starred = useAsync(() => repo!.listProjects({ view: "starred", limit: 4 }), [repo]);
  const folders = useAsync(() => repo!.listFolders(), [repo]);
  const reload = () => {
    recent.reload();
    starred.reload();
  };

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white shadow-lift md:p-12">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> AI design assistant built in
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">What will you design today?</h1>
          <p className="mt-3 text-white/85 md:text-lg">Start from a template, a blank canvas, or describe your idea and let AI lay it out — every element stays editable.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CreateDesignDialog trigger={<Button size="lg" className="bg-white text-brand-700 hover:bg-white/90">Create a design</Button>} />
            <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" asChild>
              <Link href="/dashboard/templates">Browse templates</Link>
            </Button>
          </div>
        </div>
      </section>

      <QuickCreate />

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">Recent designs</h2>
          <Link href="/dashboard/projects" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recent.loading ? (
          <ProjectGridSkeleton count={4} />
        ) : recent.error ? (
          <ErrorState description={recent.error.message} onRetry={recent.reload} />
        ) : recent.data?.length ? (
          <ProjectGrid projects={recent.data} folders={folders.data ?? []} onChanged={reload} />
        ) : (
          <EmptyState icon={<Shapes />} title="No designs yet" description="Create your first design or start from one of the templates below." action={<CreateDesignDialog />} />
        )}
      </section>

      {!!starred.data?.length && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">Starred</h2>
          <ProjectGrid projects={starred.data} folders={folders.data ?? []} onChanged={reload} />
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">Suggested templates</h2>
          <Link href="/dashboard/templates" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            All templates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <TemplateBrowser limit={10} showFilters={false} />
      </section>
    </div>
  );
}
