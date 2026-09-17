import "server-only";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { sanitizeAuditValue } from "@/lib/activity-audit";
import type {
  ActivityFilters,
  ActivityInput,
  ActivityPageResult,
  ActivityRecord,
  ActivityRecordResult,
  UserStatus,
  UserStatusResult,
} from "@/lib/activity-format";

function toRecord(row: {
  id: string;
  actor_user_id: string;
  actor_name: string;
  actor_email: string;
  action: ActivityRecord["action"];
  entity_type: ActivityRecord["entityType"];
  entity_id: string | null;
  entity_label: string;
  division_id: string | null;
  division_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}): ActivityRecord {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    divisionId: row.division_id,
    divisionName: row.division_name,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export async function recordActivity(input: ActivityInput): Promise<void> {
  const access = await requireProfile();
  if (access.error) return;
  const admin = createAdminClient();
  if (!admin) {
    console.error(
      "PULSE activity recording unavailable: service configuration is incomplete"
    );
    return;
  }
  let divisionName = input.divisionName || null;
  if (!divisionName && input.divisionId) {
    const { data: division } = await admin
      .from("divisions")
      .select("full_name")
      .eq("id", input.divisionId)
      .maybeSingle();
    divisionName = division?.full_name || null;
  }
  const { error } = await admin.from("activity_log").insert({
    actor_user_id: access.profile.id,
    actor_name: access.profile.full_name,
    actor_email: access.profile.email,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    entity_label: input.entityLabel,
    division_id: input.divisionId || null,
    division_name: divisionName,
    metadata: (sanitizeAuditValue(input.metadata || {}) || {}) as Record<string, unknown>,
  });
  if (error) {
    console.error("PULSE activity recording failed", {
      code: error.code,
      message: error.message,
    });
    return;
  }
  revalidatePath("/admin");
  revalidatePath("/admin/activity");
}

export async function getAdminActivityPage(
  filters: ActivityFilters = {}
): Promise<ActivityPageResult> {
  const access = await requireProfile("Admin");
  if (access.error) return { data: [], error: access.error, hasMore: false };
  const supabase = await createClient();
  const pageSize = Math.min(Math.max(filters.pageSize || 25, 1), 100);
  const page = Math.max(filters.page || 1, 1);
  const fetchLimit = pageSize + 1;
  const start = (page - 1) * pageSize;
  let query = supabase
    .from("activity_log")
    .select(
      "id,actor_user_id,actor_name,actor_email,action,entity_type,entity_id,entity_label,division_id,division_name,metadata,created_at"
    )
    .order("created_at", { ascending: false });
  if (filters.actorUserId)
    query = query.eq("actor_user_id", filters.actorUserId);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.divisionId) query = query.eq("division_id", filters.divisionId);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);
  if (filters.eventId) query = query.eq("id", filters.eventId);
  if (filters.entityId) query = query.eq("entity_id", filters.entityId);
  const { data, error } = await query.range(
    start,
    start + fetchLimit - 1
  );
  if (error)
    return {
      data: [],
      error: "Could not load admin activity.",
      hasMore: false,
    };
  const rows = (data || []) as unknown as Parameters<typeof toRecord>[0][];
  const visibleRows = rows.slice(0, pageSize);
  return {
    data: visibleRows.map(toRecord),
    error: null,
    hasMore: rows.length > pageSize,
  };
}

export async function getRecentAdminActivity(
  limit = 5
): Promise<ActivityRecordResult> {
  const result = await getAdminActivityPage({
    page: 1,
    pageSize: Math.min(Math.max(limit, 1), 25),
  });
  return { data: result.data, error: result.error };
}

export async function getAdminUserStatus(): Promise<UserStatusResult> {
  const access = await requireProfile("Admin");
  if (access.error) return { data: [], error: access.error };
  const supabase = await createClient();
  const [
    { data: users, error: usersError },
    { data: presence, error: presenceError },
  ] = await Promise.all([
    supabase
      .from("app_users")
      .select(
        "id,email,full_name,role,division_scope,divisions(code,full_name)"
      )
      .order("full_name"),
    supabase.from("user_presence").select("user_id,last_seen_at"),
  ]);
  if (usersError || presenceError)
    return { data: [], error: "Could not load user activity status." };
  const admin = createAdminClient();
  const presenceByUser = new Map(
    (presence || []).map((row) => [row.user_id, row.last_seen_at])
  );
  const baseUsers = (users || []) as unknown as Array<{
    id: string;
    email: string;
    full_name: string;
    role: UserStatus["role"];
    division_scope: string | null;
    divisions:
      | { code: string; full_name: string }
      | { code: string; full_name: string }[]
      | null;
  }>;
  if (!admin) {
    return {
      data: baseUsers.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        divisionName: Array.isArray(user.divisions)
          ? user.divisions[0]?.full_name || null
          : user.divisions?.full_name || null,
        lastSeenAt: presenceByUser.get(user.id) || null,
        lastSignInAt: null,
      })),
      error: "Last sign-in data is unavailable.",
    };
  }
  const authUsers = [];
  let authError: { message?: string } | null = null;
  for (let page = 1; ; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) {
      authError = result.error;
      break;
    }
    const batch = result.data?.users || [];
    authUsers.push(...batch);
    if (batch.length < 1000) break;
  }
  const signInByUser = new Map(
    authUsers.map((user) => [
      user.id,
      user.last_sign_in_at || null,
    ])
  );
  return {
    data: baseUsers.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      divisionName: Array.isArray(user.divisions)
        ? user.divisions[0]?.full_name || null
        : user.divisions?.full_name || null,
      lastSeenAt: presenceByUser.get(user.id) || null,
      lastSignInAt: signInByUser.get(user.id) || null,
    })),
    error: authError ? "Last sign-in data is unavailable." : null,
  };
}
