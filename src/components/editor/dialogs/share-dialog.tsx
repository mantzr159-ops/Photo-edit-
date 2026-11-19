"use client";
import * as React from "react";
import { toast } from "sonner";
import { Copy, Globe, Lock, Pencil, Users } from "lucide-react";
import type { ShareVisibility } from "@/lib/design/types";
import { useRepo } from "@/components/providers/repository-provider";
import { useEditor } from "@/stores/editor-store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";

const OPTIONS: { id: ShareVisibility; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "private", label: "Private", desc: "Only you can open this design", icon: Lock },
  { id: "link_view", label: "Anyone with the link can view", desc: "Public read-only preview, no sign-in needed", icon: Globe },
  { id: "link_edit", label: "Anyone with the link can edit", desc: "Signed-in users who open the link become editors", icon: Pencil },
];

export function ShareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { repo, mode } = useRepo();
  const docId = useEditor((s) => s.doc?.id);
  const [info, setInfo] = React.useState<{ visibility: ShareVisibility; token: string | null } | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open || !repo || !docId) return;
    repo.getShare(docId).then(setInfo).catch(() => setInfo({ visibility: "private", token: null }));
  }, [open, repo, docId]);

  const set = async (v: ShareVisibility) => {
    if (!repo || !docId) return;
    setBusy(true);
    try {
      setInfo(await repo.setShare(docId, v));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update sharing");
    } finally {
      setBusy(false);
    }
  };

  const url = info?.token && typeof window !== "undefined" ? `${window.location.origin}/share/${info.token}` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share design</DialogTitle>
          <DialogDescription>Control who can see or edit this design.</DialogDescription>
        </DialogHeader>
        {mode === "local" ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p className="font-medium">Sharing needs cloud mode</p>
            <p className="mt-1 text-muted-foreground">This app is running in local mode (designs live in this browser). Connect Supabase to enable shareable view & edit links. Meanwhile you can download your design and send the file.</p>
          </div>
        ) : !info ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <>
            <div className="space-y-2">
              {OPTIONS.map((o) => (
                <button key={o.id} disabled={busy} onClick={() => void set(o.id)} className={cn("flex w-full items-start gap-3 rounded-xl border p-3 text-left hover:bg-accent", info.visibility === o.id && "border-brand-500 ring-2 ring-brand-500/20")}>
                  <o.icon className="mt-0.5 h-4 w-4 text-brand-500" />
                  <span>
                    <span className="block text-sm font-medium">{o.label}</span>
                    <span className="block text-xs text-muted-foreground">{o.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            {info.visibility !== "private" && url && (
              <div className="flex gap-2">
                <Input readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Share link" />
                <Button onClick={() => { void navigator.clipboard.writeText(url); toast.success("Link copied"); }}><Copy /> Copy</Button>
              </div>
            )}
            <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Real-time co-editing is not available yet. Editors save with conflict detection — if two people edit at once, the later save is asked to reload. Live cursors & presence are planned.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
