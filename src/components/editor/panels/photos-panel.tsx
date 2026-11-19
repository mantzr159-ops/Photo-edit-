"use client";
import * as React from "react";
import { insertPayload } from "@/lib/editor/insert";
import { useEditor } from "@/stores/editor-store";
import { Skeleton } from "@/components/ui/misc";
import { DND_MIME } from "../canvas/canvas-api";
import { PanelSearch } from "./panel-ui";

type Photo = { id: string; thumb: string; full: string; width: number; height: number; title: string; attribution: string; license: string };

const SUGGESTIONS = ["nature", "office", "coffee", "city", "doctor", "abstract", "students", "food", "travel", "technology"];

export function PhotosPanel() {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Photo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [provider, setProvider] = React.useState<string>("");

  const search = React.useCallback(async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/photos/search?q=${encodeURIComponent(term.trim())}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Search failed");
      setResults(d.results);
      setProvider(d.provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); void search(q); }}>
        <PanelSearch value={q} onChange={setQ} placeholder="Search free photos" />
      </form>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => { setQ(s); void search(s); }} className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent">{s}</button>
        ))}
      </div>
      {error && <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>
      ) : (
        <div className="columns-2 gap-2 [&>*]:mb-2">
          {results.map((p) => {
            const payload = { kind: "image" as const, src: p.full, width: p.width, height: p.height, name: p.title.slice(0, 80), attribution: p.attribution };
            return (
              <button
                key={p.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData(DND_MIME, JSON.stringify(payload))}
                onClick={() => insertPayload(payload)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  useEditor.getState().setBackground({ image: { src: p.full, fit: "cover", blur: 0, opacity: 1 } });
                }}
                className="block w-full overflow-hidden rounded-lg border transition hover:border-brand-400"
                title={`${p.attribution}\nClick to add · right-click to set as background`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb} alt={p.title} loading="lazy" className="w-full" />
              </button>
            );
          })}
        </div>
      )}
      {!loading && !results.length && !error && <p className="text-xs text-muted-foreground">Search openly-licensed photos. Attribution is saved with each photo you add.</p>}
      {provider && <p className="text-[11px] text-muted-foreground">Results from {provider === "unsplash" ? "Unsplash" : "Openverse (Creative Commons)"}. Check each image’s licence before commercial use.</p>}
    </div>
  );
}
