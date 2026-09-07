export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-md p-8 space-y-8 bg-canvas-deep border border-line rounded-xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 font-mono text-xl tracking-wide text-paper">
              <div className="w-3 h-3 rounded-full bg-pulse shadow-[0_0_12px_rgba(62,217,160,0.6)] animate-pulse" />
              PULSE
            </div>
          </div>
          <h1 className="text-2xl font-serif text-paper">Welcome back</h1>
          <p className="text-sm text-slate italic font-serif">
            Personnel & Unit Lifecycle System for Equipment
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate">Email</label>
            <input 
              type="email" 
              className="w-full h-10 px-3 rounded-md bg-canvas border border-line text-paper focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse transition-all"
              placeholder="user@eumb.gov.ph"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate">Password</label>
            <input 
              type="password" 
              className="w-full h-10 px-3 rounded-md bg-canvas border border-line text-paper focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse transition-all"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full h-10 mt-2 rounded-md bg-pulse text-canvas-deep font-semibold hover:bg-pulse/90 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
