/**
 * Core design document model.
 *
 * A Project contains ordered Pages; each Page has a background and an ordered
 * list of Elements (index 0 = bottom-most layer). Every element is a plain,
 * serialisable object so it can be stored as JSON (IndexedDB / Postgres jsonb),
 * diffed for undo/redo and rendered both by react-konva (editor) and by the
 * imperative Konva renderer (export, thumbnails).
 */

export type GradientStop = { offset: number; color: string };

export type LinearGradient = {
  type: "linear";
  /** degrees, 0 = left→right, 90 = top→bottom */
  angle: number;
  stops: GradientStop[];
};

export type RadialGradient = {
  type: "radial";
  stops: GradientStop[];
};

/** A paint is either a CSS colour string or a gradient. */
export type Paint = string | LinearGradient | RadialGradient;

export type Shadow = {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
};

export interface BaseElement {
  id: string;
  type: ElementType;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  hidden?: boolean;
  /** Elements sharing a groupId are selected and transformed together. */
  groupId?: string | null;
  shadow?: Shadow;
  flipX?: boolean;
  flipY?: boolean;
}

export type ShapeKind =
  | "rect"
  | "ellipse"
  | "triangle"
  | "polygon"
  | "star"
  | "heart"
  | "blob"
  | "arrowShape";

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: ShapeKind;
  fill: Paint;
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  cornerRadius?: number;
  /** polygon sides / star points */
  sides?: number;
  innerRadiusRatio?: number;
}

export interface LineElement extends BaseElement {
  type: "line";
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  startCap: "none" | "arrow" | "circle";
  endCap: "none" | "arrow" | "circle";
  /** curved connector */
  curved?: boolean;
}

export type TextAlign = "left" | "center" | "right" | "justify";

export type TextEffectType = "none" | "shadow" | "lift" | "hollow" | "splice" | "outline" | "echo" | "glitch" | "neon";

export interface TextEffect {
  type: TextEffectType;
  /** effect colour (shadow / outline / echo / glow) */
  color: string;
  /** 0..100 — distance of offsets */
  offset: number;
  /** degrees, direction of offsets */
  direction: number;
  /** 0..100 — blur / thickness / transparency depending on effect */
  intensity: number;
}

export type TextDirection = "auto" | "ltr" | "rtl";

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number; // 100..900
  italic: boolean;
  underline: boolean;
  strike: boolean;
  align: TextAlign;
  verticalAlign?: "top" | "middle" | "bottom";
  lineHeight: number;
  letterSpacing: number;
  fill: Paint;
  /** text highlight / background box */
  background?: { color: string; padding: number; radius: number } | null;
  /** outline */
  stroke?: string;
  strokeWidth?: number;
  textTransform?: "none" | "uppercase" | "lowercase";
  /** preset id used to create this text (heading, body …) */
  preset?: string;
  /** writing direction; "auto" picks RTL for Arabic/Hebrew text */
  direction?: TextDirection;
  /** curved text: -100 (∪) … 0 (straight) … 100 (∩ full circle) */
  curve?: number;
  effect?: TextEffect | null;
}

export type ImageMask = "none" | "circle" | "rounded" | "hexagon" | "blob" | "arch";

export interface ImageFilters {
  brightness: number; // -1..1
  contrast: number; // -100..100
  saturation: number; // -2..10 (konva HSL)
  blur: number; // 0..40
  grayscale: boolean;
  sepia: boolean;
}

export interface ImageElement extends BaseElement {
  type: "image";
  /**
   * Source reference. One of:
   *  - `https://…` or `data:` URL
   *  - `local-asset:<id>` (IndexedDB asset, local mode)
   *  - `sb-asset:<storage path>` (Supabase storage, cloud mode)
   */
  src: string;
  /** natural image size for "cover" cropping */
  naturalWidth?: number;
  naturalHeight?: number;
  /** crop rect in natural-image pixels; undefined = automatic cover fit */
  crop?: { x: number; y: number; width: number; height: number };
  mask: ImageMask;
  cornerRadius: number;
  stroke?: string;
  strokeWidth?: number;
  filters?: Partial<ImageFilters>;
  /** frames: placeholder awaiting an image */
  placeholder?: boolean;
  /** attribution for open-license photos */
  attribution?: string;
}

export interface IconElement extends BaseElement {
  type: "icon";
  /** lucide icon name in PascalCase, e.g. "HeartPulse" */
  icon: string;
  color: string;
  strokeWidth: number;
}

export interface EmojiElement extends BaseElement {
  type: "emoji";
  emoji: string;
}

export type DesignElement =
  | ShapeElement
  | LineElement
  | TextElement
  | ImageElement
  | IconElement
  | EmojiElement;

export type ElementType = "shape" | "line" | "text" | "image" | "icon" | "emoji";

export type PatternKind = "dots" | "grid" | "stripes" | "waves" | "checker" | "confetti";

export interface PageBackground {
  /** solid colour or gradient */
  fill: Paint;
  image?: {
    src: string;
    fit: "cover" | "contain";
    blur: number;
    opacity: number;
  } | null;
  pattern?: { kind: PatternKind; color: string; opacity: number; scale: number } | null;
  /** export with transparent background (PNG/SVG) */
  transparent?: boolean;
}

export interface Page {
  id: string;
  name?: string;
  background: PageBackground;
  elements: DesignElement[];
}

export interface ProjectDoc {
  id: string;
  name: string;
  width: number;
  height: number;
  /** unit is always px internally; this is just the display preference */
  unit?: "px" | "in" | "mm";
  pages: Page[];
  /** template / category hint */
  category?: string;
  createdAt: string;
  updatedAt: string;
  /** monotonic revision for conflict detection */
  revision: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail?: string | null;
  starred: boolean;
  trashed: boolean;
  folderId: string | null;
  category?: string;
  pageCount: number;
  updatedAt: string;
  createdAt: string;
  visibility?: ShareVisibility;
}

export type ShareVisibility = "private" | "link_view" | "link_edit";

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  /** src reference usable on ImageElement.src */
  src: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  folder?: string | null;
  createdAt: string;
  source: "upload" | "ai" | "photo";
}

export interface TemplateDef {
  id: string;
  name: string;
  category: TemplateCategory;
  width: number;
  height: number;
  tags: string[];
  pages: Page[];
  /** true for user-saved templates */
  custom?: boolean;
  createdAt?: string;
}

export const TEMPLATE_CATEGORIES = [
  "Social Media",
  "Instagram Posts",
  "Instagram Stories",
  "TikTok",
  "YouTube Thumbnails",
  "Presentations",
  "Posters",
  "Flyers",
  "Business Cards",
  "CV / Resume",
  "Infographics",
  "Educational Designs",
  "Medical Education",
  "Invitations",
  "Logos",
  "Wallpapers",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export interface DesignSize {
  id: string;
  label: string;
  width: number;
  height: number;
  category: TemplateCategory | "Custom";
}
