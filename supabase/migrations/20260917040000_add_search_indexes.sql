-- Accelerate the substring searches used by the Equipment and Personnel tables.
create extension if not exists pg_trgm;

create index if not exists equipment_serial_number_trgm_idx
  on public.equipment using gin (serial_number gin_trgm_ops)
  where serial_number is not null;
create index if not exists equipment_model_trgm_idx
  on public.equipment using gin (model gin_trgm_ops)
  where model is not null;
create index if not exists equipment_brand_trgm_idx
  on public.equipment using gin (brand gin_trgm_ops)
  where brand is not null;
create index if not exists personnel_full_name_trgm_idx
  on public.personnel using gin (full_name gin_trgm_ops);
create index if not exists personnel_initials_trgm_idx
  on public.personnel using gin (initials gin_trgm_ops)
  where initials is not null;
create index if not exists personnel_position_trgm_idx
  on public.personnel using gin ("position" gin_trgm_ops)
  where "position" is not null;

create or replace function public.pulse_search_equipment(
  p_query text default null,
  p_category text default null,
  p_division text default null,
  p_brand text default null,
  p_status text default null,
  p_assignment text default null,
  p_rts text default null,
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
  is_rts boolean,
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
      e.year_acquired, e.status, e.condition_state, e.is_rts, d.code as division_code,
      custodian.full_name as custodian_name, assignee.full_name as assignee_name,
      public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, current_date) as display_status
    from public.equipment e
    join public.equipment_categories c on c.id = e.category_id
    join public.divisions d on d.id = e.division_id
    left join public.personnel custodian on custodian.id = e.assigned_to
    left join public.personnel assignee on assignee.id = e.assignee_id
    where (coalesce(trim(p_query), '') = ''
      or e.serial_number ilike '%' || trim(p_query) || '%'
      or e.model ilike '%' || trim(p_query) || '%'
      or e.brand ilike '%' || trim(p_query) || '%'
      or d.code ilike '%' || trim(p_query) || '%'
      or c.name ilike '%' || trim(p_query) || '%'
      or custodian.full_name ilike '%' || trim(p_query) || '%'
      or assignee.full_name ilike '%' || trim(p_query) || '%')
      and (coalesce(trim(p_category), '') = '' or c.name = trim(p_category))
      and (coalesce(trim(p_division), '') = '' or d.code = trim(p_division))
      and (coalesce(trim(p_brand), '') = '' or e.brand = trim(p_brand))
      and (coalesce(trim(p_status), '') = '' or public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, current_date) = trim(p_status))
      and (coalesce(trim(p_assignment), '') <> 'unassigned' or (e.assigned_to is null and e.assignee_id is null))
      and (coalesce(trim(p_rts), '') <> 'rts' or e.is_rts)
  )
  select rows.*, count(*) over() as total_count
  from rows
  order by rows.id
  limit least(greatest(coalesce(p_page_size, 25), 1), 50)
  offset (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 25), 1), 50)
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
    where (coalesce(trim(p_query), '') = ''
      or p.full_name ilike '%' || trim(p_query) || '%'
      or p.initials ilike '%' || trim(p_query) || '%'
      or p."position" ilike '%' || trim(p_query) || '%'
      or d.code ilike '%' || trim(p_query) || '%')
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

revoke all on function public.pulse_search_equipment(text, text, text, text, text, text, text, integer, integer) from public;
grant execute on function public.pulse_search_equipment(text, text, text, text, text, text, text, integer, integer) to authenticated;
revoke all on function public.pulse_search_personnel(text, text, text, text, integer, integer) from public;
grant execute on function public.pulse_search_personnel(text, text, text, text, integer, integer) to authenticated;
