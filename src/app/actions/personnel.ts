"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function addPersonnel(data: any) {
  const supabase = await createClient()

  // Find division id from code
  const { data: division } = await supabase
    .from('divisions')
    .select('id')
    .ilike('code', data.division_code)
    .single()

  if (!division) {
    return { error: 'Division code not found. Please ensure the division exists.' }
  }

  // Compute initials from full_name
  const initials = data.full_name
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()

  const { error } = await supabase
    .from('personnel')
    .insert({
      full_name: data.full_name,
      initials: initials,
      position: data.position,
      plantilla_status: data.plantilla_status,
      division_id: division.id,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/personnel')
  return { success: true }
}
