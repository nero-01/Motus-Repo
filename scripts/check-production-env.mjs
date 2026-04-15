#!/usr/bin/env node

/**
 * Validates required EXPO_PUBLIC_* variables for production builds.
 * Use in CI or before EAS production builds.
 */

const REQUIRED_VARS = [
  'EXPO_PUBLIC_APP_ENV',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
];

const missing = REQUIRED_VARS.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error('Missing required production environment variables:');
  for (const name of missing) {
    console.error(`- ${name}`);
  }
  console.error(
    '\nSet these in EAS Secrets or CI environment before running production builds.'
  );
  process.exit(1);
}

if (process.env.EXPO_PUBLIC_APP_ENV !== 'production') {
  console.error(
    `EXPO_PUBLIC_APP_ENV must be "production" for production validation (received: "${process.env.EXPO_PUBLIC_APP_ENV}")`
  );
  process.exit(1);
}

console.log('Production environment variables are valid.');
