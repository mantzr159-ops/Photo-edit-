import type { Paint } from "./types";
export { paintToCss } from "./render-css";

/** First / dominant colour of a paint (server-safe). */
export function paintPrimary(paint: Paint): string {
  return typeof paint === "string" ? paint : paint.stops[0]?.color ?? "#000000";
}
