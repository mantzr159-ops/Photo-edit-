"use client";
import * as React from "react";
import * as PP from "@radix-ui/react-popover";
import { cn } from "@/lib/utils/cn";

export const Popover = PP.Root;
export const PopoverTrigger = PP.Trigger;
export const PopoverClose = PP.Close;
export function PopoverContent({ className, align = "start", sideOffset = 6, ...props }: React.ComponentPropsWithoutRef<typeof PP.Content>) {
  return (
    <PP.Portal>
      <PP.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("z-50 w-72 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lift outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95", className)}
        {...props}
      />
    </PP.Portal>
  );
}
