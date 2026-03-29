-- Erovel: Initial database schema
-- Creates all tables, indexes, RLS policies, and functions

-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp" schema extensions;
create extension if not exists "pg_trgm" schema public;

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('reader', 'creator', 'admin');
create type story_format as enum ('prose', 'chat');
create type story_status as enum ('draft', 'published', 'scheduled');
create type chapter_status as enum ('draft', 'published', 'scheduled');
create type subscription_target_type as enum ('creator', 'story');
create type subscription_status as enum ('active', 'cancelled', 'expired');
create type payout_method as enum ('paxum', 'crypto');
create type payout_status as enum ('pending', 'processing', 'completed', 'failed');
create type media_type as enum ('image', 'gif', 'video');
create type report_status as enum ('pending', 'reviewed', 'resolved', 'dismissed');
create type report_target_type as enum ('story', 'comment', 'profile');

-- ============================================================
-- PROFILES
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  role user_role not null default 'reader',
  is_verified boolean not null default false,
  follower_count integer not null default 0,
  story_count integer not null default 0,
  payout_method payout_method,
  payout_email text,
  payout_wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_username on profiles(username);
create index idx_profiles_role on profiles(role);

-- ============================================================
-- CATEGORIES
-- ============================================================

create table categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  story_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Seed categories
insert into categories (id, name, slug) values
  ('romance', 'Romance', 'romance'),
  ('fantasy', 'Fantasy', 'fantasy'),
  ('bdsm', 'BDSM', 'bdsm'),
  ('lesbian', 'Lesbian', 'lesbian'),
  ('gay', 'Gay', 'gay'),
  ('group', 'Group', 'group'),
  ('voyeur', 'Voyeur/Exhibitionism', 'voyeur'),
  ('mature', 'Mature', 'mature'),
  ('scifi', 'Sci-Fi & Fantasy', 'scifi'),
  ('interracial', 'Interracial', 'interracial'),
  ('cheating', 'Cheating', 'cheating'),
  ('first-time', 'First Time', 'first-time'),
  ('taboo', 'Taboo', 'taboo'),
  ('celebrity', 'Celebrity', 'celebrity'),
  ('anal', 'Anal', 'anal'),
  ('fetish', 'Fetish', 'fetish'),
  ('humor', 'Humor & Satire', 'humor'),
  ('nonconsent', 'Non-consent/Reluctance', 'nonconsent'),
  ('other', 'Other', 'other');

-- ============================================================
-- TAGS
-- ============================================================

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create index idx_tags_slug on tags(slug);
create index idx_tags_name_trgm on tags using gin(name gin_trgm_ops);

-- ============================================================
-- STORIES
-- ============================================================

create table stories (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text not null default '',
  cover_image_url text,
  format story_format not null,
  category_id text not null references categories(id),
  status story_status not null default 'draft',
  is_gated boolean not null default false,
  chapter_count integer not null default 0,
  published_chapter_count integer not null default 0,
  view_count integer not null default 0,
  tip_total numeric(10,2) not null default 0,
  comment_count integer not null default 0,
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_stories_creator on stories(creator_id);
create index idx_stories_category on stories(category_id);
create index idx_stories_status on stories(status);
create index idx_stories_slug on stories(slug);
create index idx_stories_created on stories(created_at desc);
create index idx_stories_views on stories(view_count desc);
create index idx_stories_tips on stories(tip_total desc);

-- Full-text search index
alter table stories add column fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index idx_stories_fts on stories using gin(fts);

-- ============================================================
-- STORY TAGS (join table)
-- ============================================================

create table story_tags (
  story_id uuid not null references stories(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (story_id, tag_id)
);

create index idx_story_tags_tag on story_tags(tag_id);

-- ============================================================
-- CHAPTERS
-- ============================================================

create table chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  chapter_number integer not null,
  title text not null default '',
  status chapter_status not null default 'draft',
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, chapter_number)
);

create index idx_chapters_story on chapters(story_id, chapter_number);
create index idx_chapters_publish_at on chapters(publish_at) where status = 'scheduled';

-- ============================================================
-- CHAPTER CONTENT
-- ============================================================

create table chapter_content (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid unique not null references chapters(id) on delete cascade,
  content_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- MEDIA
-- ============================================================

create table media (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references profiles(id) on delete cascade,
  url text not null,
  cdn_path text not null,
  type media_type not null,
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

create index idx_media_uploader on media(uploader_id);

-- ============================================================
-- COMMENTS
-- ============================================================

create table comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete set null,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_comments_story on comments(story_id, created_at desc);
create index idx_comments_user on comments(user_id);

-- ============================================================
-- BOOKMARKS
-- ============================================================

create table bookmarks (
  user_id uuid not null references profiles(id) on delete cascade,
  story_id uuid not null references stories(id) on delete cascade,
  last_read_chapter_id uuid references chapters(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

-- ============================================================
-- FOLLOWS
-- ============================================================

create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index idx_follows_following on follows(following_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  reader_id uuid not null references profiles(id) on delete cascade,
  target_type subscription_target_type not null,
  target_id uuid not null, -- references either profiles.id or stories.id
  status subscription_status not null default 'active',
  ccbill_subscription_id text,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_subscriptions_reader on subscriptions(reader_id);
create index idx_subscriptions_target on subscriptions(target_type, target_id);
create unique index idx_subscriptions_active on subscriptions(reader_id, target_type, target_id) where status = 'active';

-- ============================================================
-- TIPS
-- ============================================================

create table tips (
  id uuid primary key default gen_random_uuid(),
  reader_id uuid not null references profiles(id) on delete cascade,
  creator_id uuid not null references profiles(id) on delete cascade,
  story_id uuid references stories(id) on delete set null,
  amount numeric(10,2) not null check (amount > 0),
  currency text not null default 'USD',
  ccbill_transaction_id text,
  created_at timestamptz not null default now()
);

create index idx_tips_creator on tips(creator_id, created_at desc);
create index idx_tips_reader on tips(reader_id);

-- ============================================================
-- PAYOUTS
-- ============================================================

create table payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 50), -- minimum $50
  method payout_method not null,
  status payout_status not null default 'pending',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_payouts_creator on payouts(creator_id, created_at desc);

-- ============================================================
-- REPORTS
-- ============================================================

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type report_target_type not null,
  target_id uuid not null,
  reason text not null,
  status report_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_reports_status on reports(status, created_at desc);

-- ============================================================
-- READING HISTORY
-- ============================================================

create table reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  story_id uuid not null references stories(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete set null,
  read_at timestamptz not null default now()
);

create index idx_reading_history_user on reading_history(user_id, read_at desc);
create unique index idx_reading_history_unique on reading_history(user_id, story_id, chapter_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'reader')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_profiles_updated before update on profiles for each row execute function update_updated_at();
create trigger tr_stories_updated before update on stories for each row execute function update_updated_at();
create trigger tr_chapters_updated before update on chapters for each row execute function update_updated_at();
create trigger tr_chapter_content_updated before update on chapter_content for each row execute function update_updated_at();

-- Update story counts when chapters change
create or replace function update_story_chapter_counts()
returns trigger as $$
begin
  update stories set
    chapter_count = (select count(*) from chapters where story_id = coalesce(new.story_id, old.story_id)),
    published_chapter_count = (select count(*) from chapters where story_id = coalesce(new.story_id, old.story_id) and status = 'published')
  where id = coalesce(new.story_id, old.story_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger tr_chapter_counts
  after insert or update or delete on chapters
  for each row execute function update_story_chapter_counts();

-- Update category story counts
create or replace function update_category_story_count()
returns trigger as $$
begin
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.category_id != new.category_id) then
    update categories set story_count = (
      select count(*) from stories where category_id = old.category_id and status = 'published'
    ) where id = old.category_id;
  end if;
  if tg_op != 'DELETE' then
    update categories set story_count = (
      select count(*) from stories where category_id = new.category_id and status = 'published'
    ) where id = new.category_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger tr_category_counts
  after insert or update or delete on stories
  for each row execute function update_category_story_count();

-- Update creator story count
create or replace function update_creator_story_count()
returns trigger as $$
begin
  update profiles set story_count = (
    select count(*) from stories where creator_id = coalesce(new.creator_id, old.creator_id) and status = 'published'
  ) where id = coalesce(new.creator_id, old.creator_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger tr_creator_story_count
  after insert or update or delete on stories
  for each row execute function update_creator_story_count();

-- Update story comment count
create or replace function update_story_comment_count()
returns trigger as $$
begin
  update stories set comment_count = (
    select count(*) from comments where story_id = coalesce(new.story_id, old.story_id)
  ) where id = coalesce(new.story_id, old.story_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger tr_story_comment_count
  after insert or update or delete on comments
  for each row execute function update_story_comment_count();

-- Update follower counts
create or replace function update_follower_counts()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    update profiles set follower_count = (
      select count(*) from follows where following_id = old.following_id
    ) where id = old.following_id;
  else
    update profiles set follower_count = (
      select count(*) from follows where following_id = new.following_id
    ) where id = new.following_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger tr_follower_counts
  after insert or delete on follows
  for each row execute function update_follower_counts();

-- Publish scheduled chapters (to be called by pg_cron or external cron)
create or replace function publish_scheduled_chapters()
returns integer as $$
declare
  published_count integer;
begin
  update chapters
  set status = 'published', updated_at = now()
  where status = 'scheduled' and publish_at <= now();

  get diagnostics published_count = row_count;
  return published_count;
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table stories enable row level security;
alter table chapters enable row level security;
alter table chapter_content enable row level security;
alter table media enable row level security;
alter table comments enable row level security;
alter table bookmarks enable row level security;
alter table follows enable row level security;
alter table subscriptions enable row level security;
alter table tips enable row level security;
alter table payouts enable row level security;
alter table reports enable row level security;
alter table reading_history enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table story_tags enable row level security;

-- Categories & tags: public read
create policy "categories_read" on categories for select using (true);
create policy "tags_read" on tags for select using (true);
create policy "story_tags_read" on story_tags for select using (true);

-- Profiles: public read, own update
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Stories: public read for published, own CRUD
create policy "stories_read_published" on stories for select using (status = 'published');
create policy "stories_read_own" on stories for select using (auth.uid() = creator_id);
create policy "stories_insert" on stories for insert with check (auth.uid() = creator_id);
create policy "stories_update" on stories for update using (auth.uid() = creator_id);
create policy "stories_delete" on stories for delete using (auth.uid() = creator_id);

-- Chapters: public read for published, subscribers read all, own CRUD
create policy "chapters_read_published" on chapters for select using (
  status = 'published'
  or exists (select 1 from stories where stories.id = chapters.story_id and stories.creator_id = auth.uid())
);
create policy "chapters_read_subscribed" on chapters for select using (
  exists (
    select 1 from subscriptions s
    join stories st on (
      (s.target_type = 'story' and s.target_id = st.id)
      or (s.target_type = 'creator' and s.target_id = st.creator_id)
    )
    where s.reader_id = auth.uid()
    and s.status = 'active'
    and st.id = chapters.story_id
  )
);
create policy "chapters_insert" on chapters for insert with check (
  exists (select 1 from stories where id = story_id and creator_id = auth.uid())
);
create policy "chapters_update" on chapters for update using (
  exists (select 1 from stories where id = story_id and creator_id = auth.uid())
);
create policy "chapters_delete" on chapters for delete using (
  exists (select 1 from stories where id = story_id and creator_id = auth.uid())
);

-- Chapter content: same as chapters
create policy "chapter_content_read" on chapter_content for select using (
  exists (
    select 1 from chapters c
    join stories s on s.id = c.story_id
    where c.id = chapter_content.chapter_id
    and (
      c.status = 'published'
      or s.creator_id = auth.uid()
      or exists (
        select 1 from subscriptions sub
        where sub.reader_id = auth.uid()
        and sub.status = 'active'
        and (
          (sub.target_type = 'story' and sub.target_id = s.id)
          or (sub.target_type = 'creator' and sub.target_id = s.creator_id)
        )
      )
    )
  )
);
create policy "chapter_content_insert" on chapter_content for insert with check (
  exists (
    select 1 from chapters c join stories s on s.id = c.story_id
    where c.id = chapter_id and s.creator_id = auth.uid()
  )
);
create policy "chapter_content_update" on chapter_content for update using (
  exists (
    select 1 from chapters c join stories s on s.id = c.story_id
    where c.id = chapter_id and s.creator_id = auth.uid()
  )
);

-- Media: own CRUD
create policy "media_read" on media for select using (true);
create policy "media_insert" on media for insert with check (auth.uid() = uploader_id);
create policy "media_delete" on media for delete using (auth.uid() = uploader_id);

-- Comments: public read, authenticated insert, own delete
create policy "comments_read" on comments for select using (true);
create policy "comments_insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on comments for delete using (auth.uid() = user_id);

-- Bookmarks: own only
create policy "bookmarks_read" on bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert" on bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_update" on bookmarks for update using (auth.uid() = user_id);
create policy "bookmarks_delete" on bookmarks for delete using (auth.uid() = user_id);

-- Follows: public read, own insert/delete
create policy "follows_read" on follows for select using (true);
create policy "follows_insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on follows for delete using (auth.uid() = follower_id);

-- Subscriptions: own read, system insert
create policy "subscriptions_read" on subscriptions for select using (auth.uid() = reader_id);
create policy "subscriptions_creator_read" on subscriptions for select using (
  exists (
    select 1 from stories where id = target_id and creator_id = auth.uid()
  ) or target_id = auth.uid()
);

-- Tips: own read (both sides)
create policy "tips_read_reader" on tips for select using (auth.uid() = reader_id);
create policy "tips_read_creator" on tips for select using (auth.uid() = creator_id);

-- Payouts: own read
create policy "payouts_read" on payouts for select using (auth.uid() = creator_id);
create policy "payouts_insert" on payouts for insert with check (auth.uid() = creator_id);

-- Reports: own read, authenticated insert
create policy "reports_read" on reports for select using (auth.uid() = reporter_id);
create policy "reports_insert" on reports for insert with check (auth.uid() = reporter_id);

-- Reading history: own only
create policy "reading_history_read" on reading_history for select using (auth.uid() = user_id);
create policy "reading_history_insert" on reading_history for insert with check (auth.uid() = user_id);
create policy "reading_history_delete" on reading_history for delete using (auth.uid() = user_id);

-- Admin policies (for admin role users)
create policy "admin_read_all_reports" on reports for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "admin_update_reports" on reports for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "admin_read_all_profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "admin_update_all_profiles" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
