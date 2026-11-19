"use client";
import * as React from "react";
import { toast } from "sonner";
import { Trash2, UploadCloud } from "lucide-react";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { AssetImage } from "@/components/assets/asset-image";
import { UploadButton } from "@/components/assets/upload-button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { uploadImageFile } from "@/lib/assets";
import { insertPayload } from "@/lib/editor/insert";
import { useEditor } from "@/stores/editor-store";
import { DND_MIME } from "../canvas/canvas-api";
import { PanelSearch } from "./panel-ui";

export function UploadsPanel({ mode = "insert" }: { mode?: "insert" | "background" }) {
  const { repo } = useRepo();
  const [q, setQ] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);
  const assets = useAsync(() => repo!.listAssets(), [repo]);
  React.useEffect(() => {
    const h = () => assets.reload();
    window.addEventListener("lumora:assets-changed", h);
    return () => window.removeEventListener("lumora:assets-changed", h);
  }, [assets]);
  const list = (assets.data ?? []).filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()));

  const onDrop = async (files: FileList) => {
    if (!repo) return;
    for (const f of Array.from(files).slice(0, 20)) {
      try {
        await uploadImageFile(repo, f);
      } catch (e) {
        toast.error(`${f.name}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    assets.reload();
  };

  return (
    <div
      className="space-y-3"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        void onDrop(e.dataTransfer.files);
      }}
    >
      <UploadButton className="w-full" onUploaded={() => assets.reload()} />
      <div className={`rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground transition ${dragOver ? "border-brand-500 bg-brand-500/5" : ""}`}>
        <UploadCloud className="mx-auto mb-1 h-5 w-5" /> Drop images here · PNG, JPG, WebP, GIF, SVG · max 15 MB
      </div>
      <PanelSearch value={q} onChange={setQ} placeholder="Search uploads" />
      {assets.loading ? (
        <div className="grid grid-cols-2 gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
      ) : list.length ? (
        <div className="grid grid-cols-2 gap-2">
          {list.map((a) => (
            <div key={a.id} className="group relative">
              <button
                draggable
                onDragStart={(e) => e.dataTransfer.setData(DND_MIME, JSON.stringify({ kind: "image", src: a.src, width: a.width, height: a.height, name: a.name }))}
                onClick={() =>
                  mode === "background"
                    ? useEditor.getState().setBackground({ image: { src: a.src, fit: "cover", blur: 0, opacity: 1 } })
                    : insertPayload({ kind: "image", src: a.src, width: a.width, height: a.height, name: a.name })
                }
                className="checkerboard block aspect-square w-full overflow-hidden rounded-lg border transition hover:border-brand-400"
                title={a.name}
              >
                <AssetImage src={a.src} alt={a.name} className="h-full w-full object-cover" />
              </button>
              <button
                aria-label="Delete upload"
                onClick={async () => {
                  if (!window.confirm(`Delete “${a.name}”?`)) return;
                  await repo!.deleteAsset(a.id);
                  assets.reload();
                }}
                className="absolute right-1 top-1 rounded bg-background/90 p-1 opacity-0 shadow group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<UploadCloud />} title="No uploads yet" description="Upload images to use them in your designs." className="py-8" />
      )}
    </div>
  );
}
