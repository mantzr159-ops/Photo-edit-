"use client";
import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { FONTS, ensureFonts } from "@/lib/design/fonts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

export function FontPicker({ value, onChange }: { value: string; onChange: (f: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    if (open) void ensureFonts(FONTS.map((f) => f.family));
  }, [open]);
  const list = FONTS.filter((f) => !q || f.family.toLowerCase().includes(q.toLowerCase()) || f.category.includes(q.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex h-8 w-full items-center justify-between gap-2 rounded-md border bg-background px-2 text-sm hover:bg-accent" aria-label="Font family">
          <span className="truncate" style={{ fontFamily: `"${value}"` }}>{value}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" onKeyDown={(e) => e.stopPropagation()}>
        <div className="relative border-b p-2">
          <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fonts" className="h-8 w-full rounded-md bg-muted pl-7 pr-2 text-sm outline-none" />
        </div>
        <div className="max-h-72 overflow-y-auto p-1 scrollbar-thin">
          {list.map((f) => (
            <button
              key={f.family}
              onClick={() => {
                onChange(f.family);
                setOpen(false);
              }}
              className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-accent", value === f.family && "bg-accent")}
            >
              <span className="text-[15px]" style={{ fontFamily: `"${f.family}"` }}>{f.family}</span>
              <span className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
                {f.category}
                {value === f.family && <Check className="h-3.5 w-3.5 text-brand-500" />}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
