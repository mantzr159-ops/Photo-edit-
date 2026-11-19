/**
 * Icon rendering. Icons come from the open-source Lucide set (ISC licence).
 * The full set is code-split and only loaded when icons are needed.
 */
type IconNode = [string, Record<string, string | number>][];

let iconsPromise: Promise<Record<string, IconNode>> | null = null;

export function loadIconSet(): Promise<Record<string, IconNode>> {
  if (!iconsPromise) {
    iconsPromise = import("lucide").then((m) => m.icons as unknown as Record<string, IconNode>);
  }
  return iconsPromise;
}

const escapeAttr = (v: string | number) => String(v).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

export function iconNodeToSvg(node: IconNode, color: string, strokeWidth: number, size = 256): string {
  const children = node
    .map(([tag, attrs]) => {
      if (!/^[a-z]+$/.test(tag)) return "";
      const a = Object.entries(attrs)
        .filter(([k]) => /^[a-zA-Z-]+$/.test(k) && k !== "key")
        .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${escapeAttr(color)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

export async function iconDataUrl(name: string, color: string, strokeWidth: number, size = 256): Promise<string | null> {
  const set = await loadIconSet();
  const node = set[name];
  if (!node) return null;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(iconNodeToSvg(node, color, strokeWidth, size));
}

/** Curated icon list shown before searching (all exist in Lucide). */
export const FEATURED_ICONS = [
  "Heart", "Star", "Sparkles", "Zap", "Sun", "Moon", "Cloud", "Leaf", "Flower2", "Flame",
  "Camera", "Music", "Gift", "Coffee", "Rocket", "Trophy", "Crown", "Target", "Lightbulb", "Palette",
  "Phone", "Mail", "MapPin", "Globe", "Calendar", "Clock", "User", "Users", "MessageCircle", "Share2",
  "HeartPulse", "Stethoscope", "Activity", "Pill", "Syringe", "Brain", "Microscope", "Dna", "Hospital", "Thermometer",
  "BookOpen", "GraduationCap", "PenTool", "Pencil", "Calculator", "FlaskConical", "Atom", "School", "Library", "Notebook",
  "ShoppingBag", "Tag", "CreditCard", "TrendingUp", "ChartBar", "ChartPie", "Briefcase", "Building2", "Handshake", "BadgeCheck",
  "Check", "X", "Plus", "ArrowRight", "ArrowUpRight", "ChevronRight", "CircleCheck", "Info", "TriangleAlert", "ShieldCheck",
];
