const fs = require('fs');
const path = require('path');

// ── Load .env file (no dotenv dependency needed) ──────────────────────────
// Reads key=value pairs from the project root .env file and merges them into
// process.env, WITHOUT overwriting variables that are already set (so CI/CD
// environment variables always win over the local .env file).
const envFilePath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFilePath)) {
  const lines = fs.readFileSync(envFilePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('##')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key   = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// ── Get environment variables ─────────────────────────────────────────────
const supabaseUrl     = process.env.NG_APP_SUPABASE_URL     || '';
const supabaseKey     = process.env.NG_APP_SUPABASE_KEY     || '';
const serviceRoleKey  = process.env.NG_APP_SUPABASE_SERVICE_ROLE_KEY || '';
const appUrl          = process.env.NG_APP_PUBLIC_APP_URL || '';

// Fallback to default values if not set (for local development)
const defaultUrl = 'https://iuvbnejalukjapgnpzzz.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dmJuZWphbHVramFwZ25wenp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjA1MTksImV4cCI6MjA4Njk5NjUxOX0.2f1lm2tKJm_TCYs3yvzOOeDa78Aj5GhzgTcy6W-y-MM';

// Development environment file
const envDevContent = `export const environment = {
  production: false,
  // Public frontend URL used in invite and activation emails.
  appUrl: '${appUrl}',
  supabase: {
    url: '${supabaseUrl || defaultUrl}',
    anonKey: '${supabaseKey || defaultKey}',
    // Service-role key: bypasses RLS – admin user management only
    // Set NG_APP_SUPABASE_SERVICE_ROLE_KEY in .env (local) or Vercel env vars (production)
    serviceRoleKey: '${serviceRoleKey}'
  }
};
`;

// Production environment file
const envProdContent = `export const environment = {
  production: true,
  // Public frontend URL used in invite and activation emails.
  appUrl: '${appUrl}',
  supabase: {
    url: '${supabaseUrl || defaultUrl}',
    anonKey: '${supabaseKey || defaultKey}',
    // Service-role key: bypasses RLS – admin user management only
    // Set NG_APP_SUPABASE_SERVICE_ROLE_KEY in .env (local) or Vercel env vars (production)
    serviceRoleKey: '${serviceRoleKey}'
  }
};
`;

// Write environment files
const envDir = path.join(__dirname, '..', 'src', 'environments');

// Ensure directory exists
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

fs.writeFileSync(path.join(envDir, 'environment.ts'), envDevContent);
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), envProdContent);

console.log('✅ Environment files generated successfully!');
console.log(`   - Using Supabase URL: ${supabaseUrl || defaultUrl}`);
console.log(`   - Public App URL: ${appUrl || '(not set, fallback to current browser origin)'}`);
console.log(`   - Using Supabase Anon Key: ${supabaseKey ? '***' + supabaseKey.slice(-8) : '***' + defaultKey.slice(-8)}`);
console.log(`   - Service Role Key: ${serviceRoleKey ? '***' + serviceRoleKey.slice(-8) + ' (set ✓)' : '⚠️  NOT SET — admin invite will not work'}`);
