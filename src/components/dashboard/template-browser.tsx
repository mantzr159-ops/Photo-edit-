"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { TEMPLATE_CATEGORIES, type TemplateCategory, type TemplateDef } from "@/lib/design/types";
import { BUILTIN_TEMPLATES, searchTemplates } from "@/lib/templates";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Spinner } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { newProjectFromTemplate } from "@/lib/projects";
import { PageThumb } from "./template-thumb";
import { cn } from "@/lib/utils/cn";

export function useTemplates() {
  const { repo } = useRepo();
  const user = useAsync(() => (repo ? repo.listUserTemplates() : Promise.resolve([])), [repo]);
  const favs = useAsync(() => (repo ? repo.listFavoriteTemplateIds() : Promise.resolve([])), [repo]);
  const all = React.useMemo(() => [...(user.data ?? []), ...BUILTIN_TEMPLATES], [user.data]);
  return { all, user, favs };
}

export function TemplateCard({ t, favorite, onOpen, onToggleFav }: { t: TemplateDef; favorite: boolean; onOpen: () => void; onToggleFav: () => void }) {
  return (
    <div className="group">
      <button onClick={onOpen} className="block w-full overflow-hidden rounded-xl border bg-[hsl(var(--workspace))] p-3 transition hover:shadow-lift">
        <div className="flex aspect-square items-center justify-center">
          <div className={cn("max-h-full overflow-hidden rounded-md shadow-soft", t.width >= t.height ? "w-full" : "h-full")} style={{ aspectRatio: `${t.width}/${t.height}` }}>
            <PageThumb cacheKey={`tpl:${t.id}`} page={t.pages[0]} width={t.width} height={t.height} className="h-full w-full" />
          </div>
        </div>
      </button>
      <div className="mt-2 flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <button onClick={onOpen} className="block max-w-full truncate text-left text-sm font-medium hover:underline">{t.name}</button>
          <p className="truncate text-xs text-muted-foreground">
            {t.category}
            {t.pages.length > 1 ? ` · ${t.pages.length} pages` : ""}
            {t.custom ? " · Mine" : ""}
          </p>
        </div>
        <button onClick={onToggleFav} className={cn("rounded-md p-1 hover:bg-accent", favorite ? "text-rose-500" : "text-muted-foreground")} aria-label={favorite ? "Remove favourite" : "Add favourite"}>
          <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
        </button>
      </div>
    </div>
  );
}

export function TemplatePreview({ t, open, onOpenChange, onDeleted }: { t: TemplateDef | null; open: boolean; onOpenChange: (v: boolean) => void; onDeleted?: () => void }) {
  const { repo } = useRepo();
  const router = useRouter();
  const [idx, setIdx] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => setIdx(0), [t?.id]);
  if (!t) return null;
  const use = async () => {
    if (!repo) return;
    setBusy(true);
    try {
      const id = await newProjectFromTemplate(repo, t);
      router.push(`/editor/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not use template");
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t.name}</DialogTitle>
          <DialogDescription>
            {t.category} · {t.width}×{t.height}px · {t.pages.length} page{t.pages.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="relative flex items-center justify-center rounded-xl bg-[hsl(var(--workspace))] p-6">
          <div className={cn("overflow-hidden rounded-md shadow-lift", t.width >= t.height ? "w-full max-w-xl" : "h-[52vh]")} style={{ aspectRatio: `${t.width}/${t.height}` }}>
            <PageThumb cacheKey={`tpl-lg:${t.id}:${idx}`} page={t.pages[idx]} width={t.width} height={t.height} maxSide={1000} className="h-full w-full" />
          </div>
          {t.pages.length > 1 && (
            <>
              <Button size="icon" variant="secondary" className="absolute left-3 rounded-full" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)} aria-label="Previous page"><ChevronLeft /></Button>
              <Button size="icon" variant="secondary" className="absolute right-3 rounded-full" disabled={idx === t.pages.length - 1} onClick={() => setIdx((i) => i + 1)} aria-label="Next page"><ChevronRight /></Button>
              <span className="absolute bottom-2 rounded-full bg-background/80 px-2 py-0.5 text-xs">{idx + 1} / {t.pages.length}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {t.tags.slice(0, 6).map((tag) => (
            <Badge key={tag} variant="outline">#{tag}</Badge>
          ))}
          <div className="ml-auto flex gap-2">
            {t.custom && repo && (
              <Button
                variant="outline"
                onClick={async () => {
                  if (!window.confirm("Delete this template?")) return;
                  await repo.deleteTemplate(t.id);
                  toast.success("Template deleted");
                  onOpenChange(false);
                  onDeleted?.();
                }}
              >
                <Trash2 /> Delete
              </Button>
            )}
            <Button variant="gradient" onClick={use} disabled={busy}>
              {busy ? <Spinner /> : null} Use this template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateBrowser({ initialCategory = "All", limit, showFilters = true, initialQuery = "" }: { initialCategory?: TemplateCategory | "All"; limit?: number; showFilters?: boolean; initialQuery?: string }) {
  const { repo } = useRepo();
  const { all, user, favs } = useTemplates();
  const [cat, setCat] = React.useState<TemplateCategory | "All" | "Favorites" | "Mine">(initialCategory);
  const [q, setQ] = React.useState(initialQuery);
  const [preview, setPreview] = React.useState<TemplateDef | null>(null);
  const favSet = new Set(favs.data ?? []);

  let list = cat === "Favorites" ? all.filter((t) => favSet.has(t.id)) : cat === "Mine" ? all.filter((t) => t.custom) : all;
  list = searchTemplates(list, q, cat === "Favorites" || cat === "Mine" ? "All" : cat);
  if (limit) list = list.slice(0, limit);

  const toggleFav = async (t: TemplateDef) => {
    if (!repo) return;
    const next = !favSet.has(t.id);
    await repo.setTemplateFavorite(t.id, next);
    favs.setData(next ? [...favSet, t.id] : [...favSet].filter((x) => x !== t.id));
  };

  return (
    <div className="space-y-5">
      {showFilters && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" className="pl-9" aria-label="Search templates" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {(["All", "Favorites", "Mine", ...TEMPLATE_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:bg-accent", cat === c && "border-transparent bg-foreground text-background hover:bg-foreground")}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}
      {list.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {list.map((t) => (
            <TemplateCard key={t.id} t={t} favorite={favSet.has(t.id)} onOpen={() => setPreview(t)} onToggleFav={() => void toggleFav(t)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Search />} title="No templates found" description={cat === "Mine" ? "Save any design as a template from the editor's File menu." : "Try a different search or category."} />
      )}
      <TemplatePreview t={preview} open={!!preview} onOpenChange={(v) => !v && setPreview(null)} onDeleted={() => user.reload()} />
    </div>
  );
}
