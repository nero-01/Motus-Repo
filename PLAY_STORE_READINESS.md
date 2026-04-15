# Play Store Readiness (Issue 18)

This checklist tracks launch-blocking Play Console metadata and policy work.

Supporting docs:
- `STORE_LISTING_CONTENT.md` (copy-ready listing text)
- `DATA_SAFETY_MAPPING.md` (privacy/data-safety declaration mapping)
- `APP_STORE_READINESS.md` (Apple submission checklist)

## App Content

- [ ] Complete **App access** declaration.
- [ ] Complete **Ads** declaration.
- [ ] Complete **Content rating** questionnaire.
- [ ] Complete **Data safety** form with current app behavior.

## Store Listing

- [ ] App name finalized.
- [ ] Short description finalized (80 chars max).
- [ ] Full description finalized (4000 chars max).
- [ ] Category and tags selected.
- [ ] Contact email set.
- [ ] Privacy policy URL added in Play Console.

## Graphics

- [ ] App icon (512x512) uploaded.
- [ ] Feature graphic (1024x500) uploaded.
- [ ] Phone screenshots uploaded.
- [ ] Tablet screenshots uploaded (if targeting tablets).

## Releases

- [ ] Internal testing release created and published.
- [ ] Closed testing release created (if required).
- [ ] Production release notes drafted.

## Notes for MotusTots

- In-app privacy policy entry point exists at:
  - `app/features/settings/about.tsx`
  - URL source: `constants/support.ts` (`PRIVACY_POLICY_URL`)
- Default policy URL:
  - `https://motustots.com/privacy`
- Override with env var when needed:
  - `EXPO_PUBLIC_PRIVACY_POLICY_URL`
