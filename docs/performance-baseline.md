# PULSE production performance baseline

Run the network baseline against a deployed URL:

```powershell
node scripts/measure-production.mjs https://your-pulse-domain.vercel.app
```

For authenticated Core Web Vitals, open the same URL in Chrome, sign in, and run Lighthouse in an Incognito window on desktop and mobile emulation. Record LCP, INP, CLS, transferred bytes, and the slowest Supabase request for Dashboard, Equipment, Reports, and Budget. Authenticated HTML is intentionally not cached publicly, so measurements must be taken with a real session.
