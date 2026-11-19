"use client";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/misc";

// The editor is client-only (canvas, IndexedDB, Konva).
const EditorApp = dynamic(() => import("@/components/editor/editor-app").then((m) => m.EditorApp), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center gap-3 text-muted-foreground">
      <Spinner className="h-5 w-5" /> Loading editor…
    </div>
  ),
});

export function EditorLoader({ id }: { id: string }) {
  return <EditorApp projectId={id} />;
}
