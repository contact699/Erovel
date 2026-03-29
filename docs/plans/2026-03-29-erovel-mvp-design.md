# Erovel MVP Design

An adult fiction platform combining Literotica-style reading with imgchest-style media embedding and creator monetization through tips and subscriptions.

## Architecture

- **Frontend:** Next.js 14+ (App Router), responsive PWA, no separate mobile app
- **Database/Auth:** Supabase (Postgres + Auth + Realtime + RLS)
- **Media:** BunnyCDN (storage + delivery, signed URLs for gated content)
- **Payments in:** CCBill (high-risk processor, handles tips + subscriptions)
- **Payments out:** Paxum, USDC crypto, via Trolley for mass payouts
- **ID Verification:** Veriff (creator verification, 2257 compliance)
- **CSAM Detection:** PhotoDNA hash matching on every media upload

Server components for SEO/fast loads on story pages. Client components for editors, dashboards, and interactive reading. Supabase RLS enforces content gating at the database level. Next.js API routes handle imgchest scraping, CCBill webhooks, and Veriff callbacks.

## Data Model

### Users & Profiles
- `profiles` — extends Supabase auth: username, display_name, bio, avatar_url, role (reader/creator), is_verified, created_at

### Content
- `stories` — creator_id, title, slug, description, cover_image_url, format (prose/chat), category_id, status (draft/published/scheduled), is_gated, created_at, updated_at
- `chapters` — story_id, chapter_number, title, status (draft/published/scheduled), publish_at (nullable, for scheduled releases), created_at
- `chapter_content` — chapter_id, content_json (JSONB storing editor state for both formats)
- `media` — uploader_id, url, cdn_path, type (image/gif/video), file_size, created_at

### Discovery
- `categories` — predefined: romance, fantasy, BDSM, etc.
- `tags` — freeform creator-added tags
- `story_tags` — many-to-many join

### Engagement
- `comments` — story_id, chapter_id (nullable), user_id, body, created_at
- `bookmarks` — user_id, story_id, last_read_chapter_id

### Monetization
- `subscriptions` — reader_id, target_type (creator/story), target_id, status, ccbill_subscription_id, started_at, expires_at
- `tips` — reader_id, creator_id, story_id (nullable), amount, currency, ccbill_transaction_id, created_at
- `payouts` — creator_id, amount, method (paxum/crypto), status, processed_at

JSONB for chapter content because both formats (prose and chat) are block-based editor output. Flexible schema, no complex relational structures for content blocks, maps directly to editor state.

## Story Formats

### Format 1: Prose with Inline Media
- Built on TipTap (headless rich text, ProseMirror-based)
- Rich text formatting, custom nodes for inline GIF/image blocks
- GIFs autoplay as they scroll into viewport (Intersection Observer)
- Tap/click any media for fullscreen lightbox
- Clean typography, generous margins, dark/light mode

### Format 2: iMessage/Chat Bubbles
- Custom React component (not TipTap)
- Creator defines characters (name, avatar, color, alignment)
- Adds messages one at a time to timeline
- Each message: character, text, optional media attachment
- Drag to reorder, live preview
- Reader view: alternating bubble sides, inline media, tap-to-fullscreen

### Shared Editor Features
- Media upload: drag-drop, uploads to BunnyCDN, returns URL
- Chapter management sidebar: add/reorder/delete chapters, set schedule
- Draft autosave every 30 seconds
- Preview mode before publishing

## Monetization & Payments

### Flow
Reader -> CCBill -> Erovel holding -> Creator payout (Paxum/Crypto)

### Tipping
- Tip button on every story and creator profile
- Preset amounts ($2, $5, $10, $20) plus custom
- CCBill payment form, webhook confirms, balance updated

### Subscriptions (two types, creator chooses)
- Per-creator: monthly, full access to all gated content from that creator
- Per-story: one-time, unlocks all chapters immediately including future scheduled ones
- CCBill handles recurring billing, cancellations, chargebacks

### Scheduled Releases
- Creator uploads chapters, sets cadence (every 1/2/3/7 days)
- publish_at timestamps auto-calculated
- Cron job or Supabase scheduled function publishes on schedule
- Free readers see only published chapters
- Subscribers see all chapters regardless of schedule
- Supabase RLS enforces gating

### Platform Cut
- 15% of all transactions
- CCBill takes ~5-8% on top
- Creators net roughly 77-80%

### Creator Payouts
- Dashboard shows balance, pending, paid
- Weekly payouts or at $50 minimum threshold
- Paxum or USDC crypto wallet
- Trolley as backend for mass payouts

## Reader Experience

### Browse & Search
- Homepage: featured, trending (most tipped/viewed this week), new releases, categories
- Category pages with filters: format, completion status, tags
- Full-text search via Supabase tsvector (upgrade to Elasticsearch later if needed)
- Creator profile pages: bio, stories, tip/subscribe, follower count

### Story Page
- Max-width content area, clean typography, dark/light mode
- Collapsible chapter navigation sidebar
- Gated chapters: teaser (~200 words or 5 chat bubbles) with subscribe/unlock prompt
- Inline GIF autoplay on scroll, pause when out of viewport
- Fullscreen lightbox with swipe-to-close on mobile
- Sticky bottom bar: tip, bookmark, comment, share
- Natural "next chapter" flow

### Reader Accounts
- Free to browse and read ungated content
- Account required to: tip, comment, bookmark, subscribe
- Reading history tracked automatically, "continue reading" on homepage
- Bookmarks with last-read-chapter tracking
- Follow creators, notifications when new chapters drop

### Age Gate
- Date-of-birth confirmation on first visit
- Stored in cookie/localStorage
- Not full ID verification for readers at MVP

## Content Moderation & Compliance

### Day-One Requirements
- DMCA agent registered with US Copyright Office
- Takedown request form on every story page
- PhotoDNA hash matching on every media upload (blocks + flags matches)
- ToS: creators own content and are legally responsible
- Creator ID verification via Veriff before publishing (2257 compliance)

### Moderation
- Report button on every story, comment, and profile
- Reports queue in admin dashboard
- Prohibited content in ToS: CSAM, non-consensual real-person content, minors in any context
- Account suspension/ban capability

### imgchest Import
- Creator pastes URL into import tool
- Server-side fetch, parse page, extract media in order
- Re-host media to BunnyCDN
- Present in chat bubble editor as draft for review
- Creator confirms ownership before import completes

### Admin Dashboard (minimal MVP)
- Moderation queue
- User management (ban/suspend)
- Basic platform metrics (signups, stories, revenue)

## Build Sequence

### Pre-Build (Week 0)
- Incorporate separate legal entity
- Submit CCBill merchant account application
- Register DMCA agent
- Secure erovel.com domain
- Consult adult content industry lawyer

### Phase 1: Foundation (Weeks 1-3)
- Supabase project, schema, RLS policies
- Auth: signup, login, age gate
- Profile system: reader and creator accounts
- Veriff integration for creator ID verification
- BunnyCDN media upload pipeline
- PWA manifest and service worker

### Phase 2: Creator Tools (Weeks 4-6)
- TipTap prose editor with custom media nodes
- Chat bubble editor (custom React component)
- Media upload with drag-drop, BunnyCDN, PhotoDNA scan
- Chapter management, draft saving
- Story publishing (categories, tags, gating)
- imgchest import tool

### Phase 3: Reader Experience (Weeks 7-9)
- Homepage (featured/trending/new)
- Category browsing and tag filtering
- Search (Supabase full-text)
- Story reading pages (both formats, dark mode, fullscreen media)
- Comments
- Bookmarks and reading history
- Creator profile pages

### Phase 4: Monetization (Weeks 10-12)
- CCBill integration (tips + subscriptions)
- Scheduled chapter release system
- Gated content logic with RLS
- Creator dashboard (earnings, views, payouts)
- Payout pipeline (Paxum/crypto via Trolley)

### Phase 5: Launch Prep (Weeks 13-14)
- Admin moderation dashboard
- Content reporting flow
- Load testing
- Onboard 20-30 creators from Reddit
- Soft launch

## What's NOT in MVP
- AI image/GIF generation (Phase 2)
- Direct messaging between creators and readers
- Collaborative stories
- Advanced recommendation engine
- Ratings system (tips serve as quality signal)
- Full reader ID verification (Phase 2 as laws evolve)
