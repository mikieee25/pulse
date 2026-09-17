"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import {
  effectivePlantillaStatus,
  PLANTILLA_STATUSES,
  suggestedInitials,
} from "@/lib/pulse";
import { createClient } from "@/utils/supabase/server";
import { PULSE_CACHE_TAGS } from "@/lib/cache-tags";
import { recordActivity } from "@/lib/admin-activity";

const personnelInput = z.object({
  full_name: z.string().trim().min(1),
  initials: z.string().trim().min(1).max(12),
  position: z.string().trim().min(1),
  plantilla_status: z.enum(PLANTILLA_STATUSES),
  division_id: z.string().uuid(),
});
const personnelId = z.uuid();
export type PersonnelInput = z.infer<typeof personnelInput>;

export async function addPersonnel(input: PersonnelInput) {
  const access = await requireProfile("Admin");
  if (access.error) return access;
  const parsed = personnelInput.safeParse({
    ...input,
    initials: input.initials || suggestedInitials(input.full_name),
  });
  if (!parsed.success)
    return { error: "Please complete the personnel fields." };
  const data = {
    ...parsed.data,
    plantilla_status: effectivePlantillaStatus(
      parsed.data.position,
      parsed.data.plantilla_status
    ),
  };
  const supabase = await createClient();
  const { data: saved, error } = await supabase
    .from("personnel")
    .insert(data)
    .select("id")
    .single();
  if (error) return { error: error.message };
  await recordActivity({
    action: "created",
    entityType: "personnel",
    entityId: saved.id,
    entityLabel: data.full_name,
    divisionId: data.division_id,
  });
  revalidateTag(PULSE_CACHE_TAGS.notifications, "max");
  revalidateTag(PULSE_CACHE_TAGS.personnel, "max");
  revalidateTag(PULSE_CACHE_TAGS.inventory, "max");
  revalidatePath("/personnel");
  return { success: true };
}

export async function updatePersonnel(id: string, input: PersonnelInput) {
  const access = await requireProfile("Admin");
  if (access.error) return access;
  if (!personnelId.safeParse(id).success)
    return { error: "Personnel not found." };
  const parsed = personnelInput.safeParse(input);
  if (!parsed.success)
    return { error: "Please complete the personnel fields." };
  const data = {
    ...parsed.data,
    plantilla_status: effectivePlantillaStatus(
      parsed.data.position,
      parsed.data.plantilla_status
    ),
  };
  const supabase = await createClient();
  const [
    { data: existing },
    { count: custodianCount },
    { count: assigneeCount },
  ] = await Promise.all([
    supabase
      .from("personnel")
      .select("division_id,position,plantilla_status")
      .eq("id", id)
      .single(),
    supabase
      .from("equipment")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", id),
    supabase
      .from("equipment")
      .select("id", { count: "exact", head: true })
      .eq("assignee_id", id),
  ]);
  const assignmentChanged =
    existing &&
    (existing.division_id !== data.division_id ||
      existing.position !== data.position ||
      existing.plantilla_status !== data.plantilla_status);
  if ((custodianCount || assigneeCount) && assignmentChanged)
    return {
      error:
        "Unassign this person before changing their division, position, or plantilla status.",
    };
  const { error } = await supabase.from("personnel").update(data).eq("id", id);
  if (error) return { error: error.message };
  await recordActivity({
    action: "updated",
    entityType: "personnel",
    entityId: id,
    entityLabel: data.full_name,
    divisionId: data.division_id,
  });
  revalidateTag(PULSE_CACHE_TAGS.notifications, "max");
  revalidateTag(PULSE_CACHE_TAGS.personnel, "max");
  revalidateTag(PULSE_CACHE_TAGS.inventory, "max");
  revalidatePath("/personnel");
  return { success: true };
}

export async function deletePersonnel(id: string) {
  const access = await requireProfile("Admin");
  if (access.error) return access;
  if (!personnelId.safeParse(id).success)
    return { error: "Personnel not found." };
  const supabase = await createClient();
  const [
    { count: custodianCount, error: custodianError },
    { count: assigneeCount, error: assigneeError },
    { count: historyCount, error: historyError },
  ] = await Promise.all([
    supabase
      .from("equipment")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", id),
    supabase
      .from("equipment")
      .select("id", { count: "exact", head: true })
      .eq("assignee_id", id),
    supabase
      .from("assignment_history")
      .select("id", { count: "exact", head: true })
      .eq("personnel_id", id),
  ]);
  if (custodianError || assigneeError || historyError)
    return {
      error:
        (custodianError || assigneeError || historyError)?.message ||
        "Could not verify personnel assignments.",
    };
  if (custodianCount || assigneeCount)
    return {
      error:
        "Unassign this person's equipment before deleting the personnel record.",
    };
  if (historyCount)
    return {
      error:
        "This personnel record has assignment history and cannot be deleted.",
    };
  const { error } = await supabase.from("personnel").delete().eq("id", id);
  if (error) return { error: error.message };
  await recordActivity({
    action: "deleted",
    entityType: "personnel",
    entityId: id,
    entityLabel: id,
  });
  revalidateTag(PULSE_CACHE_TAGS.notifications, "max");
  revalidateTag(PULSE_CACHE_TAGS.personnel, "max");
  revalidateTag(PULSE_CACHE_TAGS.inventory, "max");
  revalidatePath("/personnel");
  return { success: true };
}
