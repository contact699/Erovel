import { describe, it, expect } from "vitest";
import { buildSystemPrompt, truncateToneReference } from "./system-prompts";
import type { Brief } from "./schemas";

const baseBrief: Brief = {
  title: "x",
  description: "y",
  categoryId: "mf",
  format: "prose",
  characters: [{ name: "A", description: "B" }],
  themes: ["affair"],
  chapterCount: 3,
  planningStyle: "B",
};

describe("buildSystemPrompt", () => {
  it("always states 18+ and fiction framing", () => {
    const p = buildSystemPrompt(baseBrief);
    expect(p).toMatch(/18\+/);
    expect(p).toMatch(/fiction/i);
  });

  it("does NOT add the step-relation addendum for non-family categories", () => {
    const p = buildSystemPrompt({ ...baseBrief, categoryId: "mf" });
    expect(p).not.toMatch(/step-/i);
  });

  it("adds the step-relation addendum for the family category", () => {
    const p = buildSystemPrompt({ ...baseBrief, categoryId: "family" });
    expect(p).toMatch(/step-/i);
    expect(p).toMatch(/blood relation/i);
  });

  it("tells the model to write explicitly", () => {
    const p = buildSystemPrompt(baseBrief);
    expect(p).toMatch(/explicit/i);
    expect(p).toMatch(/self-censor|do not censor/i);
  });

  it("mentions the format (prose vs chat) in the prompt", () => {
    const prose = buildSystemPrompt({ ...baseBrief, format: "prose" });
    const chat = buildSystemPrompt({ ...baseBrief, format: "chat", characters: [
      { name: "A", description: "B" },
      { name: "C", description: "D" },
    ] });
    expect(prose).toMatch(/prose|paragraphs/i);
    expect(chat).toMatch(/text message|chat/i);
  });
});

describe("truncateToneReference", () => {
  it("returns the input unchanged when under the word cap", () => {
    const short = "one two three";
    expect(truncateToneReference(short, 100)).toBe(short);
  });

  it("truncates to approximately the given word count", () => {
    const words = Array(500).fill("word").join(" ");
    const truncated = truncateToneReference(words, 100);
    const count = truncated.split(/\s+/).length;
    expect(count).toBeLessThanOrEqual(101);
    expect(count).toBeGreaterThanOrEqual(99);
  });

  it("returns empty string for undefined input", () => {
    expect(truncateToneReference(undefined, 100)).toBe("");
  });
});
