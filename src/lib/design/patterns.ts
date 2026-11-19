import type { LinearGradient, PatternKind, RadialGradient } from "./types";

/** Pattern tiles generated as SVG (no external assets). */
export function patternTileSvg(kind: PatternKind, color: string): string {
  const c = color.replace(/"/g, "");
  let body = "";
  let size = 40;
  switch (kind) {
    case "dots": body = `<circle cx="10" cy="10" r="3" fill="${c}"/><circle cx="30" cy="30" r="3" fill="${c}"/>`; break;
    case "grid": body = `<path d="M40 0H0V40" fill="none" stroke="${c}" stroke-width="1.5"/>`; break;
    case "stripes": body = `<path d="M-10 10L10 -10M0 40L40 0M30 50L50 30" stroke="${c}" stroke-width="6"/>`; break;
    case "waves": size = 60; body = `<path d="M0 30 Q15 15 30 30 T60 30" fill="none" stroke="${c}" stroke-width="3"/>`; break;
    case "checker": body = `<rect width="20" height="20" fill="${c}"/><rect x="20" y="20" width="20" height="20" fill="${c}"/>`; break;
    case "confetti":
      size = 80;
      body = `<rect x="10" y="12" width="10" height="4" rx="2" transform="rotate(30 15 14)" fill="${c}"/><circle cx="55" cy="20" r="3.5" fill="${c}"/><rect x="40" y="55" width="12" height="4" rx="2" transform="rotate(-40 46 57)" fill="${c}"/><circle cx="15" cy="60" r="2.5" fill="${c}"/><path d="M65 50l4 8 -8 0z" fill="${c}"/>`;
      break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;
}

export function patternDataUrl(kind: PatternKind, color: string) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(patternTileSvg(kind, color));
}

export const PATTERNS: PatternKind[] = ["dots", "grid", "stripes", "waves", "checker", "confetti"];

export const GRADIENT_PRESETS: (LinearGradient | RadialGradient)[] = [
  { type: "linear", angle: 45, stops: [{ offset: 0, color: "#7444ff" }, { offset: 1, color: "#ff6b5a" }] },
  { type: "linear", angle: 90, stops: [{ offset: 0, color: "#a1c4fd" }, { offset: 1, color: "#c2e9fb" }] },
  { type: "linear", angle: 135, stops: [{ offset: 0, color: "#f6d365" }, { offset: 1, color: "#fda085" }] },
  { type: "linear", angle: 45, stops: [{ offset: 0, color: "#0f2027" }, { offset: 0.5, color: "#203a43" }, { offset: 1, color: "#2c5364" }] },
  { type: "linear", angle: 0, stops: [{ offset: 0, color: "#43e97b" }, { offset: 1, color: "#38f9d7" }] },
  { type: "linear", angle: 120, stops: [{ offset: 0, color: "#fa709a" }, { offset: 1, color: "#fee140" }] },
  { type: "linear", angle: 90, stops: [{ offset: 0, color: "#30cfd0" }, { offset: 1, color: "#330867" }] },
  { type: "linear", angle: 60, stops: [{ offset: 0, color: "#ff9a9e" }, { offset: 1, color: "#fecfef" }] },
  { type: "linear", angle: 30, stops: [{ offset: 0, color: "#16132b" }, { offset: 1, color: "#4517b0" }] },
  { type: "linear", angle: 90, stops: [{ offset: 0, color: "#fdfbfb" }, { offset: 1, color: "#ebedee" }] },
  { type: "radial", stops: [{ offset: 0, color: "#ffecd2" }, { offset: 1, color: "#fcb69f" }] },
  { type: "radial", stops: [{ offset: 0, color: "#4facfe" }, { offset: 1, color: "#00f2fe" }] },
  { type: "radial", stops: [{ offset: 0, color: "#3a168f" }, { offset: 1, color: "#0b0820" }] },
  { type: "linear", angle: 45, stops: [{ offset: 0, color: "#e0c3fc" }, { offset: 1, color: "#8ec5fc" }] },
  { type: "linear", angle: 90, stops: [{ offset: 0, color: "#ff0844" }, { offset: 1, color: "#ffb199" }] },
  { type: "linear", angle: 135, stops: [{ offset: 0, color: "#0ba360" }, { offset: 1, color: "#3cba92" }] },
];

export const SOLID_SWATCHES = [
  "#ffffff", "#f4f2fb", "#e6e3f2", "#b8b3cc", "#6b6585", "#16132b", "#000000",
  "#7444ff", "#b14dff", "#ff6b5a", "#ff3b6b", "#ff9f1c", "#ffd23f", "#2ec4b6",
  "#00a6fb", "#0f4c81", "#1b998b", "#3a5a40", "#f7e1d7", "#fdf0d5", "#c1121f",
];
