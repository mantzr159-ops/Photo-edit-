"use client";
/** Imperative bridge between the canvas and the rest of the editor UI. */
import type Konva from "konva";

export interface CanvasApi {
  stage: Konva.Stage | null;
  /** convert client (screen) coordinates to design coordinates */
  toWorld: (clientX: number, clientY: number) => { x: number; y: number } | null;
  fit: () => void;
  zoomTo: (zoom: number) => void;
  /** visible centre of the viewport in design coordinates */
  viewCenter: () => { x: number; y: number } | null;
}

export const canvasApi: CanvasApi = {
  stage: null,
  toWorld: () => null,
  fit: () => undefined,
  zoomTo: () => undefined,
  viewCenter: () => null,
};

/** MIME type used for drag-and-drop from editor panels onto the canvas. */
export const DND_MIME = "application/x-lumora-element";

// Debug handle for automated browser tests in development only.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") (window as unknown as { __lumoraCanvas: CanvasApi }).__lumoraCanvas = canvasApi;
