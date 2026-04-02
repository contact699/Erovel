-- Track verification sessions
create table if not exists verification_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  veriff_session_id text unique not null,
  status text not null default 'created', -- created, submitted, approved, declined, expired
  veriff_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_verification_user on verification_sessions(user_id, created_at desc);

alter table verification_sessions enable row level security;
create policy "verification_read_own" on verification_sessions for select using (auth.uid() = user_id);
create policy "verification_insert" on verification_sessions for insert with check (true);
create policy "verification_update" on verification_sessions for update using (true);
