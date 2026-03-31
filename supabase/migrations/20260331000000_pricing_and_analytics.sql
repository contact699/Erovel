-- Add creator pricing fields to profiles
alter table profiles add column if not exists subscription_price numeric(10,2) default 9.99;

-- Add per-story pricing
alter table stories add column if not exists price numeric(10,2) default 0;

-- Analytics: daily view tracking
create table if not exists story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete set null,
  viewer_id uuid references profiles(id) on delete set null,
  viewed_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_story_views_story on story_views(story_id, viewed_at);
create index if not exists idx_story_views_chapter on story_views(chapter_id, viewed_at);
create index if not exists idx_story_views_date on story_views(viewed_at);

-- RLS for story_views
alter table story_views enable row level security;
create policy "story_views_insert" on story_views for insert with check (true);
create policy "story_views_read_creator" on story_views for select using (
  exists (select 1 from stories where stories.id = story_views.story_id and stories.creator_id = auth.uid())
);

-- Increment view_count on stories when a view is recorded
create or replace function increment_story_view_count()
returns trigger
security definer
set search_path = public
as $$
begin
  update stories set view_count = view_count + 1 where id = new.story_id;
  return new;
end;
$$ language plpgsql;

create trigger tr_story_view_count
  after insert on story_views
  for each row execute function increment_story_view_count();

-- Scheduled chapter publishing is handled by calling
-- publish_scheduled_chapters() via an external cron/edge function.
-- Enable pg_cron in Supabase dashboard to automate this.
