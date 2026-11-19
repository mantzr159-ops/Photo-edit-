"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, BriefcaseBusiness, Contact, FileText, GraduationCap, Image as ImageIcon, LayoutTemplate, Mail, Monitor, Palette, PartyPopper, Presentation, Smartphone, Stethoscope, MonitorPlay, Camera } from "lucide-react";
import { DESIGN_SIZES } from "@/lib/design/factory";
import { useRepo } from "@/components/providers/repository-provider";
import { newProject } from "@/lib/projects";
import { TEMPLATE_CATEGORIES } from "@/lib/design/types";

const QUICK = [
  { id: "ig-post", icon: Camera, color: "from-pink-500 to-orange-400" },
  { id: "ig-story", icon: Smartphone, color: "from-fuchsia-500 to-purple-500" },
  { id: "yt-thumb", icon: MonitorPlay, color: "from-red-500 to-rose-500" },
  { id: "presentation", icon: Presentation, color: "from-amber-500 to-orange-500" },
  { id: "poster", icon: ImageIcon, color: "from-sky-500 to-indigo-500" },
  { id: "flyer", icon: FileText, color: "from-emerald-500 to-teal-500" },
  { id: "business-card", icon: Contact, color: "from-slate-600 to-slate-800" },
  { id: "infographic", icon: LayoutTemplate, color: "from-violet-500 to-brand-500" },
];

const CAT_ICONS: Record<string, React.ElementType> = {
  "Medical Education": Stethoscope, "Educational Designs": GraduationCap, "CV / Resume": BriefcaseBusiness, Invitations: Mail, Logos: Palette,
  Wallpapers: Monitor, Presentations: Presentation, "Social Media": Camera, Infographics: BookOpen, Posters: ImageIcon, Flyers: FileText,
  "Business Cards": Contact, "Instagram Posts": Camera, "Instagram Stories": Smartphone, TikTok: Smartphone, "YouTube Thumbnails": MonitorPlay, Party: PartyPopper,
};

export function QuickCreate() {
  const { repo } = useRepo();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const go = async (id: string) => {
    const s = DESIGN_SIZES.find((d) => d.id === id)!;
    if (!repo) return;
    setBusy(id);
    try {
      router.push(`/editor/${await newProject(repo, { width: s.width, height: s.height, name: `Untitled – ${s.label}`, category: s.category })}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create");
      setBusy(null);
    }
  };
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Start a blank design</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {QUICK.map((q) => {
            const s = DESIGN_SIZES.find((d) => d.id === q.id)!;
            return (
              <button key={q.id} onClick={() => go(q.id)} disabled={!!busy} className="group flex flex-col items-center gap-2 text-center disabled:opacity-60">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${q.color} text-white shadow-soft transition group-hover:-translate-y-0.5 group-hover:shadow-lift`}>
                  <q.icon className="h-6 w-6" />
                </span>
                <span className="text-xs font-medium leading-tight">{s.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_CATEGORIES.map((c) => {
            const Icon = CAT_ICONS[c] ?? LayoutTemplate;
            return (
              <Link key={c} href={`/dashboard/templates?category=${encodeURIComponent(c)}`} className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-sm transition hover:border-brand-300 hover:bg-accent">
                <Icon className="h-4 w-4 text-brand-500" /> {c}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
