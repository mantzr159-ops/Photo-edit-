import { beforeEach, describe, expect, it } from "vitest";
import { useEditor } from "@/stores/editor-store";
import { createProject, createShape, createText } from "@/lib/design/factory";

const s = () => useEditor.getState();

beforeEach(() => {
  s().load(createProject({ width: 1000, height: 800 }));
});

describe("editor store", () => {
  it("adds, updates and undoes/redoes elements", () => {
    const rect = createShape("rect", { x: 10, y: 10, width: 100, height: 100 });
    s().addElements([rect]);
    expect(s().doc!.pages[0].elements).toHaveLength(1);
    expect(s().selectedIds).toEqual([rect.id]);
    s().updateElement(rect.id, { x: 50 });
    expect(s().doc!.pages[0].elements[0].x).toBe(50);
    s().undo();
    expect(s().doc!.pages[0].elements[0].x).toBe(10);
    s().undo();
    expect(s().doc!.pages[0].elements).toHaveLength(0);
    s().redo();
    s().redo();
    expect(s().doc!.pages[0].elements[0].x).toBe(50);
  });

  it("coalesces rapid edits with the same history key", () => {
    const rect = createShape("rect");
    s().addElements([rect]);
    const before = s().past.length;
    for (let i = 0; i < 10; i++) s().updateElement(rect.id, { opacity: i / 10 }, "opacity");
    expect(s().past.length).toBe(before + 1);
  });

  it("groups: selecting one member selects the group", () => {
    const a = createShape("rect"), b = createShape("ellipse"), c = createText();
    s().addElements([a, b, c]);
    s().select([a.id, b.id]);
    s().groupSelected();
    s().select([a.id]);
    expect(new Set(s().selectedIds)).toEqual(new Set([a.id, b.id]));
    s().ungroupSelected();
    s().select([a.id]);
    expect(s().selectedIds).toEqual([a.id]);
  });

  it("arranges layers", () => {
    const a = createShape("rect"), b = createShape("rect"), c = createShape("rect");
    s().addElements([a, b, c]);
    s().select([a.id]);
    s().arrange("front");
    expect(s().doc!.pages[0].elements.map((e) => e.id)).toEqual([b.id, c.id, a.id]);
    s().arrange("backward");
    expect(s().doc!.pages[0].elements.map((e) => e.id)).toEqual([b.id, a.id, c.id]);
  });

  it("aligns a single element to the page and distributes three", () => {
    const a = createShape("rect", { x: 5, y: 5, width: 100, height: 100 });
    s().addElements([a]);
    s().align("hcenter");
    expect(s().doc!.pages[0].elements[0].x).toBe(450);
    const b = createShape("rect", { x: 0, y: 0, width: 10, height: 10 });
    const c = createShape("rect", { x: 30, y: 0, width: 10, height: 10 });
    const d = createShape("rect", { x: 100, y: 0, width: 10, height: 10 });
    s().addElements([b, c, d]);
    s().select([b.id, c.id, d.id]);
    s().distribute("horizontal");
    const xs = s().doc!.pages[0].elements.slice(1).map((e) => e.x);
    expect(xs).toEqual([0, 50, 100]);
  });

  it("manages pages: add, duplicate, move, delete", () => {
    const first = s().doc!.pages[0].id;
    s().addElements([createShape("rect")]);
    s().duplicatePage(first);
    expect(s().doc!.pages).toHaveLength(2);
    expect(s().doc!.pages[1].elements[0].id).not.toBe(s().doc!.pages[0].elements[0].id);
    s().addPage();
    s().movePage(2, 0);
    expect(s().doc!.pages[1].id).toBe(first);
    s().deletePage(first);
    expect(s().doc!.pages).toHaveLength(2);
  });

  it("copy/paste creates offset copies with new ids; locked elements survive delete", () => {
    const a = createShape("rect", { x: 0, y: 0 });
    s().addElements([a]);
    s().copySelected();
    s().paste();
    const els = s().doc!.pages[0].elements;
    expect(els).toHaveLength(2);
    expect(els[1].x).toBe(24);
    s().select([a.id]);
    s().toggleLockSelected();
    s().deleteSelected();
    expect(s().doc!.pages[0].elements.some((e) => e.id === a.id)).toBe(true);
  });

  it("resizes design and scales content", () => {
    s().addElements([createShape("rect", { x: 100, y: 100, width: 100, height: 100 })]);
    s().resizeDesign(500, 400, true);
    const el = s().doc!.pages[0].elements[0];
    expect(s().doc!.width).toBe(500);
    expect(el.width).toBe(50);
  });
});
