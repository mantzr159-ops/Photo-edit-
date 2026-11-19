"use client";
import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthCard, GoogleIcon } from "@/components/auth/auth-card";
import { LocalModeNotice } from "@/components/auth/local-mode-notice";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/utils/redirect";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const error = params.get("error");

  React.useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (!isSupabaseConfigured) return <LocalModeNotice />;
  const sb = getSupabaseBrowser()!;

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
          if (error) toast.error(error.message);
        }}
      >
        <GoogleIcon /> Continue with Google
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
          setBusy(false);
          if (error) {
            toast.error(error.message === "Email not confirmed" ? "Please verify your email first — check your inbox." : error.message);
            return;
          }
          router.replace(next);
          router.refresh();
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <Label htmlFor="pw">Password</Label>
            <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
          </div>
          <Input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" variant="gradient" className="w-full" disabled={busy}>
          {busy && <Spinner />} Sign in
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to continue designing." footer={isSupabaseConfigured ? <>New here? <Link href="/signup" className="font-medium text-brand-600 hover:underline">Create an account</Link></> : null}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
