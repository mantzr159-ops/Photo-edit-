"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { AuthCard, GoogleIcon } from "@/components/auth/auth-card";
import { LocalModeNotice } from "@/components/auth/local-mode-notice";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SignupPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  if (!isSupabaseConfigured)
    return (
      <AuthCard title="Create your account">
        <LocalModeNotice />
      </AuthCard>
    );
  const sb = getSupabaseBrowser()!;

  if (sent)
    return (
      <AuthCard title="Check your inbox">
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-10 w-10 text-brand-500" />
          <p className="text-sm text-muted-foreground">We sent a verification link to <strong>{email}</strong>. Click it to activate your account.</p>
          <Button variant="outline" asChild><Link href="/login">Back to sign in</Link></Button>
        </div>
      </AuthCard>
    );

  return (
    <AuthCard title="Create your account" subtitle="Free forever for personal projects." footer={<>Already have an account? <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link></>}>
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` } });
            if (error) toast.error(error.message);
          }}
        >
          <GoogleIcon /> Sign up with Google
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password.length < 8) return toast.error("Use at least 8 characters for your password.");
            setBusy(true);
            const { data, error } = await sb.auth.signUp({
              email: email.trim(),
              password,
              options: { data: { full_name: name.trim().slice(0, 80) }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
            });
            setBusy(false);
            if (error) return toast.error(error.message);
            if (data.session) window.location.href = "/dashboard";
            else setSent(true);
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="gradient" className="w-full" disabled={busy}>
            {busy && <Spinner />} Create account
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
