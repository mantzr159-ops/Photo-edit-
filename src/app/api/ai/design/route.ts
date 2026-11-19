import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTextProvider } from "@/lib/ai/registry";
import { guardAIRequest, aiError } from "@/lib/ai/guard";
import { DesignRequestSchema, DesignSpecSchema } from "@/lib/ai/schema";
import { LocalTextProvider } from "@/lib/ai/providers/local";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const g = await guardAIRequest(req, "design");
  if (g.error) return g.error;
  const parsed = DesignRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return aiError(400, { error: "Invalid request: " + parsed.error.issues[0]?.message, code: "invalid" });
  const provider = getTextProvider();
  try {
    const specs = await provider.generateDesigns(parsed.data);
    const valid = specs.map((s) => DesignSpecSchema.safeParse(s)).filter((r) => r.success).map((r) => r.data!);
    if (!valid.length) throw new Error("No valid design was produced.");
    return NextResponse.json({ provider: { id: provider.id, label: provider.label, isAI: provider.isAI }, concepts: valid });
  } catch (e) {
    console.error("[ai/design]", e);
    // degrade gracefully to the offline engine so the user still gets a starting point
    if (provider.id !== "local") {
      const local = new LocalTextProvider();
      const concepts = await local.generateDesigns(parsed.data);
      return NextResponse.json({
        provider: { id: local.id, label: local.label, isAI: false },
        concepts,
        warning: `AI provider failed (${e instanceof Error ? e.message : "error"}); showing offline concepts instead.`,
      });
    }
    return aiError(502, { error: e instanceof Error ? e.message : "Generation failed", code: "provider_error" });
  }
}
