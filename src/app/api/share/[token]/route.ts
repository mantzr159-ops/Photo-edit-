import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public read-only access to a shared project. Asset references are signed
 * server-side (service role) and ONLY for storage paths the shared document
 * actually references — no other files are exposed.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[\w-]{10,64}$/.test(token)) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  const sb = await getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "Sharing requires cloud mode (Supabase)." }, { status: 503 });
  const { data, error } = await sb.rpc("get_shared_project", { p_token: token });
  if (error || !data) return NextResponse.json({ error: "This link is invalid or sharing was turned off." }, { status: 404 });

  const json = JSON.stringify(data);
  const ownerPrefix = `${data.owner_id}/`;
  const paths = [...new Set([...json.matchAll(/sb-asset:([\w./-]+)/g)].map((m) => m[1]))].filter((p) => p.startsWith(ownerPrefix) && !p.includes(".."));
  const signed: Record<string, string> = {};
  const admin = getSupabaseAdmin();
  if (admin && paths.length) {
    const { data: urls } = await admin.storage.from("assets").createSignedUrls(paths, 60 * 60);
    urls?.forEach((u) => {
      if (u.path && u.signedUrl) signed[`sb-asset:${u.path}`] = u.signedUrl;
    });
  }
  const { owner_id: _owner, ...project } = data;
  void _owner;
  return NextResponse.json({ project, signed });
}
