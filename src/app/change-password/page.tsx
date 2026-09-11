import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BrandLockup } from "@/components/layout/brand-lockup"
import { createClient } from "@/utils/supabase/server"

export default async function ChangePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  if (user.app_metadata?.must_change_password !== true) redirect("/")
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-deep p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <BrandLockup priority />
          <h1 className="font-serif text-3xl text-paper">Change your password</h1>
          <p className="mt-2 text-sm text-slate">Replace the temporary password before continuing to PULSE.</p>
        </div>
        <div className="rounded-xl border border-line bg-canvas p-8 shadow-2xl">
          <form className="space-y-6" action="/auth/change-password" method="POST">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate">New password</label>
              <input id="password" name="password" type="password" minLength={12} required autoComplete="new-password" className="w-full rounded-md border border-line bg-canvas-deep px-3 py-2 text-paper transition-all focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse" />
              <p className="mt-1 text-xs text-slate">Use at least 12 characters.</p>
            </div>
            <div>
              <label htmlFor="confirmation" className="mb-1 block text-sm font-medium text-slate">Confirm new password</label>
              <input id="confirmation" name="confirmation" type="password" minLength={12} required autoComplete="new-password" className="w-full rounded-md border border-line bg-canvas-deep px-3 py-2 text-paper transition-all focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse" />
            </div>
            {error && <p className="text-sm text-alert" role="alert">{error}</p>}
            <Button type="submit" className="h-10 w-full">Change password</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
