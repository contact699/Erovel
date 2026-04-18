# AI-Assisted Story Creation — Design

**Date:** 2026-04-18
**Status:** Approved, ready for implementation plan

## Problem

Manual story creation on Erovel is friction-heavy. Creators have to write from a blank editor, which slows publishing and keeps output volume low. Many creators also have a pile of images/videos they want to build a story around, but no easy way to generate the surrounding narrative.

Claude refuses to write explicit content. Gemini will write it readily with appropriate safety-setting configuration and system-prompt framing. We want to give verified creators an AI-assisted flow that generates publishable draft chapters they can edit and ship.

## Goals

- Verified creators can go from idea → publishable draft in minutes, not hours.
- Supports both prose and chat (sext-style) formats.
- Images/videos the creator uploads are woven naturally into the generated content (right placement, referenced in the writing).
- Creators can reference other stories for tone/banter.
- Chapter-by-chapter generation so creators review before burning more budget.

## Non-Goals (launch)

- Image vision. Creators caption each image; AI uses the caption, not the pixels.
- More than 2 characters in chat format.
- Character voice presets.
- Public "made with AI" labels on stories.
- AI-assist inside the existing manual flow. AI wizard is a separate flow.

---

## High-level shape

A standalone client-side wizard at `/dashboard/stories/new-ai`, alongside the existing manual flow at `/dashboard/stories/new`.

From `/dashboard/stories`, creators see two entry points: `+ Start blank` (manual) and `✨ Create with AI` (wizard). Gated to users with `profiles.is_verified = true`. Unverified creators see a "Get verified to unlock AI writing" prompt that links to the verify modal.

The wizard persists state in component state + `localStorage` for crash recovery. On the first successful chapter generation, it writes the `stories` row (with `ai_context` and `ai_generated = true`) plus the `chapters` / `chapter_content` rows for that chapter. Subsequent chapters append `chapters` / `chapter_content` rows and patch `ai_context`. Regenerating overwrites that chapter's `content_json` in place (no versioning at launch). The publish logic is reused from the manual flow (extracted into a shared helper so the two flows don't drift).

## Model & safety

- **Model:** Gemini 2.5 Flash via Google AI Studio REST API.
- **Safety settings:** `BLOCK_ONLY_HIGH` across all four categories (sexually explicit, hate speech, dangerous content, harassment). Writes explicit content; still refuses CSAM and extremes under any config.
- **No vision** — creator-provided captions cover the "what's in the image" question, and Gemini's NSFW vision is unreliable.
- **API key** lives in `GEMINI_API_KEY`, server-side only.

### Content framing in the system prompt

Every generation includes preamble language:

- "You are an erotica author writing for Erovel, an adult fiction platform."
- "All characters are 18+. This is fiction. Follow the creator's brief."
- "Write explicitly. Don't self-censor language or scenes."

When the story's category is `family`, the system prompt adds:

- "Default to step-relationships (step-sibling, step-parent, step-cousin, etc.) unless the creator explicitly specifies blood relation. All characters remain 18+."

This maximises Gemini's willingness to write the family category without pushing into content that will trigger baked-in refusals.

## Cost & abuse protection (layered)

1. **Verified-only gate.** `profiles.is_verified = true` required on every AI route.
2. **Per-user rate limit.** 100 chapter generations per 24 hours, tracked in `ai_generations`. `kind = 'chapter'` and `kind = 'regenerate'` count toward the limit; `kind = 'plan'` does not (one-shot per story, cheap). Tunable.
3. **Output-token cap.** `maxOutputTokens: 4000` per request.
4. **Budget circuit breaker.** Daily spend computed from `ai_generations.tokens_*`. Crossing a configurable USD threshold (default $50/day initially) auto-disables the feature flag for the remainder of the UTC day; resets at 00:00 UTC.
5. **Feature flag.** `AI_STORY_WIZARD_ENABLED` env var for manual kill-switch.

## Wizard UX — four steps

Progress indicator at the top. Each step auto-saves draft state to `localStorage`.

### Step 1 — Brief

- Title, short description (required).
- Category dropdown (existing `CATEGORIES`).
- Format: prose / chat (radio).
- Characters: rows of `name` + `one-line description`. Prose ≥ 1 character; chat = exactly 2 characters for launch.
- Themes / kinks: free-text tag input.
- Chapter count: 1–20.
- **Planning style picker** (creator chooses one):
  - **A — I write synopses.** Creator writes a one-sentence synopsis per chapter in Step 2.
  - **B — AI drafts an outline.** AI proposes chapter titles + synopses in Step 2, creator edits/approves.
  - **C — Improvise.** Step 2 is skipped. AI invents each chapter on the fly using the brief + prior chapter summaries.
- **Tone reference** (optional), three tabs:
  - **My stories** — dropdown of the creator's own published stories.
  - **Platform story** — pick any published story (search or paste link).
  - **Paste text** — free-form textarea, ~2,000-word cap.

### Step 2 — Arc planning

Branches on the planning style chosen in Step 1:
- **A** → N editable rows (chapter title + one-sentence synopsis).
- **B** → spinner → AI returns drafted outline → editable rows → `Approve & continue`.
- **C** → skipped; go straight to Step 3.

### Step 3 — Chapter generator (loops N times)

- **Header:** `Chapter X of N`, with a left-side jump-to list of chapters (lets creator go back to any prior chapter and regenerate).
- **Media upload zone.** Each uploaded image/video gets a required short caption field underneath. Captions are mandatory because the AI uses them (not the pixels) to place and describe media in the generated content.
- **Regeneration hint chips.** Toggles appended to the prompt on the next generation: `more explicit`, `more dialogue`, `slower pacing`, `shorter`, `longer`. Selections persist for the chapter.
- **`✨ Generate chapter`** button → streams output into a live preview on the right. Prose preview uses `ProseReader`; chat preview uses `ChatReader`.
- **After generation:** `Edit manually` drops the content into `ProseEditor` / `ChatEditor` with the draft preloaded. Manual edits survive the next regeneration if the creator regenerates from the edited state (we pass the current content as context).
- **`Regenerate`** (hints reapplied) and **`Next chapter`** buttons.
- Every successful generation auto-saves to DB — a creator who bails mid-wizard has a draft waiting.

### Step 4 — Review & publish

- Story overview: cover upload, chapter list with inline `Edit`, category / gating / visibility settings.
- Reuses the manual flow's save+publish logic via an extracted helper.
- `Preview` opens the public reader view in a new tab.
- `Save draft` / `Publish` buttons.

---

## Data model

### New column: `stories.ai_context jsonb`

Single JSONB blob holding the whole wizard state for that story: brief, outline, per-chapter captions map, tone-reference text. Regeneration reads and updates it. Kept as a single column to avoid schema churn.

### New column: `stories.ai_generated boolean default false`

Set to `true` by the wizard when it creates a story. Powers Phase-2 analytics; otherwise passive.

### New table: `ai_generations`

```sql
create table ai_generations (
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

create index idx_ai_generations_user_time
  on ai_generations (user_id, created_at desc);
```

Rate limit query:
```sql
select count(*) from ai_generations
where user_id = $1 and created_at > now() - interval '24 hours';
```

No changes to `chapters` or `chapter_content` — generated content lands in the same shape the manual flow produces.

## API contracts

All routes: verified-creator gate + rate-limit check + audit-log row on success.

### `POST /api/ai/story/plan`

Generate a per-chapter outline (planning style B only).

```ts
body: {
  brief: Brief,
  toneReferenceText?: string,
}

response: {
  outline: { title: string, synopsis: string }[],
}
```

### `POST /api/ai/story/chapter`

Generate one chapter (first generation or regeneration). Streams the output via SSE so the preview fills in incrementally.

```ts
body: {
  brief: Brief,
  outline: { title, synopsis }[],      // empty for planning style C
  chapterNumber: number,
  priorChapterSummaries: string[],     // 1-2 lines each, keeps context short
  mediaCaptions: { url, caption }[],
  regenHints?: string[],
  format: 'prose' | 'chat',
  toneReferenceText?: string,
}

// Streamed response body ends with a final JSON frame:
response (prose): { content: JSONContent, summary: string }
response (chat):  { characters: ChatCharacter[], messages: ChatMessage[], summary: string }
```

The `summary` field is a 1-2 line précis the server stores in `ai_context` for use as `priorChapterSummaries` in later chapters.

### `POST /api/ai/story/tone-reference`

Fetch a referenced story's text for use as a voice sample. No Gemini call; no rate limit.

```ts
body:     { storyId?: string, storySlug?: string }
response: { text: string }      // first ~2,000 words
```

## Gemini request config

```ts
{
  generationConfig: {
    temperature: 0.9,
    topP: 0.95,
    maxOutputTokens: 4000,
    responseMimeType: 'application/json',
    responseSchema: <JSON Schema derived from the zod schemas via zod-to-json-schema>,
  },
  safetySettings: [
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
  ],
}
```

## Code organisation

```
src/lib/ai/
  gemini.ts            - client wrapper: generateStructured(), generateStream()
  system-prompts.ts    - prompt templates + category addenda (family → step-relation default)
  schemas.ts           - zod: Brief, ChapterSynopsis, prose output, chat output
  rate-limit.ts        - checkAndRecord(userId, kind)

src/app/api/ai/story/
  plan/route.ts
  chapter/route.ts     - SSE streaming
  tone-reference/route.ts

src/app/dashboard/stories/new-ai/
  page.tsx             - wizard shell + step machine
  brief-form.tsx
  arc-planner.tsx
  chapter-generator.tsx
  regen-chips.tsx
  tone-reference-picker.tsx
```

## Error handling

| Failure mode | Behaviour |
|---|---|
| Gemini safety refusal (`finishReason: 'SAFETY'` or `promptFeedback.blockReason`) | 422 + friendly UI message: "Gemini refused that particular scene. Try rewording themes, characters, or the brief." |
| Gemini 5xx / timeout | 502 + retry button; inputs preserved |
| Malformed JSON from model | server retries once with stricter nudge; if still malformed, returns raw text as a fallback the creator pastes manually |
| Rate limit hit | 429 with `x-ratelimit-reset` header; UI shows reset countdown |
| Unverified user hits AI route directly | 403 |
| DB save failure mid-wizard | `localStorage` state survives; retry save without regenerating |

## Testing

- **Unit (vitest):** `rate-limit.ts` window logic; `system-prompts.ts` (family addendum present; tone-ref truncation); `schemas.ts` validation; `gemini.ts` with mocked fetch (verifies safety settings + request body shape).
- **Route tests:** stubbed Gemini client; verify auth → verify → rate-limit → DB ordering; verify status codes for each failure mode.
- **Component smoke test:** wizard progresses step 1 → 4 with mocked API responses.
- **Manual QA matrix** before flipping the flag on:
  - Each planning style (A/B/C) × each format (prose/chat)
  - Family category edge case
  - Media upload with captions woven in
  - Regen with each hint chip
  - Mid-wizard refresh → state restored
  - Rate-limit hit → friendly message with reset time
  - Unverified user → blocked

## Rollout

- Ship behind `AI_STORY_WIZARD_ENABLED` env var (default off).
- Complete manual QA matrix locally + on a preview deploy.
- Flip the flag on for all verified creators at once (small user base, fast feedback loop).
- Watch `ai_generations` daily for 2 weeks: avg tokens per chapter, refusal rate, users near the 100/day limit, daily USD spend trajectory.
- Iterate on the system prompt, the hint chips, and the rate limit based on real behaviour.

## Observability

Each AI route logs to Vercel runtime with these fields on every call:

```
user_id, kind, model, tokens_in, tokens_out, duration_ms,
outcome ('success' | 'refusal' | 'error'), error_code?
```

## Phase-2 / later

- Admin panel card: generations / cost / refusal rate / top users / budget burndown.
- Multimodal vision once Gemini's NSFW vision improves.
- More than 2 characters in chat format.
- Per-character voice presets.
- Opt-in "made with AI" label on stories.
- Auto-summariser that watches for drift between chapters and flags it mid-wizard.
