-- Fix the signup trigger to properly handle new user creation
-- The previous version may fail due to RLS or casting issues

create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
as $$
declare
  _username text;
  _display_name text;
  _role user_role;
begin
  _username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  _display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  -- Safely cast role, default to reader
  begin
    _role := (new.raw_user_meta_data->>'role')::user_role;
  exception when others then
    _role := 'reader';
  end;

  if _role is null then
    _role := 'reader';
  end if;

  -- Make username unique by appending random suffix if needed
  if exists (select 1 from profiles where username = _username) then
    _username := _username || '_' || substr(md5(random()::text), 1, 6);
  end if;

  insert into profiles (id, username, display_name, role)
  values (new.id, _username, _display_name, _role);

  return new;
end;
$$ language plpgsql;
