"use client";
import { createProject } from "@/lib/design/factory";
import type { Page, TemplateDef } from "@/lib/design/types";
import type { DataRepository } from "@/lib/storage/types";
import { instantiateTemplate } from "@/lib/templates";

export async function newProject(repo: DataRepository, input: { name?: string; width: number; height: number; pages?: Page[]; category?: string; folderId?: string | null }) {
  const doc = createProject(input);
  await repo.createProject(doc, { folderId: input.folderId ?? null });
  return doc.id;
}

export function newProjectFromTemplate(repo: DataRepository, t: TemplateDef) {
  return newProject(repo, { name: t.name, width: t.width, height: t.height, pages: instantiateTemplate(t), category: t.category });
}
