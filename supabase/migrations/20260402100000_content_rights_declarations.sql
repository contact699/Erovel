-- Content rights declarations: track creator permissions for real-person / AI content
-- Supports evidence tiers, badge levels, and admin review workflow

-- ============================================================
-- ENUMS
-- ============================================================

create type declaration_type as enum ('real_person_active', 'real_person_prior', 'ai_generated', 'fictional');
create type evidence_tier as enum ('video', 'screenshot', 'signed_consent', 'prior_declaration');
create type badge_level as enum ('verified_permission', 'permission_documented', 'ai_generated', 'none');
create type declaration_status as enum ('pending', 'approved', 'rejected', 'more_info_requested', 'expired');

-- ============================================================
-- CONTENT RIGHTS DECLARATIONS
-- ============================================================

create table content_rights_declarations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  declaration_type declaration_type not null,
  subject_name text,
  subject_platform text,
  subject_profile_url text,
  evidence_tier evidence_tier,
  evidence_urls text[],
  evidence_metadata jsonb,
  badge_level badge_level not null default 'none',
  status declaration_status not null default 'pending',
  admin_reviewer_id uuid references profiles(id) on delete set null,
  admin_notes text,
  reviewed_at timestamptz,
  grace_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_declarations_creator on content_rights_declarations(creator_id);
create index idx_declarations_status on content_rights_declarations(status);
create index idx_declarations_grace on content_rights_declarations(grace_deadline) where grace_deadline is not null;

-- ============================================================
-- STORY ↔ DECLARATION JOIN TABLE
-- ============================================================

create table story_rights_declarations (
  story_id uuid not null references stories(id) on delete cascade,
  declaration_id uuid not null references content_rights_declarations(id) on delete cascade,
  primary key (story_id, declaration_id)
);

create index idx_story_rights_story on story_rights_declarations(story_id);
create index idx_story_rights_declaration on story_rights_declarations(declaration_id);

-- ============================================================
-- DENORMALIZED BADGE ON STORIES
-- ============================================================

alter table stories add column if not exists badge_level badge_level not null default 'none';

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================

create trigger tr_content_rights_declarations_updated
  before update on content_rights_declarations
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY: content_rights_declarations
-- ============================================================

alter table content_rights_declarations enable row level security;

-- Creators can read their own declarations
create policy "declarations_read_own" on content_rights_declarations
  for select using (auth.uid() = creator_id);

-- Creators can insert their own declarations
create policy "declarations_insert_own" on content_rights_declarations
  for insert with check (auth.uid() = creator_id);

-- Creators can update their own declarations while pending or more_info_requested
create policy "declarations_update_own_pending" on content_rights_declarations
  for update using (
    auth.uid() = creator_id
    and status in ('pending', 'more_info_requested')
  );

-- Admins can read all declarations
create policy "declarations_admin_read" on content_rights_declarations
  for select using (
    coalesce((auth.jwt()->'user_metadata'->>'role'), '') = 'admin'
  );

-- Admins can update all declarations (review workflow)
create policy "declarations_admin_update" on content_rights_declarations
  for update using (
    coalesce((auth.jwt()->'user_metadata'->>'role'), '') = 'admin'
  );

-- ============================================================
-- ROW LEVEL SECURITY: story_rights_declarations
-- ============================================================

alter table story_rights_declarations enable row level security;

-- Anyone can read (badges are public)
create policy "story_rights_read" on story_rights_declarations
  for select using (true);

-- Creators can link declarations to their own stories
create policy "story_rights_insert_own" on story_rights_declarations
  for insert with check (
    exists (
      select 1 from stories
      where stories.id = story_id
        and stories.creator_id = auth.uid()
    )
  );

-- Creators can unlink declarations from their own stories
create policy "story_rights_delete_own" on story_rights_declarations
  for delete using (
    exists (
      select 1 from stories
      where stories.id = story_id
        and stories.creator_id = auth.uid()
    )
  );
