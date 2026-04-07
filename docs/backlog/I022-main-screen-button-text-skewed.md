# I022 – Main screen button text skewed (parked)

**Status:** Parked — tracked on GitHub; pick up when prioritized.  
**Area:** UI / main landing (`app/index.tsx` or splash entry)  
**Priority:** TBD

## Summary

On the **main / splash screen**, button **label text appears skewed** (alignment, baseline, or layout) so copy does not read cleanly across devices and font scales.

## Investigation

- [ ] Reproduce on **iOS** and **Android** (small + large phones)
- [ ] Check **React Native Paper** `Button` `labelStyle` / `contentStyle` vs parent `flex` / `width`
- [ ] Verify **Dimensions** / safe area not squeezing horizontal layout
- [ ] Test with **system font scaling** (accessibility)

## Acceptance criteria (when active)

- Button labels are **visually level** and **centered** on supported devices
- No clipping or diagonal “skew” at common breakpoints

## GitHub

- **Issue:** https://github.com/nero-01/Motus-Repo/issues/23
