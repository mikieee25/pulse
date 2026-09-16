import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const authSource = await readFile(new URL("../src/lib/auth.ts", import.meta.url), "utf8")
const cacheSource = await readFile(new URL("../src/lib/cached-data.ts", import.meta.url), "utf8")
const tagsSource = await readFile(new URL("../src/lib/cache-tags.ts", import.meta.url), "utf8")
const topbarSource = await readFile(new URL("../src/components/layout/topbar.tsx", import.meta.url), "utf8")

test("profile lookup is request-memoized", () => {
  assert.match(authSource, /cache\(/)
})

test("stable reference data uses tagged server caching", () => {
  assert.match(cacheSource, /unstable_cache/)
  assert.match(tagsSource, /pulse:categories/)
  assert.match(tagsSource, /pulse:divisions/)
  assert.match(cacheSource, /getCachedCategoryCosts/)
  assert.match(cacheSource, /getCachedPersonnel/)
  assert.match(tagsSource, /pulse:costs/)
  assert.match(tagsSource, /pulse:personnel/)
  assert.match(cacheSource, /revalidate: 60/)
})

test("topbar reads the cached notification snapshot", () => {
  assert.match(topbarSource, /getCachedNotifications/)
  assert.doesNotMatch(topbarSource, /from\("equipment"\)/)
  assert.match(cacheSource, /role === "Viewer" && !divisionScope/)
})

test("activity and presence stay live instead of using stale cache", async () => {
  const activitySource = await readFile(new URL("../src/lib/admin-activity.ts", import.meta.url), "utf8")
  const presenceSource = await readFile(new URL("../src/app/actions/presence.ts", import.meta.url), "utf8")
  assert.doesNotMatch(activitySource, /unstable_cache/)
  assert.doesNotMatch(presenceSource, /unstable_cache/)
  assert.match(activitySource, /activity_log/)
  assert.match(presenceSource, /user_presence/)
})

test("mutable reference data invalidates its cache tags", async () => {
  const adminActions = await readFile(new URL("../src/app/actions/admin.ts", import.meta.url), "utf8")
  const personnelActions = await readFile(new URL("../src/app/actions/personnel.ts", import.meta.url), "utf8")
  assert.match(adminActions, /revalidateTag\(PULSE_CACHE_TAGS\.costs/)
  assert.match(personnelActions, /revalidateTag\(PULSE_CACHE_TAGS\.personnel/)
})
