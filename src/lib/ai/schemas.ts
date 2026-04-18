import { z } from "zod";

export const CharacterSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().min(1).max(300),
});

export const BriefSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(1000),
    categoryId: z.string().min(1),
    format: z.enum(["prose", "chat"]),
    characters: z.array(CharacterSchema).min(1).max(4),
    themes: z.array(z.string()).max(30),
    chapterCount: z.number().int().min(1).max(20),
    planningStyle: z.enum(["A", "B", "C"]),
    toneReferenceText: z.string().max(20_000).optional(),
  })
  .refine(
    (b) => b.format !== "chat" || b.characters.length === 2,
    { message: "Chat format requires exactly two characters" }
  );

export type Brief = z.infer<typeof BriefSchema>;

export const ChapterSynopsisSchema = z.object({
  title: z.string().min(1).max(200),
  synopsis: z.string().min(1).max(1000),
});

export type ChapterSynopsis = z.infer<typeof ChapterSynopsisSchema>;

export const MediaCaptionSchema = z.object({
  url: z.string().url(),
  caption: z.string().min(1).max(500),
});

export type MediaCaption = z.infer<typeof MediaCaptionSchema>;

// Prose output matches the TipTap JSONContent shape loosely; we don't
// try to validate every node type — just that it's an object with a type.
export const ProseChapterOutputSchema = z.object({
  content: z.object({ type: z.string() }).passthrough(),
  summary: z.string().min(1).max(500),
});

export type ProseChapterOutput = z.infer<typeof ProseChapterOutputSchema>;

export const ChatCharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  color: z.string(),
  alignment: z.enum(["left", "right"]),
  avatar_url: z.string().nullable().optional(),
});

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  character_id: z.string().min(1),
  text: z.string().optional(),
  media_url: z.string().optional(),
  media_type: z.enum(["image", "gif", "video"]).optional(),
  order: z.number().int().optional(),
});

export const ChatChapterOutputSchema = z.object({
  characters: z.array(ChatCharacterSchema).length(2),
  messages: z.array(ChatMessageSchema).min(1).max(200),
  summary: z.string().min(1).max(500),
});

export type ChatChapterOutput = z.infer<typeof ChatChapterOutputSchema>;

// The generation "kind" column on ai_generations.
export const GenerationKindSchema = z.enum(["plan", "chapter", "regenerate"]);
export type GenerationKind = z.infer<typeof GenerationKindSchema>;

// Regen hint chips.
export const RegenHintSchema = z.enum([
  "more_explicit",
  "more_dialogue",
  "slower_pacing",
  "shorter",
  "longer",
]);
export type RegenHint = z.infer<typeof RegenHintSchema>;
