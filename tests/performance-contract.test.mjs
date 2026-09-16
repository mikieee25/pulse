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
})

test("topbar reads the cached notification snapshot", () => {
  assert.match(topbarSource, /getCachedNotifications/)
  assert.doesNotMatch(topbarSource, /from\("equipment"\)/)
  assert.match(cacheSource, /role === "Viewer" && !divisionScope/)
})
