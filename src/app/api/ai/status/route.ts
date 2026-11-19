import { NextResponse } from "next/server";
import { aiStatus } from "@/lib/ai/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which providers are configured (no secrets are returned). */
export function GET() {
  return NextResponse.json(aiStatus());
}
