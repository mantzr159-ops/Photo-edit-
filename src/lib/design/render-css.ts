import type { Paint } from "./types";

/** CSS representation of a paint (safe to import on the server / without Konva). */
export function paintToCss(paint: Paint): string {
  if (typeof paint === "string") return paint;
  const stops = [...paint.stops].sort((a, b) => a.offset - b.offset).map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ");
  return paint.type === "linear" ? `linear-gradient(${paint.angle + 90}deg, ${stops})` : `radial-gradient(circle, ${stops})`;
}
