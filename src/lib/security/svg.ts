/**
 * SVG sanitiser (allow-list based). Removes scripts, event handlers,
 * foreignObject, external references and CSS that can fetch remote content.
 * SVGs are additionally only ever rendered via <img>/canvas (never inlined),
 * which browsers sandbox from script execution — this is defence in depth.
 */
const ALLOWED_TAGS = new Set([
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "defs", "lineargradient",
  "radialgradient", "stop", "clippath", "mask", "pattern", "symbol", "use", "title", "desc", "filter", "fegaussianblur",
  "feoffset", "feblend", "fecolormatrix", "fecomposite", "feflood", "femerge", "femergenode", "fedropshadow", "image", "style", "marker",
]);

const URL_ATTRS = new Set(["href", "xlink:href", "src"]);

export function sanitizeSvg(input: string): string | null {
  if (typeof DOMParser === "undefined") return null;
  if (input.length > 5_000_000) return null;
  const doc = new DOMParser().parseFromString(input, "image/svg+xml");
  if (doc.getElementsByTagName("parsererror").length) return null;
  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== "svg") return null;

  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const tag = child.nodeName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        child.remove();
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (name.startsWith("on")) child.removeAttribute(attr.name);
        else if (URL_ATTRS.has(name) && !(value.startsWith("#") || value.startsWith("data:image/png") || value.startsWith("data:image/jpeg") || value.startsWith("data:image/webp")))
          child.removeAttribute(attr.name);
        else if (/javascript:|expression\(|url\(\s*['"]?\s*(https?:|\/\/)/i.test(attr.value)) child.removeAttribute(attr.name);
      }
      if (tag === "style") {
        child.textContent = (child.textContent ?? "").replace(/@import[^;]+;?/gi, "").replace(/url\(\s*['"]?\s*(https?:|\/\/)[^)]*\)/gi, "none");
      }
      walk(child);
    }
  };
  for (const attr of Array.from(root.attributes)) if (attr.name.toLowerCase().startsWith("on")) root.removeAttribute(attr.name);
  walk(root);
  if (!root.getAttribute("xmlns")) root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(root);
}
