#!/bin/bash

# Backup script for MotusTots working configuration
# This script saves the current working state for future restoration

echo "🔧 Creating backup of working MotusTots configuration..."

# Create backup directory
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Copy essential configuration files
echo "📁 Backing up configuration files..."
cp package.json "$BACKUP_DIR/"
cp package-lock.json "$BACKUP_DIR/"
cp app.json "$BACKUP_DIR/"
cp metro.config.js "$BACKUP_DIR/"
cp babel.config.js "$BACKUP_DIR/"
cp tsconfig.json "$BACKUP_DIR/"
cp tailwind.config.js "$BACKUP_DIR/"

# Copy environment files
echo "🔐 Backing up environment files..."
cp .env* "$BACKUP_DIR/" 2>/dev/null || true
cp config/env.ts "$BACKUP_DIR/" 2>/dev/null || true

# Create a restoration script
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
#!/bin/bash

echo "🔄 Restoring MotusTots configuration..."

# Stop any running processes
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

# Remove node_modules and reinstall
echo "🧹 Cleaning node_modules..."
rm -rf node_modules
rm -f package-lock.json

# Restore configuration files
echo "📁 Restoring configuration files..."
cp package.json ./
cp app.json ./
cp metro.config.js ./
cp babel.config.js ./
cp tsconfig.json ./
cp tailwind.config.js ./

# Restore environment files
echo "🔐 Restoring environment files..."
cp .env* ./ 2>/dev/null || true
cp env.ts ./config/ 2>/dev/null || true

# Reinstall dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "✅ Restoration complete! Run 'npx expo start' to start the app."
EOF

chmod +x "$BACKUP_DIR/restore.sh"

# Create a README for the backup
cat > "$BACKUP_DIR/README.md" << EOF
# MotusTots Working Configuration Backup

Created: $(date)

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
EOF

echo "✅ Backup created in: $BACKUP_DIR"
echo "📋 Backup includes:"
echo "   - All configuration files"
echo "   - Working dependency versions"
echo "   - Restoration script (restore.sh)"
echo "   - README with instructions"
echo ""
echo "💾 To save this backup to git:"
echo "   git add $BACKUP_DIR"
echo "   git commit -m 'Backup working MotusTots configuration'"
echo "   git push"
