"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { z } from "zod"

const credentials = z.object({ email: z.email(), password: z.string().min(1) })

export async function signIn(formData: FormData) {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") })
  if (!parsed.success) redirect("/login?error=Enter a valid email and password")
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect("/")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function updatePassword(formData: FormData) {
  const password = z.string().min(6, "Password must be at least 6 characters").safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.errors[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: error.message };
  return { success: true };
}
