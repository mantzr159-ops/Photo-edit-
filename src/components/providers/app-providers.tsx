"use client";
import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RepositoryProvider } from "./repository-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <RepositoryProvider>{children}</RepositoryProvider>
        <Toaster richColors closeButton position="bottom-right" toastOptions={{ className: "rounded-xl" }} />
      </TooltipProvider>
    </ThemeProvider>
  );
}
