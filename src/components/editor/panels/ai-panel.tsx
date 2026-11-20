"use client";
import * as React from "react";
import { toast } from "sonner";
import { Check, Copy, ImagePlus, Info, Palette, PenLine, RefreshCw, Save, Sparkles, Wand2, LayoutTemplate, Shapes } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useEditor, selectActivePage, selectSelectedElements } from "@/stores/editor-store";
import type { DesignSpec, TextResult } from "@/lib/ai/schema";
import { ASPECTS, IMAGE_STYLES } from "@/lib/ai/schema";
import { compileDesign } from "@/lib/ai/compile";
import type { Page, TextElement } from "@/lib/design/types";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, Spinner } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageThumb } from "@/components/dashboard/template-thumb";
import { useRepo } from "@/components/providers/repository-provider";
import { uploadImageFile, dataUrlToBlob } from "@/lib/assets";
import { insertPayload } from "@/lib/editor/insert";
import { iconNodeToSvg, loadIconSet } from "@/lib/design/icons";
import { applyPaletteToPage } from "./design-panel";
import { smartTidy } from "@/lib/editor/style-tools";
import type { DeckSpec } from "@/lib/templates/editorial";
import { DECK_THEMES } from "@/lib/templates/editorial";
import { compileDeck } from "@/lib/ai/compile-deck";
import { DECK_STYLES } from "@/lib/ai/schema";
import { cn } from "@/lib/utils/cn";

type ProviderInfo = { id: string; label: string; isAI: boolean };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error ?? `Request failed (${r.status})`), { setup: d.setup, code: d.code });
  return d as T;
}

function ProviderNote({ p }: { p: ProviderInfo | null }) {
  if (!p) return null;
  return p.isAI ? (
    <Badge variant="brand"><Sparkles className="h-3 w-3" /> {p.label}</Badge>
  ) : (
    <p className="flex gap-1.5 rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:text-amber-200">
      <Info className="h-3.5 w-3.5 shrink-0" /> Offline engine (no AI key configured): results use keyword themes and colour theory. Add ANTHROPIC_API_KEY or OPENAI_API_KEY on the server for real AI.
    </p>
  );
}

/* ───────────────────────────── design generation ───────────────────────────── */

const EXAMPLES = [
  "Create a modern medical infographic about hypertension for medical students",
  "Instagram post announcing a summer coffee festival",
  "Minimal poster for a jazz night in Lisbon",
  "Educational slide explaining photosynthesis for kids",
];

function DesignTab() {
  const doc = useEditor((s) => s.doc);
  const [prompt, setPrompt] = React.useState("");
  const [count, setCount] = React.useState(3);
  const [busy, setBusy] = React.useState(false);
  const [provider, setProvider] = React.useState<ProviderInfo | null>(null);
  const [concepts, setConcepts] = React.useState<{ spec: DesignSpec; page: Page }[]>([]);
  const [open, setOpen] = React.useState<number | null>(null);
  if (!doc) return null;

  const generate = async () => {
    setBusy(true);
    setConcepts([]);
    try {
      const d = await postJson<{ provider: ProviderInfo; concepts: DesignSpec[]; warning?: string }>("/api/ai/design", { prompt, width: doc.width, height: doc.height, count });
      setProvider(d.provider);
      if (d.warning) toast.warning(d.warning);
      const compiled = await Promise.all(d.concepts.map(async (spec) => ({ spec, page: await compileDesign(spec, doc.width, doc.height) })));
      setConcepts(compiled);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const apply = (i: number, mode: "new" | "replace") => {
    const s = useEditor.getState();
    const page = structuredClone(concepts[i].page);
    page.id = crypto.randomUUID().slice(0, 12);
    page.elements.forEach((e) => (e.id = crypto.randomUUID().slice(0, 12)));
    if (mode === "new") s.addPage(s.activePageId, page);
    else s.replacePages(s.doc!.pages.map((p) => (p.id === s.activePageId ? { ...page, id: p.id } : p)));
    toast.success("Design added — every element is editable");
  };

  return (
    <div className="space-y-3">
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.stopPropagation()} rows={4} maxLength={2000} placeholder="Describe the design you want…" aria-label="Design prompt" />
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => setPrompt(ex)} className="rounded-full border px-2.5 py-1 text-left text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">{ex.length > 42 ? ex.slice(0, 40) + "…" : ex}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Concepts</label>
        {[1, 2, 3, 4].map((n) => (
          <button key={n} onClick={() => setCount(n)} className={cn("h-7 w-7 rounded-md border text-xs", count === n && "border-brand-500 bg-brand-500/10")}>{n}</button>
        ))}
        <span className="ml-auto text-[11px] text-muted-foreground">{doc.width}×{doc.height}</span>
      </div>
      {/presentation|slides?|deck|keynote|عرض تقديمي|شرائح/i.test(prompt) && <p className="rounded-md bg-brand-500/10 p-2 text-[11px] text-brand-700 dark:text-brand-300">Making a presentation? The <b>Slides</b> tab builds a full art-directed deck.</p>}
      <Button variant="gradient" className="w-full" disabled={busy || prompt.trim().length < 3} onClick={() => void generate()}>
        {busy ? <Spinner /> : <Sparkles />} {busy ? "Designing…" : "Generate designs"}
      </Button>
      <ProviderNote p={provider} />
      {concepts.map((c, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <div className="flex justify-center bg-muted/50 p-2">
            <div className={cn("overflow-hidden rounded shadow-sm", doc.width >= doc.height ? "w-full" : "h-48")} style={{ aspectRatio: `${doc.width}/${doc.height}` }}>
              <PageThumb cacheKey={`concept:${c.page.id}`} page={c.page} width={doc.width} height={doc.height} className="h-full w-full" />
            </div>
          </div>
          <div className="space-y-2 p-3">
            <p className="text-sm font-semibold">{c.spec.title}</p>
            <p className="text-xs text-muted-foreground">{c.spec.concept}</p>
            <div className="flex h-4 overflow-hidden rounded">
              {Object.values(c.spec.palette).map((col, j) => <span key={j} className="flex-1" style={{ background: col }} title={col} />)}
            </div>
            <button className="text-[11px] font-medium text-brand-600 hover:underline" onClick={() => setOpen(open === i ? null : i)}>{open === i ? "Hide" : "Show"} design rationale</button>
            {open === i && (
              <div className="space-y-1.5 rounded-md bg-muted/60 p-2 text-[11px]">
                <p><b>Layout:</b> {c.spec.layout} · <b>Mood:</b> {c.spec.mood}</p>
                <p><b>Typography:</b> {c.spec.typography.heading} / {c.spec.typography.body} — {c.spec.typography.rationale}</p>
                <p><b>Hierarchy:</b> {c.spec.hierarchy.join(" → ")}</p>
                <p><b>Icons:</b> {[...new Set([...c.spec.sections.map((s) => s.icon), ...c.spec.suggestedIcons])].slice(0, 10).join(", ")}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => apply(i, "new")}>Add as page</Button>
              <Button size="sm" variant="outline" onClick={() => apply(i, "replace")}>Replace page</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


/* ───────────────────────────── presentation decks ───────────────────────────── */

const DECK_EXAMPLES = [
  "Grand rounds talk on home blood-pressure monitoring for cardiology residents",
  "Investor update for a sustainable food startup, Q4 results",
  "Launch keynote for a smart desk lamp",
  "عرض تقديمي عن خطة شركة ناشئة للتوسع في العراق",
];

const STYLE_LABEL: Record<(typeof DECK_STYLES)[number], string> = { swiss: "Swiss", editorial: "Editorial", journal: "Journal", keynote: "Keynote", forest: "Forest" };

function SlidesTab() {
  const doc = useEditor((s) => s.doc);
  const [prompt, setPrompt] = React.useState("");
  const [count, setCount] = React.useState(8);
  const [style, setStyle] = React.useState<(typeof DECK_STYLES)[number] | "auto">("auto");
  const [busy, setBusy] = React.useState(false);
  const [provider, setProvider] = React.useState<ProviderInfo | null>(null);
  const [result, setResult] = React.useState<{ deck: DeckSpec; pages: Page[] } | null>(null);
  if (!doc) return null;
  const W = 1920, H = 1080;

  const generate = async () => {
    setBusy(true);
    setResult(null);
    try {
      const d = await postJson<{ provider: ProviderInfo; deck: DeckSpec; warning?: string }>("/api/ai/deck", { prompt, slides: count, style });
      setProvider(d.provider);
      if (d.warning) toast.warning(d.warning);
      setResult({ deck: d.deck, pages: await compileDeck(d.deck, W, H) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const fresh = (pages: Page[]) =>
    pages.map((p) => ({ ...structuredClone(p), id: crypto.randomUUID().slice(0, 12), elements: p.elements.map((e) => ({ ...structuredClone(e), id: crypto.randomUUID().slice(0, 12) })) }));

  const apply = (mode: "replace" | "append") => {
    if (!result) return;
    const s = useEditor.getState();
    const sameSize = s.doc!.width === W && s.doc!.height === H;
    if (mode === "replace") {
      s.replacePages(fresh(result.pages), { width: W, height: H });
      if (!s.doc!.name || s.doc!.name.startsWith("Untitled")) s.setName(result.deck.title);
    } else {
      if (!sameSize) return toast.error("Slides are 1920×1080. Use “Replace design” or resize your design to 16:9 first.");
      s.appendPages(fresh(result.pages));
    }
    toast.success(`${result.pages.length} slides added — every element is editable`);
  };

  return (
    <div className="space-y-3">
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.stopPropagation()} rows={4} maxLength={3000} placeholder="What is the presentation about, and who is it for?" aria-label="Presentation prompt" />
      <div className="flex flex-wrap gap-1.5">
        {DECK_EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => setPrompt(ex)} dir="auto" className="rounded-full border px-2.5 py-1 text-left text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">{ex.length > 44 ? ex.slice(0, 42) + "…" : ex}</button>
        ))}
      </div>
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Art direction</p>
        <div className="grid grid-cols-3 gap-1">
          {(["auto", ...DECK_STYLES] as const).map((st) => (
            <button key={st} onClick={() => setStyle(st)} className={cn("flex items-center gap-1.5 rounded-md border px-1.5 py-1.5 text-[11px] hover:bg-accent", style === st && "border-brand-500 bg-brand-500/10")}>
              {st !== "auto" && <span className="h-3 w-3 shrink-0 rounded-sm border" style={{ background: DECK_THEMES[st].paper, boxShadow: `inset -5px 0 0 ${DECK_THEMES[st].accent}` }} />}
              {st === "auto" ? "Auto" : STYLE_LABEL[st]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Slides</span>
        <input type="range" min={4} max={14} value={count} onChange={(e) => setCount(Number(e.target.value))} className="flex-1 accent-brand-500" aria-label="Number of slides" />
        <span className="w-6 text-right text-xs tabular-nums">{count}</span>
      </div>
      <Button variant="gradient" className="w-full" disabled={busy || prompt.trim().length < 3} onClick={() => void generate()}>
        {busy ? <Spinner /> : <Sparkles />} {busy ? "Art-directing your deck…" : "Generate presentation"}
      </Button>
      <ProviderNote p={provider} />
      {result && (
        <div className="space-y-2 rounded-xl border bg-card p-2">
          <div className="px-1">
            <p className="text-sm font-semibold" dir="auto">{result.deck.title}</p>
            <p className="text-[11px] text-muted-foreground">{STYLE_LABEL[result.deck.style]} · {result.pages.length} slides · each slide a different composition</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {result.pages.map((pg, i) => (
              <div key={pg.id} className="relative overflow-hidden rounded border" style={{ aspectRatio: "16/9" }}>
                <PageThumb cacheKey={`deck:${pg.id}`} page={pg} width={W} height={H} maxSide={480} className="h-full w-full" />
                <span className="absolute bottom-0.5 left-1 rounded bg-black/50 px-1 text-[9px] text-white">{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => apply("replace")}>Replace design</Button>
            <Button size="sm" variant="outline" onClick={() => apply("append")}>Add slides</Button>
          </div>
          <p className="px-1 text-[10px] text-muted-foreground">Image areas are placeholders — drag a photo onto them. Check every figure before presenting.</p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── image generation ───────────────────────────── */

function ImageTab() {
  const { repo } = useRepo();
  const [prompt, setPrompt] = React.useState("");
  const [style, setStyle] = React.useState<(typeof IMAGE_STYLES)[number]>("photorealistic");
  const [aspect, setAspect] = React.useState<(typeof ASPECTS)[number]>("1:1");
  const [count, setCount] = React.useState(2);
  const [busy, setBusy] = React.useState(false);
  const [images, setImages] = React.useState<{ dataUrl: string; saved?: string; dims?: { w: number; h: number } }[]>([]);
  const [setup, setSetup] = React.useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setSetup(null);
    try {
      const d = await postJson<{ images: { dataUrl: string }[] }>("/api/ai/image", { prompt, style, aspect, count });
      setImages((prev) => [...d.images.map((i) => ({ dataUrl: i.dataUrl })), ...prev].slice(0, 12));
    } catch (e) {
      const err = e as Error & { setup?: string; code?: string };
      if (err.code === "not_configured") setSetup(err.setup ?? null);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (i: number) => {
    if (!repo) return null;
    const img = images[i];
    if (img.saved) return img;
    const blob = await dataUrlToBlob(img.dataUrl);
    const asset = await uploadImageFile(repo, new File([blob], `ai-${prompt.slice(0, 30).replace(/[^\w]+/g, "-")}.png`, { type: blob.type || "image/png" }), { source: "ai" });
    const next = { ...img, saved: asset.src, dims: { w: asset.width ?? 1024, h: asset.height ?? 1024 } };
    setImages((list) => list.map((x, j) => (j === i ? next : x)));
    window.dispatchEvent(new Event("lumora:assets-changed"));
    return next;
  };

  return (
    <div className="space-y-3">
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.stopPropagation()} rows={3} maxLength={1500} placeholder="A cozy reading nook with warm morning light…" aria-label="Image prompt" />
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Style</p>
        <div className="grid grid-cols-3 gap-1">
          {IMAGE_STYLES.map((s) => (
            <button key={s} onClick={() => setStyle(s)} className={cn("rounded-md border px-1 py-1.5 text-[11px] capitalize hover:bg-accent", style === s && "border-brand-500 bg-brand-500/10")}>{s === "3d" ? "3D" : s}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-muted-foreground">Ratio</span>
        {ASPECTS.map((a) => (
          <button key={a} onClick={() => setAspect(a)} className={cn("rounded-md border px-1.5 py-1 text-[11px]", aspect === a && "border-brand-500 bg-brand-500/10")}>{a}</button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-muted-foreground">Variations</span>
        {[1, 2, 3, 4].map((n) => (
          <button key={n} onClick={() => setCount(n)} className={cn("h-7 w-7 rounded-md border text-xs", count === n && "border-brand-500 bg-brand-500/10")}>{n}</button>
        ))}
      </div>
      <Button variant="gradient" className="w-full" disabled={busy || prompt.trim().length < 3} onClick={() => void generate()}>
        {busy ? <Spinner /> : <ImagePlus />} {busy ? "Generating…" : images.length ? "Regenerate" : "Generate images"}
      </Button>
      {setup && <p className="rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:text-amber-200"><b>Setup needed:</b> {setup}</p>}
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <div key={i} className="group relative overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.dataUrl} alt={`Generated ${i + 1}`} className="w-full" />
            <div className="absolute inset-x-1 bottom-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
              <Button size="sm" className="h-7 flex-1 px-1 text-[11px]" onClick={async () => {
                try {
                  const s = await save(i);
                  if (s?.saved) insertPayload({ kind: "image", src: s.saved, width: s.dims?.w, height: s.dims?.h, name: "AI image" });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not insert");
                }
              }}>Insert</Button>
              <Button size="icon-sm" variant="secondary" className="h-7 w-7" aria-label="Save to uploads" onClick={async () => { await save(i); toast.success("Saved to uploads"); }}>
                {img.saved ? <Check /> : <Save />}
              </Button>
            </div>
          </div>
        ))}
      </div>
      {!!images.length && <Button size="sm" variant="ghost" className="w-full" onClick={() => void generate()} disabled={busy}><RefreshCw /> More variations</Button>}
    </div>
  );
}

/* ───────────────────────────── writing / palettes / icons / layout ───────────────────────────── */

function useTextTask() {
  const [busy, setBusy] = React.useState(false);
  const [provider, setProvider] = React.useState<ProviderInfo | null>(null);
  const run = async (body: Record<string, unknown>): Promise<TextResult | null> => {
    setBusy(true);
    try {
      const d = await postJson<{ provider: ProviderInfo; result: TextResult }>("/api/ai/text", body);
      setProvider(d.provider);
      return d.result;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, provider, run };
}

function WriteTab() {
  const selected = useEditor(useShallow(selectSelectedElements));
  const textEl = selected.find((e): e is TextElement => e.type === "text");
  const [input, setInput] = React.useState("");
  const [tone, setTone] = React.useState("professional");
  const [platform, setPlatform] = React.useState("instagram");
  const [result, setResult] = React.useState<TextResult | null>(null);
  const { busy, provider, run } = useTextTask();
  React.useEffect(() => {
    if (textEl) setInput(textEl.text);
  }, [textEl?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = async (task: string) => {
    const r = await run({ task, input, tone, platform });
    if (r) setResult(r);
  };
  const applyText = (t: string) => {
    if (textEl) useEditor.getState().updateElement(textEl.id, { text: t });
    else insertPayload({ kind: "text", preset: "body", text: t });
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">{textEl ? "Working on the selected text box." : "Type text below, or select a text box on the canvas."}</p>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.stopPropagation()} rows={4} maxLength={6000} placeholder="Text or topic…" aria-label="Text input" />
      <div className="grid grid-cols-2 gap-2">
        <select value={tone} onChange={(e) => setTone(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs" aria-label="Tone">
          {["professional", "friendly", "playful", "persuasive", "academic", "concise"].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)} tone</option>)}
        </select>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs" aria-label="Platform">
          {["instagram", "tiktok", "linkedin", "x", "facebook", "youtube"].map((t) => <option key={t} value={t}>{t === "x" ? "X / Twitter" : t[0].toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" disabled={busy || !input.trim()} onClick={() => void go("rewrite")}><PenLine /> Rewrite</Button>
        <Button size="sm" variant="outline" disabled={busy || !input.trim()} onClick={() => void go("summarize")}>Summarize</Button>
        <Button size="sm" variant="outline" disabled={busy || !input.trim()} onClick={() => void go("headlines")}>Headlines</Button>
        <Button size="sm" variant="outline" disabled={busy || !input.trim()} onClick={() => void go("social")}>Social post</Button>
      </div>
      {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Spinner /> Working…</div>}
      <ProviderNote p={provider} />
      {result?.text && (
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
          <p className="whitespace-pre-wrap text-sm">{result.text}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => applyText(result.text)}>{textEl ? "Replace text" : "Add to canvas"}</Button>
            <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText([result.text, result.items.join(" ")].filter(Boolean).join("\n\n")); toast.success("Copied"); }}><Copy /> Copy</Button>
          </div>
        </div>
      )}
      {!!result?.items.length && (
        <div className="space-y-1">
          {result.items.map((it, i) => (
            <button key={i} onClick={() => applyText(it)} className="block w-full rounded-md border px-2.5 py-2 text-left text-sm hover:border-brand-300 hover:bg-accent">{it}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestTab() {
  const page = useEditor(selectActivePage);
  const doc = useEditor((s) => s.doc);
  const [brief, setBrief] = React.useState("");
  const [palettes, setPalettes] = React.useState<TextResult["palettes"]>([]);
  const [icons, setIcons] = React.useState<string[]>([]);
  const [tips, setTips] = React.useState<{ text: string; items: string[] } | null>(null);
  const [iconSet, setIconSet] = React.useState<Record<string, [string, Record<string, string | number>][]> | null>(null);
  const { busy, provider, run } = useTextTask();
  React.useEffect(() => void loadIconSet().then(setIconSet), []);
  if (!page || !doc) return null;
  const describe = () =>
    brief.trim() ||
    page.elements.filter((e): e is TextElement => e.type === "text").map((t) => t.text).join(" ").slice(0, 1500) ||
    doc.name;

  return (
    <div className="space-y-3">
      <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} onKeyDown={(e) => e.stopPropagation()} rows={2} placeholder="Describe the topic or mood (optional — uses your page text otherwise)" aria-label="Brief" />
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={async () => { const r = await run({ task: "palette", input: describe() }); if (r) setPalettes(r.palettes); }}><Palette /> Palettes</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={async () => { const r = await run({ task: "elements", input: describe() }); if (r) setIcons(r.items.filter((n) => iconSet && n in iconSet)); }}><Shapes /> Elements</Button>
        <Button
          size="sm"
          variant="outline"
          className="col-span-2"
          disabled={busy}
          onClick={async () => {
            const summary = { page: { width: doc.width, height: doc.height, background: typeof page.background.fill === "string" ? page.background.fill : "#ffffff" }, elements: page.elements.map((e) => ({ type: e.type, x: Math.round(e.x), y: Math.round(e.y), width: Math.round(e.width), height: Math.round(e.height), ...(e.type === "text" ? { text: e.text.slice(0, 80), fontSize: Math.round(e.fontSize), fill: e.fill } : {}) })) };
            const r = await run({ task: "layout-critique", input: JSON.stringify(summary).slice(0, 6000) });
            if (r) setTips({ text: r.text, items: r.items });
          }}
        >
          <LayoutTemplate /> Review my layout
        </Button>
      </div>
      {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Spinner /> Thinking…</div>}
      <ProviderNote p={provider} />
      {palettes.map((p, i) => (
        <button key={i} onClick={() => applyPaletteToPage(p.colors)} className="flex w-full items-center gap-2 rounded-lg border p-1.5 hover:border-brand-300" title="Apply to page">
          <span className="flex h-7 flex-1 overflow-hidden rounded">{p.colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</span>
          <span className="w-20 truncate text-left text-xs">{p.name}</span>
        </button>
      ))}
      {!!icons.length && iconSet && (
        <div className="grid grid-cols-6 gap-1.5">
          {icons.map((n) => (
            <button key={n} title={n} onClick={() => insertPayload({ kind: "icon", icon: n })} className="flex aspect-square items-center justify-center rounded-md border hover:bg-accent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={n} className="h-6 w-6 dark:invert" src={"data:image/svg+xml;charset=utf-8," + encodeURIComponent(iconNodeToSvg(iconSet[n], "#16132b", 2, 24))} />
            </button>
          ))}
        </div>
      )}
      {tips && (
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="font-medium">{tips.text}</p>
          <ul className="list-disc space-y-1 pl-4 text-xs">{tips.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const patches = smartTidy(page, doc.width, doc.height);
              if (!patches.length) return toast.info("Nothing to tidy automatically.");
              useEditor.getState().patchElements(patches);
              toast.success(`Auto-tidied ${patches.length} elements`);
            }}
          >
            <Wand2 /> Auto-tidy alignment
          </Button>
        </div>
      )}
    </div>
  );
}

export function AIPanel() {
  return (
    <Tabs defaultValue="design">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="design" className="px-1">Design</TabsTrigger>
        <TabsTrigger value="slides" className="px-1">Slides</TabsTrigger>
        <TabsTrigger value="image" className="px-1">Image</TabsTrigger>
        <TabsTrigger value="write" className="px-1">Write</TabsTrigger>
        <TabsTrigger value="suggest" className="px-1">Ideas</TabsTrigger>
      </TabsList>
      <TabsContent value="design"><DesignTab /></TabsContent>
      <TabsContent value="slides"><SlidesTab /></TabsContent>
      <TabsContent value="image"><ImageTab /></TabsContent>
      <TabsContent value="write"><WriteTab /></TabsContent>
      <TabsContent value="suggest"><SuggestTab /></TabsContent>
    </Tabs>
  );
}
