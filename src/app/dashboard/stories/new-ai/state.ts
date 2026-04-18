import type { Brief, ChapterSynopsis } from "@/lib/ai/schemas";
import type { JSONContent } from "@tiptap/react";
import type { ChatCharacter, ChatMessage } from "@/lib/types";

export type WizardStep = "brief" | "arc" | "chapters" | "review";

export interface MediaAttachment {
  id: string;
  url: string;
  caption: string;
  mediaType: "image" | "gif" | "video";
}

export interface ChapterOutput {
  kind: "prose" | "chat";
  content?: JSONContent;                      // prose
  characters?: ChatCharacter[];               // chat
  messages?: ChatMessage[];                   // chat
  summary: string;
}

export interface ChapterDraft {
  output: ChapterOutput | null;
  media: MediaAttachment[];
  regenHints: string[];
}

export interface WizardState {
  step: WizardStep;
  brief: Brief;
  toneReferenceText?: string;
  outline: ChapterSynopsis[];
  chapters: Record<number, ChapterDraft>;     // keyed by zero-based index
  currentChapterIndex: number;
  storyId: string | null;
  chapterDbIds: Record<number, string>;
}

export const initialState: WizardState = {
  step: "brief",
  brief: {
    title: "",
    description: "",
    categoryId: "",
    format: "prose",
    characters: [{ name: "", description: "" }],
    themes: [],
    chapterCount: 3,
    planningStyle: "B",
  },
  outline: [],
  chapters: {},
  currentChapterIndex: 0,
  storyId: null,
  chapterDbIds: {},
};

export type WizardAction =
  | { type: "SET_BRIEF"; patch: Partial<Brief> }
  | { type: "SET_TONE_REFERENCE"; text: string | undefined }
  | { type: "GO_TO"; step: WizardStep }
  | { type: "SET_OUTLINE"; outline: ChapterSynopsis[] }
  | { type: "SET_CHAPTER_OUTPUT"; index: number; output: ChapterOutput }
  | { type: "SET_CHAPTER_MEDIA"; index: number; media: MediaAttachment[] }
  | { type: "SET_REGEN_HINTS"; index: number; hints: string[] }
  | { type: "SET_CURRENT_CHAPTER"; index: number }
  | { type: "SET_STORY_ID"; id: string }
  | { type: "SET_CHAPTER_DB_ID"; index: number; dbId: string }
  | { type: "LOAD_STATE"; state: WizardState };

export function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_BRIEF":
      return { ...state, brief: { ...state.brief, ...action.patch } };
    case "SET_TONE_REFERENCE":
      return { ...state, toneReferenceText: action.text };
    case "GO_TO":
      return { ...state, step: action.step };
    case "SET_OUTLINE":
      return { ...state, outline: action.outline };
    case "SET_CHAPTER_OUTPUT":
      return {
        ...state,
        chapters: {
          ...state.chapters,
          [action.index]: {
            ...(state.chapters[action.index] ?? { media: [], regenHints: [] }),
            output: action.output,
          },
        },
      };
    case "SET_CHAPTER_MEDIA":
      return {
        ...state,
        chapters: {
          ...state.chapters,
          [action.index]: {
            ...(state.chapters[action.index] ?? { output: null, regenHints: [] }),
            media: action.media,
          },
        },
      };
    case "SET_REGEN_HINTS":
      return {
        ...state,
        chapters: {
          ...state.chapters,
          [action.index]: {
            ...(state.chapters[action.index] ?? { output: null, media: [] }),
            regenHints: action.hints,
          },
        },
      };
    case "SET_CURRENT_CHAPTER":
      return { ...state, currentChapterIndex: action.index };
    case "SET_STORY_ID":
      return { ...state, storyId: action.id };
    case "SET_CHAPTER_DB_ID":
      return {
        ...state,
        chapterDbIds: { ...state.chapterDbIds, [action.index]: action.dbId },
      };
    case "LOAD_STATE":
      return action.state;
    default:
      return state;
  }
}

export const LOCAL_STORAGE_KEY = "erovel-ai-wizard-state-v1";
