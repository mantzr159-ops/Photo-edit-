"use client";
import * as React from "react";
import * as DM from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";

export const DropdownMenu = DM.Root;
export const DropdownMenuTrigger = DM.Trigger;
export const DropdownMenuSub = DM.Sub;

const itemCls =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentPropsWithoutRef<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        sideOffset={sideOffset}
        className={cn("z-50 min-w-[11rem] overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lift data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95", className)}
        {...props}
      />
    </DM.Portal>
  );
}
export const DropdownMenuItem = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof DM.Item>) => <DM.Item className={cn(itemCls, className)} {...p} />;
export const DropdownMenuSeparator = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof DM.Separator>) => <DM.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...p} />;
export const DropdownMenuLabel = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof DM.Label>) => <DM.Label className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...p} />;
export const DropdownMenuSubTrigger = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof DM.SubTrigger>) => <DM.SubTrigger className={cn(itemCls, className)} {...p} />;
export function DropdownMenuSubContent({ className, ...p }: React.ComponentPropsWithoutRef<typeof DM.SubContent>) {
  return (
    <DM.Portal>
      <DM.SubContent className={cn("z-50 min-w-[10rem] rounded-xl border bg-popover p-1 shadow-lift", className)} {...p} />
    </DM.Portal>
  );
}
