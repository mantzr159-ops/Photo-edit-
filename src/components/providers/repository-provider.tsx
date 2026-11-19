"use client";
/**
 * Chooses the data backend at runtime:
 *  - Supabase configured + signed in  → SupabaseRepository (cloud mode)
 *  - Supabase not configured          → LocalRepository (IndexedDB, local mode)
 * Also wires the image loader so `local-asset:` / `sb-asset:` refs resolve.
 */
import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LocalRepository } from "@/lib/storage/local-repository";
import { SupabaseRepository } from "@/lib/storage/supabase-repository";
import type { DataRepository } from "@/lib/storage/types";
import { setSrcResolver } from "@/lib/design/images";

type Status = "loading" | "ready" | "unauthenticated";

type Ctx = {
  repo: DataRepository | null;
  mode: "local" | "cloud";
  status: Status;
  user: User | null;
  signOut: () => Promise<void>;
};

const RepoContext = React.createContext<Ctx | null>(null);

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{ repo: DataRepository | null; status: Status; user: User | null }>(() =>
    isSupabaseConfigured ? { repo: null, status: "loading", user: null } : { repo: new LocalRepository(), status: "ready", user: null },
  );

  React.useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabaseBrowser()!;
    const apply = (user: User | null) =>
      setState((prev) => {
        if (prev.user?.id === user?.id && prev.status !== "loading") return prev;
        return user ? { repo: new SupabaseRepository(sb, user.id, user.email ?? null), status: "ready", user } : { repo: null, status: "unauthenticated", user: null };
      });
    sb.auth.getUser().then(({ data }) => apply(data.user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => apply(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    const repo = state.repo;
    setSrcResolver(repo ? (src) => repo.resolveAssetSrc(src) : null);
  }, [state.repo]);

  const signOut = React.useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    window.location.href = "/login";
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ ...state, mode: isSupabaseConfigured ? "cloud" : "local", signOut }),
    [state, signOut],
  );
  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepo() {
  const ctx = React.useContext(RepoContext);
  if (!ctx) throw new Error("useRepo must be used inside RepositoryProvider");
  return ctx;
}
