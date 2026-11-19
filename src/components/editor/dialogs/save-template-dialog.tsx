"use client";
import * as React from "react";
import { toast } from "sonner";
import { useEditor } from "@/stores/editor-store";
import { useRepo } from "@/components/providers/repository-provider";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/design/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { uuid } from "@/lib/utils/id";

export function SaveTemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const doc = useEditor((s) => s.doc);
  const { repo } = useRepo();
  const [name, setName] = React.useState("");
  const [cat, setCat] = React.useState<TemplateCategory>("Social Media");
  const [tags, setTags] = React.useState("");
  React.useEffect(() => {
    if (open && doc) {
      setName(doc.name);
      if (doc.category && (TEMPLATE_CATEGORIES as readonly string[]).includes(doc.category)) setCat(doc.category as TemplateCategory);
    }
  }, [open, doc]);
  if (!doc) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>Reuse this design as a starting point. Templates appear under Templates → Mine.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1"><Label htmlFor="tn">Name</Label><Input id="tn" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></div>
        <div className="space-y-1">
          <Label htmlFor="tc">Category</Label>
          <select id="tc" value={cat} onChange={(e) => setCat(e.target.value as TemplateCategory)} className="h-9 w-full rounded-lg border bg-background px-2 text-sm">
            {TEMPLATE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1"><Label htmlFor="tt">Tags (comma separated)</Label><Input id="tt" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="brand, launch, minimal" /></div>
        <Button
          variant="gradient"
          disabled={!name.trim() || !repo}
          onClick={async () => {
            try {
              await repo!.saveTemplate({
                id: uuid(),
                name: name.trim(),
                category: cat,
                width: doc.width,
                height: doc.height,
                tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 12),
                pages: structuredClone(doc.pages),
              });
              toast.success("Template saved");
              onOpenChange(false);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not save template");
            }
          }}
        >
          Save template
        </Button>
      </DialogContent>
    </Dialog>
  );
}
