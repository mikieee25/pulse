"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { PULSE_CACHE_TAGS } from "@/lib/cache-tags";
import { recordActivity } from "@/lib/admin-activity";
import { buildAuditMetadata } from "@/lib/activity-audit";

const divisionInput = z.object({
  code: z.string().trim().min(2).max(16),
  full_name: z.string().trim().min(1),
});
const divisionId = z.uuid();
export type DivisionInput = z.infer<typeof divisionInput>;

export async function addDivision(input: DivisionInput) {
  const access = await requireProfile("Admin");
  if (access.error) return access;
  const parsed = divisionInput.safeParse(input);
  if (!parsed.success) return { error: "Please complete the division fields." };
  const supabase = await createClient();
  const { data: saved, error } = await supabase
    .from("divisions")
    .insert({
      code: parsed.data.code.toUpperCase(),
      full_name: parsed.data.full_name,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  const after = { id: saved.id, code: parsed.data.code.toUpperCase(), full_name: parsed.data.full_name };
  await recordActivity({
    action: "created",
    entityType: "division",
    entityId: saved.id,
    entityLabel: parsed.data.code.toUpperCase(),
    divisionName: parsed.data.full_name,
    metadata: buildAuditMetadata(null, after, { source: "division.create" }),
  });
  revalidateTag(PULSE_CACHE_TAGS.divisions, "max");
  revalidateTag(PULSE_CACHE_TAGS.inventory, "max");
  revalidateTag(PULSE_CACHE_TAGS.planning, "max");
  revalidatePath("/divisions");
  return { success: true };
}

export async function updateDivision(id: string, input: DivisionInput) {
  const access = await requireProfile("Admin");
  if (access.error) return access;
  if (!divisionId.safeParse(id).success)
    return { error: "Division not found." };
  const parsed = divisionInput.safeParse(input);
  if (!parsed.success) return { error: "Please complete the division fields." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("divisions").select("id,code,full_name").eq("id", id).maybeSingle();
  if (!before) return { error: "Division not found." };
  const { data, error } = await supabase
    .from("divisions")
    .update({
      code: parsed.data.code.toUpperCase(),
      full_name: parsed.data.full_name,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Division not found." };
  await recordActivity({
    action: "updated",
    entityType: "division",
    entityId: id,
    entityLabel: parsed.data.code.toUpperCase(),
    divisionName: parsed.data.full_name,
    metadata: buildAuditMetadata(before, { id, code: parsed.data.code.toUpperCase(), full_name: parsed.data.full_name }, { source: "division.update" }),
  });
  revalidateTag(PULSE_CACHE_TAGS.divisions, "max");
  revalidateTag(PULSE_CACHE_TAGS.inventory, "max");
  revalidateTag(PULSE_CACHE_TAGS.planning, "max");
  revalidatePath("/divisions");
  return { success: true };
}
