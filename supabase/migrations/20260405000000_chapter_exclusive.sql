-- Allow creators to mark individual chapters as "exclusive" so they
-- never auto-release via the scheduled-publish cron job.

alter table chapters add column is_exclusive boolean not null default false;

-- Recreate the cron publish function to skip exclusive chapters
create or replace function publish_scheduled_chapters()
returns integer as $$
declare
  published_count integer;
begin
  update chapters
  set status = 'published', updated_at = now()
  where status = 'scheduled'
    and publish_at <= now()
    and is_exclusive = false;

  get diagnostics published_count = row_count;
  return published_count;
end;
$$ language plpgsql security definer;
