begin;

-- =========================================================
-- CURRENT-USER HELPERS
-- SECURITY DEFINER avoids recursive RLS lookups on profiles.
-- Every relation is schema-qualified because search_path is empty.
-- =========================================================

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
  from public.profiles as profile
  where profile.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_home_villa_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.home_villa_id
  from public.profiles as profile
  where profile.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select profile.is_active
      from public.profiles as profile
      where profile.id = auth.uid()
      limit 1
    ),
    false
  );
$$;

create or replace function public.can_access_area(
  requested_area_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    join public.areas as area
      on area.id = requested_area_id
    where profile.id = auth.uid()
      and profile.is_active = true
      and area.is_active = true
      and (
        profile.role in (
          'owner_admin',
          'upkeep_manager'
        )
        or (
          profile.role in (
            'resident',
            'villa_admin'
          )
          and (
            profile.home_villa_id = requested_area_id
            or area.type = 'common'
          )
        )
      )
  );
$$;


-- =========================================================
-- FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.current_user_role()
from public;

revoke all
on function public.current_user_home_villa_id()
from public;

revoke all
on function public.current_user_is_active()
from public;

revoke all
on function public.can_access_area(uuid)
from public;

grant execute
on function public.current_user_role()
to authenticated;

grant execute
on function public.current_user_home_villa_id()
to authenticated;

grant execute
on function public.current_user_is_active()
to authenticated;

grant execute
on function public.can_access_area(uuid)
to authenticated;


-- =========================================================
-- INITIAL ISSUE TIMELINE ENTRY
-- A newly reported issue automatically receives its first update.
-- =========================================================

create or replace function public.create_initial_issue_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.issue_updates (
    issue_id,
    created_by,
    message,
    old_status,
    new_status,
    created_at
  )
  values (
    new.id,
    new.reported_by,
    'Issue reported',
    null,
    new.status,
    new.created_at
  );

  return new;
end;
$$;

revoke all
on function public.create_initial_issue_update()
from public;

create trigger create_initial_issue_update_trigger
after insert on public.issues
for each row
execute function public.create_initial_issue_update();


-- =========================================================
-- IMMUTABLE ISSUE IDENTITY
-- Area, reporter and creation time cannot be rewritten later.
-- =========================================================

create or replace function public.protect_issue_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.area_id is distinct from old.area_id then
    raise exception
      'An issue cannot be moved to another area';
  end if;

  if new.reported_by is distinct from old.reported_by then
    raise exception
      'The issue reporter cannot be changed';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception
      'The issue creation time cannot be changed';
  end if;

  return new;
end;
$$;

revoke all
on function public.protect_issue_identity()
from public;

create trigger protect_issue_identity_trigger
before update on public.issues
for each row
execute function public.protect_issue_identity();


-- =========================================================
-- DATA API PRIVILEGES
-- RLS policies below decide which rows are actually accessible.
-- =========================================================

grant usage on schema public
to authenticated;

grant select
on table
  public.areas,
  public.profiles,
  public.issues,
  public.issue_updates,
  public.announcements,
  public.upkeep_tasks,
  public.upkeep_history
to authenticated;

grant insert
on table
  public.issues,
  public.issue_updates,
  public.announcements,
  public.upkeep_tasks,
  public.upkeep_history
to authenticated;

grant update
on table
  public.issues,
  public.upkeep_tasks
to authenticated;


-- =========================================================
-- AREAS
-- Residents/admins: own villa + clubhouse.
-- Owner/upkeep manager: all active areas.
-- =========================================================

create policy "areas_select_accessible"
on public.areas
for select
to authenticated
using (
  public.can_access_area(id)
);


-- =========================================================
-- PROFILES
-- Everyone may read their own profile, including inactive users,
-- so the application can display an access-disabled message.
-- =========================================================

create policy "profiles_select_visible"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())

  or (
    (select public.current_user_is_active())
    and (select public.current_user_role()) = 'owner_admin'
  )

  or (
    (select public.current_user_is_active())
    and (select public.current_user_role()) = 'villa_admin'
    and role = 'resident'
    and home_villa_id =
      (select public.current_user_home_villa_id())
  )
);


-- =========================================================
-- ISSUES
-- =========================================================

create policy "issues_select_accessible"
on public.issues
for select
to authenticated
using (
  public.can_access_area(area_id)
);

create policy "issues_insert_own"
on public.issues
for insert
to authenticated
with check (
  (select public.current_user_is_active())
  and reported_by = (select auth.uid())
  and public.can_access_area(area_id)
);

create policy "issues_update_operational"
on public.issues
for update
to authenticated
using (
  (select public.current_user_is_active())
  and (
    select public.current_user_role()
  ) in (
    'owner_admin',
    'upkeep_manager'
  )
  and public.can_access_area(area_id)
)
with check (
  (select public.current_user_is_active())
  and (
    select public.current_user_role()
  ) in (
    'owner_admin',
    'upkeep_manager'
  )
  and public.can_access_area(area_id)
);


-- =========================================================
-- ISSUE UPDATES
-- Residents and villa admins may read accessible timelines.
-- Only owner/upkeep manager may add operational updates.
-- =========================================================

create policy "issue_updates_select_accessible"
on public.issue_updates
for select
to authenticated
using (
  exists (
    select 1
    from public.issues as issue
    where issue.id = issue_updates.issue_id
      and public.can_access_area(issue.area_id)
  )
);

create policy "issue_updates_insert_operational"
on public.issue_updates
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select public.current_user_is_active())
  and (
    select public.current_user_role()
  ) in (
    'owner_admin',
    'upkeep_manager'
  )
  and exists (
    select 1
    from public.issues as issue
    where issue.id = issue_updates.issue_id
      and public.can_access_area(issue.area_id)
  )
);


-- =========================================================
-- ANNOUNCEMENTS
-- Family-facing content is hidden from the upkeep manager.
-- Only a villa admin may publish to their villa or clubhouse.
-- =========================================================

create policy "announcements_select_family"
on public.announcements
for select
to authenticated
using (
  (select public.current_user_is_active())
  and (
    select public.current_user_role()
  ) in (
    'owner_admin',
    'villa_admin',
    'resident'
  )
  and public.can_access_area(area_id)
);

create policy "announcements_insert_villa_admin"
on public.announcements
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select public.current_user_is_active())
  and (
    select public.current_user_role()
  ) = 'villa_admin'
  and public.can_access_area(area_id)
);


-- =========================================================
-- UPKEEP TASKS
-- Everyone can view accessible schedules.
-- Owner and upkeep manager manage schedules.
-- =========================================================

create policy "upkeep_tasks_select_accessible"
on public.upkeep_tasks
for select
to authenticated
using (
  public.can_access_area(area_id)
);

create policy "upkeep_tasks_insert_operational"
on public.upkeep_tasks
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select public.current_user_is_active())
  and (
    select public.current_user_role()
  ) in (
    'owner_admin',
    'upkeep_manager'
  )
  and public.can_access_area(area_id)
);

create policy "upkeep_tasks_update_operational"
on public.upkeep_tasks
for update
to authenticated
using (
  (select public.current_user_is_active())
  and (
    select public.current_user_role()
  ) in (
    'owner_admin',
    'upkeep_manager'
  )
  and public.can_access_area(area_id)
)
with check (
  (select public.current_user_is_active())
  and (
    select public.current_user_role()
  ) in (
    'owner_admin',
    'upkeep_manager'
  )
  and public.can_access_area(area_id)
);


-- =========================================================
-- UPKEEP HISTORY
-- =========================================================

create policy "upkeep_history_select_accessible"
on public.upkeep_history
for select
to authenticated
using (
  exists (
    select 1
    from public.upkeep_tasks as task
    where task.id = upkeep_history.task_id
      and public.can_access_area(task.area_id)
  )
);

create policy "upkeep_history_insert_operational"
on public.upkeep_history
for insert
to authenticated
with check (
  completed_by = (select auth.uid())
  and (select public.current_user_is_active())
  and (
    select public.current_user_role()
  ) in (
    'owner_admin',
    'upkeep_manager'
  )
  and exists (
    select 1
    from public.upkeep_tasks as task
    where task.id = upkeep_history.task_id
      and public.can_access_area(task.area_id)
  )
);

commit;