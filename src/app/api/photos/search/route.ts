import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";

export type PhotoResult = { id: string; thumb: string; full: string; width: number; height: number; title: string; attribution: string; license: string };

/**
 * Stock photo search. Uses Unsplash when UNSPLASH_ACCESS_KEY is set, otherwise
 * Openverse (openly-licensed media, no key needed). Images are served through
 * /api/photos/proxy so they can be exported from the canvas without CORS taint.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  const page = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1)));
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (!rateLimit(`photos:${ip}`, 60).ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  if (!q) return NextResponse.json({ results: [] });
  const proxy = (u: string) => `/api/photos/proxy?url=${encodeURIComponent(u)}`;
  try {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (key) {
      const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=24`, {
        headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) throw new Error(`Unsplash ${r.status}`);
      const d = await r.json();
      const results: PhotoResult[] = d.results.map((p: { id: string; urls: { small: string; regular: string }; width: number; height: number; alt_description: string; user: { name: string } }) => ({
        id: p.id,
        thumb: proxy(p.urls.small),
        full: proxy(p.urls.regular),
        width: p.width,
        height: p.height,
        title: p.alt_description || q,
        attribution: `Photo by ${p.user.name} on Unsplash`,
        license: "Unsplash License",
      }));
      return NextResponse.json({ provider: "unsplash", results });
    }
    const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page=${page}&page_size=24&license_type=commercial,modification&mature=false`, {
      headers: { "User-Agent": "LumoraStudio/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`Openverse ${r.status}`);
    const d = await r.json();
    const results: PhotoResult[] = (d.results ?? []).map((p: { id: string; thumbnail: string; width: number; height: number; title: string; creator: string; license: string; license_version: string }) => ({
      id: p.id,
      thumb: proxy(p.thumbnail),
      full: proxy(p.thumbnail),
      width: p.width || 800,
      height: p.height || 600,
      title: p.title || q,
      attribution: `"${p.title || "Untitled"}" by ${p.creator || "unknown"} (CC ${String(p.license).toUpperCase()} ${p.license_version ?? ""}) via Openverse`,
      license: `CC ${String(p.license).toUpperCase()}`,
    }));
    return NextResponse.json({ provider: "openverse", results });
  } catch (e) {
    return NextResponse.json({ error: `Photo search unavailable: ${e instanceof Error ? e.message : "error"}`, results: [] }, { status: 502 });
  }
}
