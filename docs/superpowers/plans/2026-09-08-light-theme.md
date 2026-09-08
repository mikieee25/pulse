# PULSE Light Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent, accessible light theme to the authenticated PULSE dashboard while preserving the existing dark theme.

**Architecture:** Keep Tailwind utilities pointed at semantic CSS variables and add a light override on `html.light`. A small client `ThemeToggle` owns the browser preference and toggles `dark`/`light` classes on the document element; the server layout remains dark-safe for the initial render.

**Tech Stack:** Next.js 16.3.4 App Router, React 19, Tailwind CSS v4, TypeScript, `localStorage`, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-08-light-theme-live-notifications-design.md`

## Global Constraints

- Persist the selected theme in browser `localStorage`; dark is the default.
- Existing semantic CSS variables remain the styling interface.
- Keep the authenticated dashboard shell and existing data behavior unchanged.
- Do not add a theme dependency.

---

### Task 1: Add the failing theme contract

**Files:**
- Create: `tests/light-theme.test.mjs`
- Inspect: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/layout/topbar.tsx`

**Interfaces:**
- Produces the test contract required by Tasks 2 and 3: light semantic tokens, a persisted theme key, and an accessible theme button.

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8")
const layout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8")
const topbar = await readFile(new URL("../src/components/layout/topbar.tsx", import.meta.url), "utf8")

test("dashboard exposes a persistent light theme", () => {
  assert.match(css, /html\.light/)
  assert.match(css, /--canvas:/)
  assert.match(layout, /suppressHydrationWarning/)
  assert.match(topbar, /ThemeToggle/)
  assert.match(topbar, /Switch to light theme|Switch to dark theme/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/light-theme.test.mjs`

Expected: FAIL because the light selector and `ThemeToggle` do not exist yet.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/light-theme.test.mjs
git commit -m "test: define light theme contract"
```

### Task 2: Implement semantic light tokens and theme control

**Files:**
- Create: `src/components/theme/theme-toggle.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces `ThemeToggle`, a client component with no props that toggles the document between `dark` and `light` and persists under `pulse-theme`.

- [ ] **Step 1: Add light token overrides**

Add an `html.light` block that overrides the existing semantic variables with readable light values, including `--canvas`, `--canvas-deep`, `--paper`, `--paper-dim`, `--slate`, and `--line`; keep `--pulse` and `--alert` high-contrast.

- [ ] **Step 2: Implement the minimal client toggle**

Use this behavior in `ThemeToggle`:

```tsx
"use client"

const STORAGE_KEY = "pulse-theme"

type Theme = "dark" | "light"

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.classList.toggle("light", theme === "light")
}
```

Initialize as dark, read only `pulse-theme` in `useEffect`, guard `localStorage` access with `try/catch`, and render an icon button with an accessible label that changes between `Switch to light theme` and `Switch to dark theme`.

- [ ] **Step 3: Run the focused test**

Run: `node --test tests/light-theme.test.mjs`

Expected: PASS.

- [ ] **Step 4: Commit the theme unit**

```bash
git add src/app/globals.css src/components/theme/theme-toggle.tsx tests/light-theme.test.mjs
git commit -m "feat: add persistent light theme"
```

### Task 3: Integrate the toggle into the dashboard shell

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/topbar.tsx`

**Interfaces:**
- Consumes: `ThemeToggle` from `@/components/theme/theme-toggle`.
- Produces: The authenticated shell displays the theme control without changing sign-out, profile, or navigation behavior.

- [ ] **Step 1: Update the root class contract**

Keep the existing dark class for the server-safe initial render and add `suppressHydrationWarning` to the `<html>` element so the client preference can change the class without a hydration warning.

- [ ] **Step 2: Place the control in the topbar**

Render `<ThemeToggle />` beside the notification control using the existing Budget-style focus ring and `aria-label`.

- [ ] **Step 3: Run all checks**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass.

Run: `npx tsc --noEmit --pretty false`

Expected: exit code 0.

Run: `npx eslint --max-warnings=0 "src/app/layout.tsx" "src/components/layout/topbar.tsx" "src/components/theme/theme-toggle.tsx"`

Expected: zero errors and warnings.

- [ ] **Step 4: Commit the shell integration**

```bash
git add src/app/layout.tsx src/components/layout/topbar.tsx
git commit -m "feat: add theme toggle to dashboard shell"
```

### Task 4: Verify the light theme at runtime

**Files:**
- Test: `tests/light-theme.test.mjs`

- [ ] **Step 1: Build the application**

Run: `npm run build`

Expected: Next.js production build completes successfully.

- [ ] **Step 2: Restart the LAN dev server after the build**

Restart only the PULSE process on port 3000, then open `http://192.168.68.58:3000/login`.

- [ ] **Step 3: Verify the browser behavior**

Sign in, activate the theme control, confirm the dashboard switches to light colors, refresh, and confirm light remains selected. Toggle back to dark and confirm the original styling returns.

