"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import type { Page } from "@/lib/design/types";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ErrorState, Spinner } from "@/components/ui/misc";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Shared = { id: string; name: string; width: number; height: number; visibility: "link_view" | "link_edit"; pages: Page[] };

/** Public, read-only preview of a project shared by link. */
export function ShareViewer({ token }: { token: string }) {
  const router = useRouter();
  const [data, setData] = React.useState<Shared | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [idx, setIdx] = React.useState(0);
  const [img, setImg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`/api/share/${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Link unavailable");
        const signed: Record<string, string> = d.signed ?? {};
        const { setSrcResolver } = await import("@/lib/design/images");
        setSrcResolver(async (src) => signed[src] ?? Promise.reject(new Error("Asset unavailable")));
        setData(d.project);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  React.useEffect(() => {
    if (!data) return;
    let alive = true;
    setImg(null);
    import("@/lib/export/render-page").then(async ({ renderPageToDataUrl }) => {
      const scale = Math.min(2, 1800 / Math.max(data.width, data.height));
      const url = await renderPageToDataUrl(data, data.pages[idx], { pixelRatio: scale, mimeType: "image/png" });
      if (alive) setImg(url);
    });
    return () => {
      alive = false;
    };
  }, [data, idx]);

  const edit = async () => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return router.push(`/login?next=/share/${token}`);
    const { data: pid, error } = await sb.rpc("join_shared_project", { p_token: token });
    if (error) return toast.error(error.message);
    router.push(`/editor/${pid}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--workspace))]">
      <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
        <Link href="/"><Logo /></Link>
        <span className="ml-2 truncate text-sm font-medium">{data?.name}</span>
        <div className="ml-auto flex gap-2">
          {data?.visibility === "link_edit" && <Button size="sm" variant="gradient" onClick={() => void edit()}><Pencil /> Edit this design</Button>}
          <Button size="sm" variant="outline" asChild><Link href="/dashboard">Create your own</Link></Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        {error ? (
          <ErrorState title="Link unavailable" description={error} />
        ) : !data ? (
          <Spinner className="h-6 w-6" />
        ) : (
          <>
            <div className="flex max-h-[78vh] max-w-full items-center justify-center" style={{ aspectRatio: `${data.width}/${data.height}` }}>
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={data.name} className="max-h-[78vh] max-w-full rounded-md shadow-lift" />
              ) : (
                <Spinner className="h-6 w-6" />
              )}
            </div>
            {data.pages.length > 1 && (
              <div className="flex items-center gap-3 text-sm">
                <Button size="icon-sm" variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)} aria-label="Previous"><ChevronLeft /></Button>
                {idx + 1} / {data.pages.length}
                <Button size="icon-sm" variant="outline" disabled={idx === data.pages.length - 1} onClick={() => setIdx(idx + 1)} aria-label="Next"><ChevronRight /></Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
