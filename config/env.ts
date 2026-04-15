// Environment Configuration
// Production builds must provide Supabase vars via EAS/CI secrets.

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const IS_PRODUCTION = APP_ENV === 'production';

const DEV_SUPABASE_URL = 'https://gqopilelgxqnqnvshzpr.supabase.co';
const DEV_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxb3BpbGVsZ3hxbnFudnNoenByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODYzNjAsImV4cCI6MjA2NjQ2MjM2MH0.4HIgzZTYIlncPRyei8j6SoTGCWDLoHEkDpAiKcq-a20';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || (IS_PRODUCTION ? '' : DEV_SUPABASE_URL);
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || (IS_PRODUCTION ? '' : DEV_SUPABASE_ANON_KEY);

if (IS_PRODUCTION && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL and/or EXPO_PUBLIC_SUPABASE_ANON_KEY for production build. Set them in EAS Secrets or CI.'
  );
}

export const ENV = {
  // Supabase Configuration
  SUPABASE_URL,
  SUPABASE_ANON_KEY,

  // DeepSeek AI Configuration (for future use)
  DEEPSEEK_API_KEY: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '',
  DEEPSEEK_API_URL: process.env.EXPO_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com',

  // Google Calendar API (for future use)
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',
  GOOGLE_VISION_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '',
  PRIVACY_POLICY_URL:
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || 'https://motustots.com/privacy',

  // App Configuration
  APP_ENV,
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  
  // Explicit opt-in only — default false so tab screens use Supabase (see I003 / dashboard regressions).
  FORCE_MOCK: process.env.EXPO_PUBLIC_FORCE_MOCK === 'true',
};

// console.log('ENV configuration:', {
//   SUPABASE_URL: ENV.SUPABASE_URL,
//   SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? 'Present' : 'Missing',
//   APP_ENV: ENV.APP_ENV,
//   FORCE_MOCK: ENV.FORCE_MOCK,
// }); 