"use client";
import * as React from "react";
import * as TB from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils/cn";

export const Tabs = TB.Root;
export const TabsList = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof TB.List>) => (
  <TB.List className={cn("inline-flex h-9 items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground", className)} {...p} />
);
export const TabsTrigger = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof TB.Trigger>) => (
  <TB.Trigger
    className={cn("inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", className)}
    {...p}
  />
);
export const TabsContent = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof TB.Content>) => <TB.Content className={cn("mt-3 focus-visible:outline-none", className)} {...p} />;
