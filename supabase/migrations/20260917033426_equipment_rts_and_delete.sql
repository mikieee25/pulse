alter table public.equipment
  add column if not exists is_rts boolean not null default false;

create index if not exists equipment_is_rts_idx
  on public.equipment (is_rts)
  where is_rts = true;

update public.equipment
set is_rts = true
where coalesce(remarks, '') ilike '%for rts%';

create or replace function public.set_equipment_rts(
  p_equipment_id uuid,
  p_is_rts boolean
) returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  changed boolean;
begin
  if private.current_user_role() is distinct from 'Admin'::app_role then
    raise exception 'Admin access required';
  end if;

  update public.equipment
  set is_rts = p_is_rts
  where id = p_equipment_id
  returning true into changed;

  if changed is null then
    raise exception 'Equipment not found';
  end if;
  return changed;
end;
$$;

create or replace function public.delete_equipment(
  p_equipment_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  snapshot jsonb;
begin
  if private.current_user_role() is distinct from 'Admin'::app_role then
    raise exception 'Admin access required';
  end if;

  select jsonb_build_object(
    'id', e.id,
    'division_id', e.division_id,
    'label', coalesce(nullif(trim(concat_ws(' ', e.brand, e.model, e.serial_number)), ''), 'Equipment'),
    'is_rts', e.is_rts
  )
  into snapshot
  from public.equipment e
  where e.id = p_equipment_id
  for update;

  if snapshot is null then
    raise exception 'Equipment not found';
  end if;

  delete from public.assignment_history where equipment_id = p_equipment_id;
  delete from public.equipment where id = p_equipment_id;
  return snapshot;
end;
$$;

revoke all on function public.set_equipment_rts(uuid, boolean) from public;
revoke all on function public.delete_equipment(uuid) from public;
grant execute on function public.set_equipment_rts(uuid, boolean) to authenticated;
grant execute on function public.delete_equipment(uuid) to authenticated;

drop function if exists public.pulse_search_equipment(text, text, text, text, text, text, integer, integer);

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
    where (coalesce(trim(p_query), '') = '' or concat_ws(' ', e.serial_number, e.model, e.brand, d.code, c.name, custodian.full_name, assignee.full_name) ilike '%' || trim(p_query) || '%')
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

revoke all on function public.pulse_search_equipment(text, text, text, text, text, text, text, integer, integer) from public;
grant execute on function public.pulse_search_equipment(text, text, text, text, text, text, text, integer, integer) to authenticated;
