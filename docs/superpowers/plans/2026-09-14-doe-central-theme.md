# PULSE DOE Central Theme Implementation Plan

> **Execution note:** Follow the repository's required test-first workflow. Implement one small behavior at a time, run its focused test, then run the full verification suite before declaring completion.

## Objective

Create one central DOE-branded theme source, make the professional light theme the default, retain an optional persisted dark theme, migrate all UI and chart colors to semantic tokens, and add the official Bagong Pilipinas logo to the shared brand lockup.

## Constraints and existing state

- Preserve the user's existing logo changes in `public/pulseicon.svg`, `public/pulselogo.svg`, and the deletion of the root `pulselogo.svg`.
- Preserve the untracked workbook `01 EUMB ICT List.xlsx`; it must not be included in any future commit.
- Preserve existing equipment, Supabase, notification, and lifecycle behavior.
- Keep `pulse-theme` as the preference key unless a migration is required.
- Do not invent or recolor official logo artwork.

## Step 1: Establish the central theme source

Files:

- Add `src/styles/theme.css`.
- Update `src/app/globals.css`.

Work:

1. Define the exact DOE primitive variables supplied by the user:
   `#0000FE`, `#FFFF00`, `#397DFF`, `#FFFE77`, `#1F5BF6`, `#FFEE4D`, `#0341CB`, `#FADB09`, `#0016A8`, and `#E8B911`.
2. Define semantic roles for surfaces, text, borders, actions, focus, success, warning, danger, muted states, and notifications.
3. Map light-theme roles to mostly white and blue-neutral surfaces, with balanced/bold DOE blue for actions and yellow tonal values for attention states.
4. Map dark-theme roles to deep blue-neutral surfaces and readable light text while retaining blue actions and controlled yellow accents.
5. Keep supporting notification colors, including purple where appropriate, as named semantic tokens rather than scattered literals.
6. Import the theme file from `globals.css` and keep the Tailwind `@theme inline` aliases pointed at semantic variables so current utility classes continue to work.
7. Keep component layout and spacing rules out of the central theme file.

Verification: add/update a focused test that checks every required DOE value and the continued presence of the semantic aliases used by existing pages.

## Step 2: Make light the default without a theme flash

Files:

- Update `src/app/layout.tsx`.
- Update `src/components/theme/theme-toggle.tsx`.
- Update `tests/light-theme.test.mjs`.

Work:

1. Remove the hardcoded `dark` document class and make light the initial theme.
2. Restore a saved `pulse-theme` value before hydration when available.
3. Ensure the document has exactly the active theme class and that switching updates both classes and storage.
4. Keep the toggle accessible, with correct label, title, and icon for the next theme.
5. Ensure login, change-password, dashboard, and all nested routes inherit the same behavior.

Verification: test first-visit light behavior, saved dark restoration, switching, and absence of contradictory `dark light` classes. Confirm no hydration warning is introduced.

## Step 3: Migrate direct color usage

Files to audit:

- `src/components/layout/*`
- `src/components/ui/*`
- `src/components/dashboard/*`
- `src/components/equipment/*`
- `src/components/notifications/*`
- `src/components/changelog/*`
- `src/app/(dashboard)/**`
- `src/app/login/page.tsx`
- `src/app/change-password/page.tsx`
- Any additional files found by the hardcoded-color search.

Work:

1. Replace direct hex values and one-off brand colors with semantic tokens.
2. Replace Tailwind amber/sky literals with semantic warning/info tokens where they represent system meaning.
3. Retain distinct notification tones, such as purple, through semantic notification tokens.
4. Ensure lifecycle statuses remain visually distinct and retain readable text labels/icons.
5. Ensure pure yellow is not used as small text on white and yellow surfaces use dark text.
6. Keep focus, hover, disabled, error, and selected states readable in both themes.

Verification: run a source scan for remaining hardcoded UI colors, inspect each intentional exception, and add a test preventing blue-yellow gradient declarations.

## Step 4: Update data visualizations

Files:

- `src/components/dashboard/dashboard-charts.tsx`.
- Any other chart/report files discovered during the audit.

Work:

1. Replace the current hardcoded `COLORS` array with CSS-variable-backed semantic chart colors.
2. Use theme-aware tooltip, legend, grid, axis, and cursor colors.
3. Keep chart labels/data meaning independent from color alone.
4. Use only single-color tonal gradients if a gradient is visually needed.
5. Check charts in both themes with empty and populated data.

Verification: dashboard data counts and category/status breakdowns remain unchanged; only presentation colors change.

## Step 5: Add the three-logo brand lockup

Files:

- `src/components/layout/brand-lockup.tsx`.
- `src/components/layout/sidebar.tsx` if layout integration is needed.
- `src/components/layout/topbar.tsx` if layout integration is needed.
- `tests/brand-lockup.test.mjs`.
- Asset: `public/Bagong Pilipinas.png`.

Work:

1. Add Bagong Pilipinas after PULSE in the full lockup.
2. Keep DOE first and Bagong Pilipinas rightmost.
3. Use `next/image` with explicit dimensions, `alt` text, and preserved aspect ratio.
4. Add responsive sizing so the full lockup does not crowd the sidebar or header.
5. Preserve clear space around the logos and avoid rounded/cropped treatment that changes official artwork.
6. Use compact DOE + PULSE branding where the full lockup is not appropriate, while preserving ordering.

Verification: test the DOM/image order and inspect desktop, tablet, and mobile layouts in both themes.

## Step 6: Update the in-app changelog

Files:

- `src/components/changelog/changelog.tsx`.

Work:

Add a concise entry covering:

- DOE central theme tokens.
- Light theme becoming the default.
- Optional persisted dark mode.
- DOE-toned charts and semantic status colors.
- Three-logo DOE/PULSE/Bagong Pilipinas lockup.
- Accessibility and logo-clear-space improvements.

The changelog update must happen before the implementation commit, consistent with the project's release workflow.

## Step 7: Test and quality verification

Run, in order:

1. Focused theme and brand-lockup tests.
2. Existing tests, including equipment status, category coverage, budget UI, dashboard style, notifications, and temporary-password flow.
3. `npx tsc --noEmit` or the repository's configured type-check command.
4. Repository lint command from `package.json`.
5. Production build command from `package.json`.
6. Visual review of login, change-password, dashboard, equipment, personnel, divisions, budget, summary, reports, changelog, and admin pages at desktop/mobile widths.

Check specifically:

- Light is visible on a fresh browser profile.
- Dark preference survives refresh.
- No page is unstyled or rendered with browser-default colors.
- All dashboard metrics and charts still reflect the existing data.
- Buttons, links, alerts, tables, dialogs, badges, and focus rings meet readable contrast.
- DOE is first, PULSE follows, and Bagong Pilipinas is rightmost.
- No mixed blue-yellow gradient exists.
- The workbook remains untracked and excluded from the commit.

## Step 8: Review and commit boundary

Before committing:

1. Inspect `git diff` and `git status --short`.
2. Confirm only intended theme, logo-lockup, test, changelog, and plan/spec files are staged.
3. Explicitly exclude `01 EUMB ICT List.xlsx`.
4. Do not overwrite unrelated user-owned changes.
5. Use a conventional commit message describing the central theme and branding work.

No commit or push is part of this plan unless separately requested after implementation and verification.
