# MotusTots – Open Issues & Tracking

This file lists known issues and incomplete work across the app so you can track and fix them (e.g. by copying into GitHub Issues). **Last audit:** app flow and features review.

---

## How to use

- **ID**: Use as reference (e.g. in commits or GitHub Issue titles).
- **Priority**: `P0` = blocking / critical, `P1` = important, `P2` = nice-to-have.
- **Area**: Feature or module affected.
- **Fix**: Short action to resolve.

---

## Quick reference

| ID   | Area        | Title (short)                          | Priority |
|------|-------------|----------------------------------------|----------|
| I001 | Config      | Google Vision API key optional but undocumented in app | P2 |
| I002 | Database    | Apply fix_worksheet_progress.sql if not applied        | P1 |
| I003 | Dashboard   | Dashboard uses mock data instead of real API           | P1 |
| I004 | Dashboard   | getRecentActivities / getUpcomingTasks not implemented | P1 |
| I005 | Settings    | Edit Profile, Change Password, Privacy – no-op       | P1 |
| I006 | Settings    | Export Data, Help, Contact Support, About – no-op     | P2 |
| I007 | Settings    | Preference “Change” (select) and member toggle – no-op| P2 |
| I008 | Co-parenting| Calendar: create/delete event not implemented       | P1 |
| I009 | Co-parenting| Expenses: Generate report, Export, Add expense – TODO | P2 |
| I010 | Co-parenting| Messages: Start new conversation – TODO               | P2 |
| I011 | Routines    | Routine detail uses hardcoded childId                 | P1 |
| I012 | Routines    | Reset routine for next day – TODO                      | P2 |
| I013 | Meals       | Create meal plan not persisted (TODO in service)      | P1 |
| I014 | Meals       | Toggle meal completion not implemented                | P2 |
| I015 | Family      | Parent invite & View analytics – TODO                 | P2 |
| I016 | Auth        | Social auth (e.g. Google) placeholder implementation | P2 |
| I017 | Reminders   | Vision: no cancel while “Scanning image…”             | P2 |
| I018 | Store       | Store listing, privacy URL, content rating – manual   | P0 for launch |
| I019 | Store       | Production env vars must be set (EAS/CI)              | P0 for launch |

---

## 1. Config & environment

### I001 – Google Vision API key optional; in-app messaging only
- **Area:** Reminders (Google Vision)
- **Priority:** P2
- **Description:** Reminders “Read from image” needs `EXPO_PUBLIC_GOOGLE_VISION_API_KEY`. If missing, the app shows an alert. There is no in-app note that the key is optional and where to set it.
- **Fix:** Add a short “Setup” or “Why didn’t scan work?” link/alert in Reminders that points to SETUP_GUIDE.md (or a help screen) for Vision API key.

---

## 2. Database

### I002 – Worksheet progress schema fix may not be applied
- **Area:** Education / Supabase
- **Priority:** P1
- **Description:** `fix_worksheet_progress.sql` adds a unique constraint and index on `worksheet_progress`. If not applied, education progress saves can fail with ON CONFLICT errors.
- **Fix:** Run `fix_worksheet_progress.sql` (and `fix_rls_policies.sql` if needed) on the target Supabase project and confirm no ON CONFLICT errors when saving worksheet progress.

---

## 3. Dashboard & home

### I003 – Dashboard stats are mock data
- **Area:** Dashboard (Home tab)
- **Priority:** P1
- **Description:** `app/(tabs)/index.tsx` loads dashboard stats and recent activities from hardcoded mock data (e.g. `mockStats`, `mockActivities`) after a short delay, not from Supabase.
- **Fix:** Call dashboard service (e.g. `getDashboardStats`, `getRecentActivities`) and map API response to `DashboardStats` and `RecentActivity[]`; remove mock objects.

### I004 – Dashboard service methods not implemented
- **Area:** services/supabase/dashboard.ts
- **Priority:** P1
- **Description:** `getRecentActivities` and `getUpcomingTasks` contain `// TODO: Implement real query` and return empty arrays.
- **Fix:** Implement Supabase queries (e.g. routine completions, meal plans, messages) and return shaped data for dashboard and activities list.

---

## 4. Settings

### I005 – Edit Profile, Change Password, Privacy – no-op
- **Area:** app/features/settings/index.tsx
- **Priority:** P1
- **Description:** List items “Edit Profile”, “Change Password”, “Privacy Settings” have `// TODO: Navigate to edit profile` (and similar); pressing them does nothing.
- **Fix:** Add routes/screens for edit profile, change password, and privacy settings and wire `onPress` to navigation (or modals).

### I006 – Export Data, Help, Contact Support, About – no-op
- **Area:** app/features/settings/index.tsx
- **Priority:** P2
- **Description:** “Export Data”, “Help & FAQ”, “Contact Support”, “About MotusTots” have TODO onPress handlers; no behavior.
- **Fix:** Implement export (e.g. Supabase fetch + share/file), help/FAQ screen or link, contact (mailto or support URL), and about (version + link to privacy policy).

### I007 – Preference “Change” and member toggle – no-op
- **Area:** app/features/settings/index.tsx
- **Priority:** P2
- **Description:** For preferences of type `select`, the “Change” button has `// TODO: Show selection dialog`. Family member toggle has `// TODO: Toggle member status`.
- **Fix:** Add selection dialog for preferences and wire member status toggle to family service/API.

---

## 5. Co-parenting

### I008 – Calendar create/delete event not implemented
- **Area:** app/features/co-parenting/calendar/index.tsx
- **Priority:** P1
- **Description:** `// TODO: Implement createCalendarEvent from service` and `// TODO: Implement deleteCalendarEvent from service`; calendar events are not created or deleted via API.
- **Fix:** Implement create/delete in calendar service and call from UI.

### I009 – Expenses: Generate report, Export, Add expense – TODO
- **Area:** app/features/co-parenting/expenses/index.tsx
- **Priority:** P2
- **Description:** “Generate report”, “Export data”, and add-expense navigation have `// TODO` comments; functionality not implemented.
- **Fix:** Implement report generation, export (e.g. CSV), and add-expense screen/navigation.

### I010 – Messages: Start new conversation – TODO
- **Area:** app/features/co-parenting/messages/index.tsx
- **Priority:** P2
- **Description:** Starting a new conversation is `// TODO: Start new conversation`.
- **Fix:** Implement “new conversation” flow (e.g. pick recipient, create thread, navigate to thread).

---

## 6. Routines

### I011 – Routine detail uses hardcoded childId
- **Area:** app/features/routines/[id].tsx
- **Priority:** P1
- **Description:** `toggleTask` uses `const childId = 'test-child-id'` with a `// TODO: Replace with real childId from auth/family store`. Completions are not tied to the real logged-in child/family.
- **Fix:** Get current child (or selected child) from family store or auth and pass real `childId` to `completeRoutineTask`.

### I012 – Reset routine for next day – TODO
- **Area:** app/features/routines/[id].tsx
- **Priority:** P2
- **Description:** `// TODO: Reset routine for next day` present; daily reset not implemented.
- **Fix:** Implement “reset for next day” (e.g. clear completions for tomorrow or next occurrence and refresh UI).

---

## 7. Meals / planners

### I013 – Create meal plan not persisted
- **Area:** app/features/planners/meals/create.tsx
- **Priority:** P1
- **Description:** Submit handler has `// TODO: Implement createMealPlan from service`; shows success alert but does not call service or persist to Supabase.
- **Fix:** Implement `createMealPlan` in meals service and call it with form data; then navigate back or to meal list.

### I014 – Toggle meal completion not implemented
- **Area:** app/features/planners/meals/index.tsx
- **Priority:** P2
- **Description:** `// TODO: Implement toggleMealCompletion from service`; toggling completion does not persist.
- **Fix:** Implement toggle in service and wire to UI.

---

## 8. Family & dashboard links

### I015 – Parent invite & View analytics – TODO
- **Area:** src/modules/family/components/FamilyDashboard.tsx
- **Priority:** P2
- **Description:** `onPress={() => {/* TODO: Add parent invite */}}` and `onPress={() => {/* TODO: View analytics */}}`; buttons do nothing.
- **Fix:** Implement parent-invite flow (e.g. invite by email) and navigate to analytics or open analytics screen.

---

## 9. Auth

### I016 – Social auth placeholder
- **Area:** src/modules/auth/services/socialAuthService.ts
- **Priority:** P2
- **Description:** Comment indicates a placeholder implementation; social sign-in (e.g. Google) may not be fully wired end-to-end.
- **Fix:** Verify Google (and any other) OAuth flow with Supabase from sign-in to session and document or fix any gaps.

---

## 10. Reminders (Vision)

### I017 – No cancel while “Scanning image…”
- **Area:** app/(tabs)/reminders/index.tsx
- **Priority:** P2
- **Description:** While Google Vision request is in progress, the “Scanning image…” modal has no Cancel button; user must wait for success or error.
- **Fix:** Add Cancel button that aborts the request (e.g. AbortController) and closes the modal.

---

## 11. Store & production launch

### I018 – Store listing and policies (manual)
- **Area:** Play Store / App Store
- **Priority:** P0 for launch
- **Description:** Store listing (short/long description, screenshots, feature graphic), privacy policy URL, content rating, and data safety forms must be completed in Play Console (and App Store Connect if applicable). See PLAY_STORE_READINESS.md and BETA_CHECKLIST.md.
- **Fix:** Complete all store listing and policy steps in the respective consoles; add privacy policy URL to app if required.

### I019 – Production environment variables
- **Area:** Build / EAS
- **Priority:** P0 for launch
- **Description:** For production builds, `EXPO_PUBLIC_APP_ENV=production`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_ANON_KEY` must be set in EAS Secrets (or CI), not only in local `config/env.ts` fallbacks.
- **Fix:** Configure EAS Secrets (or equivalent) for production builds; document in SETUP_GUIDE or README.

---

## 12. Other / general

- **Navigation warnings:** Some route warnings may appear in development; non-critical but can be cleaned up for clarity.
- **Analytics screen:** Uses local/family store and may use mock or partial data; confirm data sources match intended metrics (see APP_STATUS.md for “Real Data Integration”).
- **Dashboard Content (modules):** `modules/dashboard/components/DashboardContent.tsx` has `// TODO: Fetch dashboard data from API`; align with I003/I004 when centralizing dashboard data.

---

## Suggested order of work

1. **P0 (launch):** I018, I019  
2. **P1 (core behavior):** I002, I003, I004, I005, I008, I011, I013  
3. **P2 (polish):** I001, I006, I007, I009, I010, I012, I014, I015, I016, I017  

---

**GitHub Issues:** All issues are created at https://github.com/nero-01/Motus-Repo/issues — I001→#1 … I019→#19.

*To track in GitHub: create an Issue per ID (e.g. “I003 – Dashboard uses mock data”) and link this file in the Issue description.*
