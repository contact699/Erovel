# Content Rights Declarations System

## Overview

A system for creators to declare and prove the rights basis for stories featuring real people, AI-generated imagery, or fictional content. Includes tiered evidence verification, admin review, reader-facing badges, and future support for model-side claiming.

## Problem

Creators who write stories featuring real models/performers (e.g., OnlyFans creators) get banned from platforms like Reddit even when they have legitimate permission. There's no standardized way to prove consent. Erovel can differentiate by providing a structured, transparent rights documentation system.

## Content Source Types

| Type | Description | Evidence Required |
|------|-------------|-------------------|
| `real_person_active` | Real person, creator has active permission | Yes — tiered |
| `real_person_prior` | Real person, historical/migrated consent | Yes — prior declaration |
| `ai_generated` | AI-generated imagery, no real person | Disclosure checkbox only |
| `fictional` | Fully fictional, no real people | None |

## Evidence Tiers

| Tier | Type | Badge Level | Description |
|------|------|-------------|-------------|
| 1 | Screen-recorded video | Verified Permission | Video of DM conversation on platform, navigation from chat to model profile, metadata timestamp matching in-video clock |
| 2 | Screenshots | Permission Documented | Screenshots of permission conversations showing model's profile/username |
| 3 | Signed consent form | Verified Permission | Signed PDF/image of a release form |
| 4 | Prior consent declaration | Permission Documented | Description of consent history + whatever evidence exists (old screenshots, emails) |

## Data Model

### New table: `content_rights_declarations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid, PK | |
| `creator_id` | FK profiles | Creator who submitted |
| `declaration_type` | enum | `real_person_active`, `real_person_prior`, `ai_generated`, `fictional` |
| `subject_name` | text, nullable | Model/person's name or stage name |
| `subject_platform` | text, nullable | OnlyFans, Instagram, Twitter/X, Other |
| `subject_profile_url` | text, nullable | Link to model's profile |
| `evidence_tier` | enum, nullable | `video`, `screenshot`, `signed_consent`, `prior_declaration` |
| `evidence_urls` | text[], nullable | Links to uploaded evidence files on BunnyCDN |
| `evidence_metadata` | jsonb, nullable | Video timestamp, file creation time, notes |
| `badge_level` | enum | `verified_permission`, `permission_documented`, `ai_generated`, `none` |
| `status` | enum | `pending`, `approved`, `rejected`, `more_info_requested`, `expired` |
| `admin_reviewer_id` | FK profiles, nullable | |
| `admin_notes` | text, nullable | |
| `reviewed_at` | timestamp, nullable | |
| `grace_deadline` | timestamp, nullable | 14 days after flagging |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### New join table: `story_rights_declarations`

| Column | Type | Description |
|--------|------|-------------|
| `story_id` | FK stories | |
| `declaration_id` | FK content_rights_declarations | |

One declaration can cover many stories (e.g., "I have permission from Model X" applies to all stories featuring her). One story can reference multiple declarations (features multiple real people).

## Creator Flow

### Story creation/editing — "Content Rights" step

1. **Declaration type selector**: creator picks the content source type
2. **Real person types** require:
   - Model's name/stage name
   - Platform (dropdown)
   - Profile URL (optional)
   - Evidence upload (video, image, PDF)
   - For video: note the clock time visible in recording
   - For prior consent: text description of history
   - Option to reference an existing approved declaration for the same model
3. **AI-generated**: disclosure checkbox, story gets labeled
4. **Fictional**: no action needed (default)

### On publish

- **Fictional / AI-generated**: publishes immediately
- **Real person + existing approved declaration**: publishes immediately with badge
- **Real person + new evidence**: publishes, flagged for admin review within 14-day window
- **Real person + no evidence**: publishes, flagged, creator nagged to submit proof

## Admin Review Flow

### New page: `/admin/rights-review`

**Queue view:**
- Sorted by urgency (approaching 14-day deadline first)
- Filterable by status and evidence tier
- Shows: creator name, subject name, platform, evidence tier, days remaining, story count

**Review detail view:**
- Evidence viewer (video player, image viewer, PDF viewer)
- Metadata panel (upload timestamp, creator-noted clock time)
- Linked stories list
- Creator account history

**Actions:**
- **Approve** — sets badge level, notifies creator
- **Reject** (reason required) — notifies creator, starts 14-day countdown on linked stories
- **Request more info** (message required) — notifies creator, pauses countdown
- **Revoke** — for previously approved declarations (e.g., model disputes later)

**Automated:**
- Stories past 14-day grace deadline with no approved declaration: auto-unpublished, creator notified

## Reader-Facing Display

### Badges on story cards and story pages

| Badge | Color | When |
|-------|-------|------|
| Verified Permission | Green + checkmark | Admin-approved Tier 1 (video) or Tier 3 (signed consent) |
| Permission Documented | Grey/neutral | Approved Tier 2 (screenshots) or Tier 4 (prior), or pending review |
| AI-Generated Imagery | Distinct label | Creator declared AI-generated |
| None | — | Fully fictional |

- Story cards: small icon + text
- Story detail page: larger badge near metadata
- Tooltip on hover/tap explaining meaning

## Future: Model-Side Claiming

Not built now, but data model supports it:

- Existing report type "Non-consensual real-person content" is the entry point
- Admin can link reports to existing declarations
- Reporter claiming to be the model triggers re-review
- Future dedicated "I'm featured in this story" flow matches reporter identity against declaration's `subject_name` / `subject_profile_url`
- `status` field supports future `revoked` state

No new tables needed — reports table + declarations table handle this.
