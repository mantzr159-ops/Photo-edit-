/**
 * Shared AI contracts (validated with Zod on the server and the client).
 * The design assistant returns *structured design specs* — never just an image —
 * which the layout compiler turns into individually editable canvas objects.
 */
import { z } from "zod/v4";
import { FONTS } from "@/lib/design/fonts";

const fontNames = FONTS.map((f) => f.family) as [string, ...string[]];
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex colour");

export const LAYOUTS = ["hero", "infographic", "split", "list", "poster", "grid"] as const;
export const DECORATIONS = ["circles", "blobs", "lines", "dots", "waves", "gradient", "none"] as const;

export const DesignSpecSchema = z.object({
  concept: z.string().describe("One or two sentences describing the creative concept"),
  title: z.string().describe("Main headline, short and punchy"),
  subtitle: z.string().describe("Supporting line under the title; may be empty"),
  eyebrow: z.string().describe("Tiny uppercase label above the title, e.g. a category; may be empty"),
  layout: z.enum(LAYOUTS),
  palette: z.object({
    background: hex,
    surface: hex,
    primary: hex,
    secondary: hex,
    accent: hex,
    text: hex,
    mutedText: hex,
  }),
  typography: z.object({
    heading: z.enum(fontNames),
    body: z.enum(fontNames),
    rationale: z.string(),
  }),
  hierarchy: z.array(z.string()).describe("Content hierarchy from most to least important"),
  sections: z
    .array(z.object({ heading: z.string(), body: z.string(), icon: z.string().describe("Lucide icon name in PascalCase, e.g. HeartPulse") }))
    .describe("0 to 6 content sections"),
  callToAction: z.string().describe("Button / CTA text; may be empty"),
  footer: z.string().describe("Footer / source / credit line; may be empty"),
  suggestedIcons: z.array(z.string()).describe("Additional relevant Lucide icon names"),
  decoration: z.enum(DECORATIONS),
  mood: z.string(),
});
export type DesignSpec = z.infer<typeof DesignSpecSchema>;

export const DesignConceptsSchema = z.object({ concepts: z.array(DesignSpecSchema) });

export const DesignRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(2000),
  width: z.number().int().min(16).max(10000),
  height: z.number().int().min(16).max(10000),
  count: z.number().int().min(1).max(4).default(1),
});
export type DesignRequest = z.infer<typeof DesignRequestSchema>;

export const TEXT_TASKS = ["rewrite", "summarize", "headlines", "social", "palette", "elements", "layout-critique"] as const;
export type TextTask = (typeof TEXT_TASKS)[number];

export const TextRequestSchema = z.object({
  task: z.enum(TEXT_TASKS),
  input: z.string().trim().min(1).max(6000),
  tone: z.enum(["professional", "friendly", "playful", "persuasive", "academic", "concise"]).optional(),
  platform: z.enum(["instagram", "tiktok", "linkedin", "x", "facebook", "youtube"]).optional(),
});
export type TextRequest = z.infer<typeof TextRequestSchema>;

export const TextResultSchema = z.object({
  /** primary text output (rewrite, summary, critique) */
  text: z.string(),
  /** list outputs (headlines, hashtags, icon names, tips) */
  items: z.array(z.string()),
  /** palette task: each palette is an array of hex colours */
  palettes: z.array(z.object({ name: z.string(), colors: z.array(hex) })),
});
export type TextResult = z.infer<typeof TextResultSchema>;

export const IMAGE_STYLES = ["photorealistic", "cinematic", "minimalist", "3d", "illustration", "anime", "watercolor", "vector", "editorial"] as const;
export const ASPECTS = ["1:1", "4:5", "3:4", "16:9", "9:16"] as const;

export const ImageRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(1500),
  style: z.enum(IMAGE_STYLES).default("photorealistic"),
  aspect: z.enum(ASPECTS).default("1:1"),
  count: z.number().int().min(1).max(4).default(1),
});
export type ImageRequest = z.infer<typeof ImageRequestSchema>;

export const STYLE_PROMPTS: Record<(typeof IMAGE_STYLES)[number], string> = {
  photorealistic: "photorealistic, natural lighting, high detail, 50mm lens",
  cinematic: "cinematic still, dramatic lighting, anamorphic, film grain, rich color grading",
  minimalist: "minimalist composition, generous negative space, clean flat background, simple shapes",
  "3d": "3D render, soft global illumination, clay-like materials, octane style",
  illustration: "digital illustration, rich textures, expressive brush work",
  anime: "anime style, cel shading, vibrant colors, detailed background",
  watercolor: "watercolor painting, soft washes, paper texture, delicate edges",
  vector: "flat vector illustration, bold geometric shapes, limited palette, crisp edges",
  editorial: "editorial magazine photography, styled set, sophisticated color palette",
};

export type AIErrorBody = { error: string; code?: "not_configured" | "rate_limited" | "invalid" | "provider_error" | "unauthorized"; setup?: string };
