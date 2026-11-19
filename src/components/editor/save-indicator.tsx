"use client";
import { Check, CloudOff, Loader2, AlertTriangle, HardDrive, Cloud } from "lucide-react";
import { useEditor } from "@/stores/editor-store";
import { Tooltip } from "@/components/ui/tooltip";
import { timeAgo } from "@/lib/utils/format";

export function SaveIndicator({ mode }: { mode: "local" | "cloud" }) {
  const status = useEditor((s) => s.saveStatus);
  const savedAt = useEditor((s) => s.lastSavedAt);
  const where = mode === "cloud" ? "cloud" : "this browser";
  const map = {
    idle: { icon: mode === "cloud" ? <Cloud /> : <HardDrive />, text: "", tip: `Saved to ${where}` },
    saved: { icon: <Check />, text: "Saved", tip: `All changes saved to ${where}${savedAt ? ` · ${timeAgo(savedAt)}` : ""}` },
    unsaved: { icon: <Loader2 className="opacity-0" />, text: "Unsaved", tip: "Changes will be saved automatically" },
    saving: { icon: <Loader2 className="animate-spin" />, text: "Saving…", tip: `Saving to ${where}` },
    error: { icon: <AlertTriangle className="text-amber-500" />, text: "Not saved", tip: "Save failed — retrying. A local recovery copy is kept." },
    offline: { icon: <CloudOff className="text-amber-500" />, text: "Offline", tip: "You’re offline. Changes are kept locally and will sync when you reconnect." },
  }[status];
  return (
    <Tooltip content={map.tip}>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5" data-testid="save-status" data-status={status}>
        {map.icon}
        <span className="hidden sm:inline">{map.text}</span>
      </span>
    </Tooltip>
  );
}
