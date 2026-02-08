# Google Play Store – Launch Readiness & Submission Guide

This document tells you whether MotusTots is ready for the Play Store and how to submit it. **You must submit the app yourself** from [Google Play Console](https://play.google.com/console) (we cannot post on your behalf).

---

## Is the app ready to launch?

| Area | Status | Notes |
|------|--------|--------|
| **Code & build** | Ready | No blocking errors; logs wrapped in `__DEV__`; `versionCode` set (see BETA_CHECKLIST.md). |
| **App config** | Ready | `app.json`: version 1.0.0, versionCode 1, package `com.nero01.MotusTots`. |
| **Android build** | Ready | EAS Build config in `eas.json`; production profile builds an AAB. |
| **Store listing** | You must do | Short/long description, screenshots, feature graphic, privacy policy URL. |
| **Policies** | You must do | Privacy policy, content rating questionnaire, data safety form. |
| **Account** | You must do | Google Play Developer account ($25 one-time), identity verification. |

**Verdict:** The app is **ready to be built and submitted** from a technical standpoint. You still need to complete the **store listing**, **policy forms**, and **account setup** in Play Console.

---

## What we’ve prepared in the repo

1. **`eas.json`** – EAS Build profiles so you can build a production AAB.
2. **`BETA_CHECKLIST.md`** – Logging, env, and version checks (already done).
3. **`docs/PRIVACY_POLICY.md`** – Privacy policy text you must **publish online** and use as the **Privacy policy URL** in Play Console.
4. **This file** – Step-by-step submission guide.

---

## Step-by-step: Build and submit to Play Store

### 1. Prerequisites

- [ ] **Google Play Developer account**  
  - Sign up at [play.google.com/console](https://play.google.com/console).  
  - One-time $25 fee and identity verification.

- [ ] **Expo / EAS**  
  - Install: `npm install -g eas-cli`  
  - Log in: `eas login`

- [ ] **Production environment variables**  
  - In [Expo dashboard](https://expo.dev) → your project → **Secrets**, add:
    - `EXPO_PUBLIC_APP_ENV` = `production`
    - `EXPO_PUBLIC_SUPABASE_URL` = your production Supabase URL
    - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = your production Supabase anon key  
  - Do **not** rely only on fallbacks in `config/env.ts` for production.

### 2. Build the Android App Bundle (AAB)

From the project root:

```bash
eas build --platform android --profile production
```

- This produces an **AAB** (required by Play).
- When the build finishes, download the AAB from the Expo build page (or use the link EAS prints).

### 3. Create the app in Play Console

1. Open [Play Console](https://play.google.com/console).
2. Click **Create app**.
3. Fill in:
   - App name: **MotusTots**
   - Default language, type (App or game), and whether it’s free/paid.

### 4. Complete “Set up your app”

- **App access**: If all functionality is behind login, provide a test account or state that login is required (and how to get access).
- **Ads**: Select “No” if the app does not show ads.
- **Content rating**: Complete the questionnaire (likely “Everyone” or “Everyone 10+” for a family app).
- **Target audience**: Choose the age groups (e.g. parents/families).
- **News app**: Select “No” unless it’s a news app.
- **COVID-19 contact tracing**: Select “No” unless applicable.
- **Data safety**: Declare what data you collect (account, email, family/child data, etc.) and how it’s used. Use your privacy policy as reference.
- **Government apps**: Select “No” unless applicable.

### 5. Store listing (required)

In **Store presence → Main store listing**:

- **Short description** (max 80 characters).  
  Example: “Family hub: chores, rewards, education & routines for kids and parents.”
- **Full description** (max 4000 characters).  
  Describe features: education, chores, rewards, routines, co-parenting, meal planning, analytics.
- **App icon**: 512×512 px PNG (no transparency).
- **Feature graphic**: 1024×500 px (required).
- **Screenshots**: At least 2 (phone); 7″ and 10″ if targeting tablets.  
  Use a real device or emulator to capture the app.
- **Privacy policy URL**: **Required.**  
  Host `docs/PRIVACY_POLICY.md` as a public webpage (e.g. GitHub Pages, your site) and paste the URL here.

### 6. Upload the AAB and release

1. Go to **Release → Production** (or **Testing → Internal testing** for a first test).
2. **Create new release**.
3. **Upload** the AAB you downloaded from EAS.
4. Add **Release name** (e.g. “1.0.0 (1)”) and **Release notes** (what’s new for users).
5. **Review and roll out** (or “Start rollout to Production” when ready).

### 7. Permissions (for your reference)

Your `AndroidManifest.xml` currently requests:

- `INTERNET` – Required for Supabase and API calls.
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` – Used by image picker (e.g. reminders).
- `RECORD_AUDIO` – If you use audio recording; otherwise consider removing in a future update.
- `SYSTEM_ALERT_WINDOW` – Often from dev/overlay tooling. If the app doesn’t draw over other apps, you can remove this in a future build to avoid policy questions.
- `VIBRATE` – For feedback (e.g. rewards).

In **Data safety**, declare only what you actually use; if you don’t use microphone or overlay, say so or remove the permission in the next release.

---

## Versioning for future releases

For each new upload:

1. In `app.json`:
   - Bump **`expo.version`** (e.g. `1.0.0` → `1.0.1`).
   - Bump **`expo.android.versionCode`** (e.g. `1` → `2`). It must increase every time you upload a new AAB.
2. Run: `eas build --platform android --profile production`.
3. Upload the new AAB in Play Console and create a new release.

---

## Optional: Automated submit with EAS Submit

To upload the AAB from the command line:

1. Create a **Google Play service account** and download a JSON key.  
   See [Expo: Submit to Google Play](https://docs.expo.dev/submit/android/).
2. Save the key as `play-store-service-account.json` in the project root (and add it to `.gitignore`).
3. After a successful build:
   ```bash
   eas submit --platform android --profile production
   ```

The `eas.json` in this repo already has a `submit.production.android` section; adjust `serviceAccountKeyPath` or `track` (e.g. `internal`, `alpha`, `beta`, `production`) as needed.

---

## Summary

- **App and build:** Ready; use `eas build --platform android --profile production` to get the AAB.
- **You must do in Play Console:** Store listing (description, icon, feature graphic, screenshots), privacy policy URL, content rating, data safety, and account/release steps.
- **We cannot post the app for you;** only you can submit and publish from your Play Developer account.

After you complete the store listing and policy steps and upload the AAB, you can roll out to internal testing first, then to production when you’re satisfied.
