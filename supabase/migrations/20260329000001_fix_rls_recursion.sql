-- Fix infinite recursion in profiles RLS policies
-- The admin_read_all_profiles and admin_update_all_profiles policies
-- query the profiles table from within a profiles policy, causing recursion.

-- Drop the recursive policies
drop policy if exists "admin_read_all_profiles" on profiles;
drop policy if exists "admin_update_all_profiles" on profiles;

-- Recreate using auth.users metadata instead of querying profiles
-- This avoids the recursion since auth.users is a separate table
create policy "admin_read_all_profiles" on profiles for select using (
  (select (raw_user_meta_data->>'role')::text from auth.users where id = auth.uid()) = 'admin'
);

create policy "admin_update_all_profiles" on profiles for update using (
  (select (raw_user_meta_data->>'role')::text from auth.users where id = auth.uid()) = 'admin'
);
