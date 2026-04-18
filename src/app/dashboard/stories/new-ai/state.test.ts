import { describe, it, expect } from "vitest";
import { reducer, initialState } from "./state";

describe("wizard reducer", () => {
  it("starts on step 'brief' with empty brief fields", () => {
    expect(initialState.step).toBe("brief");
    expect(initialState.brief.title).toBe("");
  });

  it("SET_BRIEF merges fields", () => {
    const s = reducer(initialState, {
      type: "SET_BRIEF",
      patch: { title: "x", chapterCount: 5 },
    });
    expect(s.brief.title).toBe("x");
    expect(s.brief.chapterCount).toBe(5);
  });

  it("GO_TO moves to the given step", () => {
    const s = reducer(initialState, { type: "GO_TO", step: "chapters" });
    expect(s.step).toBe("chapters");
  });

  it("SET_OUTLINE stores the outline array", () => {
    const s = reducer(initialState, {
      type: "SET_OUTLINE",
      outline: [{ title: "C1", synopsis: "s" }],
    });
    expect(s.outline).toHaveLength(1);
  });

  it("SET_CHAPTER_OUTPUT stores a generated chapter output by index", () => {
    const s = reducer(initialState, {
      type: "SET_CHAPTER_OUTPUT",
      index: 0,
      output: { kind: "prose", content: { type: "doc" }, summary: "s" },
    });
    expect(s.chapters[0]).toBeDefined();
    expect(s.chapters[0].output?.kind).toBe("prose");
  });

  it("SET_CURRENT_CHAPTER sets the working chapter index", () => {
    const s = reducer(initialState, { type: "SET_CURRENT_CHAPTER", index: 2 });
    expect(s.currentChapterIndex).toBe(2);
  });
});
