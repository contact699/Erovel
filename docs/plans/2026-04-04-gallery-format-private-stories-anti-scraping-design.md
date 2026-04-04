# Gallery Format, Private Stories & Anti-Scraping

**Date:** 2026-04-04
**Status:** Approved

## 1. Gallery Display Mode

Add a third story format "gallery" alongside chat and prose. Images stack vertically, full-width, with optional captions. No bubbles, no character names, no alternating sides. Available for all stories (import + native creation), with imports defaulting to gallery.

**Changes:**
- Database: add 'gallery' to story_format enum
- Types: add 'gallery' to StoryFormat
- New GalleryReader component
- Update import page to default format to 'gallery'
- Update story creation page to include gallery option
- Update chapter reader page to render gallery format

## 2. Private/Unlisted Stories

Stories can be set to "unlisted" — won't appear in browse/search, only accessible via direct link. Optional password protection. Free for all creators now, paid tier later.

**Changes:**
- Database: add `visibility` column ('public'/'unlisted', default 'public') and `password_hash` text column to stories
- Update browse/search queries to filter visibility = 'public'
- Add visibility toggle + password field to story creation/edit
- Add password gate page/modal for password-protected stories
- API route for password verification

## 3. Anti-Scraping

Two layers: signed CDN URLs (4-hour expiry) and server-side content delivery.

**Changes:**
- Add BunnyCDN token signing function to lib/bunny.ts
- Create server-side API route `/api/chapters/content` that fetches content and signs all CDN URLs
- Update chapter reader to use API route instead of direct Supabase client query
- Env var: BUNNY_CDN_TOKEN (set in BunnyCDN dashboard)
