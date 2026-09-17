-- Indexed, bounded read paths for the growing inventory.
create index if not exists equipment_category_id_idx on public.equipment (category_id);
create index if not exists equipment_division_id_idx on public.equipment (division_id);
create index if not exists equipment_assigned_to_idx on public.equipment (assigned_to) where assigned_to is not null;
create index if not exists equipment_assignee_id_idx on public.equipment (assignee_id) where assignee_id is not null;
create index if not exists equipment_created_at_idx on public.equipment (created_at desc);
create index if not exists personnel_division_id_idx on public.personnel (division_id);
create index if not exists assignment_history_equipment_time_idx on public.assignment_history (equipment_id, assigned_at desc);
create index if not exists assignment_history_personnel_id_idx on public.assignment_history (personnel_id);

create or replace function public.pulse_effective_equipment_status(
  p_status equipment_status,
  p_condition text,
  p_lifespan_years integer,
  p_year_acquired integer,
  p_as_of date
) returns text
language sql
immutable
parallel safe
set search_path = public, pg_temp
as $$
  select case
    when p_status = 'Retired' then 'Retired'
    when p_condition = 'Broken' then 'Broken'
    when p_condition = 'For Replacement' or p_status = 'For Replacement' then 'For Replacement'
    when p_lifespan_years is null or p_year_acquired is null then p_status::text
    when make_date(p_year_acquired + p_lifespan_years, 1, 1) <= p_as_of then 'For Replacement'
    when make_date(p_year_acquired + p_lifespan_years, 1, 1) <= (p_as_of + interval '1 year')::date then 'Expiring soon'
    else 'Active'
  end
$$;

create or replace function public.pulse_inventory_dashboard(
  p_division_scope uuid default null,
  p_as_of date default current_date
) returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  with classified as (
    select e.division_id, d.code as division_code, c.name as category_name,
      public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, p_as_of) as display_status
    from public.equipment e
    join public.divisions d on d.id = e.division_id
    join public.equipment_categories c on c.id = e.category_id
    where p_division_scope is null or e.division_id = p_division_scope
  ),
  status_counts as (
    select display_status as name, count(*)::integer as value from classified group by display_status order by display_status
  ),
  division_counts as (
    select division_code as name, count(*)::integer as count from classified group by division_code order by division_code
  ),
  replacement_matrix as (
    select division_code, category_name,
      count(*)::integer as total_units,
      count(*) filter (where display_status in ('For Replacement', 'Broken'))::integer as replacement_units,
      count(*) filter (where display_status = 'Expiring soon')::integer as expiring_units,
      count(*) filter (where display_status = 'Broken')::integer as broken_units
    from classified
    group by division_code, category_name
    order by division_code, category_name
  )
  select jsonb_build_object(
    'metrics', jsonb_build_object(
      'total', (select count(*) from classified),
      'active', (select count(*) from classified where display_status in ('Active', 'Expiring soon', 'For Replacement')),
      'replacement', (select count(*) from classified where display_status in ('For Replacement', 'Broken')),
      'expiring', (select count(*) from classified where display_status = 'Expiring soon'),
      'broken', (select count(*) from classified where display_status = 'Broken')
    ),
    'statusCounts', coalesce((select jsonb_agg(to_jsonb(status_counts)) from status_counts), '[]'::jsonb),
    'divisionCounts', coalesce((select jsonb_agg(to_jsonb(division_counts)) from division_counts), '[]'::jsonb),
    'replacementMatrix', coalesce((select jsonb_agg(to_jsonb(replacement_matrix)) from replacement_matrix), '[]'::jsonb)
  )
$$;

create or replace function public.pulse_inventory_plan(
  p_division_scope uuid,
  p_year integer,
  p_mode text
) returns table (
  division_code text,
  category_id uuid,
  category_name text,
  unit_count bigint,
  unit_cost numeric,
  subtotal numeric
)
language sql
stable
set search_path = public, pg_temp
as $$
  with classified as (
    select d.code as division_code, c.id as category_id, c.name as category_name,
      e.year_acquired,
      public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, make_date(p_year, 1, 1)) as display_status
    from public.equipment e
    join public.divisions d on d.id = e.division_id
    join public.equipment_categories c on c.id = e.category_id
    where (p_division_scope is null or e.division_id = p_division_scope)
      and (
        (p_mode = 'replacement' and public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, make_date(p_year, 1, 1)) in ('For Replacement', 'Broken'))
        or (p_mode = 'acquired' and e.year_acquired = p_year)
      )
  ), grouped as (
    select classified.division_code, classified.category_id, classified.category_name, count(*) as unit_count,
      coalesce((select costs.unit_cost from public.category_unit_costs costs where costs.category_id = classified.category_id and costs.year <= p_year order by costs.year desc limit 1), 0) as unit_cost
    from classified
    group by classified.division_code, classified.category_id, classified.category_name
  )
  select grouped.division_code, grouped.category_id, grouped.category_name, grouped.unit_count, grouped.unit_cost,
    grouped.unit_count * grouped.unit_cost as subtotal
  from grouped
  order by grouped.division_code, grouped.category_name
$$;

create or replace function public.pulse_search_equipment(
  p_query text default null,
  p_category text default null,
  p_division text default null,
  p_brand text default null,
  p_status text default null,
  p_assignment text default null,
  p_page integer default 1,
  p_page_size integer default 25
) returns table (
  id uuid,
  category_name text,
  lifespan_years integer,
  model text,
  brand text,
  serial_number text,
  year_acquired integer,
  status equipment_status,
  condition_state text,
  division_code text,
  custodian_name text,
  assignee_name text,
  display_status text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with rows as (
    select e.id, c.name as category_name, c.lifespan_years, e.model, e.brand, e.serial_number,
      e.year_acquired, e.status, e.condition_state, d.code as division_code,
      custodian.full_name as custodian_name, assignee.full_name as assignee_name,
      public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, current_date) as display_status
    from public.equipment e
    join public.equipment_categories c on c.id = e.category_id
    join public.divisions d on d.id = e.division_id
    left join public.personnel custodian on custodian.id = e.assigned_to
    left join public.personnel assignee on assignee.id = e.assignee_id
    where (coalesce(trim(p_query), '') = '' or concat_ws(' ', e.serial_number, e.model, e.brand, d.code, c.name, custodian.full_name, assignee.full_name) ilike '%' || trim(p_query) || '%')
      and (coalesce(trim(p_category), '') = '' or c.name = trim(p_category))
      and (coalesce(trim(p_division), '') = '' or d.code = trim(p_division))
      and (coalesce(trim(p_brand), '') = '' or e.brand = trim(p_brand))
      and (coalesce(trim(p_status), '') = '' or public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, current_date) = trim(p_status))
      and (coalesce(trim(p_assignment), '') <> 'unassigned' or (e.assigned_to is null and e.assignee_id is null))
  )
  select rows.*, count(*) over() as total_count
  from rows
  order by rows.id
  limit least(greatest(coalesce(p_page_size, 25), 1), 50)
  offset (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 25), 1), 50)
$$;

create or replace function public.pulse_notification_snapshot(
  p_division_scope uuid default null,
  p_as_of date default current_date
) returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  with classified as (
    select e.id, e.assigned_to, e.assignee_id,
      public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, p_as_of) as display_status
    from public.equipment e
    join public.equipment_categories c on c.id = e.category_id
    where p_division_scope is null or e.division_id = p_division_scope
  ), recent as (
    select ah.id, ah.assigned_at, ah.note, p.full_name
    from public.assignment_history ah
    join public.equipment e on e.id = ah.equipment_id
    left join public.personnel p on p.id = ah.personnel_id
    where p_division_scope is null or e.division_id = p_division_scope
    order by ah.assigned_at desc
    limit 5
  )
  select jsonb_build_object(
    'replacementCount', (select count(*) from classified where display_status in ('For Replacement', 'Broken')),
    'expiringCount', (select count(*) from classified where display_status = 'Expiring soon'),
    'unassignedCount', (select count(*) from classified where assigned_to is null and assignee_id is null),
    'recentAssignments', coalesce((select jsonb_agg(to_jsonb(recent)) from recent), '[]'::jsonb)
  )
$$;

create or replace function public.pulse_personnel_summary()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'total', count(*),
    'regular', count(*) filter (where plantilla_status = 'Regular'),
    'outsourced', count(*) filter (where plantilla_status in ('Outsourced', 'COS')),
    'withEquipment', count(*) filter (where exists (select 1 from public.equipment e where e.assigned_to = personnel.id or e.assignee_id = personnel.id))
  ) from public.personnel
$$;

create or replace function public.pulse_search_personnel(
  p_query text default null,
  p_division text default null,
  p_status text default null,
  p_assignment text default null,
  p_page integer default 1,
  p_page_size integer default 25
) returns table (
  id uuid,
  full_name text,
  initials text,
  "position" text,
  plantilla_status plantilla_status,
  division_id uuid,
  division_code text,
  equipment_count bigint,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with rows as (
    select p.id, p.full_name, p.initials, p."position", p.plantilla_status, p.division_id, d.code as division_code,
      (select count(*) from public.equipment e where e.assigned_to = p.id or e.assignee_id = p.id) as equipment_count
    from public.personnel p
    join public.divisions d on d.id = p.division_id
    where (coalesce(trim(p_query), '') = '' or concat_ws(' ', p.full_name, p.initials, p.position, d.code) ilike '%' || trim(p_query) || '%')
      and (coalesce(trim(p_division), '') = '' or d.code = trim(p_division))
      and (coalesce(trim(p_status), '') = '' or p.plantilla_status::text = trim(p_status))
      and (coalesce(trim(p_assignment), '') <> 'assigned' or exists (select 1 from public.equipment e where e.assigned_to = p.id or e.assignee_id = p.id))
      and (coalesce(trim(p_assignment), '') <> 'unassigned' or not exists (select 1 from public.equipment e where e.assigned_to = p.id or e.assignee_id = p.id))
  )
  select rows.*, count(*) over() as total_count
  from rows
  order by rows.full_name, rows.id
  limit least(greatest(coalesce(p_page_size, 25), 1), 50)
  offset (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 25), 1), 50)
$$;

create or replace function public.pulse_division_summary(p_as_of date default current_date)
returns table (
  id uuid,
  code text,
  full_name text,
  personnel_count bigint,
  equipment_count bigint,
  replacement_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select d.id, d.code, d.full_name,
    (select count(*) from public.personnel p where p.division_id = d.id) as personnel_count,
    (select count(*) from public.equipment e where e.division_id = d.id) as equipment_count,
    (select count(*) from public.equipment e join public.equipment_categories c on c.id = e.category_id
      where e.division_id = d.id and public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, p_as_of) in ('For Replacement', 'Broken')) as replacement_count
  from public.divisions d
  order by d.code
$$;

revoke all on function public.pulse_effective_equipment_status(equipment_status, text, integer, integer, date) from public;
grant execute on function public.pulse_effective_equipment_status(equipment_status, text, integer, integer, date) to authenticated, service_role;

revoke all on function public.pulse_inventory_dashboard(uuid, date) from public;
grant execute on function public.pulse_inventory_dashboard(uuid, date) to service_role;
revoke all on function public.pulse_inventory_plan(uuid, integer, text) from public;
grant execute on function public.pulse_inventory_plan(uuid, integer, text) to service_role;
revoke all on function public.pulse_notification_snapshot(uuid, date) from public;
grant execute on function public.pulse_notification_snapshot(uuid, date) to service_role;

grant execute on function public.pulse_search_equipment(text, text, text, text, text, text, integer, integer) to authenticated;
grant execute on function public.pulse_personnel_summary() to authenticated;
grant execute on function public.pulse_search_personnel(text, text, text, text, integer, integer) to authenticated;
grant execute on function public.pulse_division_summary(date) to authenticated;
