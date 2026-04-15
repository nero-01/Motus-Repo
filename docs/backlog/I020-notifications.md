# I020 - Notifications

## Goal
Define and implement a practical notifications baseline for MotusTots, with user controls and reminder management.

## Implemented in this pass
- Notification toggles in `app/features/settings/index.tsx` are now persisted in AsyncStorage (`motustots:settings:notifications`).
- Enabling a notification category now requests OS notification permissions and warns the user if permissions are denied.
- Added a quick route from Settings to `Manage Scheduled Reminders`.
- `app/features/settings/reminders.tsx` now supports:
  - canceling a single scheduled notification,
  - refreshing the scheduled list.
- `app/(tabs)/reminders/index.tsx` was hardened:
  - listener cleanup now uses `.remove()`,
  - enabling reminders clears existing scheduled reminders first (prevents duplicates),
  - reset now clears scheduled reminders as well as local state.

## Follow-up backlog
- Persist reminders schedule metadata by family/user (not only OS-scheduled entries).
- Add category-based scheduling rules tied to settings toggles.
- Add in-app notification inbox and read/unread status.
- Add backend push token registration and remote push flow.
