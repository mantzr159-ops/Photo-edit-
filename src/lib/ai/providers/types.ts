import type { AIDeck, DeckRequest, DesignRequest, DesignSpec, ImageRequest, TextRequest, TextResult } from "../schema";

/** Text/design LLM provider. Swap implementations without touching the app. */
export interface TextProvider {
  readonly id: "anthropic" | "openai" | "local";
  readonly label: string;
  /** true when results come from a real model (false for the offline heuristic engine) */
  readonly isAI: boolean;
  generateDesigns(req: DesignRequest): Promise<DesignSpec[]>;
  runTextTask(req: TextRequest): Promise<TextResult>;
  /** Full presentation deck with art-directed slide compositions. */
  generateDeck(req: DeckRequest): Promise<AIDeck>;
}

export interface GeneratedImage {
  /** data URL (server fetches remote results so the client never hits CORS issues) */
  dataUrl: string;
  revisedPrompt?: string;
}

export interface ImageProvider {
  readonly id: "openai" | "replicate";
  readonly label: string;
  generate(req: ImageRequest, fullPrompt: string): Promise<GeneratedImage[]>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(message: string, public setup: string) {
    super(message);
  }
}
