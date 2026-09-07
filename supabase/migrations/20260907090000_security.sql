create policy "Users read own profile" on app_users for select to authenticated using (id = auth.uid());

drop policy if exists "Viewer read history" on assignment_history;
create policy "Viewer read history" on assignment_history for select to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Viewer'
  and exists (
    select 1 from equipment
    where equipment.id = assignment_history.equipment_id
      and ((select division_scope from app_users where id = auth.uid()) is null or equipment.division_id = (select division_scope from app_users where id = auth.uid()))
  )
);

create or replace function reassign_equipment(p_equipment_id uuid, p_personnel_id uuid, p_note text default null)
returns void language plpgsql security invoker as $$
begin
  update assignment_history
  set unassigned_at = now()
  where equipment_id = p_equipment_id and unassigned_at is null;

  update equipment set assigned_to = p_personnel_id where id = p_equipment_id;
  if p_personnel_id is not null then
    insert into assignment_history (equipment_id, personnel_id, note)
    values (p_equipment_id, p_personnel_id, p_note);
  end if;
end;
$$;
