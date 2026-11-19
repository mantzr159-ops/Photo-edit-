"use client";
import * as React from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { useRepo } from "@/components/providers/repository-provider";
import { uploadImageFile } from "@/lib/assets";
import type { Asset } from "@/lib/design/types";

export function UploadButton({ onUploaded, folder, className, label = "Upload files" }: { onUploaded?: (a: Asset[]) => void; folder?: string | null; className?: string; label?: string }) {
  const { repo } = useRepo();
  const ref = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const handle = async (files: FileList | null) => {
    if (!files?.length || !repo) return;
    setBusy(true);
    const ok: Asset[] = [];
    for (const f of Array.from(files).slice(0, 20)) {
      try {
        ok.push(await uploadImageFile(repo, f, { folder }));
      } catch (e) {
        toast.error(`${f.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    if (ok.length) toast.success(`Uploaded ${ok.length} file${ok.length > 1 ? "s" : ""}`);
    onUploaded?.(ok);
    setBusy(false);
    if (ref.current) ref.current.value = "";
  };
  return (
    <>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" multiple hidden onChange={(e) => void handle(e.target.files)} />
      <Button className={className} onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? <Spinner /> : <Upload />} {label}
      </Button>
    </>
  );
}
