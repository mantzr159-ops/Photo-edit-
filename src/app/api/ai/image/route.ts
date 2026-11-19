import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getImageProvider } from "@/lib/ai/registry";
import { guardAIRequest, aiError } from "@/lib/ai/guard";
import { ImageRequestSchema, STYLE_PROMPTS } from "@/lib/ai/schema";
import { ProviderNotConfiguredError } from "@/lib/ai/providers/types";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const g = await guardAIRequest(req, "image", { limit: Math.max(1, Math.floor(Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 20) / 3)) });
  if (g.error) return g.error;
  const parsed = ImageRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return aiError(400, { error: "Invalid request: " + parsed.error.issues[0]?.message, code: "invalid" });
  try {
    const provider = getImageProvider();
    const fullPrompt = `${parsed.data.prompt}. Style: ${STYLE_PROMPTS[parsed.data.style]}.`;
    const images = await provider.generate(parsed.data, fullPrompt);
    return NextResponse.json({ provider: provider.label, images });
  } catch (e) {
    if (e instanceof ProviderNotConfiguredError) return aiError(503, { error: e.message, code: "not_configured", setup: e.setup });
    console.error("[ai/image]", e);
    return aiError(502, { error: e instanceof Error ? e.message : "Image generation failed", code: "provider_error" });
  }
}
