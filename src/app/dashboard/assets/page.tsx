"use client";
import * as React from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Search, Trash2, FolderClosed, FolderPlus } from "lucide-react";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { AssetImage } from "@/components/assets/asset-image";
import { UploadButton } from "@/components/assets/upload-button";
import { Input } from "@/components/ui/input";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { formatBytes, timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function AssetsPage() {
  const { repo } = useRepo();
  const [q, setQ] = React.useState("");
  const [folder, setFolder] = React.useState<string | null | undefined>(undefined);
  const all = useAsync(() => repo!.listAssets(), [repo]);
  const folders = [...new Set((all.data ?? []).map((a) => a.folder).filter(Boolean))] as string[];
  const [extraFolders, setExtraFolders] = React.useState<string[]>([]);
  const list = (all.data ?? []).filter((a) => (folder === undefined || (a.folder ?? null) === folder) && (!q || a.name.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Uploads</h1>
          <p className="text-sm text-muted-foreground">Your images are reusable across every project. PNG, JPEG, WebP, GIF and sanitised SVG up to 15 MB.</p>
        </div>
        <div className="ml-auto">
          <UploadButton folder={folder ?? null} onUploaded={() => all.reload()} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search uploads" className="pl-9" />
        </div>
        {[undefined, null, ...new Set([...folders, ...extraFolders])].map((f) => (
          <button
            key={String(f)}
            onClick={() => setFolder(f)}
            className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent", folder === f && "bg-foreground text-background hover:bg-foreground")}
          >
            {f ? <FolderClosed className="h-3.5 w-3.5" /> : null}
            {f === undefined ? "All" : f === null ? "Unfiled" : f}
          </button>
        ))}
        <button
          className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
          onClick={() => {
            const n = window.prompt("New upload folder name")?.trim();
            if (n) {
              setExtraFolders((x) => [...x, n.slice(0, 60)]);
              setFolder(n.slice(0, 60));
            }
          }}
        >
          <FolderPlus className="h-3.5 w-3.5" /> New folder
        </button>
      </div>
      {all.loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
      ) : list.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {list.map((a) => (
            <div key={a.id} className="group relative overflow-hidden rounded-xl border bg-card">
              <div className="checkerboard aspect-square">
                <AssetImage src={a.src} alt={a.name} className="h-full w-full object-contain" />
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium">{a.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatBytes(a.size)} · {timeAgo(a.createdAt)}</p>
              </div>
              {a.source !== "upload" && <Badge variant="brand" className="absolute left-2 top-2">{a.source === "ai" ? "AI" : "Photo"}</Badge>}
              <button
                className="absolute right-2 top-2 rounded-md bg-background/90 p-1.5 opacity-0 shadow transition hover:text-destructive group-hover:opacity-100"
                aria-label="Delete asset"
                onClick={async () => {
                  if (!window.confirm(`Delete “${a.name}”? Designs that use it will show a placeholder.`)) return;
                  await repo!.deleteAsset(a.id);
                  toast.success("Deleted");
                  all.reload();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<ImageIcon />} title="No uploads here" description="Upload images to reuse them in any design." action={<UploadButton folder={folder ?? null} onUploaded={() => all.reload()} />} />
      )}
    </div>
  );
}
