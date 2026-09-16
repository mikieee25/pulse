create table activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  actor_name text not null,
  actor_email text not null,
  action text not null check (action in ('created','updated','deleted','assigned','reassigned','retired','state_changed')),
  entity_type text not null check (entity_type in ('equipment','personnel','division','equipment_category','category_unit_cost','user')),
  entity_id uuid,
  entity_label text not null,
  division_id uuid,
  division_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_created_at_idx on activity_log (created_at desc);
create index activity_log_actor_idx on activity_log (actor_user_id, created_at desc);
create index activity_log_action_entity_idx on activity_log (action, entity_type, created_at desc);
create index activity_log_division_idx on activity_log (division_id, created_at desc);

create table user_presence (
  user_id uuid primary key references app_users(id) on delete cascade,
  last_seen_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table activity_log enable row level security;
alter table user_presence enable row level security;

grant select on activity_log to authenticated;
grant select on user_presence to authenticated;

create policy "Admin read activity" on activity_log
  for select to authenticated
  using ((select private.current_user_role()) = 'Admin');

create policy "Admin read presence" on user_presence
  for select to authenticated
  using ((select private.current_user_role()) = 'Admin');
