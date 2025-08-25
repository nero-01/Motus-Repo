export const appConfig = {
  // App Information
  name: 'MotusTots',
  version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  
  // API Configuration
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    timeout: 10000,
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  // Social Login Configuration
  social: {
    google: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    },
    facebook: {
      appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    },
    apple: {
      clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID,
    },
  },
  
  // Feature Flags
  features: {
    socialLogin: true,
    activities: true,
    routines: true,
    chores: true,
    rewards: true,
    education: true,
    coParenting: true,
    analytics: true,
  },
  
  // UI Configuration
  ui: {
    primaryColor: '#006A60',
    secondaryColor: '#4CAF50',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    elevation: 2,
  },
  
  // Analytics Configuration
  analytics: {
    enabled: process.env.EXPO_PUBLIC_ANALYTICS_ID !== undefined,
    id: process.env.EXPO_PUBLIC_ANALYTICS_ID,
  },
  
  // Error Monitoring
  monitoring: {
    sentry: {
      enabled: process.env.EXPO_PUBLIC_SENTRY_DSN !== undefined,
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    },
  },
} as const;

// Type-safe configuration access
export type AppConfig = typeof appConfig;
