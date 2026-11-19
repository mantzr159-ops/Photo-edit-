import Link from "next/link";
import { HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocalModeNotice() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium">Accounts aren’t configured yet</p>
          <p className="mt-1 text-muted-foreground">
            This deployment has no Supabase project connected, so it runs in <strong>local mode</strong>: everything is saved in this browser. Set
            <code className="mx-1 rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable sign-in.
          </p>
        </div>
      </div>
      <Button asChild variant="gradient" className="w-full">
        <Link href="/dashboard">Continue in local mode</Link>
      </Button>
    </div>
  );
}
