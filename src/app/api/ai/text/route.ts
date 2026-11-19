import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTextProvider } from "@/lib/ai/registry";
import { guardAIRequest, aiError } from "@/lib/ai/guard";
import { TextRequestSchema, TextResultSchema } from "@/lib/ai/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const g = await guardAIRequest(req, "text");
  if (g.error) return g.error;
  const parsed = TextRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return aiError(400, { error: "Invalid request: " + parsed.error.issues[0]?.message, code: "invalid" });
  const provider = getTextProvider();
  try {
    const result = TextResultSchema.parse(await provider.runTextTask(parsed.data));
    // drop malformed palette colours defensively
    result.palettes = result.palettes.map((p) => ({ ...p, colors: p.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 6) })).filter((p) => p.colors.length >= 3);
    return NextResponse.json({ provider: { id: provider.id, label: provider.label, isAI: provider.isAI }, result });
  } catch (e) {
    console.error("[ai/text]", e);
    return aiError(502, { error: e instanceof Error ? e.message : "AI request failed", code: "provider_error" });
  }
}
