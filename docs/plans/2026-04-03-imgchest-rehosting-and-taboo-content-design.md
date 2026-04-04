# Imgchest Image Re-hosting & Taboo Content Policy

**Date:** 2026-04-03
**Status:** Approved

## Problem

1. Imported stories link directly to imgchest-hosted images. If imgchest goes down or changes policies, all imported content breaks. Imported images also bypass AWS Rekognition moderation entirely.
2. Creators want to publish incest/taboo content. This needs explicit policy support and payment-processor-compliant framing.

## Design

### 1. Image Re-hosting During Import

When a user clicks "Publish All" or "Save as Draft" on the import page:

1. For each selected image in each chapter, call `/api/rehost` (new endpoint).
2. The endpoint downloads the image from imgchest, runs AWS Rekognition moderation, and uploads to BunnyCDN at `imports/{user_id}/{filename}`.
3. Returns the new CDN URL.
4. The import page replaces all imgchest URLs with CDN URLs in the chapter content JSON before saving.
5. `cover_image_url` is also re-hosted.

**Moderation:** Rekognition-flagged images (CSAM/violence) are skipped with a warning. The creator can still publish but flagged images are excluded.

**Error handling:** If download/upload fails for a single image, warn but don't block the import. The failed image keeps its imgchest URL as a fallback.

### 2. Migration Script for Existing Content

Admin-only endpoint `/api/admin/rehost-migrate`:

1. Scans all `chapter_content.content_json` for imgchest URLs.
2. Scans `stories.cover_image_url` for imgchest URLs.
3. For each URL: download, run Rekognition, upload to BunnyCDN.
4. Updates JSON in-place with new CDN URLs.
5. Logs results (success count, failures, flagged images).

Handles both content formats:
- **Chat:** `messages[].media_url`
- **Prose:** `content[].attrs.src` (image nodes)

Triggered manually by admin, runs once.

### 3. Taboo Content Policy

**Terms of Service addition** (under Content Standards):
- Fictional incest/taboo content is permitted.
- All characters must be explicitly 18+ adults.
- Content must be clearly presented as fiction.
- Biological or step-relation framing allowed if age requirements are met.
- Violations result in content removal and potential suspension.

**Automatic disclaimer** on all Taboo-category stories:
- Static banner at top of story reader page: "This is a work of fiction. All characters depicted are 18 years of age or older."
- Not a modal or popup — just a visible notice.

**Tag-based discovery:**
- No new categories. Creators use tags ("incest", "stepmom", "stepbrother", etc.) under Taboo.
- Fix existing tag persistence bug (tags not saving to DB on story creation/edit).

## Files to Create/Modify

**New files:**
- `src/app/api/rehost/route.ts` — image re-hosting endpoint
- `src/app/api/admin/rehost-migrate/route.ts` — migration script

**Modified files:**
- `src/app/dashboard/import/page.tsx` — call rehost during publish/draft
- `src/app/story/[slug]/[chapter]/page.tsx` — taboo disclaimer banner
- `src/app/story/[slug]/page.tsx` — taboo disclaimer banner
- `src/app/terms/page.tsx` — add taboo content policy section
- `src/app/dashboard/stories/new/page.tsx` — fix tag persistence
- `src/app/dashboard/stories/[id]/edit/page.tsx` — fix tag persistence
- `src/lib/supabase/queries.ts` — add tag save/update functions
