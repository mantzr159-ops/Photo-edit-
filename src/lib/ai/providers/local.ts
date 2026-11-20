/**
 * Offline heuristic engine — used when no AI provider key is configured.
 * It is NOT a language model: it uses keyword themes, extractive
 * summarisation and colour theory. The UI labels its output accordingly.
 */
import { contrastRatio, harmony, hexToHsl, hslToHex } from "@/lib/utils/color";
import type { AIDeck, DeckRequest, DesignRequest, DesignSpec, TextRequest, TextResult } from "../schema";
import type { TextProvider } from "./types";

type Theme = {
  keys: string[];
  palette: DesignSpec["palette"];
  heading: string;
  body: string;
  icons: string[];
  sections: [string, string][];
  mood: string;
  decoration: DesignSpec["decoration"];
};

const THEMES: Record<string, Theme> = {
  medical: {
    keys: ["medical", "medicine", "health", "hypertension", "diabetes", "cardio", "heart", "clinic", "patient", "doctor", "nurse", "disease", "anatomy", "pharma", "student", "symptom", "hospital", "blood"],
    palette: { background: "#f5fbff", surface: "#ffffff", primary: "#c1121f", secondary: "#0f4c81", accent: "#ff6b5a", text: "#16132b", mutedText: "#4a5d75" },
    heading: "Plus Jakarta Sans", body: "Inter",
    icons: ["HeartPulse", "Stethoscope", "Activity", "Pill", "Brain", "Microscope", "Thermometer", "ShieldCheck"],
    sections: [["Definition", "What it is and how it is classified."], ["Risk factors", "Who is most likely to be affected and why."], ["Signs & symptoms", "What to look for in clinical presentation."], ["Diagnosis", "Key investigations and diagnostic criteria."], ["Management", "First-line treatment and lifestyle measures."], ["Prevention", "Evidence-based steps that lower risk."]],
    mood: "clinical, trustworthy, clear", decoration: "circles",
  },
  tech: {
    keys: ["tech", "ai", "software", "app", "startup", "saas", "data", "cyber", "cloud", "code", "digital", "launch", "product", "robot"],
    palette: { background: "#0b0820", surface: "#16132b", primary: "#7444ff", secondary: "#2ec4b6", accent: "#ff6b5a", text: "#ffffff", mutedText: "#b8b3cc" },
    heading: "Space Grotesk", body: "Inter",
    icons: ["Rocket", "Cpu", "Cloud", "Zap", "ShieldCheck", "ChartBar", "Code", "Sparkles"],
    sections: [["The problem", "Why the status quo no longer works."], ["Our approach", "A smarter, faster way forward."], ["Key features", "Built for speed, scale and security."], ["Results", "Measurable impact from day one."]],
    mood: "futuristic, bold, energetic", decoration: "blobs",
  },
  nature: {
    keys: ["nature", "eco", "green", "climate", "plant", "garden", "earth", "sustainab", "organic", "environment", "forest", "ocean"],
    palette: { background: "#f1f5ee", surface: "#ffffff", primary: "#3a5a40", secondary: "#588157", accent: "#e9c46a", text: "#1b2a1e", mutedText: "#4f6352" },
    heading: "Fraunces", body: "DM Sans",
    icons: ["Leaf", "Sprout", "TreePine", "Sun", "Droplets", "Recycle", "Wind", "Globe"],
    sections: [["Why it matters", "Small choices add up to big change."], ["What you can do", "Simple daily habits with real impact."], ["The numbers", "A snapshot of where we stand today."], ["Join in", "Be part of the community making a difference."]],
    mood: "calm, organic, hopeful", decoration: "blobs",
  },
  food: {
    keys: ["food", "cafe", "coffee", "restaurant", "menu", "recipe", "bake", "pizza", "kitchen", "chef", "dessert", "drink"],
    palette: { background: "#fff6ec", surface: "#ffffff", primary: "#bc4b26", secondary: "#3a2a20", accent: "#f6c28b", text: "#2a1d15", mutedText: "#6e5444" },
    heading: "DM Serif Display", body: "DM Sans",
    icons: ["Coffee", "UtensilsCrossed", "ChefHat", "Pizza", "Croissant", "Wine", "Cookie", "Soup"],
    sections: [["Fresh daily", "Made from scratch with local ingredients."], ["Signature picks", "The dishes our regulars love most."], ["Visit us", "Open every day — come hungry."]],
    mood: "warm, inviting, appetising", decoration: "dots",
  },
  education: {
    keys: ["school", "education", "lesson", "learn", "class", "teacher", "kids", "course", "study", "university", "exam", "science", "math", "history", "worksheet"],
    palette: { background: "#fdf0d5", surface: "#ffffff", primary: "#003049", secondary: "#f77f00", accent: "#c1121f", text: "#003049", mutedText: "#335c67" },
    heading: "Nunito", body: "Nunito",
    icons: ["GraduationCap", "BookOpen", "Lightbulb", "Pencil", "School", "Calculator", "FlaskConical", "Atom"],
    sections: [["Learning goals", "What you will be able to do by the end."], ["Key concepts", "The big ideas, explained simply."], ["Try it", "A quick activity to practise."], ["Remember", "The one thing to take away."]],
    mood: "friendly, clear, encouraging", decoration: "dots",
  },
  luxury: {
    keys: ["luxury", "wedding", "elegant", "fashion", "jewel", "gala", "premium", "boutique", "beauty", "spa", "invitation"],
    palette: { background: "#fbf7f2", surface: "#ffffff", primary: "#7a5c2e", secondary: "#c9a96e", accent: "#16132b", text: "#16132b", mutedText: "#6b6585" },
    heading: "Cormorant Garamond", body: "Lato",
    icons: ["Gem", "Crown", "Flower2", "Sparkles", "Star", "Heart", "Wine", "Gift"],
    sections: [["The occasion", "An evening to remember."], ["Details", "Date, time and place."], ["RSVP", "Kindly reply at your earliest convenience."]],
    mood: "refined, timeless, elegant", decoration: "lines",
  },
  fitness: {
    keys: ["fitness", "gym", "workout", "sport", "run", "yoga", "training", "athlete", "marathon", "exercise"],
    palette: { background: "#111111", surface: "#1d1d1d", primary: "#d4ff3f", secondary: "#ff3b6b", accent: "#ffffff", text: "#ffffff", mutedText: "#b5b5b5" },
    heading: "Anton", body: "Inter",
    icons: ["Dumbbell", "Timer", "Flame", "Trophy", "HeartPulse", "Bike", "Footprints", "Target"],
    sections: [["Warm up", "Prime your body for peak performance."], ["Train", "High-intensity intervals that deliver."], ["Recover", "Stretch, hydrate and rest well."]],
    mood: "intense, energetic, bold", decoration: "lines",
  },
  business: {
    keys: ["business", "finance", "corporate", "marketing", "report", "sales", "investor", "pitch", "company", "conference", "webinar", "hiring", "job", "resume"],
    palette: { background: "#ffffff", surface: "#f4f6fb", primary: "#0f4c81", secondary: "#00a6fb", accent: "#ff9f1c", text: "#14213d", mutedText: "#4a5873" },
    heading: "Montserrat", body: "Inter",
    icons: ["Briefcase", "TrendingUp", "ChartPie", "Handshake", "Target", "Building2", "Users", "BadgeCheck"],
    sections: [["Overview", "Where we are and where we're headed."], ["Highlights", "Key wins from this period."], ["Strategy", "Our priorities for the next quarter."], ["Next steps", "What happens now and who owns it."]],
    mood: "confident, professional, clean", decoration: "gradient",
  },
  party: {
    keys: ["party", "birthday", "celebrat", "festival", "concert", "music", "event", "night", "dj", "holiday", "christmas", "halloween"],
    palette: { background: "#1a0b2e", surface: "#2a1450", primary: "#ff3b6b", secondary: "#ffd23f", accent: "#2ec4b6", text: "#ffffff", mutedText: "#d8c9f2" },
    heading: "Bebas Neue", body: "Poppins",
    icons: ["PartyPopper", "Music", "Cake", "Gift", "Sparkles", "Ticket", "Mic", "Star"],
    sections: [["When", "Save the date and bring your friends."], ["Where", "Easy to find, hard to leave."], ["What to expect", "Music, food and good vibes all night."]],
    mood: "festive, vibrant, playful", decoration: "circles",
  },
  travel: {
    keys: ["travel", "trip", "tour", "vacation", "beach", "hotel", "adventure", "city", "explore", "flight"],
    palette: { background: "#e8f6f8", surface: "#ffffff", primary: "#0077b6", secondary: "#00b4d8", accent: "#ff9f1c", text: "#03263a", mutedText: "#3d6378" },
    heading: "Poppins", body: "Poppins",
    icons: ["Plane", "MapPin", "Compass", "Camera", "Mountain", "Palmtree", "Luggage", "Globe"],
    sections: [["Where to go", "Hidden gems off the beaten path."], ["What to do", "Experiences you won't forget."], ["Travel tips", "Plan smarter, travel lighter."]],
    mood: "adventurous, fresh, bright", decoration: "waves",
  },
};

const STOP = new Set("a an the of for to and or in on at with about create make design build modern simple beautiful nice please me my our your is are be that this using from by as it into new".split(" "));

function detectTheme(prompt: string): Theme {
  const p = prompt.toLowerCase();
  let best: Theme = THEMES.business;
  let score = 0;
  for (const t of Object.values(THEMES)) {
    const s = t.keys.reduce((acc, k) => acc + (p.includes(k) ? 1 : 0), 0);
    if (s > score) {
      score = s;
      best = t;
    }
  }
  return best;
}

/** Extract the subject of a brief, e.g. "…infographic about hypertension for…" → "Hypertension". */
export function extractTopic(prompt: string): string {
  const m = /\b(?:about|on|for|of)\s+([^,.;]+?)(?:\s+for\s+|\s+aimed\s+|\s+targeting\s+|[,.;]|$)/i.exec(prompt);
  let topic = m?.[1] ?? prompt;
  topic = topic.replace(/\b(a|an|the)\b/gi, "").trim();
  const words = topic.split(/\s+/).filter((w) => w && !STOP.has(w.toLowerCase())).slice(0, 5);
  const t = words.join(" ") || "Your big idea";
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

function audience(prompt: string) {
  return /\bfor\s+([^,.;]+)$/i.exec(prompt.trim())?.[1]?.trim();
}

function variantPalette(base: DesignSpec["palette"], i: number): DesignSpec["palette"] {
  if (i === 0) return base;
  if (i === 1) {
    // inverted: dark background using primary
    const bgc = hslToHex({ ...hexToHsl(base.primary), l: 14 });
    return { ...base, background: bgc, surface: hslToHex({ ...hexToHsl(base.primary), l: 20 }), text: "#ffffff", mutedText: "#d9d6e8", accent: base.accent };
  }
  const h = harmony(base.primary, i === 2 ? "triadic" : "split");
  return { ...base, primary: h[1], secondary: h[2], accent: h[0], background: "#ffffff", surface: hslToHex({ ...hexToHsl(h[1]), s: 40, l: 96 }), text: "#16132b", mutedText: "#4a4566" };
}

export class LocalTextProvider implements TextProvider {
  readonly id = "local" as const;
  readonly label = "Built-in offline engine";
  readonly isAI = false;

  async generateDesigns(req: DesignRequest): Promise<DesignSpec[]> {
    const theme = detectTheme(req.prompt);
    const topic = extractTopic(req.prompt);
    const who = audience(req.prompt);
    const tall = req.height > req.width * 1.3;
    const wide = req.width > req.height * 1.3;
    const isInfo = /infographic|guide|steps|overview|facts|poster/i.test(req.prompt);
    const layouts: DesignSpec["layout"][] = tall ? (isInfo ? ["infographic", "list", "poster", "grid"] : ["poster", "infographic", "list", "hero"]) : wide ? ["split", "hero", "grid", "list"] : ["hero", "grid", "poster", "split"];
    const fonts: [string, string][] = [[theme.heading, theme.body], ["Playfair Display", "Inter"], ["Poppins", "Poppins"], ["Montserrat", "Lora"]];
    return Array.from({ length: req.count }, (_, i) => {
      const palette = variantPalette(theme.palette, i);
      const sectionCount = layouts[i % layouts.length] === "hero" || layouts[i % layouts.length] === "poster" ? 3 : Math.min(theme.sections.length, tall ? 6 : 4);
      return {
        concept: `Offline concept ${i + 1}: a ${theme.mood} ${layouts[i % layouts.length]} layout about ${topic}. (Generated without an AI model — connect a provider for tailored copy.)`,
        title: topic,
        subtitle: who ? `A visual guide for ${who}` : `Everything you need to know`,
        eyebrow: theme === THEMES.medical ? "Medical education" : theme.mood.split(",")[0].toUpperCase(),
        layout: layouts[i % layouts.length],
        palette,
        typography: { heading: fonts[i % fonts.length][0], body: fonts[i % fonts.length][1], rationale: "Contrasting display face for headings with a highly legible body face." },
        hierarchy: ["Title", "Subtitle", "Section headings", "Section body", "Footer"],
        sections: theme.sections.slice(0, sectionCount).map(([h, b], j) => ({ heading: h, body: b, icon: theme.icons[j % theme.icons.length] })),
        callToAction: theme === THEMES.medical || theme === THEMES.education ? "" : "Learn more",
        footer: theme === THEMES.medical ? "For educational purposes — verify against current guidelines." : "",
        suggestedIcons: theme.icons,
        decoration: (i === 0 ? theme.decoration : (["circles", "blobs", "gradient", "lines"] as const)[i % 4]),
        mood: theme.mood,
      } satisfies DesignSpec;
    });
  }

  async generateDeck(req: DeckRequest): Promise<AIDeck> {
    return offlineDeck(req);
  }

  async runTextTask(req: TextRequest): Promise<TextResult> {
    const empty: TextResult = { text: "", items: [], palettes: [] };
    const input = req.input.trim();
    switch (req.task) {
      case "summarize":
        return { ...empty, text: summarize(input) };
      case "rewrite":
        return { ...empty, text: rewrite(input, req.tone ?? "professional") };
      case "headlines": {
        const t = extractTopic(input);
        return {
          ...empty,
          items: [`The Ultimate Guide to ${t}`, `${t}, Explained`, `5 Things to Know About ${t}`, `Rethinking ${t}`, `${t}: What Really Matters`, `Your ${t} Starts Here`],
        };
      }
      case "social": {
        const t = extractTopic(input);
        const tags = keywords(input, 8).map((k) => `#${k.replace(/[^a-z0-9]/gi, "")}`);
        return { ...empty, text: `✨ ${t} — here's what you need to know.\n\n${summarize(input, 2)}\n\nSave this for later and share it with someone who needs it! 👇`, items: tags };
      }
      case "palette": {
        const theme = detectTheme(input);
        const base = theme.palette.primary;
        return {
          ...empty,
          palettes: [
            { name: "Signature", colors: [theme.palette.background, theme.palette.primary, theme.palette.secondary, theme.palette.accent, theme.palette.text] },
            { name: "Analogous", colors: harmony(base, "analogous") },
            { name: "Complementary", colors: harmony(base, "complementary") },
            { name: "Triadic", colors: harmony(base, "triadic") },
          ],
        };
      }
      case "elements": {
        const theme = detectTheme(input);
        return { ...empty, items: [...theme.icons, "Sparkles", "Star", "Check", "ArrowRight"] };
      }
      case "layout-critique":
        return { ...empty, ...critique(input) };
    }
  }
}

/* ───────── helpers ───────── */

function keywords(text: string, n: number) {
  const freq = new Map<string, number>();
  for (const w of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) if (!STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
}

/** Extractive summary: score sentences by keyword frequency, keep original order. */
export function summarize(text: string, maxSentences?: number) {
  const sentences = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  if (sentences.length <= 2) return text;
  const keep = maxSentences ?? Math.max(1, Math.round(sentences.length * 0.35));
  const kw = new Map(keywords(text, 20).map((k, i) => [k, 20 - i]));
  const scored = sentences.map((s, i) => ({ i, s, score: (s.toLowerCase().match(/[a-z']+/g) ?? []).reduce((a, w) => a + (kw.get(w) ?? 0), 0) / Math.sqrt(s.length + 1) }));
  return scored.sort((a, b) => b.score - a.score).slice(0, keep).sort((a, b) => a.i - b.i).map((x) => x.s).join(" ");
}

function rewrite(text: string, tone: string) {
  const t = text.replace(/\s+/g, " ").trim();
  switch (tone) {
    case "concise": return summarize(t, Math.max(1, Math.ceil((t.match(/[.!?]/g)?.length ?? 1) / 2)));
    case "playful": return t.replace(/\.(\s|$)/g, "!$1") + " 🎉";
    case "persuasive": return `Imagine this: ${t.charAt(0).toLowerCase()}${t.slice(1)} Don't miss out.`;
    case "friendly": return `Hey there! ${t}`;
    case "academic": return t.replace(/\bget\b/gi, "obtain").replace(/\bshow\b/gi, "demonstrate").replace(/\bbig\b/gi, "substantial");
    default: return t.charAt(0).toUpperCase() + t.slice(1);
  }
}

function critique(input: string): Pick<TextResult, "text" | "items"> {
  let els: { type: string; x: number; y: number; width: number; height: number; fontSize?: number; fill?: string }[] = [];
  let page = { width: 1000, height: 1000, background: "#ffffff" };
  try {
    const parsed = JSON.parse(input);
    els = parsed.elements ?? [];
    page = { ...page, ...parsed.page };
  } catch {
    /* ignore */
  }
  const tips: string[] = [];
  const texts = els.filter((e) => e.type === "text");
  const sizes = [...new Set(texts.map((t) => Math.round(t.fontSize ?? 0)))].sort((a, b) => b - a);
  if (sizes.length > 4) tips.push(`You use ${sizes.length} different font sizes — limit to 3–4 for a clearer hierarchy.`);
  if (sizes.length >= 2 && sizes[0] / sizes[1] < 1.4) tips.push("Make the headline noticeably larger (≈1.5× the next size) to strengthen hierarchy.");
  const margin = Math.min(page.width, page.height) * 0.05;
  if (els.some((e) => e.x < margin * 0.5 && e.x > -1 && e.width < page.width * 0.95)) tips.push("Some elements hug the left edge — keep a consistent outer margin of ~5% of the canvas.");
  const lefts = texts.map((t) => Math.round(t.x / 10));
  if (new Set(lefts).size > 3) tips.push("Text blocks start at many different x positions — align them to a shared left edge or centre axis.");
  if (texts.some((t) => typeof t.fill === "string" && t.fill.startsWith("#") && page.background.startsWith("#") && contrastRatio(t.fill, page.background) < 3)) tips.push("Check text contrast against the background — some text may be hard to read.");
  if (els.length > 25) tips.push("The layout is busy — consider removing decorative elements to give content room to breathe.");
  if (!tips.length) tips.push("Hierarchy and alignment look solid. Try adding one accent colour to draw the eye to the key message.");
  return { text: `Heuristic review of ${els.length} elements (offline engine).`, items: tips };
}

/* ───────── offline presentation engine ───────── */

type Slide = AIDeck["slides"][number];
const S = (kind: Slide["kind"], o: Partial<Slide>): Slide => ({ kind, label: "", heading: "", body: "", number: "", items: [], quote: "", attribution: "", footnote: "", ...o });

/**
 * Deterministic deck scaffold. It never invents facts: figures are explicit
 * placeholders and every data slide says so, so the user replaces them.
 */
export function offlineDeck(req: DeckRequest): AIDeck {
  const ar = /[\u0600-\u06FF]/.test(req.prompt);
  const theme = detectTheme(req.prompt);
  const style: AIDeck["style"] =
    req.style !== "auto" ? req.style
    : theme === THEMES.medical || theme === THEMES.education ? "journal"
    : theme === THEMES.tech ? "keynote"
    : theme === THEMES.nature ? "forest"
    : theme === THEMES.luxury || theme === THEMES.food ? "editorial"
    : "swiss";
  const topic = ar ? (req.prompt.replace(/^(اعمل|سوي|صمم|أنشئ|انشئ)\s+(لي\s+)?(عرض(اً)?\s+(تقديمي(اً)?)?\s*)?(عن|حول)?\s*/u, "").split(/[.،,\n]/)[0].trim().slice(0, 60) || "موضوع العرض") : extractTopic(req.prompt);
  const ph = ar ? "بيانات توضيحية — استبدلها بأرقامك" : "Placeholder data — replace with your figures";
  const L = ar
    ? {
        cover: S("cover", { heading: topic, body: "عرض تقديمي", footnote: "٢٠٢٧" }),
        index: S("index", { label: "المحتويات", heading: "المحتويات", items: [{ label: "الفكرة الأساسية", value: "", desc: "" }, { label: "السياق", value: "", desc: "" }, { label: "الأرقام", value: "", desc: "" }, { label: "الخطوات القادمة", value: "", desc: "" }] }),
        statement: S("statement", { label: "الفكرة الأساسية", heading: `ما الذي يجعل ${topic} مهماً الآن؟`, body: "اكتب هنا الرسالة الرئيسية التي تريد أن يتذكرها جمهورك في جملة أو جملتين." }),
        essay: S("essay", { label: "السياق", heading: "الصورة الكاملة في فقرة واحدة.", body: "استخدم هذه المساحة لشرح الخلفية: ما المشكلة، من يتأثر بها، ولماذا لم تُحل بعد. اجعل النص قصيراً وواضحاً.", quote: "اقتباس قصير يلخص الفكرة.", attribution: "المصدر" }),
        bigNumber: S("bigNumber", { label: "رقم مهم", number: "٠٠٪", heading: "اكتب هنا ما يعنيه هذا الرقم.", body: "جملة توضح المصدر والسياق.", footnote: ph }),
        imageCaption: S("imageCaption", { label: "شكل ٠١", heading: "صورة تحكي الفكرة.", body: "اسحب صورة إلى هذه المساحة، واكتب وصفاً قصيراً لها." }),
        process: S("process", { label: "المنهجية", heading: "كيف نعمل", items: [{ label: "نفهم", value: "", desc: "نحدد المشكلة بدقة." }, { label: "نصمم", value: "", desc: "نختبر الحلول بسرعة." }, { label: "ننفذ", value: "", desc: "نطلق ونقيس النتائج." }] }),
        bars: S("bars", { label: "الأرقام", heading: "مقارنة بالأرقام", body: "عنوان قصير يشرح ما يوضحه الرسم.", items: [{ label: "البند الأول", value: "40", desc: "" }, { label: "البند الثاني", value: "28", desc: "" }, { label: "البند الثالث", value: "17", desc: "" }], footnote: ph }),
        timeline: S("timeline", { label: "الخطة", heading: "خارطة الطريق", items: [{ label: "المرحلة ١", value: "", desc: "البداية والتخطيط." }, { label: "المرحلة ٢", value: "", desc: "التنفيذ الأولي." }, { label: "المرحلة ٣", value: "", desc: "التوسع والتحسين." }] }),
        comparison: S("comparison", { label: "مقارنة", heading: "قبل وبعد", items: [{ label: "قبل", value: "الوضع الحالي", desc: "صف الوضع الحالي باختصار." }, { label: "بعد", value: "ما نطمح إليه", desc: "صف النتيجة المتوقعة." }] }),
        quote: S("quote", { label: "اقتباس", quote: "اكتب هنا اقتباساً ملهماً يتعلق بالموضوع.", attribution: "اسم القائل" }),
        closing: S("closing", { heading: "شكراً لكم.", items: [{ label: "التواصل", value: "", desc: "email@example.com" }, { label: "الأسئلة", value: "", desc: "نرحب بأسئلتكم" }] }),
      }
    : {
        cover: S("cover", { heading: topic, body: "Presentation", footnote: "2027" }),
        index: S("index", { label: "Contents", heading: "Contents", items: [{ label: "The core idea", value: "", desc: "" }, { label: "Context", value: "", desc: "" }, { label: "The numbers", value: "", desc: "" }, { label: "Next steps", value: "", desc: "" }] }),
        statement: S("statement", { label: "The core idea", heading: `Why ${topic} matters now.`, body: "Replace this with the one message your audience should remember, in a sentence or two." }),
        essay: S("essay", { label: "Context", heading: "The whole picture, in one paragraph.", body: "Use this space for background: what the problem is, who it affects, and why it hasn't been solved yet. Keep it short and concrete.", quote: "A short pull quote that captures the idea.", attribution: "Source" }),
        bigNumber: S("bigNumber", { label: "Key figure", number: "00%", heading: "Say what this number means.", body: "One sentence of context and source.", footnote: ph }),
        imageCaption: S("imageCaption", { label: "Fig. 01", heading: "An image that tells the story.", body: "Drop a photograph into this area and write a short caption." }),
        process: S("process", { label: "Approach", heading: "How we work", items: [{ label: "Understand", value: "", desc: "Define the problem precisely." }, { label: "Design", value: "", desc: "Test ideas quickly and cheaply." }, { label: "Deliver", value: "", desc: "Launch, measure, improve." }] }),
        bars: S("bars", { label: "The numbers", heading: "A comparison, to scale", body: "A short line explaining what the chart shows.", items: [{ label: "Item one", value: "40", desc: "" }, { label: "Item two", value: "28", desc: "" }, { label: "Item three", value: "17", desc: "" }], footnote: ph }),
        timeline: S("timeline", { label: "Plan", heading: "The road ahead", items: [{ label: "Phase 1", value: "", desc: "Discovery and planning." }, { label: "Phase 2", value: "", desc: "First release." }, { label: "Phase 3", value: "", desc: "Scale and refine." }] }),
        comparison: S("comparison", { label: "Contrast", heading: "Before and after", items: [{ label: "Before", value: "Where we are", desc: "Describe today in one sentence." }, { label: "After", value: "Where we're going", desc: "Describe the outcome in one sentence." }] }),
        quote: S("quote", { label: "Perspective", quote: "Replace with a memorable quotation about your topic.", attribution: "Name, role" }),
        closing: S("closing", { heading: "Thank you.", items: [{ label: "Contact", value: "", desc: "name@example.com" }, { label: "Questions", value: "", desc: "Let's discuss" }] }),
      };
  const order: Slide["kind"][] = ["index", "statement", "bigNumber", "imageCaption", "essay", "bars", "process", "quote", "timeline", "comparison"];
  const middle = order.slice(0, Math.max(2, req.slides - 2)).map((k) => L[k]);
  return { title: topic, subtitle: ar ? "عرض تقديمي" : "Presentation", author: "", style, accent: "", slides: [L.cover, ...middle, L.closing] };
}
