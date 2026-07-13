begin;

create or replace function public.add_issue_update(
  p_issue_id uuid,
  p_message text,
  p_new_status text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_issue public.issues%rowtype;
  created_update_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if p_message is null or length(btrim(p_message)) = 0 then
    raise exception 'An update message is required';
  end if;

  if (
    p_new_status is not null
    and p_new_status not in (
      'open',
      'progress',
      'resolved'
    )
  ) then
    raise exception 'Invalid issue status';
  end if;

  select *
  into current_issue
  from public.issues
  where id = p_issue_id
  for update;

  if not found then
    raise exception 'Issue was not found';
  end if;

  -- Updating the issue also proves that the caller passes the
  -- operational RLS policy for this area.
  update public.issues
  set
    status = coalesce(
      p_new_status,
      current_issue.status
    ),
    resolved_at = case
      when p_new_status = 'resolved'
        then now()
      when p_new_status is not null
        then null
      else current_issue.resolved_at
    end,
    updated_at = now()
  where id = p_issue_id;

  insert into public.issue_updates (
    issue_id,
    created_by,
    message,
    old_status,
    new_status,
    created_at
  )
  values (
    p_issue_id,
    auth.uid(),
    btrim(p_message),
    case
      when p_new_status is null
        then null
      else current_issue.status
    end,
    p_new_status,
    now()
  )
  returning id into created_update_id;

  return created_update_id;
end;
$$;

revoke all
on function public.add_issue_update(
  uuid,
  text,
  text
)
from public;

grant execute
on function public.add_issue_update(
  uuid,
  text,
  text
)
to authenticated;

commit;