begin;

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
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select *
  into current_task
  from public.upkeep_tasks
  where id = p_task_id
    and is_active = true
  for update;

  if not found then
    raise exception 'Upkeep task was not found';
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

-- =========================================================
-- PREVENT SAVING PAST UPKEEP DUE DATES
-- Uses The Enclave's business timezone.
-- Existing tasks may naturally become overdue over time;
-- this only validates new or edited values.
-- =========================================================

create or replace function public.validate_upkeep_next_due()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  due_date date;
  today_date date;
begin
  due_date :=
    (
      new.next_due
      at time zone 'Asia/Kolkata'
    )::date;

  today_date :=
    (
      now()
      at time zone 'Asia/Kolkata'
    )::date;

  if due_date < today_date then
    raise exception
      'Next due date cannot be in the past';
  end if;

  return new;
end;
$$;

revoke all
on function public.validate_upkeep_next_due()
from public;

create trigger validate_upkeep_next_due_trigger
before insert or update of next_due
on public.upkeep_tasks
for each row
execute function public.validate_upkeep_next_due();

commit;