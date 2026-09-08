# PULSE Light Theme and Live Notifications

## Goal

Add a proper light theme and make the authenticated topbar notification bell useful without introducing a new notifications table.

## Scope

- Add a Dark/Light theme toggle to the authenticated dashboard shell.
- Persist the selected theme in browser `localStorage`; dark is the default.
- Add a notification dropdown to the topbar.
- Derive notification items from existing equipment and assignment-history data:
  - equipment for replacement;
  - equipment expiring soon;
  - unassigned equipment;
  - recent assignment activity.
- Store read state locally in the browser and provide a “Mark all as read” action.
- Keep all reads behind the existing authenticated Supabase session and RLS policies.

## Design

The root layout will support a client-controlled `dark` or `light` class on the document element. Existing semantic CSS variables remain the styling interface; a light-theme variable set will override the current dark values. A small theme control in the topbar will expose the current mode with an accessible label and persist the choice under a PULSE-specific local-storage key.

The server-rendered topbar will query the minimum existing equipment and assignment-history fields needed to build grouped alert items. It will pass serializable notification data to a client `NotificationBell` component. The component owns menu visibility and local read state, shows an unread badge, supports keyboard-accessible buttons, and renders a clear empty state. No notification records are written to Supabase.

## Data flow

```text
Supabase equipment + assignment_history
          |
          v
     Topbar server query
          |
          v
  serializable alert groups
          |
          v
 NotificationBell client UI
          |
          v
 localStorage read state
```

## Error handling

If notification queries fail, the topbar remains usable and the bell shows a compact unavailable state rather than failing the entire dashboard shell. If local storage is unavailable, the theme and read state work for the current session without persistence.

## Testing

- Add source-level contract tests for theme controls, light variables, public asset access, and notification behavior.
- Run the complete Node test suite, TypeScript, ESLint, and production build.
- Verify the live LAN page serves the branded assets and dashboard shell after the final build/server restart.

## Out of scope

- Email, push, or realtime notifications.
- A persisted notifications table.
- Per-notification dismissal or server-synchronized read state.
