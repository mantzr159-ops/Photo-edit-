/**
 * Image loading with caching and pluggable src resolution.
 * `local-asset:` and `sb-asset:` references are resolved through the active
 * data repository (IndexedDB object URL or Supabase signed URL).
 */
type Resolver = (src: string) => Promise<string>;

let resolver: Resolver | null = null;
const cache = new Map<string, Promise<HTMLImageElement>>();
const resolved = new Map<string, HTMLImageElement>();

export function setSrcResolver(r: Resolver | null) {
  resolver = r;
}

export function isReferenceSrc(src: string) {
  return src.startsWith("local-asset:") || src.startsWith("sb-asset:");
}

export async function resolveSrc(src: string): Promise<string> {
  if (isReferenceSrc(src)) {
    if (!resolver) throw new Error("No asset resolver registered");
    return resolver(src);
  }
  return src;
}

export function getCachedImage(src: string): HTMLImageElement | undefined {
  return resolved.get(src);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src);
  if (hit) return hit;
  const p = (async () => {
    const url = await resolveSrc(src);
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      if (/^https?:/.test(url) && !url.startsWith(window.location.origin)) img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        resolved.set(src, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image`));
      img.src = url;
    });
  })();
  cache.set(src, p);
  p.catch(() => cache.delete(src));
  return p;
}

export function forgetImage(src: string) {
  cache.delete(src);
  resolved.delete(src);
}
