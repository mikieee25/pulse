"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function addEquipment(data: any) {
  const supabase = await createClient()

  // First get the category ID
  const { data: category } = await supabase
    .from('equipment_categories')
    .select('id')
    .eq('name', data.categoryName)
    .single()

  if (!category) {
    return { error: 'Category not found' }
  }

  // Get OD division ID as fallback since form doesn't select division yet
  const { data: division } = await supabase
    .from('divisions')
    .select('id')
    .eq('code', 'OD')
    .single()

  const { error } = await supabase
    .from('equipment')
    .insert({
      category_id: category.id,
      brand: data.brand,
      model: data.model,
      serial_number: data.serial_number,
      year_acquired: data.year_acquired,
      division_id: division?.id,
      status: 'Active'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/equipment')
  return { success: true }
}
