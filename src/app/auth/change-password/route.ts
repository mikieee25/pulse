import { NextResponse } from "next/server"
import { validatePasswordChange } from "@/lib/temporary-password"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

function changePasswordError(request: Request, message: string) {
  return NextResponse.redirect(new URL(`/change-password?error=${encodeURIComponent(message)}`, request.url), 303)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const password = String(formData.get("password") || "")
  const confirmation = String(formData.get("confirmation") || "")
  const validationError = validatePasswordChange(password, confirmation)
  if (validationError) return changePasswordError(request, validationError)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303)
  if (user.app_metadata?.must_change_password !== true) return NextResponse.redirect(new URL("/", request.url), 303)

  const admin = createAdminClient()
  if (!admin) return changePasswordError(request, "Password change configuration is incomplete.")
  const { error: passwordError } = await supabase.auth.updateUser({ password })
  if (passwordError) return changePasswordError(request, passwordError.message)
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, must_change_password: false },
  })
  if (metadataError) return changePasswordError(request, "Password changed, but your account could not be unlocked. Try again.")

  await supabase.auth.signOut()
  return NextResponse.redirect(new URL("/login?message=Password changed. Sign in with your new password.", request.url), 303)
}
