"use client";
/** Client-side deck compilation with exact text measurement. */
import type { Page } from "@/lib/design/types";
import { buildDeck, deckFonts, type DeckSpec } from "@/lib/templates/editorial";
import { ensureFontFaces } from "@/lib/design/fonts";
import { measureTextHeight } from "@/lib/design/render";

export async function compileDeck(deck: DeckSpec, W: number, H: number): Promise<Page[]> {
  // build once to learn which faces are used, load them, then build with exact measurements
  const draft = buildDeck(deck, W, H);
  const faces = draft.flatMap((p) => p.elements.flatMap((e) => (e.type === "text" ? [{ family: e.fontFamily, weight: e.fontWeight, italic: e.italic }] : [])));
  await ensureFontFaces([...new Map(faces.map((f) => [`${f.family}|${f.weight}|${f.italic}`, f])).values()]);
  void deckFonts;
  return buildDeck(deck, W, H, measureTextHeight);
}
