# MotusTots Restoration Guide

## 🚨 Emergency Restoration

If your MotusTots app stops working, follow these steps to restore it to a working state:

### Quick Fix (Try this first)
```bash
# Stop any running processes
pkill -f "expo start"
pkill -f "metro"

# Clear caches and reinstall
rm -rf node_modules
rm -f package-lock.json
npm install --legacy-peer-deps
npx expo start --clear
```

### Full Restoration (If quick fix doesn't work)

1. **Use the backup restoration script:**
   ```bash
   cd backup-20250823-190240
   ./restore.sh
   ```

2. **Manual restoration:**
   ```bash
   # Stop processes
   pkill -f "expo start"
   pkill -f "metro"
   
   # Clean everything
   rm -rf node_modules
   rm -f package-lock.json
   
   # Restore from backup
   cp backup-20250823-190240/package.json ./
   cp backup-20250823-190240/app.json ./
   cp backup-20250823-190240/metro.config.js ./
   cp backup-20250823-190240/babel.config.js ./
   cp backup-20250823-190240/tsconfig.json ./
   cp backup-20250823-190240/tailwind.config.js ./
   
   # Reinstall dependencies
   npm install --legacy-peer-deps
   
   # Start the app
   npx expo start --clear
   ```

## 🔧 Working Configuration Details

### Expo SDK 52 Compatible Versions
- `expo`: ~52.0.47
- `expo-router`: ~4.0.21
- `react-native`: 0.76.9
- `metro`: ^0.81.0
- `react-native-safe-area-context`: 4.12.0
- `react-native-screens`: 4.4.0
- `expo-constants`: 17.0.8
- `expo-linking`: 7.0.5
- `expo-status-bar`: 2.0.1
- `expo-notifications`: 0.31.4
- `expo-image-picker`: (latest)
- `react-native-paper`: (latest)
- `react-native-reanimated`: 3.16.1

### Key Configuration Files
- `package.json` - Dependencies and scripts
- `app.json` - Expo configuration
- `metro.config.js` - Metro bundler configuration
- `babel.config.js` - Babel configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration

## 🐛 Common Issues and Solutions

### Issue: "Unable to resolve module"
**Solution:** Clear Metro cache and reinstall
```bash
npx expo start --clear
# If that doesn't work:
rm -rf node_modules && npm install --legacy-peer-deps
```

### Issue: Version conflicts
**Solution:** Use exact versions from backup
```bash
npm install expo@~52.0.47 expo-router@~4.0.21 react-native@0.76.9 --legacy-peer-deps
```

### Issue: Metro bundler errors
**Solution:** Reset Metro and clear caches
```bash
npx expo start --clear --reset-cache
```

### Issue: Missing dependencies
**Solution:** Install missing packages
```bash
npm install [missing-package] --legacy-peer-deps
```

## 📱 Testing the App

1. **Start the development server:**
   ```bash
   npx expo start
   ```

2. **Scan QR code** with Expo Go app

3. **Check for errors** in the terminal

4. **If errors occur**, follow the restoration steps above

## 💾 Backup Information

- **Backup created:** August 23, 2025 at 19:02:40
- **Backup location:** `backup-20250823-190240/`
- **Git commit:** Initial commit with working configuration
- **Status:** ✅ All dependencies working for Expo SDK 52

## 🔄 Future Updates

When updating dependencies:
1. **Always test** after updates
2. **Keep the backup** as a fallback
3. **Use `--legacy-peer-deps`** flag for npm install
4. **Check Expo SDK compatibility** before major updates

## 📞 Support

If you continue to have issues:
1. Check the backup restoration script
2. Verify all configuration files match the backup
3. Ensure you're using the correct Node.js version
4. Clear all caches and reinstall from scratch
