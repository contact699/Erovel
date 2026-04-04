-- Add gallery format, visibility control, and password protection to stories

-- ============================================================
-- ENUM: add 'gallery' to story_format
-- ============================================================

ALTER TYPE story_format ADD VALUE IF NOT EXISTS 'gallery';

-- ============================================================
-- STORIES: visibility column (public / unlisted)
-- ============================================================

ALTER TABLE stories ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

-- ============================================================
-- STORIES: optional password protection
-- ============================================================

ALTER TABLE stories ADD COLUMN IF NOT EXISTS password_hash text;
