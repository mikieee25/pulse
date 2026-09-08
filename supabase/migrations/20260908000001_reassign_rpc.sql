create or replace function reassign_equipment(p_equipment_id uuid, p_personnel_id uuid, p_note text default null, p_type text default 'Custodian')
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  -- unassign previous
  update assignment_history
  set unassigned_at = now()
  where equipment_id = p_equipment_id and unassigned_at is null and assignment_type = p_type;

  -- update equipment
  if p_type = 'Custodian' then
    update equipment set assigned_to = p_personnel_id where id = p_equipment_id;
  else
    update equipment set assignee_id = p_personnel_id where id = p_equipment_id;
  end if;

  -- insert new history
  if p_personnel_id is not null then
    insert into assignment_history (equipment_id, personnel_id, note, assignment_type)
    values (p_equipment_id, p_personnel_id, p_note, p_type);
  end if;
end;
$$;
