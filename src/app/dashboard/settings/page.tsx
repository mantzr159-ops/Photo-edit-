"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Check, Cloud, HardDrive, Monitor, Moon, Sun, X } from "lucide-react";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge, Skeleton } from "@/components/ui/misc";
import { formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Status = { text: { label: string; isAI: boolean }; image: { configured: boolean; label: string | null }; removeBg: { configured: boolean }; photos: { provider: string } };

function Row({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className={cn("mt-0.5 flex h-5 w-5 items-center justify-center rounded-full", ok ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600")}>
        {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { repo, mode, user } = useRepo();
  const { theme, setTheme } = useTheme();
  const profile = useAsync(() => repo!.getProfile(), [repo]);
  const usage = useAsync(() => repo!.getStorageUsage(), [repo]);
  const status = useAsync<Status>(() => fetch("/api/ai/status").then((r) => r.json()), []);
  const [name, setName] = React.useState("");
  React.useEffect(() => setName(profile.data?.displayName ?? ""), [profile.data]);

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Profile</h2>
        {profile.loading ? <Skeleton className="h-10 w-full" /> : (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await repo!.updateProfile({ displayName: name.trim().slice(0, 80) });
                toast.success("Profile updated");
                profile.reload();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Update failed");
              }
            }}
          >
            <div className="min-w-[240px] flex-1 space-y-1">
              <Label htmlFor="dn">Display name</Label>
              <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <Button type="submit">Save</Button>
          </form>
        )}
        {user?.email && <p className="mt-3 text-sm text-muted-foreground">Signed in as {user.email}{user.email_confirmed_at ? " · email verified" : " · email not verified"}</p>}
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Appearance</h2>
        <div className="flex gap-2">
          {[["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]].map(([v, Icon, label]) => {
            const I = Icon as React.ElementType;
            return (
              <button key={v as string} onClick={() => setTheme(v as string)} className={cn("flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-accent", theme === v && "border-brand-500 ring-2 ring-brand-500/20")}>
                <I className="h-4 w-4" /> {label as string}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          {mode === "cloud" ? <Cloud className="h-4 w-4 text-brand-500" /> : <HardDrive className="h-4 w-4 text-amber-500" />} Storage
          <Badge variant={mode === "cloud" ? "brand" : "warning"}>{mode === "cloud" ? "Cloud (Supabase)" : "Local mode"}</Badge>
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {mode === "cloud"
            ? "Projects, pages and assets are stored in Supabase and protected by row-level security."
            : "Supabase isn't configured, so designs are stored in this browser (IndexedDB). Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable accounts, cloud sync and sharing."}
        </p>
        {usage.data && <p className="text-sm">{formatBytes(usage.data.usedBytes)} of {formatBytes(usage.data.quotaBytes)} used by uploads</p>}
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="mb-1 font-semibold">AI & integrations</h2>
        <p className="mb-2 text-sm text-muted-foreground">Provider keys live only in server environment variables and are never sent to the browser.</p>
        {status.loading || !status.data ? <Skeleton className="h-24 w-full" /> : (
          <div className="divide-y">
            <Row ok={status.data.text.isAI} title={`Design & text AI: ${status.data.text.label}`} detail={status.data.text.isAI ? "Generating designs and copy with a language model." : "Using the built-in offline engine (keyword themes + colour theory). Set ANTHROPIC_API_KEY or OPENAI_API_KEY for real AI."} />
            <Row ok={status.data.image.configured} title={`Image generation${status.data.image.label ? `: ${status.data.image.label}` : ""}`} detail={status.data.image.configured ? "Text-to-image is available." : "Set OPENAI_API_KEY or REPLICATE_API_TOKEN to enable text-to-image."} />
            <Row ok={status.data.removeBg.configured} title="Cloud background removal" detail={status.data.removeBg.configured ? "remove.bg is configured." : "Set REMOVE_BG_API_KEY for high-quality removal. A basic in-browser remover is always available."} />
            <Row ok title={`Stock photos: ${status.data.photos.provider === "unsplash" ? "Unsplash" : "Openverse (CC-licensed)"}`} detail="Searchable from the editor's Photos panel." />
            <Row ok={false} title="Real-time collaboration" detail="Not yet available. Shared edit links use save-conflict detection (one editor at a time recommended)." />
          </div>
        )}
      </section>
    </div>
  );
}
