"use client";
import * as React from "react";
import { Search } from "lucide-react";
import { DND_MIME } from "../canvas/canvas-api";
import { insertPayload, type InsertPayload } from "@/lib/editor/insert";
import { cn } from "@/lib/utils/cn";

export function PanelSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        aria-label={placeholder}
      />
    </div>
  );
}

export function PanelHeading({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between first:mt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
      {action}
    </div>
  );
}

/** A tile that inserts on click and can be dragged onto the canvas. */
export function InsertTile({ payload, children, className, title }: { payload: InsertPayload; children: React.ReactNode; className?: string; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => insertPayload(payload)}
      className={cn("flex items-center justify-center rounded-lg border bg-card transition hover:border-brand-300 hover:bg-accent active:scale-95", className)}
    >
      {children}
    </button>
  );
}
