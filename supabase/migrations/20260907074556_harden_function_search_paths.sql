alter function public.check_equipment_assignment() set search_path = public, pg_temp;
do $$
begin
  if to_regprocedure('public.reassign_equipment(uuid,uuid,text)') is not null then
    alter function public.reassign_equipment(uuid, uuid, text) set search_path = public, pg_temp;
  end if;
end;
$$;
