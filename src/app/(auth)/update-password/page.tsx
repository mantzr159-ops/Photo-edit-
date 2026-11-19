"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { LocalModeNotice } from "@/components/auth/local-mode-notice";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  if (!isSupabaseConfigured) return <AuthCard title="Update password"><LocalModeNotice /></AuthCard>;
  return (
    <AuthCard title="Choose a new password">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) return toast.error("Use at least 8 characters.");
          if (pw !== pw2) return toast.error("Passwords don’t match.");
          const { error } = await getSupabaseBrowser()!.auth.updateUser({ password: pw });
          if (error) return toast.error(error.message);
          toast.success("Password updated");
          router.replace("/dashboard");
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pw2">Confirm password</Label>
          <Input id="pw2" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <Button type="submit" variant="gradient" className="w-full">Update password</Button>
      </form>
    </AuthCard>
  );
}
