alter function public.check_equipment_assignment() set search_path = public, pg_temp;
alter function public.reassign_equipment(uuid, uuid, text) set search_path = public, pg_temp;
