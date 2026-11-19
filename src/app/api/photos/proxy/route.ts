import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Strict allowlist to prevent SSRF — only known stock photo CDNs. */
const ALLOWED_HOSTS = new Set(["api.openverse.org", "images.unsplash.com", "plus.unsplash.com"]);
const MAX_BYTES = 12 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Bad url" }, { status: 400 });
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
  const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000) }).catch(() => null);
  if (!r || !r.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  const type = r.headers.get("content-type") || "";
  if (!/^image\/(png|jpe?g|webp|gif)/.test(type)) return NextResponse.json({ error: "Not an image" }, { status: 415 });
  const buf = await r.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: "Too large" }, { status: 413 });
  return new NextResponse(buf, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" } });
}
