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
