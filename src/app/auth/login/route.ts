import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const credentials = z.object({ email: z.email(), password: z.string().min(1) })

export async function POST(request: Request) {
  const formData = await request.formData()
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") })
  if (!parsed.success) return NextResponse.redirect(new URL("/login?error=Enter a valid email and password", request.url))
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
  return NextResponse.redirect(new URL("/", request.url))
}
