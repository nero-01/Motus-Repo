# MotusTots Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device
- Git

### 1. Clone and Install
```bash
git clone https://github.com/nero-01/Motus-Repo.git
cd Motus-Repo
npm install
```

### 2. Environment Setup
```bash
cp env.example .env
```

Edit `.env` with your credentials:
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Social Login Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id_here
EXPO_PUBLIC_APPLE_CLIENT_ID=your_apple_client_id_here

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 3. Start Development Server
```bash
npx expo start
```

Scan the QR code with Expo Go app.

## 🔧 Configuration

### Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Add them to your `.env` file

### Social Login Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your app's bundle identifier
6. Copy Client ID to `.env`

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth settings
5. Copy App ID to `.env`

#### Apple Sign-In
1. Go to [Apple Developer](https://developer.apple.com)
2. Create App ID with Sign In capability
3. Create Service ID
4. Configure domains and redirect URLs
5. Copy Client ID to `.env`

#### Reminders – Google Cloud Vision (optional)
To scan weekly planner images and build reminders from text:
1. In [Google Cloud Console](https://console.cloud.google.com), enable **Cloud Vision API** for your project
2. Create an **API key** (APIs & Services → Credentials → Create credentials → API key)
3. Restrict the key to “Cloud Vision API” (and optionally to your app’s bundle ID) for security
4. Add to `.env`: `EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_vision_api_key_here`

## 📱 Features Overview

### 🔐 Authentication
- Email/password login
- Social login (Google, Facebook, Apple)
- Password reset
- User profile management

### 🎯 Activities
- Browse educational activities
- Search and filter by age, type, difficulty
- Save favorites
- Track completion and ratings
- Detailed activity instructions

### 👨‍👩‍👧‍👦 Family Management
- Add multiple children
- Age-appropriate content filtering
- Progress tracking per child

### 📅 Routines & Planning
- Create daily routines
- Meal planning
- Chore management
- Reminders and notifications

### 📊 Analytics
- Activity completion tracking
- Progress reports
- Usage analytics

## 🏗️ Architecture

### Module Structure
```
src/modules/
├── auth/           # Authentication module
├── activities/     # Activities module
├── family/         # Family management
├── routines/       # Routines and planning
└── shared/         # Shared utilities
```

### Key Technologies
- **React Native** with Expo
- **TypeScript** for type safety
- **Zustand** for state management
- **Supabase** for backend
- **React Native Paper** for UI
- **Expo Auth Session** for social login

## 🚀 Deployment

### Development
```bash
npx expo start
```

### Production Build
```bash
npx expo build:android
npx expo build:ios
```

### EAS Build (Recommended)
```bash
npm install -g @expo/eas-cli
eas build --platform all
```

## 🐛 Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
npx expo start --clear
```

#### Dependency Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Expo Go Issues
- Ensure you're using the latest Expo Go version
- Check that your device and computer are on the same network
- Try switching between Tunnel, LAN, and Local connection modes

#### Social Login Issues
- Verify all environment variables are set correctly
- Check that OAuth redirect URLs are configured properly
- Ensure app bundle identifiers match in developer consoles

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Paper](https://callstack.github.io/react-native-paper)
- [Supabase Documentation](https://supabase.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
