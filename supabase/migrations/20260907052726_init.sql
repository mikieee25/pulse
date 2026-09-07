create type plantilla_status as enum ('Regular','COS','Outsourced','Reserve','For Transfer','For RTS');
create type equipment_status as enum ('Active','For Replacement','Retired');
create type app_role as enum ('Admin','Viewer');

create table divisions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  full_name text not null
);

create table personnel (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  initials text not null,
  division_id uuid references divisions(id) not null,
  position text not null,
  plantilla_status plantilla_status not null default 'Regular'
);

create table equipment_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  lifespan_years int
);

create table category_unit_costs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references equipment_categories(id) not null,
  year int not null,
  unit_cost numeric not null,
  unique (category_id, year)
);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references equipment_categories(id) not null,
  model text,
  brand text,
  year_acquired int,
  serial_number text,
  procurement_method text,
  division_id uuid references divisions(id) not null,
  assigned_to uuid references personnel(id),
  status equipment_status not null default 'Active',
  remarks text,
  created_at timestamptz default now()
);

CREATE OR REPLACE FUNCTION check_equipment_assignment() RETURNS trigger AS $$
DECLARE
  p_status plantilla_status;
  p_division uuid;
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    SELECT plantilla_status, division_id INTO p_status, p_division FROM personnel WHERE id = NEW.assigned_to;
    IF p_status != 'Regular' THEN
      RAISE EXCEPTION 'Equipment can only be assigned to Regular personnel.';
    END IF;
    IF p_division != NEW.division_id THEN
      RAISE EXCEPTION 'Equipment can only be assigned to personnel within the same division.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_equipment_assignment
  BEFORE INSERT OR UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION check_equipment_assignment();

create table assignment_history (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references equipment(id) not null,
  personnel_id uuid references personnel(id) not null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  note text
);

create table app_users (
  id uuid primary key references auth.users(id),
  email text not null,
  full_name text not null,
  role app_role not null default 'Viewer',
  division_scope uuid references divisions(id)
);

alter table divisions enable row level security;
alter table personnel enable row level security;
alter table equipment_categories enable row level security;
alter table category_unit_costs enable row level security;
alter table equipment enable row level security;
alter table assignment_history enable row level security;
alter table app_users enable row level security;

create policy "Admin full access" on divisions for all to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Admin'
);
create policy "Admin full access" on personnel for all to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Admin'
);
create policy "Admin full access" on equipment_categories for all to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Admin'
);
create policy "Admin full access" on category_unit_costs for all to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Admin'
);
create policy "Admin full access" on equipment for all to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Admin'
);
create policy "Admin full access" on assignment_history for all to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Admin'
);
create policy "Admin full access" on app_users for all to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Admin'
);

create policy "Viewer read divisions" on divisions for select to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Viewer' 
);
create policy "Viewer read personnel" on personnel for select to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Viewer' 
  and (
    (select division_scope from app_users where id = auth.uid()) is null 
    or division_id = (select division_scope from app_users where id = auth.uid())
  )
);
create policy "Viewer read categories" on equipment_categories for select to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Viewer' 
);
create policy "Viewer read costs" on category_unit_costs for select to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Viewer' 
);
create policy "Viewer read equipment" on equipment for select to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Viewer' 
  and (
    (select division_scope from app_users where id = auth.uid()) is null 
    or division_id = (select division_scope from app_users where id = auth.uid())
  )
);
create policy "Viewer read history" on assignment_history for select to authenticated using (
  (select role from app_users where id = auth.uid()) = 'Viewer' 
);

insert into equipment_categories (name, lifespan_years) values
  ('Laptop', 3),
  ('Tablet', 3),
  ('Desktop', 3),
  ('Drone', null),
  ('Camera', null),
  ('Printer', null);

insert into category_unit_costs (category_id, year, unit_cost)
select id, extract(year from current_date)::int, 0 from equipment_categories;
