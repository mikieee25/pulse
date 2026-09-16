-- Activity and presence are read-only to authenticated clients. Server actions
-- use the service-role client for inserts/upserts after authorization checks.
revoke all on table public.activity_log, public.user_presence from authenticated, anon;
grant select on table public.activity_log, public.user_presence to authenticated;
