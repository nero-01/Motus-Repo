# I018 – Store listing & policies checklist

Use this checklist to complete **I018** (store listing, privacy URL, content rating) for Google Play. All steps are done in [Google Play Console](https://play.google.com/console). Details: **PLAY_STORE_READINESS.md**.

---

## Prerequisites

- [ ] Google Play Developer account created ($25, identity verified)
- [ ] App built: `eas build --platform android --profile production`
- [ ] EAS Secrets set: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see SETUP_GUIDE.md)

---

## Store listing (Store presence → Main store listing)

- [ ] **Short description** (max 80 chars), e.g. “Family hub: chores, rewards, education & routines for kids and parents.”
- [ ] **Full description** (max 4000 chars) – features: education, chores, rewards, routines, co-parenting, meal planning, analytics
- [ ] **App icon** 512×512 px PNG (no transparency)
- [ ] **Feature graphic** 1024×500 px
- [ ] **Screenshots** – at least 2 (phone); 7″ and 10″ if targeting tablets
- [ ] **Privacy policy URL** – required. Publish `docs/PRIVACY_POLICY.md` at a public URL (e.g. GitHub Pages, your site) and paste that URL here.  
  Optional: set `EXPO_PUBLIC_PRIVACY_POLICY_URL` in EAS Secrets (or .env) so the in-app Settings/Profile “Privacy Policy” link opens this URL.

---

## Policies & setup (Set up your app)

- [ ] **App access** – test account or “login required” note if app is behind login
- [ ] **Ads** – “No” if no ads
- [ ] **Content rating** – complete questionnaire (e.g. Everyone or Everyone 10+)
- [ ] **Target audience** – age groups (e.g. parents/families)
- [ ] **News app** – “No”
- [ ] **COVID-19 contact tracing** – “No”
- [ ] **Data safety** – declare collected data (account, email, family/child data, etc.) and usage; use privacy policy as reference
- [ ] **Government apps** – “No”

---

## Release

- [ ] Create app in Play Console (Create app → name: MotusTots, etc.)
- [ ] Upload AAB (Release → Production or Testing → Internal testing)
- [ ] Release name and release notes filled
- [ ] Roll out (internal testing first recommended)

---

**When done:** Update **issues.md** I018 status and close the corresponding GitHub Issue when the app is live or in testing.
