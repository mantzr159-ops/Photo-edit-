"use client";
import * as React from "react";
import * as CM from "@radix-ui/react-context-menu";
import { cn } from "@/lib/utils/cn";

export const ContextMenu = CM.Root;
export const ContextMenuTrigger = CM.Trigger;
const itemCls =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-40 [&_svg]:size-4 [&_svg]:text-muted-foreground";
export function ContextMenuContent({ className, ...p }: React.ComponentPropsWithoutRef<typeof CM.Content>) {
  return (
    <CM.Portal>
      <CM.Content className={cn("z-50 min-w-[13rem] rounded-xl border bg-popover p-1 shadow-lift animate-in fade-in-0 zoom-in-95", className)} {...p} />
    </CM.Portal>
  );
}
export const ContextMenuItem = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof CM.Item>) => <CM.Item className={cn(itemCls, className)} {...p} />;
export const ContextMenuSeparator = () => <CM.Separator className="-mx-1 my-1 h-px bg-border" />;
export const ContextMenuShortcut = ({ children }: { children: React.ReactNode }) => <span className="ml-auto pl-4 text-xs tracking-wide text-muted-foreground">{children}</span>;
export const ContextMenuSub = CM.Sub;
export const ContextMenuSubTrigger = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof CM.SubTrigger>) => <CM.SubTrigger className={cn(itemCls, className)} {...p} />;
export function ContextMenuSubContent({ className, ...p }: React.ComponentPropsWithoutRef<typeof CM.SubContent>) {
  return (
    <CM.Portal>
      <CM.SubContent className={cn("z-50 min-w-[10rem] rounded-xl border bg-popover p-1 shadow-lift", className)} {...p} />
    </CM.Portal>
  );
}
