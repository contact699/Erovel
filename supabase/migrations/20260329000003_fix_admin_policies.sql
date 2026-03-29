-- Fix admin policies that query auth.users (causes "permission denied for table users")
-- Use auth.jwt() instead which is always accessible without table permissions

drop policy if exists "admin_read_all_profiles" on profiles;
drop policy if exists "admin_update_all_profiles" on profiles;

-- Use JWT claims to check admin role
create policy "admin_read_all_profiles" on profiles for select using (
  coalesce((auth.jwt()->'user_metadata'->>'role'), '') = 'admin'
);

create policy "admin_update_all_profiles" on profiles for update using (
  coalesce((auth.jwt()->'user_metadata'->>'role'), '') = 'admin'
);

-- Also fix admin policies on reports that reference profiles table
drop policy if exists "admin_read_all_reports" on reports;
drop policy if exists "admin_update_reports" on reports;

create policy "admin_read_all_reports" on reports for select using (
  coalesce((auth.jwt()->'user_metadata'->>'role'), '') = 'admin'
);

create policy "admin_update_reports" on reports for update using (
  coalesce((auth.jwt()->'user_metadata'->>'role'), '') = 'admin'
);
