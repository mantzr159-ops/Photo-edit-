"use client";
import * as React from "react";
import * as TP from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils/cn";

export const TooltipProvider = TP.Provider;

export function Tooltip({ content, children, side = "bottom" }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <TP.Root delayDuration={350}>
      <TP.Trigger asChild>{children}</TP.Trigger>
      <TP.Portal>
        <TP.Content side={side} sideOffset={6} className={cn("z-[60] rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-soft animate-in fade-in-0 zoom-in-95")}>
          {content}
        </TP.Content>
      </TP.Portal>
    </TP.Root>
  );
}
