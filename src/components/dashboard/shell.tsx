"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Cloud, FolderClosed, FolderPlus, HardDrive, Home, Image as ImageIcon, LayoutTemplate, LogOut, Menu, Monitor, Moon, Search, Settings, Star, Sun, Trash2, Shapes,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge, Spinner } from "@/components/ui/misc";
import { useRepo } from "@/components/providers/repository-provider";
import { useAsync } from "@/hooks/use-async";
import { formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CreateDesignDialog } from "./create-design-dialog";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/projects", label: "Projects", icon: Shapes },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/starred", label: "Starred", icon: Star },
  { href: "/dashboard/assets", label: "Uploads", icon: ImageIcon },
  { href: "/dashboard/trash", label: "Trash", icon: Trash2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export const FoldersContext = React.createContext<{ reloadFolders: () => void }>({ reloadFolders: () => undefined });

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { repo, mode } = useRepo();
  const folders = useAsync(() => (repo ? repo.listFolders() : Promise.resolve([])), [repo]);
  const usage = useAsync(() => (repo ? repo.getStorageUsage() : Promise.resolve({ usedBytes: 0, quotaBytes: 1 })), [repo, pathname]);
  const [search] = React.useState("");

  React.useEffect(() => {
    const h = () => folders.reload();
    window.addEventListener("lumora:folders-changed", h);
    return () => window.removeEventListener("lumora:folders-changed", h);
  }, [folders]);

  const addFolder = async () => {
    const name = window.prompt("Folder name");
    if (!name?.trim() || !repo) return;
    try {
      await repo.createFolder(name.trim());
      folders.reload();
      toast.success(`Folder “${name.trim()}” created`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create folder");
    }
  };

  const pct = usage.data ? Math.min(100, (usage.data.usedBytes / usage.data.quotaBytes) * 100) : 0;
  void search;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link href="/dashboard" onClick={onNavigate} className="px-2 pt-1">
        <Logo />
      </Link>
      <CreateDesignDialog trigger={<Button variant="gradient" className="w-full">+ Create a design</Button>} />
      <nav className="space-y-0.5">
        {NAV.map((n) => {
          const active = n.href === "/dashboard" ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground",
                active && "bg-accent text-foreground",
              )}
            >
              <n.icon className={cn("h-4 w-4", active && "text-brand-500")} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mb-1 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Folders
          <button onClick={addFolder} className="rounded p-1 hover:bg-accent" aria-label="New folder">
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
        {folders.loading ? (
          <div className="px-3 py-2"><Spinner /></div>
        ) : folders.data?.length ? (
          folders.data.map((f) => (
            <Link
              key={f.id}
              href={`/dashboard/projects?folder=${f.id}`}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <FolderClosed className="h-4 w-4" />
              <span className="truncate">{f.name}</span>
            </Link>
          ))
        ) : (
          <p className="px-3 py-1 text-xs text-muted-foreground">No folders yet</p>
        )}
      </div>
      <div className="rounded-xl border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium">
          {mode === "cloud" ? <Cloud className="h-3.5 w-3.5 text-brand-500" /> : <HardDrive className="h-3.5 w-3.5 text-amber-500" />}
          {mode === "cloud" ? "Cloud storage" : "Local storage (this browser)"}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {usage.data ? `${formatBytes(usage.data.usedBytes)} of ${formatBytes(usage.data.quotaBytes)} used` : "Calculating…"}
        </p>
      </div>
    </div>
  );
}

export function ThemeMenuItems() {
  const { setTheme } = useTheme();
  return (
    <>
      <DropdownMenuItem onClick={() => setTheme("light")}><Sun /> Light</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")}><Moon /> Dark</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")}><Monitor /> System</DropdownMenuItem>
    </>
  );
}

export function UserMenu() {
  const { repo, mode, signOut } = useRepo();
  const profile = useAsync(() => (repo ? repo.getProfile() : Promise.resolve(null)), [repo]);
  const name = profile.data?.displayName ?? "…";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-accent" aria-label="Account menu">
          {profile.data?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.data.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">{name.slice(0, 1).toUpperCase()}</span>
          )}
          <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline">{name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="truncate text-sm text-foreground">{name}</div>
          <div className="truncate font-normal">{profile.data?.email ?? (mode === "local" ? "Local mode · not signed in" : "")}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings /> Settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeMenuItems />
        {mode === "cloud" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}><LogOut /> Sign out</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { status, mode } = useRepo();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?next=/dashboard");
  }, [status, router]);

  if (status !== "ready") {
    return (
      <div className="flex h-screen items-center justify-center gap-3 text-muted-foreground">
        <Spinner className="h-5 w-5" /> Loading your workspace…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-card/50 lg:block">
        <Sidebar />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-background shadow-lift animate-in slide-in-from-left">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
          <form
            className="relative max-w-xl flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your designs and templates" className="h-10 rounded-full pl-9" aria-label="Search" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            {mode === "local" && (
              <Badge variant="warning" className="hidden sm:inline-flex" title="Supabase isn't configured: projects are saved in this browser's IndexedDB.">
                <HardDrive className="h-3 w-3" /> Local mode
              </Badge>
            )}
            <UserMenu />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
