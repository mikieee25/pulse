import { Button } from "@/components/ui/button"
import { BrandLockup } from "@/components/layout/brand-lockup"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { error, message } = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-deep p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <BrandLockup priority />
          <p className="text-slate text-sm">Sign in to manage ICT equipment.</p>
        </div>

        <div className="bg-canvas border border-line rounded-xl p-8 shadow-2xl">
          <form className="space-y-6" action="/auth/login" method="POST">
            <div className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate mb-1">Email</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className="w-full bg-canvas-deep border border-line rounded-md px-3 py-2 text-paper focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse transition-all"
                  placeholder="admin@pulse.gov"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate mb-1">Password</label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  className="w-full bg-canvas-deep border border-line rounded-md px-3 py-2 text-paper focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-sm text-alert" role="alert">{error}</p>}
            {message && <p className="text-sm text-pulse" role="status">{message}</p>}
            <Button type="submit" className="w-full h-10 mt-2">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
