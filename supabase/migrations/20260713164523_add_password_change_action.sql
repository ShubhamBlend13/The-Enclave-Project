begin;

-- Called only after Supabase Auth successfully changes the user's password.
-- SECURITY DEFINER lets the function update one protected profile field
-- without granting general profile-update access to the browser.
create or replace function public.complete_password_change()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  update public.profiles
  set must_change_password = false
  where id = auth.uid()
    and is_active = true;

  if not found then
    raise exception 'An active profile was not found';
  end if;
end;
$$;

revoke all
on function public.complete_password_change()
from public;

grant execute
on function public.complete_password_change()
to authenticated;

commit;