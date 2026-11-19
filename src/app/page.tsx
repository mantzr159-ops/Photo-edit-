import Link from "next/link";
import { ArrowRight, Download, LayoutTemplate, MousePointer2, Sparkles, Layers, Cloud } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: MousePointer2, title: "Pro canvas editor", text: "Multi-page designs, snapping guides, layers, grouping, rich text and image masks." },
  { icon: Sparkles, title: "AI design assistant", text: "Describe it — get fully editable layouts, copy, palettes and generated images." },
  { icon: LayoutTemplate, title: "Templates for everything", text: "Social posts, decks, posters, resumes, medical infographics and more." },
  { icon: Download, title: "Real exports", text: "PNG, JPG, multi-page PDF and SVG at any resolution, with transparency." },
  { icon: Cloud, title: "Autosave & cloud sync", text: "Every change saved automatically, with recovery and sharing links." },
  { icon: Layers, title: "Your asset library", text: "Upload once, reuse across projects. Search open-license photos." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
          <Button variant="gradient" asChild><Link href="/dashboard">Open studio</Link></Button>
        </div>
      </header>
      <section className="container relative py-20 text-center md:py-28">
        <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
        <p className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium shadow-soft">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" /> AI-native graphic design
        </p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-6xl">
          Design anything. <span className="text-gradient">Beautifully.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">A complete visual studio with an intelligent canvas, templates and an AI assistant that builds editable designs from a sentence.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" variant="gradient" asChild><Link href="/dashboard">Start designing <ArrowRight /></Link></Button>
          <Button size="lg" variant="outline" asChild><Link href="/dashboard/templates">Browse templates</Link></Button>
        </div>
      </section>
      <section className="container grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-soft">
            <f.icon className="mb-3 h-6 w-6 text-brand-500" />
            <h3 className="font-display font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Lumora Studio · Icons by Lucide (ISC) · Fonts via Google Fonts (OFL)</footer>
    </div>
  );
}
