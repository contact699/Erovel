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
