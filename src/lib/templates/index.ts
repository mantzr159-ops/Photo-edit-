import { clonePage } from "@/lib/design/factory";
import type { Page, TemplateCategory, TemplateDef } from "@/lib/design/types";
import { BUILTIN_TEMPLATES } from "./library";

export { BUILTIN_TEMPLATES };

/** Fresh, independently-editable copy of a template's pages (new ids). */
export function instantiateTemplate(t: Pick<TemplateDef, "pages">): Page[] {
  return t.pages.map(clonePage);
}

export function searchTemplates(list: TemplateDef[], query: string, category?: TemplateCategory | "All") {
  const q = query.trim().toLowerCase();
  return list.filter((t) => {
    if (category && category !== "All" && t.category !== category) return false;
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q));
  });
}

/** Templates whose category matches the "Social Media" umbrella also show for its sub-categories. */
export function relatedCategories(c: TemplateCategory): TemplateCategory[] {
  if (c === "Social Media") return ["Social Media", "Instagram Posts", "Instagram Stories", "TikTok"];
  return [c];
}
