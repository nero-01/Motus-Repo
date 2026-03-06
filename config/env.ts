// Environment Configuration
// In production, set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS Secrets or build env.
// Do not rely on fallbacks for production builds.

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const isProduction = APP_ENV === 'production';

export const ENV = {
  // Supabase: no fallback keys in production (must be set in EAS/build env)
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || (isProduction ? '' : 'https://gqopilelgxqnqnvshzpr.supabase.co'),
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || (isProduction ? '' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxb3BpbGVsZ3hxbnFudnNoenByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODYzNjAsImV4cCI6MjA2NjQ2MjM2MH0.4HIgzZTYIlncPRyei8j6SoTGCWDLoHEkDpAiKcq-a20'),

  // DeepSeek AI Configuration (for future use)
  DEEPSEEK_API_KEY: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '',
  DEEPSEEK_API_URL: process.env.EXPO_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com',

  // Google Calendar API (for future use)
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',

  // Google Cloud Vision API (for reminder image OCR)
  GOOGLE_VISION_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '',

  // App Configuration
  APP_ENV,
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',

  // Optional: public URL for privacy policy (in-app link; also set in Play Console store listing)
  PRIVACY_POLICY_URL: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || '',

  // Mock mode: always false in production; only enabled in dev if EXPO_PUBLIC_FORCE_MOCK=true
  FORCE_MOCK: isProduction ? false : process.env.EXPO_PUBLIC_FORCE_MOCK === 'true',
};

// console.log('ENV configuration:', {
//   SUPABASE_URL: ENV.SUPABASE_URL,
//   SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? 'Present' : 'Missing',
//   APP_ENV: ENV.APP_ENV,
//   FORCE_MOCK: ENV.FORCE_MOCK,
// }); 