# Build Scripts

## set-env.js

This script automatically generates the Angular environment configuration files (`environment.ts` and `environment.prod.ts`) from environment variables.

### Usage

The script runs automatically:
- **During build**: `npm run build` (runs the script before building)
- **After install**: `npm install` (via postinstall hook)

### Environment Variables

The script reads the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NG_APP_SUPABASE_URL` | Supabase project URL | Optional (uses default if not set) |
| `NG_APP_SUPABASE_KEY` | Supabase anon/public key | Optional (uses default if not set) |

### Local Development

For local development, the script will use the default values (hardcoded in the script). The generated files are gitignored.

### Vercel Deployment

On Vercel, set the environment variables in your project settings:
1. Go to Project Settings → Environment Variables
2. Add `NG_APP_SUPABASE_URL` and `NG_APP_SUPABASE_KEY`
3. Deploy - the script will run automatically via the postinstall hook

### Manual Execution

You can manually run the script:

```bash
node scripts/set-env.js
```

Or with custom environment variables:

```bash
NG_APP_SUPABASE_URL=https://your-project.supabase.co NG_APP_SUPABASE_KEY=your-key node scripts/set-env.js
```

