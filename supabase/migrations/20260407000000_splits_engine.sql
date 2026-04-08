-- Erovel splits engine v1
-- Adds payees, split_rules, payee_balances, splits_failed
-- Adds splits jsonb columns to tips and subscriptions
-- Backfills existing data with 100%-to-creator snapshots
-- See docs/plans/2026-04-07-splits-engine-v1-design.md

-- ============================================================
-- ENUMS
-- ============================================================

create type payee_type as enum ('profile', 'platform', 'external');
create type split_subject_type as enum ('creator', 'story');

-- ============================================================
-- PAYEES
-- ============================================================

create table payees (
  id uuid primary key default gen_random_uuid(),
  type payee_type not null,
  profile_id uuid references profiles(id) on delete cascade,
  label text,
  payout_method payout_method,
  payout_email text,
  payout_wallet_address text,
  created_at timestamptz not null default now(),
  -- A profile-type payee must have a profile_id; others must not
  check (
    (type = 'profile' and profile_id is not null)
    or (type != 'profile' and profile_id is null)
  )
);

create index idx_payees_profile on payees(profile_id);
create index idx_payees_type on payees(type);
create unique index idx_payees_profile_unique on payees(profile_id) where type = 'profile';

alter table payees enable row level security;

-- Public read of payees is OK — payee identity is not sensitive on its own
create policy "payees_read" on payees for select using (true);
create policy "payees_admin_all" on payees for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Seed: a single platform payee
insert into payees (type, label) values ('platform', 'Erovel');

-- Backfill: a profile-type payee for every existing profile
insert into payees (type, profile_id)
select 'profile', id from profiles
on conflict do nothing;

-- Trigger: auto-create a payee row when a profile is created
create or replace function create_payee_for_profile()
returns trigger as $$
begin
  insert into payees (type, profile_id) values ('profile', new.id)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_create_payee_for_profile
  after insert on profiles
  for each row execute function create_payee_for_profile();

-- ============================================================
-- SPLIT RULES
-- ============================================================

create table split_rules (
  id uuid primary key default gen_random_uuid(),
  subject_type split_subject_type not null,
  subject_id uuid not null,
  payee_id uuid not null references payees(id) on delete cascade,
  basis_pct numeric(5,2),
  basis_fixed numeric(10,2),
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  check (basis_pct is not null or basis_fixed is not null),
  check (basis_pct is null or (basis_pct >= 0 and basis_pct <= 100)),
  check (basis_fixed is null or basis_fixed >= 0)
);

create index idx_split_rules_subject on split_rules(subject_type, subject_id);

alter table split_rules enable row level security;

create policy "split_rules_read_own" on split_rules for select using (
  -- Creators can read rules for their own creator/stories
  (subject_type = 'creator' and subject_id = auth.uid())
  or (subject_type = 'story' and exists (
    select 1 from stories where id = subject_id and creator_id = auth.uid()
  ))
);
create policy "split_rules_admin_all" on split_rules for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- SPLITS JSONB COLUMNS ON PAYMENT TABLES
-- ============================================================

alter table tips add column splits jsonb not null default '[]'::jsonb;
alter table subscriptions add column splits jsonb not null default '[]'::jsonb;

-- Backfill existing tips: 100% to creator's payee
update tips
set splits = jsonb_build_array(
  jsonb_build_object(
    'payee_id', (select id from payees where profile_id = tips.creator_id and type = 'profile'),
    'amount', tips.amount,
    'basis', 'residual'
  )
);

-- Backfill existing subscriptions: 100% to target's payee
-- Note: subscriptions can target either a creator or a story
update subscriptions
set splits = jsonb_build_array(
  jsonb_build_object(
    'payee_id', (
      case
        when target_type = 'creator' then
          (select id from payees where profile_id = subscriptions.target_id and type = 'profile')
        when target_type = 'story' then
          (select p.id from payees p
           join stories s on s.creator_id = p.profile_id
           where s.id = subscriptions.target_id and p.type = 'profile')
      end
    ),
    'amount', 0, -- subscriptions don't have an inherent amount in the existing schema
    'basis', 'residual'
  )
);

-- ============================================================
-- PAYEE BALANCES
-- ============================================================

create table payee_balances (
  payee_id uuid primary key references payees(id) on delete cascade,
  gross_earned numeric(12,2) not null default 0,
  total_paid_out numeric(12,2) not null default 0,
  available numeric(12,2) generated always as (gross_earned - total_paid_out) stored,
  updated_at timestamptz not null default now()
);

alter table payee_balances enable row level security;

create policy "payee_balances_read_own" on payee_balances for select using (
  exists (select 1 from payees where id = payee_balances.payee_id and profile_id = auth.uid())
);
create policy "payee_balances_admin_all" on payee_balances for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Insert a balance row for every existing payee
insert into payee_balances (payee_id) select id from payees
on conflict do nothing;

-- Backfill: walk every tip's snapshot and bump gross_earned
update payee_balances pb
set gross_earned = coalesce((
  select sum((entry->>'amount')::numeric)
  from tips, jsonb_array_elements(tips.splits) entry
  where (entry->>'payee_id')::uuid = pb.payee_id
), 0);

-- Trigger: bump payee_balances when a tip is inserted
create or replace function apply_tip_splits_to_balances()
returns trigger as $$
declare
  entry jsonb;
begin
  for entry in select * from jsonb_array_elements(new.splits)
  loop
    update payee_balances
    set gross_earned = gross_earned + (entry->>'amount')::numeric,
        updated_at = now()
    where payee_id = (entry->>'payee_id')::uuid;
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_tip_splits_balance
  after insert on tips
  for each row execute function apply_tip_splits_to_balances();

-- Same trigger for subscriptions (insert only — renewals create new rows)
create trigger tr_subscription_splits_balance
  after insert on subscriptions
  for each row execute function apply_tip_splits_to_balances();

-- ============================================================
-- SPLITS FAILED QUEUE
-- ============================================================

create table splits_failed (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_payload jsonb not null,
  error_message text not null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_splits_failed_pending on splits_failed(created_at desc) where reviewed_at is null;

alter table splits_failed enable row level security;
create policy "splits_failed_admin_only" on splits_failed for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- PAYOUTS: ADD payee_id COLUMN, BACKFILL
-- ============================================================

alter table payouts add column payee_id uuid references payees(id) on delete restrict;

update payouts
set payee_id = (select id from payees where profile_id = payouts.creator_id and type = 'profile');

alter table payouts alter column payee_id set not null;

create index idx_payouts_payee on payouts(payee_id, created_at desc);

-- Trigger: bump total_paid_out when a payout transitions to 'completed' or 'processing'
create or replace function apply_payout_to_balance()
returns trigger as $$
begin
  -- When a payout is created (pending), no balance impact yet
  -- When it transitions into processing/completed, it consumes balance
  -- When it transitions back to pending or failed, it releases balance
  if tg_op = 'INSERT' then
    if new.status in ('processing', 'completed') then
      update payee_balances
      set total_paid_out = total_paid_out + new.amount,
          updated_at = now()
      where payee_id = new.payee_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.status not in ('processing', 'completed') and new.status in ('processing', 'completed') then
      update payee_balances
      set total_paid_out = total_paid_out + new.amount,
          updated_at = now()
      where payee_id = new.payee_id;
    elsif old.status in ('processing', 'completed') and new.status not in ('processing', 'completed') then
      update payee_balances
      set total_paid_out = total_paid_out - new.amount,
          updated_at = now()
      where payee_id = new.payee_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_payout_balance
  after insert or update on payouts
  for each row execute function apply_payout_to_balance();

-- Backfill total_paid_out from existing payouts
update payee_balances pb
set total_paid_out = coalesce((
  select sum(amount)
  from payouts
  where payouts.payee_id = pb.payee_id
    and payouts.status in ('processing', 'completed')
), 0);
