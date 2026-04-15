# App Store Readiness (Issue 18)

Use this checklist to prepare and submit MotusTots in App Store Connect.

## App Information

- [ ] App name finalized.
- [ ] Subtitle finalized.
- [ ] Category (primary/secondary) selected.
- [ ] Age rating questionnaire completed.
- [ ] Support URL set.
- [ ] Marketing URL set (if available).
- [ ] Privacy Policy URL set.

## App Privacy (Nutrition Labels)

- [ ] Data collection categories declared accurately.
- [ ] Data linked to user vs not linked is marked correctly.
- [ ] Tracking usage declared (if any).
- [ ] Third-party SDK privacy impact reviewed.
- [ ] Responses align with `DATA_SAFETY_MAPPING.md`.

## Build & Distribution

- [ ] iOS build uploaded to App Store Connect.
- [ ] Build processed successfully.
- [ ] Build assigned to version metadata.
- [ ] Export compliance completed.
- [ ] Content rights declaration completed.

## Listing Metadata

- [ ] Description added (aligned with `STORE_LISTING_CONTENT.md`).
- [ ] Keywords added.
- [ ] What’s New text added.
- [ ] App icon appears correctly.
- [ ] Screenshots uploaded for required device sizes.

## Optional Policy/UX Checks

- [ ] Account deletion path available if account creation is supported.
- [ ] Support contact path accessible from in-app settings.
- [ ] Privacy policy link is reachable in-app and in listing.

## TestFlight

- [ ] Internal testing build distributed.
- [ ] External testing group configured (if needed).
- [ ] Test notes added for reviewers.

## App Review Submission

- [ ] Demo account details provided (if login required).
- [ ] Reviewer notes include navigation tips to key features.
- [ ] Contact details for review questions are up to date.

## MotusTots Quick References

- In-app About screen: `app/features/settings/about.tsx`
- In-app privacy/settings screen: `app/features/settings/privacy.tsx`
- URL constants source: `constants/support.ts`
- Store copy source: `STORE_LISTING_CONTENT.md`
- Data/privacy mapping source: `DATA_SAFETY_MAPPING.md`

