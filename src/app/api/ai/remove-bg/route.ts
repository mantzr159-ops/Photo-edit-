import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { guardAIRequest, aiError } from "@/lib/ai/guard";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX = 10 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Background removal via remove.bg (server-side; key never exposed). */
export async function POST(req: NextRequest) {
  const g = await guardAIRequest(req, "remove-bg", { maxBytes: MAX + 50_000, limit: 10 });
  if (g.error) return g.error;
  const key = process.env.REMOVE_BG_API_KEY;
  if (!key)
    return aiError(503, {
      error: "Cloud background removal is not configured.",
      code: "not_configured",
      setup: "Set REMOVE_BG_API_KEY (remove.bg) on the server. The basic in-browser remover works without it.",
    });
  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof Blob)) return aiError(400, { error: "Missing image", code: "invalid" });
  if (file.size > MAX || !TYPES.includes(file.type)) return aiError(400, { error: "Image must be PNG/JPEG/WebP under 10 MB", code: "invalid" });
  const out = new FormData();
  out.append("image_file", file, "image");
  out.append("size", "auto");
  const res = await fetch("https://api.remove.bg/v1.0/removebg", { method: "POST", headers: { "X-Api-Key": key }, body: out, signal: AbortSignal.timeout(55_000) });
  if (!res.ok) return aiError(502, { error: `Background removal failed (${res.status})`, code: "provider_error" });
  return new NextResponse(await res.arrayBuffer(), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
}
