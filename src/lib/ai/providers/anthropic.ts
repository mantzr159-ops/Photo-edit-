import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { DESIGN_SYSTEM_PROMPT, TEXT_SYSTEM_PROMPT, designUserPrompt, textUserPrompt } from "../prompts";
import { DesignConceptsSchema, TextResultSchema, type DesignRequest, type TextRequest } from "../schema";
import type { TextProvider } from "./types";

/** Claude-backed provider (server-side only; key never leaves the server). */
export class AnthropicTextProvider implements TextProvider {
  readonly id = "anthropic" as const;
  readonly label = "Claude (Anthropic)";
  readonly isAI = true;
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = process.env.ANTHROPIC_MODEL || "claude-opus-5-5") {
    this.client = new Anthropic({ apiKey, timeout: 120_000, maxRetries: 2 });
    this.model = model;
  }

  private async parse<T>(system: string, user: string, format: ReturnType<typeof zodOutputFormat>, effort: "low" | "medium") {
    const res = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 16000,
      // Server-side fallback reroutes a safety-classifier decline to another model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format, effort },
    });
    if (res.stop_reason === "refusal") throw new Error("The AI declined this request. Try rephrasing your prompt.");
    if (res.stop_reason === "max_tokens") throw new Error("The AI response was too long. Try a shorter brief.");
    if (!res.parsed_output) throw new Error("The AI returned an unexpected response.");
    return res.parsed_output as T;
  }

  async generateDesigns(req: DesignRequest) {
    const out = await this.parse<{ concepts: import("../schema").DesignSpec[] }>(
      DESIGN_SYSTEM_PROMPT,
      designUserPrompt(req),
      zodOutputFormat(DesignConceptsSchema),
      "medium",
    );
    return out.concepts.slice(0, req.count);
  }

  async runTextTask(req: TextRequest) {
    return this.parse<import("../schema").TextResult>(TEXT_SYSTEM_PROMPT, textUserPrompt(req), zodOutputFormat(TextResultSchema), "low");
  }
}
