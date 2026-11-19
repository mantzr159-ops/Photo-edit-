"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TemplateBrowser } from "@/components/dashboard/template-browser";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/design/types";

function Inner() {
  const params = useSearchParams();
  const c = params.get("category");
  const cat = c && (TEMPLATE_CATEGORIES as readonly string[]).includes(c) ? (c as TemplateCategory) : "All";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Templates</h1>
        <p className="text-sm text-muted-foreground">Fully editable starting points for every format.</p>
      </div>
      <TemplateBrowser key={cat} initialCategory={cat} />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
