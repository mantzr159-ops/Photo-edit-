import { uid, uuid } from "@/lib/utils/id";
import type {
  DesignElement,
  DesignSize,
  EmojiElement,
  IconElement,
  ImageElement,
  LineElement,
  Page,
  PageBackground,
  ProjectDoc,
  ShapeElement,
  ShapeKind,
  TextElement,
} from "./types";

export const DESIGN_SIZES: DesignSize[] = [
  { id: "ig-post", label: "Instagram Post", width: 1080, height: 1080, category: "Instagram Posts" },
  { id: "ig-portrait", label: "Instagram Portrait", width: 1080, height: 1350, category: "Instagram Posts" },
  { id: "ig-story", label: "Instagram Story", width: 1080, height: 1920, category: "Instagram Stories" },
  { id: "tiktok", label: "TikTok Video Cover", width: 1080, height: 1920, category: "TikTok" },
  { id: "fb-post", label: "Facebook Post", width: 1200, height: 630, category: "Social Media" },
  { id: "x-post", label: "X / Twitter Post", width: 1600, height: 900, category: "Social Media" },
  { id: "linkedin", label: "LinkedIn Post", width: 1200, height: 1200, category: "Social Media" },
  { id: "yt-thumb", label: "YouTube Thumbnail", width: 1280, height: 720, category: "YouTube Thumbnails" },
  { id: "presentation", label: "Presentation 16:9", width: 1920, height: 1080, category: "Presentations" },
  { id: "poster", label: "Poster (18×24 in)", width: 1728, height: 2304, category: "Posters" },
  { id: "flyer", label: "Flyer (A4)", width: 1240, height: 1754, category: "Flyers" },
  { id: "business-card", label: "Business Card", width: 1050, height: 600, category: "Business Cards" },
  { id: "resume", label: "Resume (Letter)", width: 1275, height: 1650, category: "CV / Resume" },
  { id: "infographic", label: "Infographic", width: 1080, height: 2160, category: "Infographics" },
  { id: "invitation", label: "Invitation (5×7 in)", width: 1500, height: 2100, category: "Invitations" },
  { id: "logo", label: "Logo", width: 1000, height: 1000, category: "Logos" },
  { id: "wallpaper-desktop", label: "Desktop Wallpaper", width: 1920, height: 1080, category: "Wallpapers" },
  { id: "wallpaper-phone", label: "Phone Wallpaper", width: 1170, height: 2532, category: "Wallpapers" },
];

export const defaultShadow = () => ({ enabled: false, color: "#000000", blur: 12, offsetX: 0, offsetY: 6, opacity: 0.25 });

export function createBackground(fill: PageBackground["fill"] = "#ffffff"): PageBackground {
  return { fill, image: null, pattern: null, transparent: false };
}

export function createPage(partial: Partial<Page> = {}): Page {
  return { id: uid(), background: createBackground(), elements: [], ...partial };
}

export function createProject(input: { name?: string; width: number; height: number; pages?: Page[]; category?: string; id?: string }): ProjectDoc {
  const now = new Date().toISOString();
  return {
    id: input.id ?? uuid(),
    name: input.name ?? "Untitled design",
    width: Math.round(input.width),
    height: Math.round(input.height),
    pages: input.pages?.length ? input.pages : [createPage()],
    category: input.category,
    createdAt: now,
    updatedAt: now,
    revision: 0,
  };
}

const base = (x = 0, y = 0, width = 200, height = 200) => ({
  id: uid(),
  x,
  y,
  width,
  height,
  rotation: 0,
  opacity: 1,
  locked: false,
  hidden: false,
  groupId: null,
});

export function createShape(shape: ShapeKind, partial: Partial<ShapeElement> = {}): ShapeElement {
  return {
    ...base(),
    type: "shape",
    shape,
    fill: "#7444ff",
    stroke: "#16132b",
    strokeWidth: 0,
    cornerRadius: 0,
    sides: shape === "polygon" ? 6 : shape === "star" ? 5 : undefined,
    innerRadiusRatio: shape === "star" ? 0.45 : undefined,
    ...partial,
  };
}

export function createLine(partial: Partial<LineElement> = {}): LineElement {
  return {
    ...base(0, 0, 300, 20),
    type: "line",
    stroke: "#16132b",
    strokeWidth: 6,
    startCap: "none",
    endCap: "none",
    ...partial,
  };
}

export type TextPresetId = "heading" | "subheading" | "body" | "caption" | "quote" | "decorative";

export const TEXT_PRESETS: Record<TextPresetId, { label: string; sample: string; props: Partial<TextElement> }> = {
  heading: { label: "Add a heading", sample: "Add a heading", props: { fontSize: 96, fontWeight: 800, fontFamily: "Plus Jakarta Sans", lineHeight: 1.1, letterSpacing: -1 } },
  subheading: { label: "Add a subheading", sample: "Add a subheading", props: { fontSize: 56, fontWeight: 600, fontFamily: "Plus Jakarta Sans", lineHeight: 1.2 } },
  body: { label: "Add a little bit of body text", sample: "Add a little bit of body text", props: { fontSize: 32, fontWeight: 400, fontFamily: "Inter", lineHeight: 1.5 } },
  caption: { label: "Caption", sample: "CAPTION TEXT", props: { fontSize: 22, fontWeight: 600, fontFamily: "Inter", letterSpacing: 3, textTransform: "uppercase", lineHeight: 1.4 } },
  quote: { label: "“Quote”", sample: "“Design is intelligence made visible.”", props: { fontSize: 48, fontWeight: 400, italic: true, fontFamily: "Playfair Display", lineHeight: 1.3 } },
  decorative: { label: "Decorative", sample: "Celebrate", props: { fontSize: 110, fontWeight: 400, fontFamily: "Great Vibes", lineHeight: 1.1 } },
};

export function createText(partial: Partial<TextElement> = {}): TextElement {
  return {
    ...base(0, 0, 600, 60),
    type: "text",
    text: "Add text",
    fontFamily: "Inter",
    fontSize: 48,
    fontWeight: 400,
    italic: false,
    underline: false,
    strike: false,
    align: "left",
    lineHeight: 1.25,
    letterSpacing: 0,
    fill: "#16132b",
    background: null,
    stroke: "#000000",
    strokeWidth: 0,
    textTransform: "none",
    ...partial,
  };
}

export function createTextFromPreset(preset: TextPresetId, partial: Partial<TextElement> = {}): TextElement {
  const p = TEXT_PRESETS[preset];
  return createText({ text: p.sample, preset, ...p.props, ...partial });
}

export function createImage(src: string, partial: Partial<ImageElement> = {}): ImageElement {
  return {
    ...base(0, 0, 400, 300),
    type: "image",
    src,
    mask: "none",
    cornerRadius: 0,
    strokeWidth: 0,
    stroke: "#ffffff",
    ...partial,
  };
}

/** Neutral placeholder used by frames until an image is dropped in. */
export const FRAME_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#e6e3f2"/><g fill="none" stroke="#a49dc4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><rect x="120" y="135" width="160" height="130" rx="14"/><circle cx="165" cy="180" r="14"/><path d="M130 255l50-50 35 35 25-25 40 40"/></g></svg>`,
  );

export function createFrame(mask: ImageElement["mask"], partial: Partial<ImageElement> = {}): ImageElement {
  return createImage(FRAME_PLACEHOLDER, {
    width: 400,
    height: 400,
    naturalWidth: 400,
    naturalHeight: 400,
    mask,
    cornerRadius: mask === "rounded" ? 40 : 0,
    placeholder: true,
    name: "Frame",
    ...partial,
  });
}

export function createIcon(icon: string, partial: Partial<IconElement> = {}): IconElement {
  return { ...base(0, 0, 160, 160), type: "icon", icon, color: "#16132b", strokeWidth: 2, ...partial };
}

export function createEmoji(emoji: string, partial: Partial<EmojiElement> = {}): EmojiElement {
  return { ...base(0, 0, 180, 180), type: "emoji", emoji, ...partial };
}

/** Deep clone an element with fresh ids (optionally remapping group ids consistently). */
export function cloneElement<T extends DesignElement>(el: T, groupMap?: Map<string, string>): T {
  const copy = structuredClone(el);
  copy.id = uid();
  if (copy.groupId) {
    if (groupMap) {
      if (!groupMap.has(copy.groupId)) groupMap.set(copy.groupId, uid());
      copy.groupId = groupMap.get(copy.groupId)!;
    }
  }
  return copy;
}

export function clonePage(page: Page): Page {
  const groupMap = new Map<string, string>();
  return { ...structuredClone(page), id: uid(), elements: page.elements.map((e) => cloneElement(e, groupMap)) };
}

export function elementLabel(el: DesignElement): string {
  if (el.name) return el.name;
  switch (el.type) {
    case "text": return el.text.split("\n")[0].slice(0, 28) || "Text";
    case "shape": return el.shape[0].toUpperCase() + el.shape.slice(1);
    case "image": return el.placeholder ? "Frame" : "Image";
    case "icon": return el.icon;
    case "emoji": return `Sticker ${el.emoji}`;
    case "line": return el.endCap === "arrow" ? "Arrow" : "Line";
  }
}
