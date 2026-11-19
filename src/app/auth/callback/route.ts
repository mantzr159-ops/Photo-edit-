import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils/redirect";

/** OAuth / email-verification / password-reset landing: exchanges the PKCE code for a session. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const err = url.searchParams.get("error_description");
  if (err) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err)}`, url.origin));
  const sb = await getSupabaseServer();
  if (code && sb) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=Invalid%20or%20expired%20link", url.origin));
}
