begin;

-- Existing schedules may naturally become overdue.
-- This guard only prevents saving a new past next-due value.
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

drop trigger if exists
  validate_upkeep_next_due_trigger
on public.upkeep_tasks;

create trigger validate_upkeep_next_due_trigger
before insert or update of next_due
on public.upkeep_tasks
for each row
execute function public.validate_upkeep_next_due();

commit;