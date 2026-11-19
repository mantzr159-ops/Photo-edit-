"use client";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

/** Compact numeric input that commits on blur/enter and supports arrow-key stepping. */
export function NumberField({ label, value, onChange, step = 1, min, max, suffix, className, decimals = 0 }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string; className?: string; decimals?: number }) {
  const fmt = (v: number) => (Number.isFinite(v) ? String(Math.round(v * 10 ** decimals) / 10 ** decimals) : "0");
  const [draft, setDraft] = React.useState(fmt(value));
  const focused = React.useRef(false);
  React.useEffect(() => {
    if (!focused.current) setDraft(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const commit = (raw: string) => {
    let v = Number(raw);
    if (!Number.isFinite(v)) return setDraft(fmt(value));
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    onChange(v);
    setDraft(fmt(v));
  };
  return (
    <label className={cn("flex h-8 items-center gap-1.5 rounded-md border bg-background px-2 text-xs focus-within:ring-2 focus-within:ring-ring", className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <input
        className="w-full min-w-0 bg-transparent text-right tabular-nums outline-none"
        value={draft}
        inputMode="decimal"
        aria-label={label}
        onFocus={() => (focused.current = true)}
        onBlur={(e) => {
          focused.current = false;
          commit(e.target.value);
        }}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const d = (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
            commit(String((Number(draft) || 0) + d));
          }
        }}
      />
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </label>
  );
}

export function Section({ title, children, action, className }: { title: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-2.5 border-b px-4 py-4 last:border-b-0", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function IconToggle({ active, onClick, children, label, disabled }: { active?: boolean; onClick: () => void; children: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn("flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-40 [&_svg]:h-4 [&_svg]:w-4", active && "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300")}
    >
      {children}
    </button>
  );
}
