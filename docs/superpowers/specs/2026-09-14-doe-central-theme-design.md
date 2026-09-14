# PULSE DOE Central Theme Design

Date: 2026-09-14
Status: Approved for implementation

## Goal

Make PULSE a professional, light-first application with the DOE brand palette as its primary visual language. Keep the existing dark theme available, make theme behavior consistent across all routes, and provide one source of truth for colors.

## Design decisions

- Light is the default theme for first-time visitors.
- Dark remains an optional user preference and is persisted locally.
- DOE blue is the primary interactive color.
- DOE yellow is an accent for attention, highlights, warning states, and selected data points.
- Supporting semantic colors such as purple may be used for notifications or other non-brand statuses when they improve meaning.
- Body text uses accessible dark neutrals or deep blue rather than pure yellow or pure blue everywhere.
- Every color used for text, controls, borders, charts, and surfaces is represented by a semantic token where practical.
- No gradient may combine blue and yellow. Gradients, if needed, are single-color tonal gradients only.

## Palette tokens

The central theme file will preserve the supplied DOE values as named primitives:

| Primitive | Hex |
| --- | --- |
| DOE blue | `#0000FE` |
| DOE yellow | `#FFFF00` |
| Blue light | `#397DFF` |
| Blue balanced | `#1F5BF6` |
| Blue bold | `#0341CB` |
| Blue deep | `#0016A8` |
| Yellow light | `#FFFE77` |
| Yellow balanced | `#FFEE4D` |
| Yellow bold | `#FADB09` |
| Yellow deep | `#E8B911` |

Semantic tokens will map these primitives to application roles. The light theme will use white and very light blue-neutral surfaces, deep blue-neutral text, balanced/bold blue for actions, and a dark-text-on-yellow treatment for yellow controls. The dark theme will use deep blue-neutral surfaces with light/balanced blue actions and restrained yellow accents.

Pure DOE yellow will not be used as small body text on white. Pure DOE blue will not be used as the only distinction for statuses; status indicators will retain text or icon labels for accessibility.

## File responsibilities

### `src/styles/theme.css`

Owns:

- DOE primitive color variables.
- Light semantic variables on `:root`.
- Dark semantic overrides on `.dark`.
- Supporting semantic tokens for notification, success, warning, danger, muted, and focus states.
- Optional single-color chart gradients, if charts need them.

The file will not contain component-specific layout rules.

### `src/app/globals.css`

Keeps Tailwind imports, `@theme inline` mappings, typography, reset, and global accessibility rules. Existing semantic utility names such as `canvas`, `paper`, `pulse`, `alert`, `slate`, and `line` will continue to work by mapping them to the central variables.

### `src/app/layout.tsx` and theme handling

- Remove the hardcoded dark default.
- Set the initial document theme to light.
- Restore a saved `pulse-theme` preference before hydration where possible to avoid a visible theme flash.
- Keep the theme toggle synchronized with the document class and local storage.

### Shared components and pages

Audit shared layout, dashboard, equipment, personnel, divisions, budget, summary, reports, changelog, and admin components for direct color literals or Tailwind colors. Replace brand/status literals with semantic tokens while preserving meaningful supporting colors such as notification purple.

### Charts

Use CSS variables for Recharts fills, tooltip surfaces, axes, legends, and grid lines. Chart palettes will be deterministic and accessible. Blue and yellow may appear as separate data series or deliberate contrast, but no mixed blue-yellow gradient will be introduced.

### `src/components/layout/brand-lockup.tsx`

Keep the DOE logo first, PULSE second, and the available `public/Bagong Pilipinas.png` asset rightmost in the full lockup. Preserve each asset's aspect ratio and clear space, and avoid effects or background treatments that conflict with the supplied branding rules. Compact navigation lockups may use only DOE and PULSE when the full three-logo lockup does not fit, but the ordering must remain consistent.

## Accessibility and behavior

- Buttons and links must have readable contrast in both themes.
- Yellow surfaces use dark text and never white text by default.
- Focus rings use a visible blue or deep-blue token.
- Status meaning is not conveyed by color alone.
- Theme switching must work on every route, including login and changelog.
- Mobile layouts must retain clear logo spacing and usable controls.

## Verification

Add or update source-level tests for:

- Exact DOE primitive values existing in the central theme file.
- Light being the default theme.
- Saved dark preference being restored.
- Existing semantic utility tokens remaining available.
- No blue-yellow gradient declarations.
- DOE logo preceding the PULSE logo.

Run TypeScript checks, lint, existing tests, production build, and a visual pass at desktop and mobile widths for light and dark themes. Verify the dashboard metrics and charts remain data-driven after the color migration.

## Out of scope

- Redesigning data models or Supabase behavior.
- Replacing the supplied logo artwork.
- Adding the Bagong Pilipinas logo before its official asset is available.
- Changing notification meanings or equipment lifecycle logic.
