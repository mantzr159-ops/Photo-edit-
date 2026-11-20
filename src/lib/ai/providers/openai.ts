import "server-only";
import { DECK_SYSTEM_PROMPT, DESIGN_SYSTEM_PROMPT, TEXT_SYSTEM_PROMPT, deckUserPrompt, designUserPrompt, textUserPrompt } from "../prompts";
import { AIDeckSchema, DesignConceptsSchema, TextResultSchema, type AIDeck, type DeckRequest, type DesignRequest, type DesignSpec, type ImageRequest, type TextRequest, type TextResult } from "../schema";
import type { GeneratedImage, ImageProvider, TextProvider } from "./types";
import { z } from "zod/v4";

const API = "https://api.openai.com/v1";

async function openaiJson<T>(apiKey: string, model: string, system: string, user: string, schema: z.ZodType, name: string): Promise<T> {
  const res = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_schema", json_schema: { name, schema: z.toJSONSchema(schema) } },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = schema.safeParse(JSON.parse(content ?? "{}"));
  if (!parsed.success) throw new Error("The AI returned an unexpected response.");
  return parsed.data as T;
}

/** OpenAI-compatible text provider (alternative to Claude). */
export class OpenAITextProvider implements TextProvider {
  readonly id = "openai" as const;
  readonly label = "OpenAI";
  readonly isAI = true;
  constructor(private apiKey: string, private model = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini") {}

  async generateDesigns(req: DesignRequest): Promise<DesignSpec[]> {
    const out = await openaiJson<{ concepts: DesignSpec[] }>(this.apiKey, this.model, DESIGN_SYSTEM_PROMPT, designUserPrompt(req), DesignConceptsSchema, "design_concepts");
    return out.concepts.slice(0, req.count);
  }

  generateDeck(req: DeckRequest): Promise<AIDeck> {
    return openaiJson<AIDeck>(this.apiKey, this.model, DECK_SYSTEM_PROMPT, deckUserPrompt(req), AIDeckSchema, "slide_deck");
  }

  runTextTask(req: TextRequest): Promise<TextResult> {
    return openaiJson<TextResult>(this.apiKey, this.model, TEXT_SYSTEM_PROMPT, textUserPrompt(req), TextResultSchema, "text_result");
  }
}

const SIZE: Record<ImageRequest["aspect"], string> = { "1:1": "1024x1024", "4:5": "1024x1536", "3:4": "1024x1536", "16:9": "1536x1024", "9:16": "1024x1536" };

export class OpenAIImageProvider implements ImageProvider {
  readonly id = "openai" as const;
  readonly label = "OpenAI Images";
  constructor(private apiKey: string, private model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1") {}

  async generate(req: ImageRequest, fullPrompt: string): Promise<GeneratedImage[]> {
    const res = await fetch(`${API}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt: fullPrompt, size: SIZE[req.aspect], n: req.count }),
      signal: AbortSignal.timeout(180_000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ? `OpenAI: ${String(body.error.message).slice(0, 200)}` : `OpenAI error ${res.status}`);
    }
    const data = await res.json();
    return (data.data ?? []).map((d: { b64_json?: string; revised_prompt?: string }) => ({
      dataUrl: `data:image/png;base64,${d.b64_json}`,
      revisedPrompt: d.revised_prompt,
    }));
  }
}
