begin;

-- =========================================================
-- AREAS
-- Eight villas and one shared clubhouse.
-- =========================================================

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null
    check (type in ('villa', 'common')),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint areas_code_not_empty
    check (length(btrim(code)) > 0),

  constraint areas_name_not_empty
    check (length(btrim(name)) > 0)
);

insert into public.areas (
  code,
  type,
  name,
  is_active
)
values
  ('S1', 'villa', 'Villa S1', true),
  ('S2', 'villa', 'Villa S2', true),
  ('S3', 'villa', 'Villa S3', true),
  ('S4', 'villa', 'Villa S4', true),
  ('E1', 'villa', 'Villa E1', true),
  ('E2', 'villa', 'Villa E2', true),
  ('E3', 'villa', 'Villa E3', true),
  ('E4', 'villa', 'Villa E4', true),
  ('CLUBHOUSE', 'common', 'Clubhouse', true)
on conflict (code)
do update set
  type = excluded.type,
  name = excluded.name,
  is_active = excluded.is_active;


-- =========================================================
-- PROFILES
-- Application metadata for Supabase Auth users.
-- =========================================================

create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text not null,
  phone text,
  employee_id text,

  home_villa_id uuid
    references public.areas(id)
    on delete restrict,

  role text not null
    check (
      role in (
        'owner_admin',
        'villa_admin',
        'resident',
        'upkeep_manager'
      )
    ),

  must_change_password boolean not null default true,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  created_by uuid
    references auth.users(id)
    on delete set null,

  updated_at timestamptz not null default now(),

  constraint profiles_full_name_not_empty
    check (length(btrim(full_name)) > 0)
);

create unique index profiles_phone_unique
  on public.profiles(phone)
  where phone is not null;

create unique index profiles_employee_id_unique
  on public.profiles(lower(employee_id))
  where employee_id is not null;

create index profiles_home_villa_id_idx
  on public.profiles(home_villa_id);

create index profiles_role_idx
  on public.profiles(role);

create index profiles_active_idx
  on public.profiles(is_active);


-- Validate that home areas and identities match the selected role.

create or replace function public.validate_profile_assignment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  home_area_type text;
begin
  if new.role in ('resident', 'villa_admin') then
    if new.home_villa_id is null then
      raise exception
        'Residents and villa admins require a home villa';
    end if;

    select area.type
      into home_area_type
    from public.areas as area
    where area.id = new.home_villa_id
      and area.is_active = true;

    if home_area_type is distinct from 'villa' then
      raise exception
        'The selected home area must be an active villa';
    end if;

    if new.phone is null or length(btrim(new.phone)) = 0 then
      raise exception
        'Residents and villa admins require a phone number';
    end if;

  elsif new.role = 'upkeep_manager' then
    if new.home_villa_id is not null then
      raise exception
        'The upkeep manager cannot have a home villa';
    end if;

    if (
      new.employee_id is null
      or length(btrim(new.employee_id)) = 0
    ) then
      raise exception
        'The upkeep manager requires an employee ID';
    end if;

  elsif new.role = 'owner_admin' then
    if new.home_villa_id is not null then
      raise exception
        'The owner admin cannot have a home villa';
    end if;

    if new.phone is null or length(btrim(new.phone)) = 0 then
      raise exception
        'The owner admin requires a phone number';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_profile_assignment_trigger
before insert or update on public.profiles
for each row
execute function public.validate_profile_assignment();


-- =========================================================
-- ISSUES
-- =========================================================

create table public.issues (
  id uuid primary key default gen_random_uuid(),

  area_id uuid not null
    references public.areas(id)
    on delete restrict,

  reported_by uuid not null
    references public.profiles(id)
    on delete restrict,

  category text not null
    check (
      category in (
        'electrical',
        'plumbing',
        'automation',
        'hvac',
        'housekeeping',
        'landscape',
        'clubhouse',
        'security',
        'other'
      )
    ),

  location text,
  description text not null,

  priority text not null default 'Normal'
    check (priority in ('Low', 'Normal', 'Urgent')),

  status text not null default 'open'
    check (status in ('open', 'progress', 'resolved')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,

  constraint issues_description_not_empty
    check (length(btrim(description)) > 0),

  constraint issues_resolved_timestamp
    check (
      status <> 'resolved'
      or resolved_at is not null
    )
);

create index issues_area_id_idx
  on public.issues(area_id);

create index issues_reported_by_idx
  on public.issues(reported_by);

create index issues_area_status_idx
  on public.issues(area_id, status);

create index issues_created_at_idx
  on public.issues(created_at desc);


-- =========================================================
-- ISSUE TIMELINE
-- =========================================================

create table public.issue_updates (
  id uuid primary key default gen_random_uuid(),

  issue_id uuid not null
    references public.issues(id)
    on delete cascade,

  created_by uuid not null
    references public.profiles(id)
    on delete restrict,

  message text not null,

  old_status text
    check (
      old_status is null
      or old_status in ('open', 'progress', 'resolved')
    ),

  new_status text
    check (
      new_status is null
      or new_status in ('open', 'progress', 'resolved')
    ),

  created_at timestamptz not null default now(),

  constraint issue_updates_message_not_empty
    check (length(btrim(message)) > 0)
);

create index issue_updates_issue_created_idx
  on public.issue_updates(issue_id, created_at);


-- =========================================================
-- ANNOUNCEMENTS
-- =========================================================

create table public.announcements (
  id uuid primary key default gen_random_uuid(),

  area_id uuid not null
    references public.areas(id)
    on delete restrict,

  title text not null,
  body text not null,

  created_by uuid not null
    references public.profiles(id)
    on delete restrict,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint announcements_title_not_empty
    check (length(btrim(title)) > 0),

  constraint announcements_body_not_empty
    check (length(btrim(body)) > 0)
);

create index announcements_area_created_idx
  on public.announcements(area_id, created_at desc);


-- =========================================================
-- UPKEEP SCHEDULES
-- =========================================================

create table public.upkeep_tasks (
  id uuid primary key default gen_random_uuid(),

  area_id uuid not null
    references public.areas(id)
    on delete restrict,

  title text not null,
  icon text not null default '🛠️',

  frequency text not null
    check (
      frequency in (
        'weekly',
        'monthly',
        'quarterly',
        'halfyearly',
        'yearly'
      )
    ),

  next_due timestamptz not null,
  last_completed_at timestamptz,

  is_active boolean not null default true,

  created_by uuid not null
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint upkeep_tasks_title_not_empty
    check (length(btrim(title)) > 0)
);

create index upkeep_tasks_area_due_idx
  on public.upkeep_tasks(area_id, next_due);

create index upkeep_tasks_active_idx
  on public.upkeep_tasks(is_active);


-- =========================================================
-- UPKEEP COMPLETION HISTORY
-- =========================================================

create table public.upkeep_history (
  id uuid primary key default gen_random_uuid(),

  task_id uuid not null
    references public.upkeep_tasks(id)
    on delete cascade,

  completed_by uuid not null
    references public.profiles(id)
    on delete restrict,

  completed_at timestamptz not null default now(),
  note text
);

create index upkeep_history_task_completed_idx
  on public.upkeep_history(task_id, completed_at desc);


-- =========================================================
-- AUTOMATIC updated_at VALUES
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger issues_set_updated_at
before update on public.issues
for each row
execute function public.set_updated_at();

create trigger upkeep_tasks_set_updated_at
before update on public.upkeep_tasks
for each row
execute function public.set_updated_at();


-- =========================================================
-- SECURITY BASELINE
-- No browser access is granted until policies are added.
-- =========================================================

alter table public.areas
  enable row level security;

alter table public.profiles
  enable row level security;

alter table public.issues
  enable row level security;

alter table public.issue_updates
  enable row level security;

alter table public.announcements
  enable row level security;

alter table public.upkeep_tasks
  enable row level security;

alter table public.upkeep_history
  enable row level security;

revoke all privileges
on table
  public.areas,
  public.profiles,
  public.issues,
  public.issue_updates,
  public.announcements,
  public.upkeep_tasks,
  public.upkeep_history
from anon, authenticated;

commit;