create or replace function public.pulse_equipment_category_snapshot(
  p_category text,
  p_division_scope uuid default null,
  p_as_of date default current_date
) returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with classified as (
    select public.pulse_effective_equipment_status(e.status, e.condition_state, c.lifespan_years, e.year_acquired, p_as_of) as display_status
    from public.equipment e
    join public.equipment_categories c on c.id = e.category_id
    where c.name = p_category and (p_division_scope is null or e.division_id = p_division_scope)
  )
  select jsonb_build_object(
    'total', count(*),
    'active', count(*) filter (where display_status in ('Active','Expiring soon','For Replacement')),
    'replacement', count(*) filter (where display_status in ('For Replacement','Broken')),
    'expiring', count(*) filter (where display_status = 'Expiring soon'),
    'broken', count(*) filter (where display_status = 'Broken')
  ) from classified
$$;

grant execute on function public.pulse_equipment_category_snapshot(text, uuid, date) to authenticated;
grant execute on function public.pulse_equipment_category_snapshot(text, uuid, date) to service_role;
