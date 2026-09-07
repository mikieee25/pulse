"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function addDivision(data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('divisions')
    .insert({
      code: data.code.toUpperCase(),
      full_name: data.full_name,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/divisions')
  return { success: true }
}
