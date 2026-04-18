-- AI-assisted story creation: context blob on stories + audit/rate-limit table

alter table stories add column if not exists ai_context jsonb;
alter table stories add column if not exists ai_generated boolean not null default false;

create table if not exists ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('plan','chapter','regenerate')),
  story_id uuid references stories(id) on delete set null,
  chapter_id uuid references chapters(id) on delete set null,
  model text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_generations_user_time
  on ai_generations (user_id, created_at desc);

create index if not exists idx_ai_generations_created_at
  on ai_generations (created_at desc);

alter table ai_generations enable row level security;

-- Users can read their own audit rows
create policy "ai_generations_select_own" on ai_generations
  for select using (auth.uid() = user_id);

-- Writes go through the service-role key from server routes only
create policy "ai_generations_insert_service" on ai_generations
  for insert with check (true);
