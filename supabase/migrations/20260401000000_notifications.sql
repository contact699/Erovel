-- Notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null, -- 'new_chapter', 'new_follower', 'new_comment', 'tip_received'
  title text not null,
  body text not null,
  link text, -- URL to navigate to
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, created_at desc);
create index idx_notifications_unread on notifications(user_id) where read = false;

alter table notifications enable row level security;
create policy "notifications_read" on notifications for select using (auth.uid() = user_id);
create policy "notifications_update" on notifications for update using (auth.uid() = user_id);
-- Allow inserts from authenticated users (for system-generated notifications)
create policy "notifications_insert" on notifications for insert with check (true);

-- Notification preferences on profiles
alter table profiles add column if not exists notify_new_follower boolean not null default true;
alter table profiles add column if not exists notify_tips boolean not null default true;
alter table profiles add column if not exists notify_comments boolean not null default true;
alter table profiles add column if not exists notify_new_chapters boolean not null default true;
