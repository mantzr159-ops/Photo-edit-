/** Converts a model's deck output into a renderable DeckSpec (server- and client-safe). */
import { diversify, type DeckSpec, type SlideSpec } from "@/lib/templates/editorial";
import type { AIDeck } from "./schema";

const clean = (s?: string) => (s && s.trim() ? s.trim() : undefined);

export function toDeckSpec(ai: AIDeck, prompt: string, maxSlides = 14): DeckSpec {
  const rtl = /[؀-ۿ]/.test(prompt) || /[؀-ۿ]/.test(ai.title);
  const slides: SlideSpec[] = ai.slides.slice(0, maxSlides).map((s) => ({
    kind: s.kind,
    label: clean(s.label),
    heading: s.heading?.trim() ?? "",
    body: clean(s.body),
    number: clean(s.number),
    quote: clean(s.quote),
    attribution: clean(s.attribution),
    footnote: clean(s.footnote),
    items: (s.items ?? []).filter((i) => i.label?.trim()).map((i) => ({ label: i.label.trim(), value: clean(i.value), desc: clean(i.desc) })),
  }));
  // slides whose data is missing fall back to a statement instead of rendering an empty diagram
  for (const s of slides) {
    if (["timeline", "bars", "process", "index", "comparison"].includes(s.kind) && !(s.items && s.items.length >= 2)) s.kind = "statement";
    if (s.kind === "bigNumber" && !s.number) s.kind = "statement";
    if (s.kind === "quote" && !s.quote) s.quote = s.heading;
  }
  return {
    title: ai.title.trim() || "Presentation",
    subtitle: clean(ai.subtitle),
    author: clean(ai.author),
    style: ai.style,
    accent: /^#[0-9a-f]{6}$/i.test(ai.accent ?? "") ? ai.accent : undefined,
    rtl,
    slides: diversify(slides),
  };
}
