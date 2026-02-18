// This is a template file for environment configuration
// The actual environment.ts and environment.prod.ts files are auto-generated
// by the scripts/set-env.js script during build/postinstall

// Environment variables used:
// - NG_APP_SUPABASE_URL: Supabase project URL
// - NG_APP_SUPABASE_KEY: Supabase anon/public key

export const environment = {
  production: false, // or true for production
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
