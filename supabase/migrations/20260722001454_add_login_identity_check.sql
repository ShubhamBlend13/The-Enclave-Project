begin;

-- =========================================================
-- LOGIN IDENTITY CHECK
--
-- Allows the login screen to determine whether a phone
-- number or employee ID belongs to an application profile.
--
-- The function returns only true/false and does not expose
-- profile information.
-- =========================================================

create or replace function public.login_identity_exists(
  p_identity_type text,
  p_identity text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_type text :=
    lower(
      btrim(
        coalesce(p_identity_type, '')
      )
    );

  normalized_identity text :=
    btrim(
      coalesce(p_identity, '')
    );
begin
  if normalized_type = 'phone' then
    -- Expected format after frontend normalization:
    -- +91 followed by a 10-digit Indian mobile number.
    if normalized_identity !~ '^\+91[0-9]{10}$' then
      return false;
    end if;

    return exists (
      select 1
      from public.profiles as profile
      where profile.phone = normalized_identity
    );
  end if;

  if normalized_type = 'employee' then
    normalized_identity :=
      upper(normalized_identity);

    if normalized_identity !~ '^[A-Z0-9-]{3,30}$' then
      return false;
    end if;

    return exists (
      select 1
      from public.profiles as profile
      where upper(profile.employee_id) =
        normalized_identity
    );
  end if;

  return false;
end;
$$;

revoke all
on function public.login_identity_exists(
  text,
  text
)
from public;

grant execute
on function public.login_identity_exists(
  text,
  text
)
to anon, authenticated;

commit;