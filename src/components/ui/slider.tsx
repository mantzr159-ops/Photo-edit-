"use client";
import * as React from "react";
import * as SP from "@radix-ui/react-slider";
import { cn } from "@/lib/utils/cn";

export function Slider({ className, ...props }: React.ComponentPropsWithoutRef<typeof SP.Root>) {
  return (
    <SP.Root className={cn("relative flex w-full touch-none select-none items-center py-1", className)} {...props}>
      <SP.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SP.Range className="absolute h-full bg-primary" />
      </SP.Track>
      <SP.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Value" />
    </SP.Root>
  );
}

/** Labelled slider with a numeric readout. */
export function SliderField({ label, value, min, max, step = 1, onChange, suffix = "" }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <input
          type="number"
          className="w-14 rounded border bg-background px-1 py-0.5 text-right text-xs tabular-nums"
          value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          aria-label={label}
        />
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} aria-label={label} />
      {suffix ? <span className="sr-only">{suffix}</span> : null}
    </div>
  );
}
