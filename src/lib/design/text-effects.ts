/**
 * Text effects & curved text.
 *  - Curved text is laid out along a circular arc (Konva TextPath / SVG textPath).
 *    The element box is derived from the arc, so selection handles stay accurate.
 *  - Effects are expressed as extra "layers" (offset copies) behind the main
 *    text plus overrides on the main text (stroke, fill, glow), so the same
 *    description drives the canvas, raster exports and SVG export.
 */
import type { Paint, TextEffect, TextEffectType, TextElement } from "./types";

export const EFFECT_PRESETS: { type: TextEffectType; label: string; defaults: Omit<TextEffect, "type"> }[] = [
  { type: "none", label: "None", defaults: { color: "#000000", offset: 0, direction: 45, intensity: 0 } },
  { type: "shadow", label: "Shadow", defaults: { color: "#000000", offset: 40, direction: 45, intensity: 40 } },
  { type: "lift", label: "Lift", defaults: { color: "#000000", offset: 0, direction: 90, intensity: 50 } },
  { type: "hollow", label: "Hollow", defaults: { color: "#000000", offset: 0, direction: 0, intensity: 40 } },
  { type: "splice", label: "Splice", defaults: { color: "#ffb4c8", offset: 50, direction: 45, intensity: 40 } },
  { type: "outline", label: "Outline", defaults: { color: "#ffffff", offset: 0, direction: 0, intensity: 50 } },
  { type: "echo", label: "Echo", defaults: { color: "#000000", offset: 50, direction: 45, intensity: 50 } },
  { type: "glitch", label: "Glitch", defaults: { color: "#00f0ff", offset: 30, direction: 0, intensity: 50 } },
  { type: "neon", label: "Neon", defaults: { color: "#ff3bd4", offset: 0, direction: 0, intensity: 60 } },
];

export function defaultEffect(type: TextEffectType): TextEffect | null {
  if (type === "none") return null;
  const p = EFFECT_PRESETS.find((e) => e.type === type)!;
  return { type, ...p.defaults };
}

/** Which effect controls make sense per effect type. */
export function effectControls(type: TextEffectType) {
  return {
    color: type !== "none" && type !== "lift" && type !== "hollow",
    offset: ["shadow", "splice", "echo", "glitch"].includes(type),
    direction: ["shadow", "splice", "echo"].includes(type),
    intensity: type !== "none",
  };
}

export type EffectLayer = { dx: number; dy: number; overrides: Record<string, unknown> };

function primary(p: Paint) {
  return typeof p === "string" ? p : p.stops[0]?.color ?? "#000000";
}

/**
 * Returns copies drawn behind the text, and overrides for the main text.
 * `fs` is the font size (effects scale with type size).
 */
export function effectLayers(el: TextElement): { behind: EffectLayer[]; main: Record<string, unknown> } {
  const e = el.effect;
  if (!e || e.type === "none") return { behind: [], main: {} };
  const fs = el.fontSize;
  const rad = (e.direction * Math.PI) / 180;
  const dist = (e.offset / 100) * fs * 0.25;
  const dx = Math.cos(rad) * dist, dy = Math.sin(rad) * dist;
  const k = e.intensity / 100;
  const textColor = primary(el.fill);
  const noShadow = { shadowEnabled: false };
  switch (e.type) {
    case "shadow":
      return { behind: [], main: { shadowEnabled: true, shadowColor: e.color, shadowBlur: fs * 0.3 * k, shadowOffsetX: dx, shadowOffsetY: dy, shadowOpacity: 0.55 + 0.4 * (1 - k) } };
    case "lift":
      return { behind: [], main: { shadowEnabled: true, shadowColor: "#000000", shadowBlur: fs * (0.15 + 0.45 * k), shadowOffsetX: 0, shadowOffsetY: fs * 0.06, shadowOpacity: 0.25 + 0.3 * k } };
    case "hollow":
      return { behind: [], main: { fill: "rgba(0,0,0,0)", fillPriority: "color", stroke: textColor, strokeWidth: Math.max(1, fs * (0.015 + 0.05 * k)), ...noShadow } };
    case "outline":
      return { behind: [], main: { stroke: e.color, strokeWidth: Math.max(1, fs * (0.02 + 0.12 * k)), fillAfterStrokeEnabled: true } };
    case "splice":
      return {
        behind: [{ dx, dy, overrides: { fill: e.color, fillPriority: "color", strokeWidth: 0, ...noShadow } }],
        main: { fill: "rgba(0,0,0,0)", fillPriority: "color", stroke: textColor, strokeWidth: Math.max(1, fs * (0.015 + 0.04 * k)), ...noShadow },
      };
    case "echo":
      return {
        behind: [
          { dx: dx * 2, dy: dy * 2, overrides: { fill: e.color === "#000000" ? textColor : e.color, fillPriority: "color", opacity: 0.2 + 0.1 * k, ...noShadow } },
          { dx, dy, overrides: { fill: e.color === "#000000" ? textColor : e.color, fillPriority: "color", opacity: 0.35 + 0.25 * k, ...noShadow } },
        ],
        main: {},
      };
    case "glitch": {
      const g = Math.max(1, (e.offset / 100) * fs * 0.12);
      return {
        behind: [
          { dx: -g, dy: 0, overrides: { fill: e.color, fillPriority: "color", opacity: 0.4 + 0.5 * k, ...noShadow } },
          { dx: g, dy: 0, overrides: { fill: "#ff1f6b", fillPriority: "color", opacity: 0.4 + 0.5 * k, ...noShadow } },
        ],
        main: {},
      };
    }
    case "neon":
      return { behind: [], main: { shadowEnabled: true, shadowColor: e.color, shadowBlur: fs * (0.15 + 0.5 * k), shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1 } };
  }
}

/* ───────────────────────────── curved text ───────────────────────────── */

export type CurveGeometry = { path: string; width: number; height: number; radius: number; theta: number };

/**
 * Arc layout for curved text.
 * @param textWidth natural single-line width of the text at its font size
 */
export function curveGeometry(curve: number, textWidth: number, fontSize: number): CurveGeometry | null {
  if (!curve || Math.abs(curve) < 1) return null;
  const theta = Math.max(0.05, (Math.min(100, Math.abs(curve)) / 100) * Math.PI * 2 * 0.98);
  const r = Math.max(fontSize, textWidth / theta);
  const pad = fontSize;
  const halfW = theta >= Math.PI ? r : r * Math.sin(theta / 2);
  const sag = r * (1 - Math.cos(theta / 2)); // vertical extent of the arc
  const width = halfW * 2 + pad * 2;
  const height = sag + pad * 2;
  const cx = width / 2;
  let path: string;
  const large = theta > Math.PI ? 1 : 0;
  if (curve > 0) {
    // ∩ — text on the outside of the top of a circle, read left → right
    const cy = pad + r;
    const a0 = -Math.PI / 2 - theta / 2, a1 = -Math.PI / 2 + theta / 2;
    path = `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
  } else {
    // ∪ — text on the inside of the bottom of a circle, read left → right
    const cy = pad - r * Math.cos(theta / 2);
    const a0 = Math.PI / 2 + theta / 2, a1 = Math.PI / 2 - theta / 2;
    path = `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 0 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
  }
  return { path, width, height, radius: r, theta };
}
