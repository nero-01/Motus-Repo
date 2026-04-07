# I020 – Notifications (parked)

**Status:** Parked — tracked here and on GitHub; not in active sprint.  
**Area:** Product / mobile (Expo)  
**Priority:** TBD (set when picked up)

## Summary

Design and implement a coherent **notifications** experience for MotusTots: what to notify (routines, meals, co-parent messages, reminders, worksheet milestones), **when**, and **how** (push, in-app inbox, email later).

## Scope (draft)

- [ ] Define notification types and user-facing copy  
- [ ] **Permissions** — request and handle iOS/Android notification permission flows  
- [ ] **Push** — `expo-notifications` (or chosen stack), device tokens, backend or Supabase edge functions if needed  
- [ ] **Preferences** — per-user or per-family toggles (which categories are on)  
- [ ] **In-app** — optional notification center / bell with read state  
- [ ] **Reminders alignment** — how this relates to the existing Reminders / Vision flows  

## Out of scope (for first slice)

- Full marketing email campaigns  
- SMS (unless explicitly added later)

## References

- Expo: [Notifications](https://docs.expo.dev/push-notifications/overview/)  
- Repo: `expo-notifications` already listed in `package.json` — verify current usage and gaps when starting work.

## GitHub

- **Issue:** https://github.com/nero-01/Motus-Repo/issues/21
