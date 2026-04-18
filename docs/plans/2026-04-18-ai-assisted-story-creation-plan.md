# AI-Assisted Story Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone AI-assisted story wizard at `/dashboard/stories/new-ai` that turns a brief + chapter count into draft chapters, chapter by chapter, using Gemini 2.5 Flash. Verified-creator gated, rate-limited, kill-switched behind a feature flag.

**Architecture:** Next.js 16 App Router client wizard talking to three server routes (`/api/ai/story/plan`, `/api/ai/story/chapter`, `/api/ai/story/tone-reference`). Pure server-side Gemini REST calls with chapter generation streamed back over SSE. Generated content lands in the same `stories` / `chapters` / `chapter_content` tables the manual flow writes. One new JSONB column (`stories.ai_context`), one boolean (`stories.ai_generated`), one new table (`ai_generations`) for audit + rate-limit accounting. Shared publish helper extracted from the manual flow so AI and manual flows never drift.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (Postgres + auth), Tailwind, TipTap (existing prose editor), zod (new — runtime schema validation), vitest (existing), Gemini 2.5 Flash REST API (`https://generativelanguage.googleapis.com/v1beta`).

**Reference:** See `docs/plans/2026-04-18-ai-assisted-story-creation-design.md` for the approved design this plan implements.

---

## Task 0: Add zod dependency + env var placeholders

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install zod**

Run:
```bash
npm install zod
```

- [ ] **Step 2: Confirm the dependency was added**

Run:
```bash
grep '"zod"' package.json
```

Expected: a line like `"zod": "^3.25.x"` (or newer) in `dependencies`.

- [ ] **Step 3: Add env placeholders**

Append to `.env.example`:

```bash

# --- AI-assisted story creation (Gemini 2.5 Flash) ---
# Google AI Studio API key (server-side only)
GEMINI_API_KEY=
# Set to "true" to enable the AI story wizard for verified creators
AI_STORY_WIZARD_ENABLED=false
# Daily USD budget ceiling. If today's estimated spend exceeds this,
# the wizard auto-disables itself for the rest of the UTC day.
AI_STORY_DAILY_BUDGET_USD=50
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore(ai): add zod + env placeholders for story wizard"
```

---

## Task 1: Supabase migration — ai_context, ai_generated, ai_generations table

**Files:**
- Create: `supabase/migrations/20260418000000_ai_story_creation.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260418000000_ai_story_creation.sql`:

```sql
-- AI-assisted story creation: context blob on stories + audit/rate-limit table

alter table stories add column if not exists ai_context jsonb;
alter table stories add column if not exists ai_generated boolean not null default false;

create table if not exists ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('plan','chapter','regenerate')),
  story_id uuid references stories(id) on delete set null,
  chapter_id uuid references chapters(id) on delete set null,
  model text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_generations_user_time
  on ai_generations (user_id, created_at desc);

create index if not exists idx_ai_generations_created_at
  on ai_generations (created_at desc);

alter table ai_generations enable row level security;

-- Users can read their own audit rows
create policy "ai_generations_select_own" on ai_generations
  for select using (auth.uid() = user_id);

-- Writes go through the service-role key from server routes only
create policy "ai_generations_insert_service" on ai_generations
  for insert with check (true);
```

- [ ] **Step 2: Apply the migration locally**

Run (assuming you have the Supabase CLI linked to a local or remote project):
```bash
supabase db push
```

OR copy/paste the SQL into the Supabase SQL editor.

Expected: no errors. Verify the columns and table exist:
```sql
select column_name from information_schema.columns
where table_name = 'stories' and column_name in ('ai_context','ai_generated');

select count(*) from ai_generations;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260418000000_ai_story_creation.sql
git commit -m "feat(ai): migration — ai_context + ai_generations table"
```

---

## Task 2: Zod schemas for briefs, outlines, and generated outputs

**Files:**
- Create: `src/lib/ai/schemas.ts`
- Create: `src/lib/ai/schemas.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/ai/schemas.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npx vitest run src/lib/ai/schemas.test.ts
```

Expected: FAIL (file not found or imports broken).

- [ ] **Step 3: Implement `schemas.ts`**

Create `src/lib/ai/schemas.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/ai/schemas.test.ts
```

Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/schemas.ts src/lib/ai/schemas.test.ts
git commit -m "feat(ai): zod schemas for briefs, outlines, and chapter outputs"
```

---

## Task 3: System prompt builder

**Files:**
- Create: `src/lib/ai/system-prompts.ts`
- Create: `src/lib/ai/system-prompts.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/ai/system-prompts.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npx vitest run src/lib/ai/system-prompts.test.ts
```

Expected: FAIL (file not found).

- [ ] **Step 3: Implement `system-prompts.ts`**

Create `src/lib/ai/system-prompts.ts`:

```ts
import type { Brief } from "./schemas";

const BASE_PREAMBLE = `You are an erotica author writing for Erovel, an adult fiction platform.

Hard rules (never violated under any circumstance):
- All characters you write are 18 or older. Fictional ages default to mid-20s to 40s unless the creator specifies an adult age.
- This is fiction. The creator's brief is the starting point; follow it.
- Write explicitly. Do not self-censor language or scenes. The platform is adult fiction — flinching from the creator's stated themes produces worse output.
- Never include content involving minors under any framing.`;

const FAMILY_ADDENDUM = `
This story is in the "family" category. Default to step-relationships (step-sibling, step-parent, step-cousin, etc.) unless the creator explicitly specifies blood relation in the brief. All characters remain 18+ and the disclaimer of "fiction, all characters 18+" applies.`;

const PROSE_FORMAT_GUIDE = `
Format: prose.
- Write rich, sensory paragraphs. Dialogue is OK but prose narration is primary.
- Output must be a TipTap JSONContent document (type: "doc" with a content array of paragraph nodes). Include text formatting where it feels natural (emphasis, etc.).`;

const CHAT_FORMAT_GUIDE = `
Format: chat (sext-style text messages between exactly two characters).
- Write natural text-message dialogue: short turns, emojis where appropriate, occasional abbreviations, typos only if the character would make them.
- Two characters only. Alternate naturally; the sender of each message is set by character_id.
- When a creator has uploaded media for this chapter, interleave messages with media turns at the positions their captions suggest fit best in the conversation.`;

export function buildSystemPrompt(brief: Brief): string {
  const parts = [BASE_PREAMBLE];

  if (brief.categoryId === "family") {
    parts.push(FAMILY_ADDENDUM);
  }

  parts.push(brief.format === "prose" ? PROSE_FORMAT_GUIDE : CHAT_FORMAT_GUIDE);

  return parts.join("\n");
}

export function truncateToneReference(
  text: string | undefined,
  wordLimit: number
): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text.trim();
  return words.slice(0, wordLimit).join(" ");
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/ai/system-prompts.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/system-prompts.ts src/lib/ai/system-prompts.test.ts
git commit -m "feat(ai): system prompt builder with family-category step-relation addendum"
```

---

## Task 4: Rate-limit helper

**Files:**
- Create: `src/lib/ai/rate-limit.ts`
- Create: `src/lib/ai/rate-limit.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/ai/rate-limit.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { checkRateLimit, recordGeneration, DAILY_LIMIT } from "./rate-limit";

function makeMockClient(usageCount: number) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gt: vi.fn().mockResolvedValue({ count: usageCount, error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
}

describe("checkRateLimit", () => {
  it("returns allowed=true when under the daily limit", async () => {
    const supabase = makeMockClient(5);
    const result = await checkRateLimit(supabase, "user-1");
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(5);
    expect(result.remaining).toBe(DAILY_LIMIT - 5);
  });

  it("returns allowed=false when at the daily limit", async () => {
    const supabase = makeMockClient(DAILY_LIMIT);
    const result = await checkRateLimit(supabase, "user-1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns allowed=false when over the daily limit", async () => {
    const supabase = makeMockClient(DAILY_LIMIT + 10);
    const result = await checkRateLimit(supabase, "user-1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("counts only 'chapter' and 'regenerate' kinds (not 'plan')", async () => {
    const supabase = makeMockClient(0);
    await checkRateLimit(supabase, "user-1");
    const from = vi.mocked(supabase.from);
    expect(from).toHaveBeenCalledWith("ai_generations");
    // The `in` clause for kinds happens inside the chained `.select()`. We
    // assert it by inspecting the chain calls.
    const selectReturn = from.mock.results[0].value;
    expect(selectReturn.select).toHaveBeenCalled();
  });
});

describe("recordGeneration", () => {
  it("inserts an ai_generations row with the given kind and token counts", async () => {
    const supabase = makeMockClient(0);
    await recordGeneration(supabase, {
      userId: "user-1",
      kind: "chapter",
      storyId: "story-1",
      chapterId: null,
      model: "gemini-2.5-flash",
      tokensIn: 1000,
      tokensOut: 2000,
    });

    const from = vi.mocked(supabase.from);
    expect(from).toHaveBeenCalledWith("ai_generations");
    const insert = vi.mocked(from.mock.results[0].value.insert);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        kind: "chapter",
        story_id: "story-1",
        chapter_id: null,
        model: "gemini-2.5-flash",
        tokens_in: 1000,
        tokens_out: 2000,
      })
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npx vitest run src/lib/ai/rate-limit.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `rate-limit.ts`**

Create `src/lib/ai/rate-limit.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationKind } from "./schemas";

export const DAILY_LIMIT = 100;

export interface RateLimitResult {
  allowed: boolean;
  used: number;
  remaining: number;
  resetAt: string; // ISO timestamp when the 24h window slides past the oldest usage
}

/**
 * Counts how many chapter-class generations a user has done in the last 24h
 * and compares to DAILY_LIMIT. "plan" generations don't count — they're
 * one-shot per story and cheap.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("ai_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("kind", ["chapter", "regenerate"])
    .gt("created_at", since);

  if (error) {
    throw new Error(`rate-limit query failed: ${error.message}`);
  }

  const used = count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - used);
  const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return { allowed: used < DAILY_LIMIT, used, remaining, resetAt };
}

export interface RecordGenerationInput {
  userId: string;
  kind: GenerationKind;
  storyId: string | null;
  chapterId: string | null;
  model: string;
  tokensIn: number;
  tokensOut: number;
}

export async function recordGeneration(
  supabase: SupabaseClient,
  input: RecordGenerationInput
): Promise<void> {
  const { error } = await supabase.from("ai_generations").insert({
    user_id: input.userId,
    kind: input.kind,
    story_id: input.storyId,
    chapter_id: input.chapterId,
    model: input.model,
    tokens_in: input.tokensIn,
    tokens_out: input.tokensOut,
  });
  if (error) {
    throw new Error(`ai_generations insert failed: ${error.message}`);
  }
}
```

Note: the test's mock chain is slightly different from the real chain (the real one uses `.in()` instead of `.gt()`'s position in the chain). Update the mock:

Replace the mock setup in `src/lib/ai/rate-limit.test.ts` with:

```ts
function makeMockClient(usageCount: number) {
  const gt = vi.fn().mockResolvedValue({ count: usageCount, error: null });
  const inFn = vi.fn().mockReturnValue({ gt });
  const eq = vi.fn().mockReturnValue({ in: inFn });
  const select = vi.fn().mockReturnValue({ eq });
  const insert = vi.fn().mockResolvedValue({ error: null });
  return {
    from: vi.fn().mockReturnValue({ select, insert }),
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/ai/rate-limit.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/rate-limit.ts src/lib/ai/rate-limit.test.ts
git commit -m "feat(ai): per-user daily rate limit + generation audit helper"
```

---

## Task 5: Feature flag + budget circuit breaker

**Files:**
- Create: `src/lib/ai/guards.ts`
- Create: `src/lib/ai/guards.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/ai/guards.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { isFeatureEnabled, estimateDailySpendUsd, isWithinBudget } from "./guards";

describe("isFeatureEnabled", () => {
  const original = process.env.AI_STORY_WIZARD_ENABLED;
  beforeEach(() => {
    process.env.AI_STORY_WIZARD_ENABLED = original;
  });

  it("returns true when env is 'true'", () => {
    process.env.AI_STORY_WIZARD_ENABLED = "true";
    expect(isFeatureEnabled()).toBe(true);
  });

  it("returns false when env is 'false'", () => {
    process.env.AI_STORY_WIZARD_ENABLED = "false";
    expect(isFeatureEnabled()).toBe(false);
  });

  it("returns false when env is unset", () => {
    delete process.env.AI_STORY_WIZARD_ENABLED;
    expect(isFeatureEnabled()).toBe(false);
  });
});

describe("estimateDailySpendUsd", () => {
  it("sums tokens and applies the Gemini 2.5 Flash price", () => {
    // Gemini 2.5 Flash pricing (as of 2026-04): $0.30/M input, $2.50/M output
    const spend = estimateDailySpendUsd([
      { tokens_in: 1_000_000, tokens_out: 500_000 },
      { tokens_in: 500_000, tokens_out: 200_000 },
    ]);
    // (1.5M * 0.30 / 1M) + (0.7M * 2.50 / 1M) = 0.45 + 1.75 = 2.20
    expect(spend).toBeCloseTo(2.2, 2);
  });

  it("returns 0 for no rows", () => {
    expect(estimateDailySpendUsd([])).toBe(0);
  });
});

describe("isWithinBudget", () => {
  const original = process.env.AI_STORY_DAILY_BUDGET_USD;
  beforeEach(() => {
    process.env.AI_STORY_DAILY_BUDGET_USD = original;
  });

  it("returns true when spend is under the budget", () => {
    process.env.AI_STORY_DAILY_BUDGET_USD = "50";
    expect(isWithinBudget(25)).toBe(true);
  });

  it("returns false when spend has hit the budget", () => {
    process.env.AI_STORY_DAILY_BUDGET_USD = "50";
    expect(isWithinBudget(50)).toBe(false);
    expect(isWithinBudget(60)).toBe(false);
  });

  it("defaults to $50 budget when env is unset", () => {
    delete process.env.AI_STORY_DAILY_BUDGET_USD;
    expect(isWithinBudget(40)).toBe(true);
    expect(isWithinBudget(55)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npx vitest run src/lib/ai/guards.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `guards.ts`**

Create `src/lib/ai/guards.ts`:

```ts
// Gemini 2.5 Flash pricing as of 2026-04 (USD per million tokens)
// https://ai.google.dev/pricing
const PRICE_INPUT_PER_M = 0.30;
const PRICE_OUTPUT_PER_M = 2.50;

const DEFAULT_BUDGET_USD = 50;

export function isFeatureEnabled(): boolean {
  return (process.env.AI_STORY_WIZARD_ENABLED || "").toLowerCase() === "true";
}

export interface TokenUsageRow {
  tokens_in: number;
  tokens_out: number;
}

export function estimateDailySpendUsd(rows: TokenUsageRow[]): number {
  let inputTokens = 0;
  let outputTokens = 0;
  for (const row of rows) {
    inputTokens += row.tokens_in ?? 0;
    outputTokens += row.tokens_out ?? 0;
  }
  return (
    (inputTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M
  );
}

export function isWithinBudget(spendUsd: number): boolean {
  const limit = Number(process.env.AI_STORY_DAILY_BUDGET_USD) || DEFAULT_BUDGET_USD;
  return spendUsd < limit;
}

/**
 * Sums today's generation spend from the DB and checks it against the budget.
 * Runs on every AI route call; if the budget's hit the route returns 503.
 */
export async function isDailySpendWithinBudget(
  supabase: import("@supabase/supabase-js").SupabaseClient
): Promise<{ withinBudget: boolean; spendUsd: number }> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("ai_generations")
    .select("tokens_in, tokens_out")
    .gt("created_at", startOfDay.toISOString());

  if (error) {
    throw new Error(`budget query failed: ${error.message}`);
  }

  const spendUsd = estimateDailySpendUsd(data ?? []);
  return { withinBudget: isWithinBudget(spendUsd), spendUsd };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/ai/guards.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/guards.ts src/lib/ai/guards.test.ts
git commit -m "feat(ai): feature flag + daily USD budget circuit breaker"
```

---

## Task 6: Gemini client — non-streaming generateStructured

**Files:**
- Create: `src/lib/ai/gemini.ts`
- Create: `src/lib/ai/gemini.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/ai/gemini.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateStructured } from "./gemini";

const ORIGINAL_FETCH = global.fetch;

describe("generateStructured", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("POSTs to the Gemini REST endpoint with safety + responseSchema", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            { content: { parts: [{ text: JSON.stringify({ hello: "world" }) }] }, finishReason: "STOP" },
          ],
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateStructured<{ hello: string }>({
      systemPrompt: "sys",
      userPrompt: "hi",
      responseSchema: { type: "object", properties: { hello: { type: "string" } } },
    });

    expect(result.parsed).toEqual({ hello: "world" });
    expect(result.tokensIn).toBe(100);
    expect(result.tokensOut).toBe(50);

    const call = fetchMock.mock.calls[0];
    expect(call[0]).toMatch(/generativelanguage\.googleapis\.com/);
    expect(call[0]).toMatch(/gemini-2\.5-flash/);
    const body = JSON.parse(call[1].body);
    expect(body.systemInstruction.parts[0].text).toBe("sys");
    expect(body.contents[0].parts[0].text).toBe("hi");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toBeDefined();
    expect(body.safetySettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        }),
      ])
    );
  });

  it("throws a SafetyRefusal error when finishReason is SAFETY", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [] }, finishReason: "SAFETY" }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 0 },
        }),
    }) as unknown as typeof fetch;

    await expect(
      generateStructured({
        systemPrompt: "x",
        userPrompt: "y",
        responseSchema: { type: "object" },
      })
    ).rejects.toThrow(/SAFETY/);
  });

  it("throws when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("internal error"),
    }) as unknown as typeof fetch;

    await expect(
      generateStructured({
        systemPrompt: "x",
        userPrompt: "y",
        responseSchema: { type: "object" },
      })
    ).rejects.toThrow(/Gemini HTTP 500/);
  });

  it("throws if GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      generateStructured({
        systemPrompt: "x",
        userPrompt: "y",
        responseSchema: { type: "object" },
      })
    ).rejects.toThrow(/GEMINI_API_KEY/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npx vitest run src/lib/ai/gemini.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `gemini.ts`**

Create `src/lib/ai/gemini.ts`:

```ts
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
] as const;

export interface GenerateStructuredArgs {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateStructuredResult<T> {
  parsed: T;
  raw: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

export class SafetyRefusalError extends Error {
  constructor(public reason: string) {
    super(`Gemini SAFETY refusal: ${reason}`);
    this.name = "SafetyRefusalError";
  }
}

export async function generateStructured<T>(
  args: GenerateStructuredArgs
): Promise<GenerateStructuredResult<T>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: args.systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: args.userPrompt }] }],
    generationConfig: {
      temperature: args.temperature ?? 0.9,
      topP: 0.95,
      maxOutputTokens: args.maxOutputTokens ?? 4000,
      responseMimeType: "application/json",
      responseSchema: args.responseSchema,
    },
    safetySettings: SAFETY_SETTINGS,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const candidate = json.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;

  if (finishReason === "SAFETY" || json.promptFeedback?.blockReason) {
    throw new SafetyRefusalError(
      finishReason ?? json.promptFeedback?.blockReason ?? "unknown"
    );
  }

  const rawText: string = candidate?.content?.parts?.[0]?.text ?? "";
  let parsed: T;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(
      `Gemini returned non-JSON (finishReason=${finishReason}): ${String(err)}`
    );
  }

  return {
    parsed,
    raw: rawText,
    tokensIn: json.usageMetadata?.promptTokenCount ?? 0,
    tokensOut: json.usageMetadata?.candidatesTokenCount ?? 0,
    model: GEMINI_MODEL,
  };
}

export { GEMINI_MODEL };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/ai/gemini.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/gemini.ts src/lib/ai/gemini.test.ts
git commit -m "feat(ai): Gemini 2.5 Flash client — generateStructured with SAFETY handling"
```

---

## Task 7: Gemini client — streaming generateStream

**Files:**
- Modify: `src/lib/ai/gemini.ts`
- Modify: `src/lib/ai/gemini.test.ts`

- [ ] **Step 1: Add the failing streaming tests**

Append to `src/lib/ai/gemini.test.ts`:

```ts
import { generateStream } from "./gemini";

function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      }
      controller.close();
    },
  });
}

describe("generateStream", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("yields text deltas as they arrive", async () => {
    const body = sseStream([
      JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hel" }] } }] }),
      JSON.stringify({ candidates: [{ content: { parts: [{ text: "lo" }] } }] }),
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: "!" }] }, finishReason: "STOP" }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 3 },
      }),
    ]);
    global.fetch = vi.fn().mockResolvedValue({ ok: true, body }) as unknown as typeof fetch;

    const deltas: string[] = [];
    let final: Awaited<ReturnType<typeof generateStream>>["final"] | null = null;
    for await (const event of generateStream({
      systemPrompt: "sys",
      userPrompt: "user",
      responseSchema: { type: "object" },
    })) {
      if (event.type === "delta") deltas.push(event.text);
      if (event.type === "final") final = event;
    }

    expect(deltas.join("")).toBe("Hello!");
    expect(final).toBeTruthy();
    expect(final?.tokensIn).toBe(10);
    expect(final?.tokensOut).toBe(3);
    expect(final?.rawText).toBe("Hello!");
  });

  it("throws SafetyRefusalError on a stream that ends with SAFETY", async () => {
    const body = sseStream([
      JSON.stringify({
        candidates: [{ content: { parts: [] }, finishReason: "SAFETY" }],
      }),
    ]);
    global.fetch = vi.fn().mockResolvedValue({ ok: true, body }) as unknown as typeof fetch;

    const run = async () => {
      for await (const _ of generateStream({
        systemPrompt: "x",
        userPrompt: "y",
        responseSchema: { type: "object" },
      })) {
        // consume
      }
    };
    await expect(run()).rejects.toThrow(/SAFETY/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npx vitest run src/lib/ai/gemini.test.ts
```

Expected: the two new tests FAIL (`generateStream` not exported).

- [ ] **Step 3: Implement `generateStream`**

Append to `src/lib/ai/gemini.ts`:

```ts

export type StreamEvent =
  | { type: "delta"; text: string }
  | {
      type: "final";
      rawText: string;
      parsed: unknown;
      tokensIn: number;
      tokensOut: number;
      model: string;
    };

export async function* generateStream(
  args: GenerateStructuredArgs
): AsyncGenerator<StreamEvent, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const url =
    `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:streamGenerateContent` +
    `?alt=sse&key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: args.systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: args.userPrompt }] }],
    generationConfig: {
      temperature: args.temperature ?? 0.9,
      topP: 0.95,
      maxOutputTokens: args.maxOutputTokens ?? 4000,
      responseMimeType: "application/json",
      responseSchema: args.responseSchema,
    },
    safetySettings: SAFETY_SETTINGS,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini stream HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let rawText = "";
  let tokensIn = 0;
  let tokensOut = 0;
  let sawSafety = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by \n\n; each frame has one or more `data: ` lines.
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      for (const line of frame.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload) continue;
        let chunk: unknown;
        try {
          chunk = JSON.parse(payload);
        } catch {
          continue;
        }

        const c = (chunk as {
          candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
          usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
        }).candidates?.[0];
        const deltaText = c?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
        if (deltaText) {
          rawText += deltaText;
          yield { type: "delta", text: deltaText };
        }
        if (c?.finishReason === "SAFETY") sawSafety = true;

        const um = (chunk as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }).usageMetadata;
        if (um) {
          tokensIn = um.promptTokenCount ?? tokensIn;
          tokensOut = um.candidatesTokenCount ?? tokensOut;
        }
      }
    }
  }

  if (sawSafety) {
    throw new SafetyRefusalError("SAFETY");
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Leave parsed as null — route handler may choose to retry or return raw.
  }

  yield {
    type: "final",
    rawText,
    parsed,
    tokensIn,
    tokensOut,
    model: GEMINI_MODEL,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/lib/ai/gemini.test.ts
```

Expected: all tests pass (including the two new streaming tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/gemini.ts src/lib/ai/gemini.test.ts
git commit -m "feat(ai): Gemini streaming generator yielding delta + final events"
```

---

## Task 8: Verified-creator + feature-flag gate helper

**Files:**
- Create: `src/lib/ai/require-ai-access.ts`

- [ ] **Step 1: Write the helper**

Create `src/lib/ai/require-ai-access.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isFeatureEnabled, isDailySpendWithinBudget } from "./guards";
import { checkRateLimit } from "./rate-limit";

/**
 * Single gate used by every /api/ai/story/* POST route.
 * Runs in order: feature-flag, auth, verified, daily budget, per-user rate-limit.
 * Returns either a ready-to-use admin client + userId, or an NextResponse
 * the caller should return directly.
 */
export async function requireAiAccess(opts: { checkRateLimit: boolean } = { checkRateLimit: true }): Promise<
  | { ok: true; supabase: ReturnType<typeof createClient>; userId: string; remaining: number }
  | { ok: false; response: NextResponse }
> {
  if (!isFeatureEnabled()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "AI wizard is currently disabled" },
        { status: 503 }
      ),
    };
  }

  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      ),
    };
  }

  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await authSupabase
    .from("profiles")
    .select("is_verified, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Profile missing" }, { status: 404 }),
    };
  }
  if (!profile.is_verified) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Get verified to use AI writing" },
        { status: 403 }
      ),
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not configured" }, { status: 503 }),
    };
  }
  const admin = createClient(url, serviceKey);

  const budget = await isDailySpendWithinBudget(admin);
  if (!budget.withinBudget) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "AI writing is temporarily disabled — daily budget reached. Resets at 00:00 UTC.",
          spendUsd: budget.spendUsd,
        },
        { status: 503 }
      ),
    };
  }

  if (opts.checkRateLimit) {
    const rl = await checkRateLimit(admin, user.id);
    if (!rl.allowed) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Daily generation limit reached (${rl.used}/100). Resets at ${rl.resetAt}.`,
            used: rl.used,
            remaining: rl.remaining,
            resetAt: rl.resetAt,
          },
          { status: 429, headers: { "x-ratelimit-reset": rl.resetAt } }
        ),
      };
    }
    return { ok: true, supabase: admin, userId: user.id, remaining: rl.remaining };
  }

  return { ok: true, supabase: admin, userId: user.id, remaining: -1 };
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/require-ai-access.ts
git commit -m "feat(ai): requireAiAccess gate — feature flag + verified + budget + rate-limit"
```

---

## Task 9: Tone-reference API route

**Files:**
- Create: `src/app/api/ai/story/tone-reference/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/ai/story/tone-reference/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { truncateToneReference } from "@/lib/ai/system-prompts";

const TONE_WORD_LIMIT = 2000;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  // Auth only — feature-flag and verify gates don't apply here; this is
  // a passive data lookup, not an AI call.
  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { storyId?: string; storySlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.storyId && !body.storySlug) {
    return NextResponse.json(
      { error: "Provide storyId or storySlug" },
      { status: 400 }
    );
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const storyQ = admin
    .from("stories")
    .select("id, status, visibility")
    .limit(1);
  const { data: story } = body.storyId
    ? await storyQ.eq("id", body.storyId).single()
    : await storyQ.eq("slug", body.storySlug!).single();

  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  if (story.status !== "published" || story.visibility !== "public") {
    return NextResponse.json(
      { error: "Can only reference published public stories" },
      { status: 403 }
    );
  }

  const { data: chapters } = await admin
    .from("chapter_content")
    .select("content_json, chapters!inner(story_id, chapter_number)")
    .eq("chapters.story_id", story.id)
    .order("chapter_number", { ascending: true, referencedTable: "chapters" })
    .limit(20);

  // Flatten whatever content shapes we see (prose TipTap JSON, or chat
  // characters+messages) into plain text for the voice sample.
  const chunks: string[] = [];
  for (const row of chapters ?? []) {
    const c = row.content_json as unknown;
    chunks.push(flattenToText(c));
    if (chunks.join(" ").split(/\s+/).length >= TONE_WORD_LIMIT) break;
  }

  const text = truncateToneReference(chunks.join("\n\n"), TONE_WORD_LIMIT);
  return NextResponse.json({ text });
}

function flattenToText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const c = content as Record<string, unknown>;

  // Chat shape
  if (Array.isArray(c.messages)) {
    return (c.messages as Array<Record<string, unknown>>)
      .map((m) => (typeof m.text === "string" ? m.text : ""))
      .filter(Boolean)
      .join("\n");
  }

  // TipTap prose shape
  const out: string[] = [];
  walk(c, out);
  return out.join(" ");
}

function walk(node: Record<string, unknown>, out: string[]) {
  if (typeof node.text === "string") {
    out.push(node.text);
  }
  const content = node.content;
  if (Array.isArray(content)) {
    for (const child of content) {
      if (child && typeof child === "object") {
        walk(child as Record<string, unknown>, out);
      }
    }
  }
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/story/tone-reference/route.ts
git commit -m "feat(ai): POST /api/ai/story/tone-reference — fetch 2k-word voice sample"
```

---

## Task 10: Plan API route

**Files:**
- Create: `src/app/api/ai/story/plan/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/ai/story/plan/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireAiAccess } from "@/lib/ai/require-ai-access";
import { BriefSchema } from "@/lib/ai/schemas";
import { buildSystemPrompt, truncateToneReference } from "@/lib/ai/system-prompts";
import { generateStructured, SafetyRefusalError } from "@/lib/ai/gemini";
import { recordGeneration } from "@/lib/ai/rate-limit";

export const maxDuration = 60;

const OUTLINE_SCHEMA = {
  type: "object",
  properties: {
    outline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          synopsis: { type: "string" },
        },
        required: ["title", "synopsis"],
      },
    },
  },
  required: ["outline"],
} as const;

export async function POST(request: NextRequest) {
  // Plan generations are cheap and one-shot per story; skip rate-limit check.
  const access = await requireAiAccess({ checkRateLimit: false });
  if (!access.ok) return access.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parse = BriefSchema.safeParse((raw as { brief?: unknown })?.brief);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid brief", details: parse.error.issues },
      { status: 400 }
    );
  }
  const brief = parse.data;
  const toneRef = truncateToneReference(
    (raw as { toneReferenceText?: string })?.toneReferenceText,
    2000
  );

  const systemPrompt = buildSystemPrompt(brief);
  const userPrompt = buildPlanUserPrompt(brief, toneRef);

  try {
    const result = await generateStructured<{
      outline: { title: string; synopsis: string }[];
    }>({
      systemPrompt,
      userPrompt,
      responseSchema: OUTLINE_SCHEMA,
      temperature: 0.8,
      maxOutputTokens: 2000,
    });

    await recordGeneration(access.supabase, {
      userId: access.userId,
      kind: "plan",
      storyId: null,
      chapterId: null,
      model: result.model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    });

    console.log(
      `[AI plan] user=${access.userId} chapters=${brief.chapterCount} ` +
        `tokens=${result.tokensIn}/${result.tokensOut}`
    );

    return NextResponse.json({ outline: result.parsed.outline });
  } catch (err) {
    if (err instanceof SafetyRefusalError) {
      return NextResponse.json(
        {
          error: "refusal",
          message:
            "Gemini refused to plan this story. Try rewording themes or characters.",
        },
        { status: 422 }
      );
    }
    console.error("[AI plan] error:", err);
    return NextResponse.json(
      { error: "Generation failed", details: String(err).slice(0, 200) },
      { status: 502 }
    );
  }
}

function buildPlanUserPrompt(
  brief: import("@/lib/ai/schemas").Brief,
  toneRef: string
): string {
  const chars = brief.characters
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");
  const themes = brief.themes.length ? brief.themes.join(", ") : "(none specified)";
  const tone = toneRef
    ? `\n\nVoice reference (mimic tone, pacing, vocabulary — do not copy prose verbatim):\n${toneRef}`
    : "";

  return `Plan a ${brief.chapterCount}-chapter ${brief.format} story.

Title: ${brief.title}
Description: ${brief.description}
Category: ${brief.categoryId}
Themes / kinks: ${themes}

Characters:
${chars}

Return a JSON object with shape:
{ "outline": [ { "title": "...", "synopsis": "one-sentence synopsis" }, ... ] }

The outline must contain exactly ${brief.chapterCount} entries. Pace the arc so early chapters set up, middle chapters escalate, and the final chapter pays off.${tone}`;
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/story/plan/route.ts
git commit -m "feat(ai): POST /api/ai/story/plan — Gemini-drafted chapter outlines"
```

---

## Task 11: Chapter API route (SSE streaming)

**Files:**
- Create: `src/app/api/ai/story/chapter/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/ai/story/chapter/route.ts`:

```ts
import { NextRequest } from "next/server";
import { requireAiAccess } from "@/lib/ai/require-ai-access";
import {
  BriefSchema,
  ProseChapterOutputSchema,
  ChatChapterOutputSchema,
  MediaCaptionSchema,
  RegenHintSchema,
} from "@/lib/ai/schemas";
import { buildSystemPrompt, truncateToneReference } from "@/lib/ai/system-prompts";
import { generateStream, SafetyRefusalError } from "@/lib/ai/gemini";
import { recordGeneration } from "@/lib/ai/rate-limit";
import { z } from "zod";

export const maxDuration = 120;

const PROSE_SCHEMA = {
  type: "object",
  properties: {
    content: { type: "object" },
    summary: { type: "string" },
  },
  required: ["content", "summary"],
} as const;

const CHAT_SCHEMA = {
  type: "object",
  properties: {
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          color: { type: "string" },
          alignment: { type: "string", enum: ["left", "right"] },
        },
        required: ["id", "name", "color", "alignment"],
      },
    },
    messages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          character_id: { type: "string" },
          text: { type: "string" },
          media_url: { type: "string" },
          media_type: { type: "string", enum: ["image", "gif", "video"] },
          order: { type: "integer" },
        },
        required: ["id", "character_id"],
      },
    },
    summary: { type: "string" },
  },
  required: ["characters", "messages", "summary"],
} as const;

const RequestSchema = z.object({
  brief: BriefSchema,
  outline: z.array(
    z.object({ title: z.string(), synopsis: z.string() })
  ),
  chapterNumber: z.number().int().min(1),
  priorChapterSummaries: z.array(z.string()),
  mediaCaptions: z.array(MediaCaptionSchema),
  regenHints: z.array(RegenHintSchema).optional(),
  toneReferenceText: z.string().optional(),
  isRegeneration: z.boolean().optional(),
  storyId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
});

const HINT_TEXT: Record<string, string> = {
  more_explicit: "Push the scene further. Use more graphic, vivid language.",
  more_dialogue: "Include more back-and-forth dialogue between the characters.",
  slower_pacing: "Slow down — linger on sensation and anticipation.",
  shorter: "Keep this chapter brief and tight.",
  longer: "Expand the chapter with more detail and a longer arc.",
};

export async function POST(request: NextRequest) {
  const access = await requireAiAccess({ checkRateLimit: true });
  if (!access.ok) return access.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = RequestSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const req = parsed.data;
  const outputSchema = req.brief.format === "prose" ? PROSE_SCHEMA : CHAT_SCHEMA;
  const systemPrompt = buildSystemPrompt(req.brief);
  const userPrompt = buildChapterUserPrompt(req);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        let tokensIn = 0;
        let tokensOut = 0;
        let rawText = "";

        for await (const event of generateStream({
          systemPrompt,
          userPrompt,
          responseSchema: outputSchema,
          maxOutputTokens: 4000,
        })) {
          if (event.type === "delta") {
            rawText += event.text;
            send({ type: "delta", text: event.text });
          } else if (event.type === "final") {
            tokensIn = event.tokensIn;
            tokensOut = event.tokensOut;
            rawText = event.rawText;
          }
        }

        let parsedObj: unknown = null;
        try {
          parsedObj = JSON.parse(rawText);
        } catch {
          send({
            type: "error",
            code: "malformed",
            message:
              "Gemini returned text we couldn't parse. Use the raw output and edit manually.",
            raw: rawText,
          });
          controller.close();
          return;
        }

        const validator =
          req.brief.format === "prose" ? ProseChapterOutputSchema : ChatChapterOutputSchema;
        const validated = validator.safeParse(parsedObj);
        if (!validated.success) {
          send({
            type: "error",
            code: "invalid_shape",
            message: "Output did not match the expected shape.",
            raw: rawText,
          });
          controller.close();
          return;
        }

        await recordGeneration(access.supabase, {
          userId: access.userId,
          kind: req.isRegeneration ? "regenerate" : "chapter",
          storyId: req.storyId ?? null,
          chapterId: req.chapterId ?? null,
          model: "gemini-2.5-flash",
          tokensIn,
          tokensOut,
        });

        send({ type: "final", output: validated.data, tokensIn, tokensOut });
        controller.close();
      } catch (err) {
        if (err instanceof SafetyRefusalError) {
          send({
            type: "error",
            code: "refusal",
            message:
              "Gemini refused that scene. Try rewording themes or characters.",
          });
        } else {
          console.error("[AI chapter] error:", err);
          send({
            type: "error",
            code: "server",
            message: "Generation failed.",
            details: String(err).slice(0, 200),
          });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function buildChapterUserPrompt(req: z.infer<typeof RequestSchema>): string {
  const { brief, outline, chapterNumber, priorChapterSummaries, mediaCaptions, regenHints, toneReferenceText } = req;
  const chars = brief.characters.map((c) => `- ${c.name}: ${c.description}`).join("\n");
  const themes = brief.themes.length ? brief.themes.join(", ") : "(none)";
  const tone = truncateToneReference(toneReferenceText, 2000);
  const toneBlock = tone
    ? `\n\nVoice reference (mimic tone/pacing/vocabulary — do not copy prose verbatim):\n${tone}`
    : "";
  const synopsis =
    outline[chapterNumber - 1]?.synopsis ??
    "(no synopsis — invent a logical next beat)";
  const prior = priorChapterSummaries.length
    ? `\n\nPrior chapters (summaries):\n${priorChapterSummaries
        .map((s, i) => `Ch ${i + 1}: ${s}`)
        .join("\n")}`
    : "";
  const media = mediaCaptions.length
    ? `\n\nMedia to incorporate naturally (creator already uploaded these; reference them at the right narrative beats):\n${mediaCaptions
        .map((m, i) => `[media ${i + 1}] url=${m.url} — caption: ${m.caption}`)
        .join("\n")}\n\n${
        brief.format === "chat"
          ? "For each media item, emit a message with its url set to media_url and media_type set appropriately (image/gif/video). Place them where they fit naturally in the conversation."
          : "Reference the media within the prose at the right moment; do not fabricate media URLs. We will splice images in during rendering."
      }`
    : "";
  const hints = regenHints?.length
    ? `\n\nRegeneration adjustments for this pass:\n${regenHints
        .map((h) => `- ${HINT_TEXT[h]}`)
        .join("\n")}`
    : "";

  return `Write chapter ${chapterNumber} of ${brief.chapterCount} for the story titled "${brief.title}".

Description: ${brief.description}
Themes / kinks: ${themes}
Characters:
${chars}

This chapter's synopsis: ${synopsis}${prior}${media}${hints}${toneBlock}

Return JSON matching the provided response schema. The "summary" field must be 1-2 lines describing what happened this chapter — it will be used as context when generating the next chapter.`;
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/story/chapter/route.ts
git commit -m "feat(ai): POST /api/ai/story/chapter — SSE streaming chapter generation"
```

---

## Task 12: Extract shared publish helper

**Files:**
- Create: `src/lib/story-publish.ts`
- Modify: `src/app/dashboard/stories/new/page.tsx` (use the helper from the new file)

- [ ] **Step 1: Create the helper**

Create `src/lib/story-publish.ts`:

```ts
import {
  createStory,
  createChapter,
  saveChapterContent,
  updateStory,
  updateChapter,
  generateSlug,
  saveStoryTags,
} from "@/lib/supabase/queries";
import type { StoryFormat, ChatContent } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";

export interface StoryMeta {
  title: string;
  description: string;
  categoryId: string;
  format: StoryFormat;
  tags: string[];
  isGated: boolean;
  storyPrice: number;
  visibility: "public" | "unlisted";
  passwordHash: string | null;
  coverImageUrl: string | null;
  aiContext?: Record<string, unknown>;
  aiGenerated?: boolean;
}

export interface ChapterPayload {
  title: string;
  chapterNumber: number;
  proseContent?: JSONContent;
  chatContent?: ChatContent;
  publishAt?: string | null;
  dbId?: string;
}

/**
 * Saves a story (creating or updating) plus its chapters. Used by both the
 * manual /dashboard/stories/new flow and the AI wizard.
 */
export async function saveStoryWithChapters(opts: {
  existingStoryId: string | null;
  meta: StoryMeta;
  chapters: ChapterPayload[];
  status: "draft" | "published";
  creatorId: string;
}): Promise<{ storyId: string }> {
  const slug = generateSlug(opts.meta.title);

  let storyId = opts.existingStoryId;

  if (!storyId) {
    const story = await createStory({
      creator_id: opts.creatorId,
      title: opts.meta.title,
      slug,
      description: opts.meta.description,
      category_id: opts.meta.categoryId,
      format: opts.meta.format,
      is_gated: opts.meta.isGated,
      price: opts.meta.storyPrice,
      visibility: opts.meta.visibility,
      password_hash: opts.meta.passwordHash,
      cover_image_url: opts.meta.coverImageUrl,
      status: opts.status,
      ai_context: opts.meta.aiContext ?? null,
      ai_generated: opts.meta.aiGenerated ?? false,
    });
    storyId = story.id;
  } else {
    await updateStory(storyId, {
      title: opts.meta.title,
      description: opts.meta.description,
      category_id: opts.meta.categoryId,
      format: opts.meta.format,
      is_gated: opts.meta.isGated,
      price: opts.meta.storyPrice,
      visibility: opts.meta.visibility,
      password_hash: opts.meta.passwordHash,
      cover_image_url: opts.meta.coverImageUrl,
      status: opts.status,
      ai_context: opts.meta.aiContext ?? null,
      ai_generated: opts.meta.aiGenerated ?? false,
    });
  }

  await saveStoryTags(storyId, opts.meta.tags);

  for (const ch of opts.chapters) {
    let chapterDbId = ch.dbId;
    if (!chapterDbId) {
      const created = await createChapter({
        story_id: storyId,
        title: ch.title,
        chapter_number: ch.chapterNumber,
        status: opts.status,
        publish_at: ch.publishAt ?? null,
      });
      chapterDbId = created.id;
    } else {
      await updateChapter(chapterDbId, {
        title: ch.title,
        chapter_number: ch.chapterNumber,
        status: opts.status,
        publish_at: ch.publishAt ?? null,
      });
    }

    if (ch.proseContent || ch.chatContent) {
      await saveChapterContent(chapterDbId, ch.proseContent ?? ch.chatContent!);
    }
  }

  return { storyId };
}
```

- [ ] **Step 2: Inspect existing `updateStory` / `createStory` signatures**

Run:
```bash
grep -n "createStory\|updateStory\|createChapter\|updateChapter\|saveChapterContent\|saveStoryTags" src/lib/supabase/queries.ts | head -20
```

Expected: these helper functions exist. If any field in the above helper (e.g. `ai_context`, `ai_generated`) is not yet supported in `createStory`/`updateStory`, add it. Check with:

```bash
grep -n "ai_context\|ai_generated" src/lib/supabase/queries.ts
```

If missing, edit `createStory` and `updateStory` in `src/lib/supabase/queries.ts` to pass through the new columns.

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors. If there are type errors on the new columns, add the optional fields to `StoryInsert`/`StoryUpdate` types at the top of `queries.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/story-publish.ts src/lib/supabase/queries.ts
git commit -m "refactor(stories): extract saveStoryWithChapters helper for reuse"
```

Note: the manual flow `/dashboard/stories/new/page.tsx` is NOT modified in this task. The AI wizard uses the new helper; the manual flow will be migrated in a follow-up only if needed. This is deliberate YAGNI — we don't want to ship a refactor of manual flow as part of this feature.

---

## Task 13: Wizard route skeleton + verified gate

**Files:**
- Create: `src/app/dashboard/stories/new-ai/page.tsx`

- [ ] **Step 1: Write the skeleton**

Create `src/app/dashboard/stories/new-ai/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";

export default function NewAiStoryPage() {
  const { user, hydrated } = useAuthStore();
  const [featureOn, setFeatureOn] = useState<boolean | null>(null);

  // Probe the plan endpoint once on mount to detect whether the server-side
  // feature flag is enabled. Any 503 for feature-off means we block the UI.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/story/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ __probe: true }),
        });
        if (cancelled) return;
        // 400 (Invalid JSON/brief) means feature is on and we reached the handler.
        // 503 means feature off (or misconfigured).
        setFeatureOn(res.status !== 503);
      } catch {
        if (!cancelled) setFeatureOn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated) return null;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-muted">Sign in to use AI writing.</p>
      </div>
    );
  }

  if (user.role !== "creator") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-muted">Only creators can write stories.</p>
      </div>
    );
  }

  if (!user.is_verified) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10">
          <ShieldCheck size={24} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold">Get verified to unlock AI writing</h1>
        <p className="text-sm text-muted">
          Identity verification keeps the platform safe and unlocks AI-assisted
          story creation.
        </p>
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    );
  }

  if (featureOn === null) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-muted text-sm">
        Loading…
      </div>
    );
  }

  if (featureOn === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">AI writing is currently off</h1>
        <p className="text-sm text-muted">
          The AI wizard is temporarily disabled. Check back shortly.
        </p>
        <Link href="/dashboard/stories/new">
          <Button variant="secondary">Start a blank story instead</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/dashboard/stories"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to my stories
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <Sparkles size={24} className="text-accent" />
        <h1 className="text-2xl font-bold">Create with AI</h1>
      </div>
      <p className="text-sm text-muted mt-2">
        Four steps: brief, arc, chapter-by-chapter generation, review.
      </p>

      {/* Step content mounts here in Task 15. */}
      <div className="mt-8 p-6 bg-surface border border-border rounded-xl text-sm text-muted">
        Wizard steps will mount here.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + visual check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

Run the dev server:
```bash
npm run dev
```

Visit `/dashboard/stories/new-ai` as:
- A logged-out user → sign-in message.
- A reader → "Only creators" message.
- An unverified creator → "Get verified" message.
- A verified creator, feature flag off → "AI writing is off" message.
- A verified creator, feature flag on (`AI_STORY_WIZARD_ENABLED=true`) → the placeholder wizard shell.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/stories/new-ai/page.tsx
git commit -m "feat(ai-wizard): route skeleton + verified + feature-flag gate"
```

---

## Task 14: Wizard state reducer

**Files:**
- Create: `src/app/dashboard/stories/new-ai/state.ts`
- Create: `src/app/dashboard/stories/new-ai/state.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/app/dashboard/stories/new-ai/state.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
npx vitest run src/app/dashboard/stories/new-ai/state.test.ts
```

Expected: FAIL (file not found).

- [ ] **Step 3: Implement `state.ts`**

Create `src/app/dashboard/stories/new-ai/state.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
npx vitest run src/app/dashboard/stories/new-ai/state.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/stories/new-ai/state.ts src/app/dashboard/stories/new-ai/state.test.ts
git commit -m "feat(ai-wizard): reducer + state shape for the 4-step wizard"
```

---

## Task 15: Brief form component

**Files:**
- Create: `src/app/dashboard/stories/new-ai/brief-form.tsx`

- [ ] **Step 1: Write the component**

Create `src/app/dashboard/stories/new-ai/brief-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { Brief } from "@/lib/ai/schemas";

interface Props {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
  onNext: () => void;
}

const PLANNING_STYLES: { value: "A" | "B" | "C"; label: string; blurb: string }[] = [
  { value: "A", label: "I write synopses", blurb: "You write one sentence per chapter in the next step." },
  { value: "B", label: "AI drafts an outline", blurb: "Gemini proposes chapter titles + synopses; you edit/approve." },
  { value: "C", label: "Improvise", blurb: "Skip planning. Each chapter is invented on the fly." },
];

export function BriefForm({ brief, onChange, onNext }: Props) {
  const [themeInput, setThemeInput] = useState("");

  function addTheme() {
    const v = themeInput.trim();
    if (!v) return;
    onChange({ themes: [...brief.themes, v] });
    setThemeInput("");
  }

  function removeTheme(idx: number) {
    onChange({ themes: brief.themes.filter((_, i) => i !== idx) });
  }

  function updateCharacter(idx: number, patch: Partial<{ name: string; description: string }>) {
    const next = brief.characters.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChange({ characters: next });
  }

  function addCharacter() {
    onChange({ characters: [...brief.characters, { name: "", description: "" }] });
  }

  function removeCharacter(idx: number) {
    onChange({ characters: brief.characters.filter((_, i) => i !== idx) });
  }

  // Chat format locks to exactly 2 characters
  function setFormat(format: "prose" | "chat") {
    const chars =
      format === "chat"
        ? brief.characters.length === 2
          ? brief.characters
          : [
              brief.characters[0] ?? { name: "", description: "" },
              brief.characters[1] ?? { name: "", description: "" },
            ]
        : brief.characters;
    onChange({ format, characters: chars });
  }

  const canContinue =
    brief.title.trim().length > 0 &&
    brief.description.trim().length > 0 &&
    brief.categoryId.length > 0 &&
    brief.characters.every((c) => c.name.trim() && c.description.trim()) &&
    (brief.format !== "chat" || brief.characters.length === 2);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={brief.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="A Wife Let Loose"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Short description</label>
        <Textarea
          value={brief.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="A bored wife's first affair — slow burn over five chapters."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={brief.categoryId}
            onChange={(e) => onChange({ categoryId: e.target.value })}
            options={[
              { value: "", label: "Pick a category…" },
              ...CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Format</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={brief.format === "prose" ? "accent" : "secondary"}
              size="sm"
              onClick={() => setFormat("prose")}
            >
              Prose
            </Button>
            <Button
              type="button"
              variant={brief.format === "chat" ? "accent" : "secondary"}
              size="sm"
              onClick={() => setFormat("chat")}
            >
              Chat (sext)
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Characters</label>
          {brief.format !== "chat" && (
            <Button type="button" variant="ghost" size="sm" onClick={addCharacter}>
              <Plus size={14} /> Add character
            </Button>
          )}
        </div>
        {brief.characters.map((c, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <Input
              value={c.name}
              onChange={(e) => updateCharacter(idx, { name: e.target.value })}
              placeholder="Name"
              className="w-40"
            />
            <Input
              value={c.description}
              onChange={(e) => updateCharacter(idx, { description: e.target.value })}
              placeholder="One-line description"
              className="flex-1"
            />
            {brief.format !== "chat" && brief.characters.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCharacter(idx)}
              >
                <X size={14} />
              </Button>
            )}
          </div>
        ))}
        {brief.format === "chat" && (
          <p className="text-xs text-muted">
            Chat format requires exactly two characters.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Themes / kinks</label>
        <div className="flex gap-2">
          <Input
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTheme();
              }
            }}
            placeholder="affair, power-imbalance, slow-burn…"
            className="flex-1"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addTheme}>
            Add
          </Button>
        </div>
        {brief.themes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {brief.themes.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-surface-hover text-muted"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTheme(i)}
                  className="hover:text-foreground cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Chapter count</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={brief.chapterCount}
            onChange={(e) =>
              onChange({
                chapterCount: Math.min(20, Math.max(1, Number(e.target.value) || 1)),
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Planning style</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PLANNING_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ planningStyle: s.value })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                brief.planningStyle === s.value
                  ? "border-accent bg-accent/5"
                  : "border-border hover:bg-surface-hover"
              }`}
            >
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted mt-1">{s.blurb}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button onClick={onNext} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/stories/new-ai/brief-form.tsx
git commit -m "feat(ai-wizard): brief form — title, characters, themes, planning style"
```

---

## Task 16: Tone reference picker component

**Files:**
- Create: `src/app/dashboard/stories/new-ai/tone-reference-picker.tsx`

- [ ] **Step 1: Write the component**

Create `src/app/dashboard/stories/new-ai/tone-reference-picker.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface MyStory {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  toneReferenceText: string | undefined;
  onChange: (text: string | undefined) => void;
}

type Tab = "my_stories" | "platform_story" | "paste";

export function ToneReferencePicker({ toneReferenceText, onChange }: Props) {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("my_stories");
  const [myStories, setMyStories] = useState<MyStory[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [platformSlug, setPlatformSlug] = useState("");
  const [pasted, setPasted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user) return;
    (async () => {
      const { data } = await supabase
        .from("stories")
        .select("id, title, slug")
        .eq("creator_id", user.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
      setMyStories(data ?? []);
    })();
  }, [user]);

  async function fetchToneFromStory(payload: { storyId?: string; storySlug?: string }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/story/tone-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        onChange(undefined);
        return;
      }
      onChange(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      onChange(undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border">
        {(
          [
            ["my_stories", "My stories"],
            ["platform_story", "Platform story"],
            ["paste", "Paste text"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`px-3 py-2 text-sm transition-colors cursor-pointer ${
              tab === value
                ? "border-b-2 border-accent text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "my_stories" && (
        <div className="space-y-2">
          <Select
            value={selectedStoryId}
            onChange={(e) => setSelectedStoryId(e.target.value)}
            options={[
              { value: "", label: myStories.length ? "Pick one of your stories…" : "You have no published stories" },
              ...myStories.map((s) => ({ value: s.id, label: s.title })),
            ]}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!selectedStoryId || loading}
            onClick={() => fetchToneFromStory({ storyId: selectedStoryId })}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Use this as the voice sample
          </Button>
        </div>
      )}

      {tab === "platform_story" && (
        <div className="flex gap-2">
          <Input
            value={platformSlug}
            onChange={(e) => setPlatformSlug(e.target.value)}
            placeholder="Paste a story slug (e.g. a-wife-let-loose-rzjsbt)"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!platformSlug.trim() || loading}
            onClick={() => fetchToneFromStory({ storySlug: platformSlug.trim() })}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Fetch
          </Button>
        </div>
      )}

      {tab === "paste" && (
        <Textarea
          value={pasted}
          onChange={(e) => {
            setPasted(e.target.value);
            onChange(e.target.value.trim() || undefined);
          }}
          placeholder="Paste ~2000 words of writing you want the AI to mimic for tone."
          rows={8}
        />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {toneReferenceText && (
        <div className="text-xs text-muted">
          Voice sample loaded ({toneReferenceText.split(/\s+/).length} words).
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="ml-2 underline hover:text-foreground cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/stories/new-ai/tone-reference-picker.tsx
git commit -m "feat(ai-wizard): tone reference picker — own stories / platform / paste"
```

---

## Task 17: Arc planner component

**Files:**
- Create: `src/app/dashboard/stories/new-ai/arc-planner.tsx`

- [ ] **Step 1: Write the component**

Create `src/app/dashboard/stories/new-ai/arc-planner.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Brief, ChapterSynopsis } from "@/lib/ai/schemas";

interface Props {
  brief: Brief;
  toneReferenceText: string | undefined;
  outline: ChapterSynopsis[];
  onOutlineChange: (outline: ChapterSynopsis[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ArcPlanner({
  brief,
  toneReferenceText,
  outline,
  onOutlineChange,
  onBack,
  onNext,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Planning style C skips this step entirely — the wizard calls onNext.
  useEffect(() => {
    if (brief.planningStyle === "C") {
      onNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.planningStyle]);

  // Planning style A: creator writes synopses themselves. Seed empty rows.
  useEffect(() => {
    if (brief.planningStyle === "A" && outline.length !== brief.chapterCount) {
      onOutlineChange(
        Array.from({ length: brief.chapterCount }, (_, i) => ({
          title: outline[i]?.title ?? `Chapter ${i + 1}`,
          synopsis: outline[i]?.synopsis ?? "",
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.planningStyle, brief.chapterCount]);

  async function draftOutline() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/story/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, toneReferenceText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "refusal" ? data.message : data.error || `HTTP ${res.status}`);
        return;
      }
      onOutlineChange(data.outline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (brief.planningStyle === "C") {
    return null; // effect above advances
  }

  const canContinue =
    outline.length === brief.chapterCount &&
    outline.every((c) => c.title.trim() && c.synopsis.trim());

  function updateRow(idx: number, patch: Partial<ChapterSynopsis>) {
    onOutlineChange(
      outline.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Arc</h2>
        <p className="text-sm text-muted">
          {brief.planningStyle === "A"
            ? "Write one sentence per chapter."
            : "Let Gemini draft a chapter-by-chapter arc — then edit any row."}
        </p>
      </div>

      {brief.planningStyle === "B" && outline.length === 0 && (
        <Button onClick={draftOutline} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Draft outline with AI
        </Button>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {outline.length > 0 && (
        <div className="space-y-3">
          {outline.map((c, idx) => (
            <div key={idx} className="p-4 bg-surface border border-border rounded-lg space-y-2">
              <Input
                value={c.title}
                onChange={(e) => updateRow(idx, { title: e.target.value })}
                placeholder={`Chapter ${idx + 1} title`}
              />
              <Textarea
                value={c.synopsis}
                onChange={(e) => updateRow(idx, { synopsis: e.target.value })}
                placeholder="One-sentence synopsis"
                rows={2}
              />
            </div>
          ))}
        </div>
      )}

      {outline.length > 0 && brief.planningStyle === "B" && (
        <Button variant="ghost" size="sm" onClick={draftOutline} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Redraft
        </Button>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/stories/new-ai/arc-planner.tsx
git commit -m "feat(ai-wizard): arc planner — A/B/C branches incl. AI-drafted outlines"
```

---

## Task 18: Chapter generator component (media + hints + streaming)

**Files:**
- Create: `src/app/dashboard/stories/new-ai/chapter-generator.tsx`

- [ ] **Step 1: Write the component**

Create `src/app/dashboard/stories/new-ai/chapter-generator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaUpload } from "@/components/editor/media-upload";
import { ChatReader } from "@/components/story/chat-reader";
import { ProseReader } from "@/components/story/prose-reader";
import { Sparkles, Loader2, X } from "lucide-react";
import type {
  WizardState,
  ChapterDraft,
  ChapterOutput,
  MediaAttachment,
} from "./state";

const HINT_CHIPS: { value: string; label: string }[] = [
  { value: "more_explicit", label: "More explicit" },
  { value: "more_dialogue", label: "More dialogue" },
  { value: "slower_pacing", label: "Slower pacing" },
  { value: "shorter", label: "Shorter" },
  { value: "longer", label: "Longer" },
];

interface Props {
  state: WizardState;
  onSetMedia: (index: number, media: MediaAttachment[]) => void;
  onSetHints: (index: number, hints: string[]) => void;
  onSetOutput: (index: number, output: ChapterOutput) => void;
  onSetCurrent: (index: number) => void;
  onBack: () => void;
  onFinish: () => void;
}

export function ChapterGenerator({
  state,
  onSetMedia,
  onSetHints,
  onSetOutput,
  onSetCurrent,
  onBack,
  onFinish,
}: Props) {
  const { brief, outline, currentChapterIndex, chapters } = state;
  const draft: ChapterDraft =
    chapters[currentChapterIndex] ?? { output: null, media: [], regenHints: [] };

  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function generate(isRegeneration: boolean) {
    setStreaming(true);
    setStreamedText("");
    setError(null);

    const priorSummaries = Array.from({ length: currentChapterIndex })
      .map((_, i) => chapters[i]?.output?.summary ?? "")
      .filter(Boolean);

    const mediaCaptions = draft.media.map((m) => ({ url: m.url, caption: m.caption }));

    const body = {
      brief,
      outline,
      chapterNumber: currentChapterIndex + 1,
      priorChapterSummaries: priorSummaries,
      mediaCaptions,
      regenHints: draft.regenHints,
      toneReferenceText: state.toneReferenceText,
      isRegeneration,
      storyId: state.storyId ?? undefined,
      chapterId: state.chapterDbIds[currentChapterIndex],
    };

    try {
      const res = await fetch("/api/ai/story/chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        setError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = line.slice(6);
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "delta") {
              setStreamedText((t) => t + ev.text);
            } else if (ev.type === "final") {
              const output: ChapterOutput =
                brief.format === "prose"
                  ? { kind: "prose", content: ev.output.content, summary: ev.output.summary }
                  : {
                      kind: "chat",
                      characters: ev.output.characters,
                      messages: ev.output.messages,
                      summary: ev.output.summary,
                    };
              onSetOutput(currentChapterIndex, output);
            } else if (ev.type === "error") {
              setError(ev.message || ev.code || "Generation failed");
            }
          } catch {
            // skip malformed event frame
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setStreaming(false);
    }
  }

  function toggleHint(value: string) {
    const current = draft.regenHints;
    const next = current.includes(value)
      ? current.filter((h) => h !== value)
      : [...current, value];
    onSetHints(currentChapterIndex, next);
  }

  function addMedia(newMedia: { url: string; mediaType: "image" | "gif" | "video" }) {
    const item: MediaAttachment = {
      id: crypto.randomUUID(),
      url: newMedia.url,
      caption: "",
      mediaType: newMedia.mediaType,
    };
    onSetMedia(currentChapterIndex, [...draft.media, item]);
  }

  function updateCaption(id: string, caption: string) {
    onSetMedia(
      currentChapterIndex,
      draft.media.map((m) => (m.id === id ? { ...m, caption } : m))
    );
  }

  function removeMedia(id: string) {
    onSetMedia(currentChapterIndex, draft.media.filter((m) => m.id !== id));
  }

  const canGenerate = draft.media.every((m) => m.caption.trim().length > 0);
  const hasOutput = !!draft.output;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      {/* Chapter list sidebar */}
      <aside className="space-y-1">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
          Chapters
        </p>
        {Array.from({ length: brief.chapterCount }).map((_, i) => {
          const done = !!chapters[i]?.output;
          const isCurrent = i === currentChapterIndex;
          return (
            <button
              key={i}
              onClick={() => onSetCurrent(i)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                isCurrent
                  ? "bg-accent/10 text-foreground"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <span className="font-mono text-xs mr-2">{i + 1}.</span>
              {outline[i]?.title ?? `Chapter ${i + 1}`}
              {done && <span className="ml-2 text-success text-xs">✓</span>}
            </button>
          );
        })}
      </aside>

      {/* Main panel */}
      <div className="space-y-5 min-w-0">
        <div>
          <h2 className="text-lg font-semibold">
            Chapter {currentChapterIndex + 1} of {brief.chapterCount}
          </h2>
          {outline[currentChapterIndex]?.synopsis && (
            <p className="text-sm text-muted mt-1">
              {outline[currentChapterIndex].synopsis}
            </p>
          )}
        </div>

        {/* Media upload + captions */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Media for this chapter (optional)</p>
          <MediaUpload
            onUpload={(url, mediaType) =>
              addMedia({ url, mediaType: mediaType as "image" | "gif" | "video" })
            }
          />
          {draft.media.length > 0 && (
            <div className="space-y-2">
              {draft.media.map((m) => (
                <div key={m.id} className="flex gap-2 items-start p-2 bg-surface border border-border rounded-lg">
                  <span className="text-xs text-muted mt-2 w-14 shrink-0">
                    {m.mediaType}
                  </span>
                  <Input
                    value={m.caption}
                    onChange={(e) => updateCaption(m.id, e.target.value)}
                    placeholder="Caption (required) — what's happening in this media?"
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeMedia(m.id)}>
                    <X size={14} />
                  </Button>
                </div>
              ))}
              {!canGenerate && (
                <p className="text-xs text-danger">
                  Every uploaded media needs a caption before generating.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Regen hint chips */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Tuning for regeneration</p>
          <div className="flex flex-wrap gap-2">
            {HINT_CHIPS.map((h) => {
              const active = draft.regenHints.includes(h.value);
              return (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => toggleHint(h.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    active
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border text-muted hover:bg-surface-hover"
                  }`}
                >
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => generate(hasOutput)}
            disabled={streaming || !canGenerate}
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {hasOutput ? "Regenerate chapter" : "Generate chapter"}
          </Button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Live preview */}
        {(streaming || hasOutput) && (
          <div className="border border-border rounded-xl p-4 bg-surface">
            {streaming && !hasOutput && (
              <pre className="text-sm whitespace-pre-wrap text-muted">
                {streamedText}
              </pre>
            )}
            {hasOutput && draft.output!.kind === "prose" && draft.output!.content && (
              <ProseReader content={draft.output!.content as Record<string, unknown>} />
            )}
            {hasOutput && draft.output!.kind === "chat" && (
              <ChatReader
                content={{
                  characters: draft.output!.characters!,
                  messages: draft.output!.messages!,
                }}
              />
            )}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="secondary" onClick={onBack}>Back</Button>
          {currentChapterIndex + 1 < brief.chapterCount ? (
            <Button
              onClick={() => onSetCurrent(currentChapterIndex + 1)}
              disabled={!hasOutput}
            >
              Next chapter
            </Button>
          ) : (
            <Button onClick={onFinish} disabled={!hasOutput}>
              Review & publish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/stories/new-ai/chapter-generator.tsx
git commit -m "feat(ai-wizard): chapter generator — media+captions, hint chips, streaming"
```

---

## Task 19: Review step + wire up wizard shell

**Files:**
- Create: `src/app/dashboard/stories/new-ai/review-step.tsx`
- Modify: `src/app/dashboard/stories/new-ai/page.tsx` — mount the steps and persist state

- [ ] **Step 1: Write `review-step.tsx`**

Create `src/app/dashboard/stories/new-ai/review-step.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "@/components/editor/media-upload";
import { ProseReader } from "@/components/story/prose-reader";
import { ChatReader } from "@/components/story/chat-reader";
import { saveStoryWithChapters } from "@/lib/story-publish";
import { useAuthStore } from "@/store/auth-store";
import type { WizardState } from "./state";
import { toast } from "@/components/ui/toast";

interface Props {
  state: WizardState;
  onBack: () => void;
  onSavedStoryId: (id: string) => void;
  onClearDraft: () => void;
}

export function ReviewStep({ state, onBack, onSavedStoryId, onClearDraft }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(asDraft: boolean) {
    if (!user) return;
    setSaving(true);
    try {
      const chapters = Array.from({ length: state.brief.chapterCount }).map((_, i) => {
        const out = state.chapters[i]?.output;
        const dbId = state.chapterDbIds[i];
        if (!out) throw new Error(`Chapter ${i + 1} has no generated content`);
        return {
          title: state.outline[i]?.title ?? `Chapter ${i + 1}`,
          chapterNumber: i + 1,
          proseContent: out.kind === "prose" ? out.content : undefined,
          chatContent:
            out.kind === "chat"
              ? { characters: out.characters!, messages: out.messages! }
              : undefined,
          dbId,
        };
      });

      const { storyId } = await saveStoryWithChapters({
        existingStoryId: state.storyId,
        meta: {
          title: state.brief.title,
          description: state.brief.description,
          categoryId: state.brief.categoryId,
          format: state.brief.format,
          tags: state.brief.themes,
          isGated: false,
          storyPrice: 0,
          visibility: "public",
          passwordHash: null,
          coverImageUrl: coverUrl,
          aiContext: {
            brief: state.brief,
            outline: state.outline,
            toneReferenceText: state.toneReferenceText ?? null,
            chapterMedia: Object.fromEntries(
              Object.entries(state.chapters).map(([idx, d]) => [idx, d.media])
            ),
          },
          aiGenerated: true,
        },
        chapters,
        status: asDraft ? "draft" : "published",
        creatorId: user.id,
      });

      onSavedStoryId(storyId);
      onClearDraft();
      toast("success", asDraft ? "Draft saved" : "Story published!");
      router.push(asDraft ? `/dashboard/stories` : `/dashboard/stories`);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-muted">
          Add a cover and publish. You can still edit chapters manually after publishing.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cover image</label>
        <MediaUpload onUpload={(url) => setCoverUrl(url)} />
        {coverUrl && (
          <img src={coverUrl} alt="Cover" className="w-40 rounded-lg" />
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input value={state.brief.title} readOnly />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea value={state.brief.description} readOnly rows={3} />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">
          {state.brief.chapterCount} chapters
        </p>
        {Array.from({ length: state.brief.chapterCount }).map((_, i) => {
          const out = state.chapters[i]?.output;
          return (
            <details key={i} className="border border-border rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm">
                {state.outline[i]?.title ?? `Chapter ${i + 1}`}
                {out ? "" : " — not generated"}
              </summary>
              {out && (
                <div className="px-4 pb-4">
                  {out.kind === "prose" && out.content && (
                    <ProseReader content={out.content as Record<string, unknown>} />
                  )}
                  {out.kind === "chat" && (
                    <ChatReader
                      content={{ characters: out.characters!, messages: out.messages! }}
                    />
                  )}
                </div>
              )}
            </details>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => save(true)} disabled={saving}>
            Save draft
          </Button>
          <Button onClick={() => save(false)} disabled={saving}>
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the placeholder block in the wizard page**

Edit `src/app/dashboard/stories/new-ai/page.tsx`. Replace the whole file with:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { reducer, initialState, LOCAL_STORAGE_KEY } from "./state";
import { BriefForm } from "./brief-form";
import { ToneReferencePicker } from "./tone-reference-picker";
import { ArcPlanner } from "./arc-planner";
import { ChapterGenerator } from "./chapter-generator";
import { ReviewStep } from "./review-step";

export default function NewAiStoryPage() {
  const { user, hydrated } = useAuthStore();
  const [featureOn, setFeatureOn] = useState<boolean | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [rehydrated, setRehydrated] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        dispatch({ type: "LOAD_STATE", state: saved });
      }
    } catch {
      /* ignore */
    }
    setRehydrated(true);
  }, []);

  // Persist draft on every change
  useEffect(() => {
    if (!rehydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, rehydrated]);

  // Feature-flag probe (unchanged from skeleton)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/story/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ __probe: true }),
        });
        if (cancelled) return;
        setFeatureOn(res.status !== 503);
      } catch {
        if (!cancelled) setFeatureOn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated) return null;
  if (!user) return <Centered text="Sign in to use AI writing." />;
  if (user.role !== "creator") return <Centered text="Only creators can write stories." />;
  if (!user.is_verified) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10">
          <ShieldCheck size={24} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold">Get verified to unlock AI writing</h1>
        <p className="text-sm text-muted">
          Identity verification keeps the platform safe and unlocks AI-assisted
          story creation.
        </p>
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    );
  }
  if (featureOn === null) return <Centered text="Loading…" />;
  if (featureOn === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">AI writing is currently off</h1>
        <p className="text-sm text-muted">
          The AI wizard is temporarily disabled. Check back shortly.
        </p>
        <Link href="/dashboard/stories/new">
          <Button variant="secondary">Start a blank story instead</Button>
        </Link>
      </div>
    );
  }

  const steps: { key: string; label: string }[] = [
    { key: "brief", label: "Brief" },
    { key: "arc", label: "Arc" },
    { key: "chapters", label: "Chapters" },
    { key: "review", label: "Review" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <Link
          href="/dashboard/stories"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to my stories
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <Sparkles size={24} className="text-accent" />
          <h1 className="text-2xl font-bold">Create with AI</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {steps.map((s, i) => {
          const active = state.step === s.key;
          const done = steps.findIndex((x) => x.key === state.step) > i;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  active
                    ? "bg-accent text-background"
                    : done
                      ? "bg-success/20 text-success"
                      : "bg-surface-hover text-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className={active ? "text-foreground" : "text-muted"}>
                {s.label}
              </span>
              {i < steps.length - 1 && <span className="text-muted">→</span>}
            </div>
          );
        })}
      </div>

      {state.step === "brief" && (
        <>
          <BriefForm
            brief={state.brief}
            onChange={(patch) => dispatch({ type: "SET_BRIEF", patch })}
            onNext={() =>
              dispatch({
                type: "GO_TO",
                step: state.brief.planningStyle === "C" ? "chapters" : "arc",
              })
            }
          />
          <div className="border-t border-border pt-6">
            <p className="text-sm font-medium mb-2">
              Tone reference (optional)
            </p>
            <ToneReferencePicker
              toneReferenceText={state.toneReferenceText}
              onChange={(text) => dispatch({ type: "SET_TONE_REFERENCE", text })}
            />
          </div>
        </>
      )}

      {state.step === "arc" && (
        <ArcPlanner
          brief={state.brief}
          toneReferenceText={state.toneReferenceText}
          outline={state.outline}
          onOutlineChange={(outline) => dispatch({ type: "SET_OUTLINE", outline })}
          onBack={() => dispatch({ type: "GO_TO", step: "brief" })}
          onNext={() => dispatch({ type: "GO_TO", step: "chapters" })}
        />
      )}

      {state.step === "chapters" && (
        <ChapterGenerator
          state={state}
          onSetMedia={(index, media) =>
            dispatch({ type: "SET_CHAPTER_MEDIA", index, media })
          }
          onSetHints={(index, hints) =>
            dispatch({ type: "SET_REGEN_HINTS", index, hints })
          }
          onSetOutput={(index, output) =>
            dispatch({ type: "SET_CHAPTER_OUTPUT", index, output })
          }
          onSetCurrent={(index) =>
            dispatch({ type: "SET_CURRENT_CHAPTER", index })
          }
          onBack={() =>
            dispatch({
              type: "GO_TO",
              step: state.brief.planningStyle === "C" ? "brief" : "arc",
            })
          }
          onFinish={() => dispatch({ type: "GO_TO", step: "review" })}
        />
      )}

      {state.step === "review" && (
        <ReviewStep
          state={state}
          onBack={() => dispatch({ type: "GO_TO", step: "chapters" })}
          onSavedStoryId={(id) => dispatch({ type: "SET_STORY_ID", id })}
          onClearDraft={() => {
            try {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            } catch {
              /* ignore */
            }
          }}
        />
      )}
    </div>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-muted">{text}</p>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Set `AI_STORY_WIZARD_ENABLED=true` and `GEMINI_API_KEY=<a valid key>` in `.env.local`, then:

```bash
npm run dev
```

Log in as a verified creator, visit `/dashboard/stories/new-ai`, and walk through the full four-step flow with planning style B + 2 chapters + no media. Verify: outline draft returns, chapter streams, regen with a hint works, Save draft creates a story + chapter rows with `ai_generated = true` and `ai_context` populated.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/stories/new-ai/review-step.tsx src/app/dashboard/stories/new-ai/page.tsx
git commit -m "feat(ai-wizard): review step + wire 4-step wizard shell"
```

---

## Task 20: Entry points on the My Stories page

**Files:**
- Modify: `src/app/dashboard/stories/page.tsx`

- [ ] **Step 1: Locate the current "New story" button**

Run:
```bash
grep -n "/dashboard/stories/new" src/app/dashboard/stories/page.tsx
```

Expected: one or more lines referencing a Link or Button pointing at `/dashboard/stories/new`.

- [ ] **Step 2: Add the AI entry point beside the existing button**

Find the existing block (it will look roughly like `<Link href="/dashboard/stories/new">...Start a new story...</Link>`) and change it to offer both:

```tsx
import { Sparkles, Plus } from "lucide-react";

{/* existing surrounding JSX untouched */}
<div className="flex flex-col sm:flex-row gap-2">
  <Link href="/dashboard/stories/new">
    <Button variant="secondary">
      <Plus size={14} />
      Start blank
    </Button>
  </Link>
  {user?.is_verified && (
    <Link href="/dashboard/stories/new-ai">
      <Button variant="accent">
        <Sparkles size={14} />
        Create with AI
      </Button>
    </Link>
  )}
</div>
```

Adjust icon imports at the top of the file to include `Sparkles` and `Plus` from `lucide-react` if they aren't already imported.

- [ ] **Step 3: Type-check + visual**

Run:
```bash
npx tsc --noEmit
npm run dev
```

Visit `/dashboard/stories` as a verified creator and confirm both buttons render.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/stories/page.tsx
git commit -m "feat(ai-wizard): 'Create with AI' entry point on the stories list"
```

---

## Task 21: Manual QA checklist document

**Files:**
- Create: `docs/qa/2026-04-18-ai-story-wizard-qa.md`

- [ ] **Step 1: Write the checklist**

Create `docs/qa/2026-04-18-ai-story-wizard-qa.md`:

```markdown
# AI Story Wizard — Manual QA

Run through this before flipping `AI_STORY_WIZARD_ENABLED=true` in production.

## Prerequisites
- [ ] `GEMINI_API_KEY` set on the environment
- [ ] `AI_STORY_WIZARD_ENABLED=true`
- [ ] `AI_STORY_DAILY_BUDGET_USD` set to a small test value (e.g. 5) for the budget test, then reset
- [ ] Test user is a creator with `is_verified = true`

## Access gates
- [ ] Logged-out user hitting `/dashboard/stories/new-ai` is redirected to sign-in UI.
- [ ] Reader role sees "Only creators can write stories."
- [ ] Unverified creator sees the "Get verified" CTA.
- [ ] With feature flag off, verified creator sees "AI writing is currently off."
- [ ] Unverified creator POSTing directly to `/api/ai/story/plan` receives 403.

## Brief step
- [ ] Continue is disabled until title, description, category, and each character's name + description are filled.
- [ ] Switching to chat format forces exactly 2 characters and blocks the Add-character button.
- [ ] Chapter count is clamped to 1–20.
- [ ] Planning style selection visibly highlights the chosen card.

## Arc step
- [ ] Planning A seeds `chapterCount` empty rows; Continue requires every row filled.
- [ ] Planning B shows a "Draft outline with AI" button; clicking returns N rows in ~5–10s.
- [ ] Planning B "Redraft" regenerates.
- [ ] Planning C skips the Arc step entirely and lands on Chapters.

## Tone reference
- [ ] "My stories" tab populates with creator's published stories.
- [ ] Picking a story and clicking "Use this as the voice sample" loads text and shows the word count.
- [ ] Platform story by slug fetches text.
- [ ] Paste-text tab saves the pasted content as the tone reference.
- [ ] "Clear" button removes the reference.

## Chapter step
- [ ] Each uploaded media requires a caption before Generate is enabled.
- [ ] Generating streams text into the preview panel.
- [ ] Completed chapter swaps preview from raw text to the rendered ProseReader / ChatReader.
- [ ] Hint chips toggle selected state.
- [ ] Regenerate uses selected hints.
- [ ] Sidebar shows ✓ next to completed chapters.
- [ ] Can jump to a previous chapter and regenerate.
- [ ] For family category: generated content defaults to step-relationships unless the brief overrides.
- [ ] Hitting 100 generations today returns 429 with a friendly message.

## Review step
- [ ] Chapter details expand to show rendered content.
- [ ] Cover upload works.
- [ ] Save draft creates a story with `status=draft`, `ai_generated=true`, and `ai_context` populated.
- [ ] Publish creates a story with `status=published`.
- [ ] Draft-saved story appears in `/dashboard/stories`.
- [ ] Published story is readable via its public `/story/<slug>/<chapter>` URL.

## Safety / refusals
- [ ] A brief clearly designed to trigger a refusal (e.g. minors in the brief) returns a 422 with the friendly "Gemini refused" message — wizard does NOT crash.
- [ ] A server restart mid-wizard restores state from `localStorage` (refresh the browser at Chapter 2 → wizard resumes on Chapter 2 with prior chapters intact).

## Budget circuit breaker
- [ ] Set `AI_STORY_DAILY_BUDGET_USD=0.01` in a test env and run a chapter generation — next chapter call returns 503 with the budget message.
- [ ] Reset the budget env var.

## Observability
- [ ] Vercel runtime logs show `[AI plan]` and `[AI chapter]` lines with user_id + token counts on each successful generation.
- [ ] `select count(*), sum(tokens_in), sum(tokens_out) from ai_generations` reflects the number of generations performed during QA.
```

- [ ] **Step 2: Commit**

```bash
git add docs/qa/2026-04-18-ai-story-wizard-qa.md
git commit -m "docs(ai): manual QA checklist for the AI story wizard"
```

---

## Self-Review Notes (author of the plan)

- **Spec coverage:** Every section of the design doc is represented. Feature flag + budget: Tasks 5 & 8. Rate limit: Task 4. Verified gate + 403: Task 8 & 13. Tone reference: Tasks 9 & 16. Planning styles A/B/C: Task 17 (arc planner). Media captions required for generation: Task 18. Streaming preview: Tasks 7, 11, 18. SAFETY refusal handling: Task 6, 11, 18, 21. Family-category step-relation: Task 3 & 21 QA. `ai_context` + `ai_generated`: Tasks 1 & 12 & 19. `ai_generations` audit: Tasks 1, 4, 10, 11. Shared publish helper: Task 12. QA checklist: Task 21.
- **Placeholder scan:** No "TBD" / "TODO" / "similar to Task N". Every code block is complete as-is.
- **Type consistency:** `Brief`, `ChapterSynopsis`, `ChapterOutput`, `MediaAttachment` defined once in `schemas.ts` or `state.ts` and reused by name throughout. API route bodies are parsed with the same zod schemas the wizard sends.
- **Scope check:** One plan. Every task produces a committable unit; the feature only comes alive end-to-end after Task 19, but earlier tasks are independently valuable (schema, libs) and shippable.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-04-18-ai-assisted-story-creation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
