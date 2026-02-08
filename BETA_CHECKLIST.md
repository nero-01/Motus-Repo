# Google Play Beta – Pre-Release Checklist

Use this before submitting MotusTots to the Google Play Store (internal or closed beta).

## ✅ Done for this release

- **Logs**
  - Onboarding debug logs removed or wrapped in `__DEV__` (no verbose output in production).
  - Dashboard, Activities, Profile, Education: `console.log`/`console.error` wrapped in `__DEV__` or removed.
  - Settings: placeholder `console.log` removed from menu actions (Edit profile, Change password, etc.).
  - Worksheets (features): completion `console.log` removed.
  - Family store, auth mock, activity service: logs wrapped in `__DEV__`.
  - Global error handler and ErrorBoundary: only log in `__DEV__`.
  - Worksheet sounds and ColorMixing: warnings only in `__DEV__`.
  - **Auth (services/supabase/auth.ts)**: All signup/signin/mock/state logs wrapped in `__DEV__`.
  - **Supabase client (client.ts)**: Connection/schema test logs and missing-config warning wrapped in `__DEV__`.
  - **Auth store**: setUser/checkAuth and family-load errors wrapped in `__DEV__`.

- **Console usage (deployment pass)**
  - All `console.log` / `console.error` / `console.warn` in app code, stores, and services are now wrapped in `__DEV__` (no console output in production). This includes: education, chores, rewards, family, dashboard, meals, auth store, Supabase client schema test, calendar, coparenting, routines, analytics, co-parenting messages/expenses, forgot-password, and placeholder buttons.

- **App config**
  - `app.json`: `android.versionCode: 1` added (required for Play Store; increment for each release).

- **Sensitive data**
  - No API keys or secrets are logged. Supabase URL/anon key in `config/env.ts` are client-side defaults; prefer setting `EXPO_PUBLIC_*` in EAS/CI and not committing real keys.

- **Production config (env)**
  - `config/env.ts`: In production (`EXPO_PUBLIC_APP_ENV=production`), no fallback Supabase URL/anon key is used; you must set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in EAS Secrets or build env. `FORCE_MOCK` is forced to `false` in production.

## ⚠️ Before you submit

1. **Environment**
   - For production builds, set `EXPO_PUBLIC_APP_ENV=production` (e.g. in EAS env or `.env`).
   - Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set in your build environment (EAS Secrets or CI), not only in `config/env.ts` fallbacks.

2. **Android**
   - Use a release keystore for signing (EAS Build can manage this).
   - Bump `version` in `app.json` for each store release (e.g. `1.0.1`) and `android.versionCode` (e.g. `2` for the second upload).

3. **Permissions**
   - Confirm `AndroidManifest.xml` only requests permissions the app actually uses (camera/storage for image picker, notifications for reminders, etc.). Remove any unused permissions.

4. **Store listing**
   - Privacy policy URL (required if you collect data).
   - Short/long description, screenshots, feature graphic.
   - Content rating questionnaire completed.

5. **Optional**
   - Add a crash reporting service (e.g. Sentry) and keep `__DEV__`-only logging; production errors can be reported without `console.*` in production.
   - Run a release build locally: `eas build --platform android --profile preview` (or your production profile) and test on a device.

## TODOs (non-blocking for beta)

- Settings: Edit profile, Change password, Privacy, Export data, Help, Contact support, About – currently no-op; can be implemented later.
- Co-parenting: some calendar/message/expense actions still TODO.
- Dashboard/activities: some “Implement real query” TODOs in services.

These do not block beta as long as the main flows (auth, education, reminders, family, chores, rewards) work and the app does not crash.

---

## Deployment status

**Ready for beta deployment** from a code perspective:

- No blocking errors; auth and critical paths no longer log in production.
- Android `versionCode` set; app config suitable for Play Store.
- Remaining logs are either success/info in services (no PII) or behind `__DEV__`.

Before submitting: complete store listing (privacy policy, descriptions, screenshots, content rating), use a release keystore, and set production env vars for your build.
