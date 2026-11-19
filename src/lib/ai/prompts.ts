import { FONTS } from "@/lib/design/fonts";
import type { DesignRequest, TextRequest } from "./schema";

export const DESIGN_SYSTEM_PROMPT = `You are a senior graphic designer and art director inside a visual design editor.
Given a brief, produce structured design specifications that a layout engine renders as editable objects.
Rules:
- Write real, specific, accurate copy for the brief (no lorem ipsum). Keep the title under 8 words.
- Section bodies are 1-2 short sentences (max ~25 words). Use 3-6 sections for infographics/lists, 0-3 otherwise.
- Pick palettes with strong contrast between text and background (WCAG AA) and a distinct accent.
- Fonts must come from this list: ${FONTS.map((f) => f.family).join(", ")}.
- Icons must be valid Lucide icon names in PascalCase (e.g. HeartPulse, Stethoscope, Brain, Pill, Activity, Leaf, Rocket, Sparkles).
- Choose the layout that best suits the format: tall formats suit "infographic" or "list"; wide formats suit "split" or "hero"; posters suit "poster".
- For medical or scientific content, be factually careful and add a brief footer such as "For educational purposes".
- When several concepts are requested, make them genuinely different in layout, palette and typography.`;

export function designUserPrompt(req: DesignRequest) {
  const orient = req.width > req.height * 1.15 ? "landscape" : req.height > req.width * 1.15 ? "portrait" : "square";
  return `Brief: ${req.prompt}
Canvas: ${req.width}×${req.height}px (${orient}).
Produce ${req.count} distinct design concept${req.count > 1 ? "s" : ""}.`;
}

export const TEXT_SYSTEM_PROMPT = `You are a world-class copywriter and design assistant embedded in a graphic design tool.
Always respond with the requested JSON fields. Use "text" for prose output, "items" for list output and "palettes" for colour palettes (hex #RRGGBB). Leave unused fields empty.`;

export function textUserPrompt(req: TextRequest) {
  switch (req.task) {
    case "rewrite":
      return `Rewrite the following text in a ${req.tone ?? "professional"} tone. Keep the meaning and roughly the same length. Put it in "text".\n\n${req.input}`;
    case "summarize":
      return `Summarize the following text into a concise version suitable for a design (max 40% of original length). Put it in "text".\n\n${req.input}`;
    case "headlines":
      return `Write 6 compelling, distinct headlines (max 9 words each) for this topic/content. Put them in "items".\n\n${req.input}`;
    case "social":
      return `Write a ${req.platform ?? "instagram"} post caption for the topic below in a ${req.tone ?? "friendly"} tone. Put the caption in "text" and 8 relevant hashtags (with #) in "items".\n\n${req.input}`;
    case "palette":
      return `Suggest 4 harmonious 5-colour palettes for this design brief. Give each a short evocative name. Put them in "palettes".\n\n${req.input}`;
    case "elements":
      return `Suggest 12 Lucide icon names (PascalCase, must exist in lucide.dev) that would illustrate this topic, ordered by relevance. Put them in "items".\n\n${req.input}`;
    case "layout-critique":
      return `You are reviewing a design layout described as JSON (element types, positions, sizes, text). Give 3-6 short, actionable suggestions to improve hierarchy, alignment, spacing, contrast and balance. Put them in "items" and a one-sentence overall verdict in "text".\n\n${req.input}`;
  }
}
