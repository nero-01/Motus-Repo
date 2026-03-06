# UX & accessibility improvements log

This file lists **non-core** improvements made for efficiency and user-friendliness. No navigation, auth, or data flow was changed. You can roll back by reverting the listed files (e.g. `git checkout -- <file>` or revert the commit).

## Files changed

| File | Changes |
|------|--------|
| `app/(tabs)/index.tsx` | Accessibility labels and roles on quick actions, profile button, recent activity items; `activeOpacity` on profile button. |
| `app/(tabs)/activities/index.tsx` | Accessibility on activity cards, favorite button, Start Activity button; `activeOpacity` on touchables; friendlier error and empty-state copy; loading text. |
| `app/(tabs)/education/index.tsx` | Accessibility on level chips, category chips, worksheet tiles; friendlier loading text. |
| `components/ui/Button.tsx` | Optional `accessibilityLabel` and `accessibilityHint` props (backward compatible). |
| `components/ui/Input.tsx` | Optional `accessibilityLabel` prop; defaults to `label` for screen readers. |

## What was not changed

- Tab bar / bottom icons
- Reminders logic or storage
- Auth, routing, or feature flows
- Any service or API usage

## How to roll back

- **Single file:**  
  `git checkout -- app/\(tabs\)/index.tsx`
- **All listed files:**  
  `git checkout -- "app/(tabs)/index.tsx" "app/(tabs)/activities/index.tsx" "app/(tabs)/education/index.tsx" "components/ui/Button.tsx" "components/ui/Input.tsx"`
- **Whole commit:**  
  `git revert <commit-hash>`
