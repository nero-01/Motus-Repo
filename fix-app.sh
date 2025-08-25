#!/bin/bash

echo "🔧 MotusTots App Fix Script"
echo "=========================="

# Stop any running processes
echo "🛑 Stopping running processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

# Clear caches
echo "🧹 Clearing caches..."
rm -rf node_modules
rm -f package-lock.json

# Reinstall dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Start the app
echo "🚀 Starting Expo development server..."
npx expo start --clear

echo "✅ Fix complete! The app should now be running."
echo "📱 Scan the QR code with Expo Go to test the app."
