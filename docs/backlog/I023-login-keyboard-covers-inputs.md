# I023 – Login keyboard covers email/password fields (parked)

**Status:** Parked — tracked on GitHub; pick up when prioritized.  
**Area:** Auth / login & register (`app/(auth)/login.tsx`, `register.tsx`, shared form components)  
**Priority:** TBD

## Summary

When the user focuses **email** or **password**, the **software keyboard** overlaps roughly **half the screen** and **covers the input fields**, so they **cannot see what they are typing**.

## Expected behavior

- While typing, the focused field (and ideally the whole form) **scrolls or shifts** so it stays **above the keyboard** (`KeyboardAvoidingView`, `ScrollView` + `keyboardVerticalOffset`, `react-native-keyboard-controller` if adopted, or platform-specific behavior).
- Works on **iOS** and **Android** (adjustResize / windowSoftInputMode where relevant).

## Investigation

- [ ] Audit login (and **register** if same layout) screens
- [ ] Wrap or restructure with **`KeyboardAvoidingView`** + **`ScrollView`** (`keyboardShouldPersistTaps`, `contentContainerStyle` flexGrow)
- [ ] Set **`keyboardVerticalOffset`** for header/status bar if needed
- [ ] **Expo / Android**: `app.json` `android.softwareKeyboardLayoutMode` if applicable
- [ ] Test with **password managers** and **autofill** toolbars (extra keyboard height)

## Acceptance criteria (when active)

- User can **always see** the active email/password field while the keyboard is open
- No regression on **small devices** (e.g. SE-sized)

## GitHub

- **Issue:** https://github.com/nero-01/Motus-Repo/issues/24
