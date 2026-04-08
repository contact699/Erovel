# Maxi partnership — engineering gap analysis

**Date:** 2026-04-07
**Context:** Max Wagner ("Maxi") proposed a co-founder partnership built around three scenarios: (1) base case — onboard Reddit/Patreon writers to Erovel as a creator marketplace, (2) low case — community fragmentation forces platform-led rebuild, (3/4) managed content vertical — recruit OnlyFans models, employ contractor writers to produce stories featuring them, take a ~70% cut, layer an affiliate model on top. He proposed 50/50 equity. Rob countered with a $25-50K investment for 10-20% equity. This document scopes the engineering reality of Maxi's full vision against what Erovel already ships, so the equity conversation can be grounded in scope rather than aspiration.

**TL;DR:**
- Scenarios 1 & 2 are ~100% built. Maxi is benefiting from a finished marketplace stack, not commissioning new work.
- Scenario 3/4 is a real but bounded build: ~6-10 focused weeks of solo dev work.
- The risk in scenario 3/4 is not the line count — it's correctness on affiliate attribution, revenue splits, and 2257/legal compliance, where small bugs have asymmetric consequences.
- The $25-50K / 10-20% counter is defensible on engineering scope alone.

---

## Scenarios 1 & 2 — creator marketplace base case: ~100% built

Both of Maxi's first two scenarios run on the platform that already exists. Mapping his needs against the current schema and routes:

| Maxi needs | Erovel today |
|---|---|
| Creator profiles, follows | `profiles` + `follows` |
| Story publishing (prose + chat) | `stories`, `story_format` enum, both formats supported |
| Chapters with scheduled drops | `chapters` + `publish_scheduled_chapters()` cron |
| Patreon-style early-access / exclusives | `is_exclusive` flag (shipped 2026-04-05) |
| Per-creator and per-story paid subscriptions | `subscriptions` table, both `creator` and `story` target types, CCBill subscription IDs wired |
| Tipping | `tips` table with CCBill txn IDs |
| Per-creator + per-story pricing | `subscription_price` on profiles, `price` on stories |
| Creator payouts | `payouts` (Paxum + crypto, $50 min) |
| Earnings dashboard | `dashboard/earnings/` |
| Story imports (from Reddit/Patreon) | `/api/import` route + `dashboard/import` page |
| Age verification (2257) | Veriff integration shipped |
| DMCA workflow | Content rights declarations shipped |
| Admin moderation | `/admin/stories`, `/admin/users`, `/admin/reports`, `/admin/rights-review` |
| Categories matching r/SextStories | Shipped |
| Discovery (browse, search, FTS) | `browse/`, `search/`, `idx_stories_fts` |
| Analytics | `story_views` table with daily tracking |

**Implication for the negotiation:** when Maxi frames it as "I bring writers, you build the product," the build *for his writers* is already done. The work in scenarios 1 & 2 is community/marketing, not engineering. His engineering ask from Rob in this lane is effectively zero. He benefits from ~$20K and months of prior work the moment he signs.

---

## Scenario 3/4 — managed vertical + OF affiliate funnel: the actual build

This is where the real net-new work lives. Effort tags: **S** = days, **M** = 1-2 weeks, **L** = multiple weeks.

### A. Model persona system — **M**
A "model" is a new domain object distinct from `profiles`/creators. New `models` table (name, slug, bio, photos, OF link, social handles, affiliate code, payout info). Join table `story_models`. Public model profile pages. Model directory. Image gallery per model. Pattern mirrors stories/creators so it's not architecturally new — but it touches schema, queries, public pages, admin tools, and search.

### B. Affiliate tracking + attribution — **M-L**
Affiliate codes per model (and optionally per writer). Click attribution via URL params → cookie → server-side conversion linking. Conversion events: signup, first subscription, ongoing subscription renewal, tips. Affiliate earnings dashboard for models. Payout pipeline integration. The data model is small but the *correctness* surface is large: attribution windows, last-click vs first-click, fraud handling, refund clawbacks. **This is the feature most likely to bite on edge cases**, and the one most likely to cause disputes with Maxi if it miscounts.

### C. Contractor writer model — **M**
A separate revenue mode where the platform pays the writer instead of the writer keeping subscription revenue. Needs: a `contractor` flag (or new role), per-story revenue model field, performance-based payout calculator (per view? per attributed conversion? per tip?), and an internal "assignment" workflow if briefs are part of the model ("write a story for model X"). Base version is small. Full version with editorial review, briefs, and performance tiers grows quickly.

### D. Revenue split engine — **S-M**
Today's model is implicit: creator owns the revenue, processor takes its cut. The managed model needs an explicit splits engine: who gets what from each subscription/tip, with platform/contractor/affiliate shares routed correctly. Schema is small. **Risk is high** because this touches the payout pipeline, and a bug here is real money lost or owed.

### E. Story↔model integration in the reader UX — **S**
Show model imagery/profile alongside the story. "More stories featuring X" lists. Affiliate-tracked outbound link to model's OF. Mostly UI on top of the new schema in (A).

### F. Model recruitment/onboarding admin tooling — **S-M**
Internal admin: model contracts, image library so writers can reference photos, model performance dashboard for Maxi. Lives entirely in `/admin`.

### G. 2257 + model release compliance — **S engineering / L legal**
Real performers in fictional sexual context = additional 2257 records, written model releases granting fiction rights. Engineering is "another upload form + records table." The exposure is legal, not code. **CCBill terms must be verified** for the specific framing of "real performers depicted in fictional sexual content."

### H. Contractor tax/payment compliance — **S engineering / M ops**
1099/W-8BEN handling. Mostly Maxi's ops problem if he's running the vertical, but the platform needs to surface contractor earnings reports for tax season.

### Total scope
**~6-10 focused weeks of solo dev work**, assuming no gold-plating. Roughly half of that is items A + B.

---

## Risk concentration

The hidden risk is not in the line count — it's in three items where small bugs have asymmetric downside:

- **B (affiliate attribution)** — bugs become "we owe Maxi's affiliate $X that we didn't track" disputes.
- **D (revenue splits)** — bugs become real-money lawsuits.
- **G (2257/model releases)** — paperwork gaps become CCBill account termination or worse.

These warrant airtight contracts and conservative defaults — not because the code is hard, but because the consequences of being wrong are large and irreversible.

---

## What this means for the partnership conversation

**1. The marketplace side is sunk cost, not future labor.**
Maxi is getting the creator marketplace stack at $0 build cost. Equity should reflect that he's *receiving* it, not commissioning it.

**2. The scenario 3/4 build is real but bounded.**
6-10 weeks. Not a multi-quarter undertaking, not a rewrite. A specced contractor could ship it; it just happens that the contractor is Rob.

**3. The engineering question collapses into the business question.**
The 6-10 weeks of work only makes sense if scenario 4 is real. If yes, the build is cheap relative to upside. If no, the conversation is purely about marketplace rev share.

**4. The $25-50K / 10-20% counter is defensible on scope alone.**
- $25K covers the scenario 3/4 build at roughly contractor rates.
- $50K buys meaningful equity *and* funds legal/compliance for the managed vertical — which is the actual blocker, not the code.

**5. Equity should track ongoing contribution, not one-time integration.**
Maxi's "I integrate my publishing business into the platform" is mostly an onboarding event — the import pipeline already exists. Once his existing stories are imported, his contribution converts entirely to ops + recruiting. Vesting + milestones, not a flat grant.

---

## Open questions to resolve before signing

- Does CCBill explicitly approve the "real performers in fictional sexual content" framing for the managed vertical?
- What is the *minimum viable* version of items A + B that gets the managed vertical to first revenue, and what can defer to a v2?
- What attribution window and last-click/first-click model does Maxi expect, and is that documented in the partnership terms?
- Who owns model release paperwork — Maxi (as ops) or the platform (as record-holder)?
- Does the contractor writer payout structure need to support Maxi's *existing* writers (i.e. is he migrating his current pipeline) or only new recruits?
