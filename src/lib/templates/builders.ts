/** Tiny DSL used to author built-in templates compactly. */
import { createEmoji, createFrame, createIcon, createLine, createPage, createShape, createText } from "@/lib/design/factory";
import type { DesignElement, ImageElement, LineElement, Page, PageBackground, Paint, ShapeElement, ShapeKind, TemplateCategory, TemplateDef, TextElement } from "@/lib/design/types";

export const lin = (angle: number, ...colors: string[]): Paint => ({
  type: "linear",
  angle,
  stops: colors.map((color, i) => ({ offset: colors.length === 1 ? 0 : i / (colors.length - 1), color })),
});
export const rad = (...colors: string[]): Paint => ({ type: "radial", stops: colors.map((color, i) => ({ offset: i / Math.max(1, colors.length - 1), color })) });

type TextOpts = Partial<TextElement>;
export const text = (value: string, x: number, y: number, width: number, o: TextOpts = {}) =>
  createText({ text: value, x, y, width, ...o });

export const heading = (value: string, x: number, y: number, width: number, o: TextOpts = {}) =>
  text(value, x, y, width, { fontFamily: "Plus Jakarta Sans", fontWeight: 800, fontSize: 96, lineHeight: 1.08, letterSpacing: -1, ...o });

export const body = (value: string, x: number, y: number, width: number, o: TextOpts = {}) =>
  text(value, x, y, width, { fontFamily: "Inter", fontSize: 30, lineHeight: 1.5, fill: "#4a4566", ...o });

export const shape = (kind: ShapeKind, x: number, y: number, width: number, height: number, fill: Paint, o: Partial<ShapeElement> = {}) =>
  createShape(kind, { x, y, width, height, fill, ...o });

export const rect = (x: number, y: number, w: number, h: number, fill: Paint, o: Partial<ShapeElement> = {}) => shape("rect", x, y, w, h, fill, o);
export const circle = (x: number, y: number, d: number, fill: Paint, o: Partial<ShapeElement> = {}) => shape("ellipse", x, y, d, d, fill, o);

export const line = (x: number, y: number, w: number, stroke: string, o: Partial<LineElement> = {}) =>
  createLine({ x, y: y - 10, width: w, height: 20, stroke, ...o });

export const icon = (name: string, x: number, y: number, size: number, color: string, strokeWidth = 2) =>
  createIcon(name, { x, y, width: size, height: size, color, strokeWidth });

export const emoji = (e: string, x: number, y: number, size: number) => createEmoji(e, { x, y, width: size, height: size });

export const frame = (mask: ImageElement["mask"], x: number, y: number, w: number, h: number, o: Partial<ImageElement> = {}) =>
  createFrame(mask, { x, y, width: w, height: h, ...o });

export const bg = (fill: Paint, extra: Partial<PageBackground> = {}): PageBackground => ({ fill, image: null, pattern: null, transparent: false, ...extra });

export const page = (background: PageBackground, elements: DesignElement[], name?: string): Page => createPage({ background, elements, name });

export function template(id: string, name: string, category: TemplateCategory, width: number, height: number, tags: string[], pages: Page[]): TemplateDef {
  return { id, name, category, width, height, tags, pages };
}
