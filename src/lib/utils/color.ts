/** Colour helpers used by palettes, gradients and contrast checks. */

export type HSL = { h: number; s: number; l: number };

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: HSL) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

export function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const c = [rgb.r, rgb.g, rgb.b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Best readable text colour (near-black or white) on the given background. */
export function readableOn(bg: string, dark = "#16132b", light = "#ffffff") {
  return contrastRatio(bg, dark) >= contrastRatio(bg, light) ? dark : light;
}

export function withAlpha(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

export type HarmonyKind = "analogous" | "complementary" | "triadic" | "split" | "monochrome" | "tetradic";

/** Generate a 5-colour harmonious palette from a base colour. */
export function harmony(base: string, kind: HarmonyKind): string[] {
  const { h, s, l } = hexToHsl(base);
  const rot = (deg: number, ds = 0, dl = 0) =>
    hslToHex({ h: (h + deg + 360) % 360, s: Math.max(0, Math.min(100, s + ds)), l: Math.max(4, Math.min(96, l + dl)) });
  switch (kind) {
    case "analogous": return [rot(-30), rot(-15, 0, 8), base, rot(15, 0, -8), rot(30)];
    case "complementary": return [rot(0, 0, 30), base, rot(0, -10, -25), rot(180), rot(180, 0, 25)];
    case "triadic": return [base, rot(120), rot(240), rot(0, -20, 35), rot(0, -10, -30)];
    case "split": return [base, rot(150), rot(210), rot(0, -30, 38), rot(0, 0, -30)];
    case "tetradic": return [base, rot(90), rot(180), rot(270), rot(0, -40, 40)];
    case "monochrome":
    default: return [rot(0, 0, -35), rot(0, 0, -18), base, rot(0, -10, 20), rot(0, -20, 38)];
  }
}

export function isValidColor(c: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c) || /^rgba?\(/i.test(c) || c === "transparent";
}
