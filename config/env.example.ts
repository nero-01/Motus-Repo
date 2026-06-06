// Environment Configuration Example
// Copy this file to config/env.ts and fill in your actual values

export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // DeepSeek AI Configuration (for future use)
  DEEPSEEK_API_KEY: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '',
  DEEPSEEK_API_URL: process.env.EXPO_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com',

  // Google Calendar API (for future use)
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',

  // App Configuration
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',

  // Expo / EAS push
  PROJECT_ID: process.env.EXPO_PUBLIC_PROJECT_ID || '',

  // OCR.space (planner OCR)
  OCR_SPACE_API_KEY: process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY || '',

  // Web Push (VAPID public key)
  VAPID_PUBLIC_KEY: process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || '',
};

// Environment variables to set in your .env file:
/*
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key
EXPO_PUBLIC_DEEPSEEK_API_URL=https://api.deepseek.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
EXPO_PUBLIC_OCR_SPACE_API_KEY=your-ocr-space-api-key
EXPO_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
*/ 