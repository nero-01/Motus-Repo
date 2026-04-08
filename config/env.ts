// Environment Configuration
// TODO: Replace with your actual values

// Debug environment variables
// console.log('Environment variables debug:');
// console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
// console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gqopilelgxqnqnvshzpr.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxb3BpbGVsZ3hxbnFudnNoenByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODYzNjAsImV4cCI6MjA2NjQ2MjM2MH0.4HIgzZTYIlncPRyei8j6SoTGCWDLoHEkDpAiKcq-a20',

  // DeepSeek AI Configuration (for future use)
  DEEPSEEK_API_KEY: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '',
  DEEPSEEK_API_URL: process.env.EXPO_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com',

  // Google Calendar API (for future use)
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',

  // App Configuration
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
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