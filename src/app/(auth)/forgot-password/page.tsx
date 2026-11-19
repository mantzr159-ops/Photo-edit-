"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { LocalModeNotice } from "@/components/auth/local-mode-notice";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  if (!isSupabaseConfigured) return <AuthCard title="Reset password"><LocalModeNotice /></AuthCard>;
  return (
    <AuthCard title="Reset your password" subtitle="We’ll email you a secure reset link." footer={<Link href="/login" className="hover:underline">Back to sign in</Link>}>
      {sent ? (
        <p className="text-sm text-muted-foreground">If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await getSupabaseBrowser()!.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/update-password` });
            if (error) return toast.error(error.message);
            setSent(true);
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" variant="gradient" className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthCard>
  );
}
