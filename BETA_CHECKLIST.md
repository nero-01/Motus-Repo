# Beta Checklist (Issue 18)

Use this before sending internal/closed test builds.

## Build & Config

- [ ] App builds successfully for Android.
- [ ] App builds successfully for iOS (if applicable).
- [ ] Environment variables set for beta backend/project.
- [ ] `EXPO_PUBLIC_PRIVACY_POLICY_URL` points to live policy page.

## Core Flows

- [ ] Email/password login works.
- [ ] Social login flow works (Google/Facebook if enabled).
- [ ] Family setup and child management load without hangs.
- [ ] Co-parenting screens load with and without family context.
- [ ] Reminders tab uploads planner image and can cancel scan.

## Notifications

- [ ] Notification permission prompt appears correctly.
- [ ] Reminder scheduling works.
- [ ] Test notification is delivered.
- [ ] Manage reminders screen lists/cancels notifications.

## Store Compliance

- [ ] Privacy policy URL is reachable publicly.
- [ ] Data safety answers match actual app behavior.
- [ ] Content rating complete in console.
- [ ] Support contact email monitored.

## Sign-off

- [ ] QA pass complete.
- [ ] Known issues documented.
- [ ] Go/no-go decision recorded.
