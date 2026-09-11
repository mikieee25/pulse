drop function if exists public.reassign_equipment(uuid, uuid, text);
alter function public.reassign_equipment(uuid, uuid, text, text) set search_path = public, pg_temp;

create or replace function public.reassign_equipment(p_equipment_id uuid, p_personnel_id uuid, p_note text default null, p_type text default 'Custodian')
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_equipment equipment%rowtype;
  v_person personnel%rowtype;
begin
  if p_type not in ('Custodian', 'Assignee') then
    raise exception 'Invalid assignment type.';
  end if;
  select * into v_equipment from equipment where id = p_equipment_id for update;
  if not found then raise exception 'Equipment not found.'; end if;
  if v_equipment.status = 'Retired' then raise exception 'Retired equipment cannot be assigned.'; end if;
  if p_personnel_id is not null then
    select * into v_person from personnel where id = p_personnel_id;
    if not found then raise exception 'Personnel not found.'; end if;
    if v_person.division_id <> v_equipment.division_id then raise exception 'Personnel must be within the same division.'; end if;
    if p_type = 'Custodian' and (v_person.plantilla_status <> 'Regular' or v_person.position in ('PSS', 'PES')) then
      raise exception 'Custodian must be Regular personnel and NOT a PSS/PES user.';
    end if;
    if p_type = 'Assignee' and v_person.position not in ('PSS', 'PES') then
      raise exception 'Assignee must be a PSS or PES user.';
    end if;
  end if;
  update assignment_history set unassigned_at = now()
    where equipment_id = p_equipment_id and unassigned_at is null and assignment_type = p_type;
  if p_type = 'Custodian' then
    update equipment set assigned_to = p_personnel_id where id = p_equipment_id;
  else
    update equipment set assignee_id = p_personnel_id where id = p_equipment_id;
  end if;
  if p_personnel_id is not null then
    insert into assignment_history (equipment_id, personnel_id, note, assignment_type)
    values (p_equipment_id, p_personnel_id, p_note, p_type);
  end if;
end;
$$;

create or replace function public.save_equipment(
  p_equipment_id uuid,
  p_category_id uuid,
  p_brand text,
  p_model text,
  p_year_acquired int,
  p_serial_number text,
  p_procurement_method text,
  p_division_id uuid,
  p_assigned_to uuid,
  p_assignee_id uuid,
  p_condition_state text,
  p_remarks text
) returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_id uuid;
  v_old_assigned uuid;
  v_old_assignee uuid;
begin
  if p_equipment_id is null then
    insert into equipment (category_id, brand, model, year_acquired, serial_number, procurement_method, division_id, assigned_to, assignee_id, condition_state, status, remarks)
    values (p_category_id, p_brand, p_model, p_year_acquired, p_serial_number, p_procurement_method, p_division_id, p_assigned_to, p_assignee_id, p_condition_state, 'Active', p_remarks)
    returning id into v_id;
  else
    select assigned_to, assignee_id into v_old_assigned, v_old_assignee from equipment where id = p_equipment_id for update;
    if not found then raise exception 'Equipment not found.'; end if;
    if (select status from equipment where id = p_equipment_id) = 'Retired' and (p_assigned_to is not null or p_assignee_id is not null) then
      raise exception 'Retired equipment cannot be assigned.';
    end if;
    update equipment set category_id = p_category_id, brand = p_brand, model = p_model, year_acquired = p_year_acquired,
      serial_number = p_serial_number, procurement_method = p_procurement_method, division_id = p_division_id,
      assigned_to = p_assigned_to, assignee_id = p_assignee_id, condition_state = p_condition_state, remarks = p_remarks
      where id = p_equipment_id;
    v_id := p_equipment_id;
    if v_old_assigned is distinct from p_assigned_to then
      update assignment_history set unassigned_at = now() where equipment_id = v_id and assignment_type = 'Custodian' and unassigned_at is null;
    end if;
    if v_old_assignee is distinct from p_assignee_id then
      update assignment_history set unassigned_at = now() where equipment_id = v_id and assignment_type = 'Assignee' and unassigned_at is null;
    end if;
  end if;
  if p_assigned_to is not null and (p_equipment_id is null or v_old_assigned is distinct from p_assigned_to) then
    insert into assignment_history (equipment_id, personnel_id, note, assignment_type) values (v_id, p_assigned_to, 'Initial assignment', 'Custodian');
  end if;
  if p_assignee_id is not null and (p_equipment_id is null or v_old_assignee is distinct from p_assignee_id) then
    insert into assignment_history (equipment_id, personnel_id, note, assignment_type) values (v_id, p_assignee_id, 'Initial assignment', 'Assignee');
  end if;
  return v_id;
end;
$$;

create or replace function public.retire_equipment(p_equipment_id uuid)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from equipment where id = p_equipment_id) then raise exception 'Equipment not found.'; end if;
  update assignment_history set unassigned_at = now() where equipment_id = p_equipment_id and unassigned_at is null;
  update equipment set status = 'Retired', assigned_to = null, assignee_id = null where id = p_equipment_id;
end;
$$;
