# MotusTots Working Configuration Backup

Created: Sat Aug 23 19:02:40 SAST 2025

## What's included:
- package.json (with working dependency versions)
- package-lock.json (dependency lock file)
- app.json (Expo configuration)
- metro.config.js (Metro bundler configuration)
- babel.config.js (Babel configuration)
- tsconfig.json (TypeScript configuration)
- tailwind.config.js (Tailwind CSS configuration)
- Environment files (.env*)
- restore.sh (restoration script)

## To restore this configuration:
1. Navigate to this backup directory
2. Run: ./restore.sh
3. This will clean and reinstall everything with the working versions

## Working dependency versions for Expo SDK 52:
- expo: ~52.0.47
- expo-router: ~4.0.21
- react-native: 0.76.9
- metro: ^0.81.0
- react-native-safe-area-context: 4.12.0
- react-native-screens: 4.4.0
- expo-constants: 17.0.8
- expo-linking: 7.0.5
- expo-status-bar: 2.0.1
- expo-notifications: 0.31.4
- expo-image-picker: (latest)
- react-native-paper: (latest)
- react-native-reanimated: 3.16.1

## Troubleshooting:
If you encounter issues after restoration:
1. Clear Metro cache: npx expo start --clear
2. Clear npm cache: npm cache clean --force
3. Delete node_modules and reinstall: rm -rf node_modules && npm install --legacy-peer-deps
