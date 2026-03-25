// Environment configuration template for local development
// Copy this file to environment.local.ts and fill in your Supabase credentials

export const environment = {
  production: false,
  appUrl: 'https://your-app-domain.example.com', // Replace with your public frontend URL
  supabase: {
    url: 'https://your-project-id.supabase.co', // Replace with your Supabase project URL
    anonKey: 'your-anon-key-here', // Replace with your Supabase anon key
    // Service-role key: bypasses RLS – admin user management only
    // Get this from: Supabase Dashboard > Settings > Database > Service roles
    serviceRoleKey: 'your-service-role-key-here' // Replace with your service-role key
  }
};

/*
To get your Supabase credentials:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and "anon public" key
4. Copy the "service_role" key (IMPORTANT: Keep this secure!)
5. Set appUrl to the exact public site URL used in invite emails
6. Replace the placeholder values in this file

Security Note:
- The service-role key bypasses Row Level Security
- Never commit this file to version control
- Use environment variables in production
*/
