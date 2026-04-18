import { describe, it, expect } from "vitest";
import {
  BriefSchema,
  ChapterSynopsisSchema,
  ProseChapterOutputSchema,
  ChatChapterOutputSchema,
} from "./schemas";

describe("BriefSchema", () => {
  it("accepts a minimal valid prose brief", () => {
    const ok = BriefSchema.safeParse({
      title: "A Wife Let Loose",
      description: "A bored wife's first affair.",
      categoryId: "mf",
      format: "prose",
      characters: [{ name: "Sarah", description: "37, restless, auburn hair" }],
      themes: ["affair"],
      chapterCount: 5,
      planningStyle: "B",
    });
    expect(ok.success).toBe(true);
  });

  it("requires exactly two characters for chat format", () => {
    const bad = BriefSchema.safeParse({
      title: "x",
      description: "y",
      categoryId: "mf",
      format: "chat",
      characters: [{ name: "Only", description: "one" }],
      themes: [],
      chapterCount: 1,
      planningStyle: "C",
    });
    expect(bad.success).toBe(false);
  });

  it("rejects chapterCount outside 1-20", () => {
    const result = BriefSchema.safeParse({
      title: "x",
      description: "y",
      categoryId: "mf",
      format: "prose",
      characters: [{ name: "A", description: "B" }],
      themes: [],
      chapterCount: 25,
      planningStyle: "A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid planningStyle", () => {
    const result = BriefSchema.safeParse({
      title: "x",
      description: "y",
      categoryId: "mf",
      format: "prose",
      characters: [{ name: "A", description: "B" }],
      themes: [],
      chapterCount: 1,
      planningStyle: "Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("ChapterSynopsisSchema", () => {
  it("accepts a valid synopsis", () => {
    const ok = ChapterSynopsisSchema.safeParse({
      title: "Chapter 1",
      synopsis: "Sarah meets her neighbour.",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects empty title", () => {
    const bad = ChapterSynopsisSchema.safeParse({ title: "", synopsis: "x" });
    expect(bad.success).toBe(false);
  });
});

describe("ProseChapterOutputSchema", () => {
  it("accepts a TipTap doc plus summary", () => {
    const ok = ProseChapterOutputSchema.safeParse({
      content: { type: "doc", content: [] },
      summary: "They met. They flirted.",
    });
    expect(ok.success).toBe(true);
  });
});

describe("ChatChapterOutputSchema", () => {
  it("accepts a two-character chat with messages", () => {
    const ok = ChatChapterOutputSchema.safeParse({
      characters: [
        { id: "char-1", name: "Sarah", color: "#3B82F6", alignment: "left" },
        { id: "char-2", name: "Mike", color: "#10B981", alignment: "right" },
      ],
      messages: [
        { id: "msg-1", character_id: "char-1", text: "Hi" },
        { id: "msg-2", character_id: "char-2", text: "Hey" },
      ],
      summary: "Initial contact.",
    });
    expect(ok.success).toBe(true);
  });
});
