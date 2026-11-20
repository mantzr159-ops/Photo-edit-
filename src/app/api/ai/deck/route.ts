import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTextProvider } from "@/lib/ai/registry";
import { guardAIRequest, aiError } from "@/lib/ai/guard";
import { AIDeckSchema, DeckRequestSchema } from "@/lib/ai/schema";
import { LocalTextProvider } from "@/lib/ai/providers/local";
import { toDeckSpec } from "@/lib/ai/deck";

export const runtime = "nodejs";
export const maxDuration = 180;

/** Generates an art-directed presentation deck (structured, every slide editable). */
export async function POST(req: NextRequest) {
  const g = await guardAIRequest(req, "deck");
  if (g.error) return g.error;
  const parsed = DeckRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return aiError(400, { error: "Invalid request: " + parsed.error.issues[0]?.message, code: "invalid" });
  const provider = getTextProvider();
  try {
    const raw = await provider.generateDeck(parsed.data);
    const deck = AIDeckSchema.parse(raw);
    if (!deck.slides.length) throw new Error("The AI returned no slides.");
    return NextResponse.json({ provider: { id: provider.id, label: provider.label, isAI: provider.isAI }, deck: toDeckSpec(deck, parsed.data.prompt) });
  } catch (e) {
    console.error("[ai/deck]", e);
    if (provider.id !== "local") {
      const local = new LocalTextProvider();
      const deck = await local.generateDeck(parsed.data);
      return NextResponse.json({
        provider: { id: local.id, label: local.label, isAI: false },
        deck: toDeckSpec(deck, parsed.data.prompt),
        warning: `AI provider failed (${e instanceof Error ? e.message : "error"}); showing an offline outline instead.`,
      });
    }
    return aiError(502, { error: e instanceof Error ? e.message : "Generation failed", code: "provider_error" });
  }
}
