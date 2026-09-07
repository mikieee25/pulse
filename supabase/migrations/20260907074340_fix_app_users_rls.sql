create schema if not exists private;

revoke all on schema private from public;

create or replace function private.current_user_role()
returns app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.app_users where id = (select auth.uid());
$$;

create or replace function private.current_user_division_scope()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select division_scope from public.app_users where id = (select auth.uid());
$$;

revoke all on function private.current_user_role() from public;
revoke all on function private.current_user_division_scope() from public;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_user_division_scope() to authenticated;

drop policy if exists "Admin full access" on divisions;
drop policy if exists "Viewer read divisions" on divisions;
drop policy if exists "Admin full access" on personnel;
drop policy if exists "Viewer read personnel" on personnel;
drop policy if exists "Admin full access" on equipment_categories;
drop policy if exists "Viewer read categories" on equipment_categories;
drop policy if exists "Admin full access" on category_unit_costs;
drop policy if exists "Viewer read costs" on category_unit_costs;
drop policy if exists "Admin full access" on equipment;
drop policy if exists "Viewer read equipment" on equipment;
drop policy if exists "Admin full access" on assignment_history;
drop policy if exists "Viewer read history" on assignment_history;
drop policy if exists "Admin full access" on app_users;

create policy "Admin full access" on divisions for all to authenticated
using ((select private.current_user_role()) = 'Admin')
with check ((select private.current_user_role()) = 'Admin');

create policy "Viewer read divisions" on divisions for select to authenticated
using ((select private.current_user_role()) = 'Viewer');

create policy "Admin full access" on personnel for all to authenticated
using ((select private.current_user_role()) = 'Admin')
with check ((select private.current_user_role()) = 'Admin');

create policy "Viewer read personnel" on personnel for select to authenticated
using (
  (select private.current_user_role()) = 'Viewer'
  and ((select private.current_user_division_scope()) is null or division_id = (select private.current_user_division_scope()))
);

create policy "Admin full access" on equipment_categories for all to authenticated
using ((select private.current_user_role()) = 'Admin')
with check ((select private.current_user_role()) = 'Admin');

create policy "Viewer read categories" on equipment_categories for select to authenticated
using ((select private.current_user_role()) = 'Viewer');

create policy "Admin full access" on category_unit_costs for all to authenticated
using ((select private.current_user_role()) = 'Admin')
with check ((select private.current_user_role()) = 'Admin');

create policy "Viewer read costs" on category_unit_costs for select to authenticated
using ((select private.current_user_role()) = 'Viewer');

create policy "Admin full access" on equipment for all to authenticated
using ((select private.current_user_role()) = 'Admin')
with check ((select private.current_user_role()) = 'Admin');

create policy "Viewer read equipment" on equipment for select to authenticated
using (
  (select private.current_user_role()) = 'Viewer'
  and ((select private.current_user_division_scope()) is null or division_id = (select private.current_user_division_scope()))
);

create policy "Admin full access" on assignment_history for all to authenticated
using ((select private.current_user_role()) = 'Admin')
with check ((select private.current_user_role()) = 'Admin');

create policy "Viewer read history" on assignment_history for select to authenticated
using (
  (select private.current_user_role()) = 'Viewer'
  and exists (
    select 1 from equipment
    where equipment.id = assignment_history.equipment_id
      and ((select private.current_user_division_scope()) is null or equipment.division_id = (select private.current_user_division_scope()))
  )
);

create policy "Admin full access" on app_users for all to authenticated
using ((select private.current_user_role()) = 'Admin')
with check ((select private.current_user_role()) = 'Admin');
