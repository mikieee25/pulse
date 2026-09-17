const base = (process.argv[2] || process.env.PULSE_URL || "http://localhost:3000").replace(/\/$/, "");
const routes = ["/login", "/", "/equipment", "/reports", "/budget"];
const results = [];
for (const route of routes) {
  const started = performance.now();
  const response = await fetch(`${base}${route}`, { redirect: "manual" });
  const body = await response.arrayBuffer();
  results.push({ route, status: response.status, bytes: body.byteLength, ttfbMs: Math.round(performance.now() - started) });
}
console.log(JSON.stringify({ base, routes: results, note: "Use Lighthouse/Chrome DevTools for LCP, INP, and CLS." }));
