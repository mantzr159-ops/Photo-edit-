/**
 * Font catalogue. Fonts are open-license Google Fonts loaded on demand via the
 * CSS API; canvas text re-renders once the face is available.
 */
export type FontDef = { family: string; category: "sans" | "serif" | "display" | "script" | "mono" | "arabic"; weights: number[] };

export const FONTS: FontDef[] = [
  { family: "Inter", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Inter Tight", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Instrument Serif", category: "serif", weights: [400] },
  { family: "Newsreader", category: "serif", weights: [300, 400, 500, 600, 700] },
  { family: "Poppins", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Montserrat", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Plus Jakarta Sans", category: "sans", weights: [300, 400, 500, 600, 700, 800] },
  { family: "DM Sans", category: "sans", weights: [400, 500, 700] },
  { family: "Space Grotesk", category: "sans", weights: [300, 400, 500, 600, 700] },
  { family: "Outfit", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Raleway", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Nunito", category: "sans", weights: [300, 400, 600, 700, 800, 900] },
  { family: "Work Sans", category: "sans", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Open Sans", category: "sans", weights: [300, 400, 600, 700, 800] },
  { family: "Lato", category: "sans", weights: [300, 400, 700, 900] },
  { family: "Roboto", category: "sans", weights: [300, 400, 500, 700, 900] },
  { family: "Oswald", category: "display", weights: [300, 400, 500, 600, 700] },
  { family: "Bebas Neue", category: "display", weights: [400] },
  { family: "Anton", category: "display", weights: [400] },
  { family: "Archivo Black", category: "display", weights: [400] },
  { family: "Righteous", category: "display", weights: [400] },
  { family: "Bungee", category: "display", weights: [400] },
  { family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  { family: "Merriweather", category: "serif", weights: [300, 400, 700, 900] },
  { family: "Lora", category: "serif", weights: [400, 500, 600, 700] },
  { family: "Cormorant Garamond", category: "serif", weights: [300, 400, 500, 600, 700] },
  { family: "DM Serif Display", category: "serif", weights: [400] },
  { family: "Libre Baskerville", category: "serif", weights: [400, 700] },
  { family: "Fraunces", category: "serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Pacifico", category: "script", weights: [400] },
  { family: "Dancing Script", category: "script", weights: [400, 500, 600, 700] },
  { family: "Great Vibes", category: "script", weights: [400] },
  { family: "Caveat", category: "script", weights: [400, 500, 600, 700] },
  { family: "Satisfy", category: "script", weights: [400] },
  // Arabic (all also include Latin glyphs)
  { family: "Cairo", category: "arabic", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Tajawal", category: "arabic", weights: [300, 400, 500, 700, 800, 900] },
  { family: "Almarai", category: "arabic", weights: [300, 400, 700, 800] },
  { family: "Noto Kufi Arabic", category: "arabic", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Noto Naskh Arabic", category: "arabic", weights: [400, 500, 600, 700] },
  { family: "Amiri", category: "arabic", weights: [400, 700] },
  { family: "El Messiri", category: "arabic", weights: [400, 500, 600, 700] },
  { family: "Changa", category: "arabic", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Reem Kufi", category: "arabic", weights: [400, 500, 600, 700] },
  { family: "Readex Pro", category: "arabic", weights: [300, 400, 500, 600, 700] },
  { family: "Lalezar", category: "arabic", weights: [400] },
  { family: "Aref Ruqaa", category: "arabic", weights: [400, 700] },
  { family: "Lemonada", category: "arabic", weights: [300, 400, 500, 600, 700] },
  { family: "JetBrains Mono", category: "mono", weights: [300, 400, 500, 700, 800] },
  { family: "Space Mono", category: "mono", weights: [400, 700] },
];

export const DEFAULT_FONT = "Inter";

const requested = new Set<string>();
const loaded = new Set<string>();
const listeners = new Set<() => void>();

export function onFontsLoaded(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function fontCssUrl(families: string[]) {
  const params = families
    .map((f) => {
      const def = FONTS.find((d) => d.family === f);
      const weights = def?.weights ?? [400, 700];
      const ital = weights.flatMap((w) => [`0,${w}`]).concat(weights.map((w) => `1,${w}`));
      // Not every family ships italics; Google gracefully synthesises if the axis is absent
      // only when we request the plain list, so request both only for families known to have them.
      const hasItalic = !["display", "script", "arabic"].includes(def?.category ?? "sans") && !["Bebas Neue", "Space Grotesk", "Outfit", "Plus Jakarta Sans"].includes(f);
      const spec = hasItalic ? `ital,wght@${ital.sort().join(";")}` : `wght@${weights.join(";")}`;
      return `family=${encodeURIComponent(f).replace(/%20/g, "+")}:${spec}`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** Ensure the given families are loaded in the document. Resolves when ready (or after timeout). */
export async function ensureFonts(families: string[], timeoutMs = 4000): Promise<void> {
  if (typeof document === "undefined") return;
  const known = families.filter((f) => FONTS.some((d) => d.family === f));
  const fresh = known.filter((f) => !requested.has(f));
  if (fresh.length) {
    fresh.forEach((f) => requested.add(f));
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontCssUrl(fresh);
    document.head.appendChild(link);
  }
  const pending = known.filter((f) => !loaded.has(f));
  if (!pending.length) return;
  const loadAll = Promise.all(
    pending.flatMap((f) => [document.fonts.load(`400 16px "${f}"`), document.fonts.load(`700 16px "${f}"`)]),
  ).then(() => {
    pending.forEach((f) => loaded.add(f));
    listeners.forEach((l) => l());
  });
  await Promise.race([loadAll.catch(() => undefined), new Promise((r) => setTimeout(r, timeoutMs))]);
}

export function isFontLoaded(family: string) {
  return loaded.has(family);
}

const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/** True when the string contains Arabic/Hebrew script. */
export function hasRtlChars(s: string) {
  return RTL_RE.test(s);
}

/** Resolve a text element's effective direction. */
export function resolveDirection(text: string, dir: "auto" | "ltr" | "rtl" | undefined): "ltr" | "rtl" {
  if (dir === "ltr" || dir === "rtl") return dir;
  return hasRtlChars(text) ? "rtl" : "ltr";
}

export type FaceSpec = { family: string; weight: number; italic?: boolean };

const facesLoaded = new Set<string>();

/**
 * Load exactly the font faces a design uses (family + weight + style).
 * Canvas text can't trigger lazy font loading, so every face must be loaded
 * explicitly before drawing for exports and thumbnails to be correct.
 */
export async function ensureFontFaces(faces: FaceSpec[], timeoutMs = 10000): Promise<void> {
  if (typeof document === "undefined") return;
  await ensureFonts([...new Set(faces.map((f) => f.family))], timeoutMs);
  const todo = faces.filter((f) => FONTS.some((d) => d.family === f.family)).map((f) => `${f.italic ? "italic " : ""}${f.weight} 16px "${f.family}"`).filter((k) => !facesLoaded.has(k));
  if (!todo.length) return;
  const all = Promise.all(todo.map((k) => document.fonts.load(k).then(() => facesLoaded.add(k)).catch(() => undefined))).then(() => listeners.forEach((l) => l()));
  await Promise.race([all, new Promise((r) => setTimeout(r, timeoutMs))]);
}
