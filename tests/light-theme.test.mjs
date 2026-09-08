import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8")
const layout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8")
const topbar = await readFile(new URL("../src/components/layout/topbar.tsx", import.meta.url), "utf8")
const toggle = await readFile(new URL("../src/components/theme/theme-toggle.tsx", import.meta.url), "utf8")

test("dashboard exposes a persistent light theme", () => {
  assert.match(css, /html\.light/)
  assert.match(css, /--canvas:/)
  assert.match(css, /--color-canvas:\s*var\(--canvas\)/)
  assert.match(css, /--color-paper:\s*var\(--paper\)/)
  assert.match(css, /--color-pulse:\s*var\(--pulse\)/)
  assert.doesNotMatch(css, /--color-canvas:\s*#10151c/)
  assert.match(layout, /suppressHydrationWarning/)
  assert.match(topbar, /ThemeToggle/)
  assert.match(toggle, /localStorage/)
  assert.match(toggle, /aria-label=/)
})
