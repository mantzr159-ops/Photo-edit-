"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DESIGN_SIZES } from "@/lib/design/factory";
import { useRepo } from "@/components/providers/repository-provider";
import { newProject } from "@/lib/projects";
import { cn } from "@/lib/utils/cn";

export function CreateDesignDialog({ trigger, folderId }: { trigger?: React.ReactNode; folderId?: string | null }) {
  const { repo } = useRepo();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [w, setW] = React.useState(1080);
  const [h, setH] = React.useState(1080);
  const [busy, setBusy] = React.useState(false);
  const [q, setQ] = React.useState("");

  const create = async (width: number, height: number, name?: string, category?: string) => {
    if (!repo) return;
    if (!(width >= 16 && width <= 10000 && height >= 16 && height <= 10000)) {
      toast.error("Size must be between 16 and 10,000 px");
      return;
    }
    setBusy(true);
    try {
      const id = await newProject(repo, { width, height, name: name ? `Untitled – ${name}` : undefined, category, folderId });
      router.push(`/editor/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create design");
      setBusy(false);
    }
  };

  const sizes = DESIGN_SIZES.filter((s) => !q || s.label.toLowerCase().includes(q.toLowerCase()) || s.category.toLowerCase().includes(q.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="gradient">
            <Plus /> Create a design
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a design</DialogTitle>
          <DialogDescription>Pick a format or set a custom size. You can resize later.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search sizes (e.g. story, poster)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-3">
          {sizes.map((s) => {
            const ratio = s.width / s.height;
            return (
              <button
                key={s.id}
                disabled={busy}
                onClick={() => create(s.width, s.height, s.label, s.category)}
                className="group flex items-center gap-3 rounded-xl border p-3 text-left transition hover:border-brand-400 hover:bg-accent disabled:opacity-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <span className="block rounded-[3px] bg-brand-gradient opacity-80 group-hover:opacity-100" style={{ width: ratio >= 1 ? 36 : 36 * ratio, height: ratio >= 1 ? 36 / ratio : 36 }} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{s.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.width} × {s.height} px
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="rounded-xl border bg-muted/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Ruler className="h-4 w-4" /> Custom size
          </div>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void create(w, h, "Custom");
            }}
          >
            <div className="w-28 space-y-1">
              <Label htmlFor="cw">Width (px)</Label>
              <Input id="cw" type="number" min={16} max={10000} value={w} onChange={(e) => setW(Number(e.target.value))} />
            </div>
            <div className="w-28 space-y-1">
              <Label htmlFor="ch">Height (px)</Label>
              <Input id="ch" type="number" min={16} max={10000} value={h} onChange={(e) => setH(Number(e.target.value))} />
            </div>
            <Button type="submit" disabled={busy} className={cn("ml-auto")}>
              Create custom design
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
