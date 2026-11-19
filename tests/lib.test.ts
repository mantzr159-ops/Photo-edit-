import { describe, expect, it } from "vitest";
import { alignDeltas, elementBounds, snapBox } from "@/lib/design/geometry";
import { contrastRatio, harmony, hexToHsl, hslToHex, readableOn } from "@/lib/utils/color";
import { safeNext } from "@/lib/utils/redirect";
import { LocalTextProvider, extractTopic, summarize } from "@/lib/ai/providers/local";
import { DesignSpecSchema } from "@/lib/ai/schema";
import { BUILTIN_TEMPLATES, instantiateTemplate, searchTemplates } from "@/lib/templates";
import { TEMPLATE_CATEGORIES } from "@/lib/design/types";
import { recolorPage, smartTidy } from "@/lib/editor/style-tools";
import { createPage, createShape, createText } from "@/lib/design/factory";
import { rateLimit } from "@/lib/ai/rate-limit";

describe("geometry", () => {
  it("computes rotated bounds", () => {
    const b = elementBounds({ x: 0, y: 0, width: 100, height: 50, rotation: 90 });
    expect(Math.round(b.x)).toBe(-50);
    expect(Math.round(b.width)).toBe(50);
    expect(Math.round(b.height)).toBe(100);
  });
  it("snaps to page centre", () => {
    const r = snapBox({ x: 447, y: 0, width: 100, height: 10 }, [], { width: 1000, height: 1000 }, 6);
    expect(r.dx).toBe(3);
    expect(r.guides[0]).toEqual({ orientation: "V", position: 500 });
  });
  it("aligns to page", () => {
    const [d] = alignDeltas([{ ...createShape("rect"), x: 10, width: 100 }], "right", { width: 500, height: 500 }, true);
    expect(d.dx).toBe(390);
  });
});

describe("color", () => {
  it("round-trips hsl", () => expect(hslToHex(hexToHsl("#7444ff"))).toBe("#7444ff"));
  it("computes contrast", () => expect(Math.round(contrastRatio("#000000", "#ffffff"))).toBe(21));
  it("chooses readable text", () => expect(readableOn("#111111")).toBe("#ffffff"));
  it("harmony returns 5 hex colours", () => harmony("#3366ff", "triadic").forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/)));
});

describe("security helpers", () => {
  it("blocks open redirects", () => {
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/editor/1")).toBe("/editor/1");
  });
  it("rate limits", () => {
    const key = "test-" + Math.random();
    expect(rateLimit(key, 2).ok).toBe(true);
    expect(rateLimit(key, 2).ok).toBe(true);
    expect(rateLimit(key, 2).ok).toBe(false);
  });
});

describe("offline AI engine", () => {
  it("extracts topics", () => expect(extractTopic("Create a modern medical infographic about hypertension for medical students")).toBe("Hypertension"));
  it("produces schema-valid, distinct concepts", async () => {
    const specs = await new LocalTextProvider().generateDesigns({ prompt: "Infographic about diabetes for nurses", width: 1080, height: 2160, count: 3 });
    expect(specs).toHaveLength(3);
    specs.forEach((s) => expect(DesignSpecSchema.safeParse(s).success).toBe(true));
    expect(new Set(specs.map((s) => s.layout)).size).toBeGreaterThan(1);
  });
  it("summarizes extractively", () => {
    const text = "Cats are great. Dogs are loyal animals. Cats sleep a lot every day. Birds sing. Cats love boxes and cats love sun.";
    expect(summarize(text).length).toBeLessThan(text.length);
  });
});

describe("templates", () => {
  it("covers every category", () => {
    for (const c of TEMPLATE_CATEGORIES) expect(BUILTIN_TEMPLATES.some((t) => t.category === c), c).toBe(true);
  });
  it("instantiates with fresh ids", () => {
    const t = BUILTIN_TEMPLATES[0];
    const pages = instantiateTemplate(t);
    expect(pages[0].id).not.toBe(t.pages[0].id);
    expect(pages[0].elements[0].id).not.toBe(t.pages[0].elements[0].id);
  });
  it("searches by tag", () => expect(searchTemplates(BUILTIN_TEMPLATES, "wedding").length).toBeGreaterThan(0));
});

describe("style tools", () => {
  it("recolours a page", () => {
    const page = createPage({ elements: [createShape("rect", { fill: "#ff0000" })] });
    const out = recolorPage(page, ["#000000", "#111111", "#00ff00", "#eeeeee", "#ffffff"]);
    expect(out.elements[0]).not.toEqual(page.elements[0]);
  });
  it("tidies near-centred items", () => {
    const t = createText({ x: 395, width: 200 });
    const patches = smartTidy(createPage({ elements: [t] }), 1000, 1000);
    expect(patches[0].patch.x).toBe(400);
  });
});

import { curveGeometry, effectLayers, defaultEffect } from "@/lib/design/text-effects";
import { hasRtlChars, resolveDirection } from "@/lib/design/fonts";

describe("text features", () => {
  it("detects RTL text", () => {
    expect(hasRtlChars("مرحبا")).toBe(true);
    expect(resolveDirection("Hello", "auto")).toBe("ltr");
    expect(resolveDirection("رمضان كريم", "auto")).toBe("rtl");
    expect(resolveDirection("رمضان", "ltr")).toBe("ltr");
  });
  it("computes curved text geometry", () => {
    expect(curveGeometry(0, 500, 50)).toBeNull();
    const up = curveGeometry(50, 600, 40)!;
    const down = curveGeometry(-50, 600, 40)!;
    expect(up.width).toBeGreaterThan(0);
    expect(up.height).toBeCloseTo(down.height, 5);
    expect(up.path.startsWith("M")).toBe(true);
  });
  it("builds effect layers", () => {
    const el = createText({ fontSize: 100, effect: defaultEffect("glitch") });
    expect(effectLayers(el).behind).toHaveLength(2);
    const hollow = effectLayers(createText({ fontSize: 100, effect: defaultEffect("hollow") }));
    expect(hollow.main.strokeWidth).toBeGreaterThan(0);
  });
  it("has many templates incl. Arabic, with unique ids", () => {
    expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(100);
    expect(new Set(BUILTIN_TEMPLATES.map((t) => t.id)).size).toBe(BUILTIN_TEMPLATES.length);
    expect(BUILTIN_TEMPLATES.filter((t) => t.tags.includes("arabic")).length).toBeGreaterThanOrEqual(15);
  });
});
