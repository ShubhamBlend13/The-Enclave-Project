begin;

-- =========================================================
-- EXPAND UPKEEP MANAGEMENT
--
-- Owner Admin and Staff:
--   all areas
--
-- Villa Admin and Resident:
--   home villa and Clubhouse only
--
-- public.can_access_area() continues to enforce the
-- role-specific area restriction.
-- =========================================================


-- =========================================================
-- UPKEEP TASK INSERT
-- =========================================================

drop policy if exists
  "upkeep_tasks_insert_operational"
on public.upkeep_tasks;

create policy "upkeep_tasks_insert_accessible"
on public.upkeep_tasks
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    select public.current_user_is_active()
  )
  and coalesce(
    (
      select public.current_user_role()
    )::text,
    ''
  ) in (
    'owner_admin',
    'villa_admin',
    'resident',
    'upkeep_manager'
  )
  and public.can_access_area(area_id)
);


-- =========================================================
-- UPKEEP TASK UPDATE
-- Checks both the existing area and the new area.
-- =========================================================

drop policy if exists
  "upkeep_tasks_update_operational"
on public.upkeep_tasks;

create policy "upkeep_tasks_update_accessible"
on public.upkeep_tasks
for update
to authenticated
using (
  (
    select public.current_user_is_active()
  )
  and coalesce(
    (
      select public.current_user_role()
    )::text,
    ''
  ) in (
    'owner_admin',
    'villa_admin',
    'resident',
    'upkeep_manager'
  )
  and public.can_access_area(area_id)
)
with check (
  (
    select public.current_user_is_active()
  )
  and coalesce(
    (
      select public.current_user_role()
    )::text,
    ''
  ) in (
    'owner_admin',
    'villa_admin',
    'resident',
    'upkeep_manager'
  )
  and public.can_access_area(area_id)
);


-- =========================================================
-- UPKEEP HISTORY INSERT
-- Required when a task is marked complete.
-- =========================================================

drop policy if exists
  "upkeep_history_insert_operational"
on public.upkeep_history;

create policy "upkeep_history_insert_accessible"
on public.upkeep_history
for insert
to authenticated
with check (
  completed_by = (select auth.uid())
  and (
    select public.current_user_is_active()
  )
  and coalesce(
    (
      select public.current_user_role()
    )::text,
    ''
  ) in (
    'owner_admin',
    'villa_admin',
    'resident',
    'upkeep_manager'
  )
  and exists (
    select 1
    from public.upkeep_tasks as task
    where task.id = upkeep_history.task_id
      and public.can_access_area(task.area_id)
  )
);


-- =========================================================
-- COMPLETE UPKEEP TASK
-- Preserve the existing atomic completion behavior while
-- explicitly validating active role and accessible area.
-- =========================================================

create or replace function public.complete_upkeep_task(
  p_task_id uuid,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_task public.upkeep_tasks%rowtype;
  completion_time timestamptz := now();
  calculated_next_due timestamptz;
  history_id uuid;
  caller_role text;
begin
  if auth.uid() is null then
    raise exception
      'Authentication is required';
  end if;

  if not coalesce(
    public.current_user_is_active(),
    false
  ) then
    raise exception
      'Your account is inactive';
  end if;

  caller_role :=
    coalesce(
      public.current_user_role()::text,
      ''
    );

  if caller_role not in (
    'owner_admin',
    'villa_admin',
    'resident',
    'upkeep_manager'
  ) then
    raise exception
      'You do not have permission to complete upkeep tasks';
  end if;

  select *
  into current_task
  from public.upkeep_tasks
  where id = p_task_id
    and is_active = true
  for update;

  if not found then
    raise exception
      'Upkeep task was not found';
  end if;

  if not coalesce(
    public.can_access_area(
      current_task.area_id
    ),
    false
  ) then
    raise exception
      'You cannot complete upkeep for this area';
  end if;

  case current_task.frequency
    when 'weekly' then
      calculated_next_due :=
        completion_time + interval '7 days';

    when 'monthly' then
      calculated_next_due :=
        completion_time + interval '1 month';

    when 'quarterly' then
      calculated_next_due :=
        completion_time + interval '3 months';

    when 'halfyearly' then
      calculated_next_due :=
        completion_time + interval '6 months';

    when 'yearly' then
      calculated_next_due :=
        completion_time + interval '1 year';

    else
      raise exception
        'Unsupported upkeep frequency: %',
        current_task.frequency;
  end case;

  update public.upkeep_tasks
  set
    last_completed_at = completion_time,
    next_due = calculated_next_due,
    updated_at = completion_time
  where id = p_task_id;

  insert into public.upkeep_history (
    task_id,
    completed_by,
    completed_at,
    note
  )
  values (
    p_task_id,
    auth.uid(),
    completion_time,
    nullif(btrim(p_note), '')
  )
  returning id into history_id;

  return history_id;
end;
$$;

revoke all
on function public.complete_upkeep_task(
  uuid,
  text
)
from public;

grant execute
on function public.complete_upkeep_task(
  uuid,
  text
)
to authenticated;

commit;