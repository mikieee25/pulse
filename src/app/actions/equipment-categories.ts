"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { canonicalEquipmentCategory } from "@/lib/pulse";
import { PULSE_CACHE_TAGS } from "@/lib/cache-tags";
import { recordActivity } from "@/lib/admin-activity";
import { buildAuditMetadata } from "@/lib/activity-audit";

const categoryInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(50, "Category name is too long."),
});

export type EquipmentCategoryInput = z.infer<typeof categoryInput>;

export async function addEquipmentCategory(input: EquipmentCategoryInput) {
  const access = await requireProfile("Admin");
  if (access.error) return access;

  const parsed = categoryInput.safeParse(input);
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message || "Enter a valid category name.",
    };

  const supabase = await createClient();
  const name = canonicalEquipmentCategory(parsed.data.name);
  const { data: saved, error } = await supabase
    .from("equipment_categories")
    .insert({ name, lifespan_years: 3 })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505")
      return { error: "That equipment category already exists." };
    return { error: error.message };
  }

  await recordActivity({
    action: "created",
    entityType: "equipment_category",
    entityId: saved.id,
    entityLabel: name,
    metadata: buildAuditMetadata(null, { id: saved.id, name, lifespan_years: 3 }, { source: "equipment_category.create" }),
  });

  revalidateTag(PULSE_CACHE_TAGS.categories, "max");
  revalidateTag(PULSE_CACHE_TAGS.notifications, "max");
  revalidateTag(PULSE_CACHE_TAGS.inventory, "max");
  revalidateTag(PULSE_CACHE_TAGS.planning, "max");
  revalidatePath("/equipment");
  revalidatePath("/budget");
  revalidatePath("/summary");
  revalidatePath("/reports");
  revalidatePath("/");
  return { success: true };
}
