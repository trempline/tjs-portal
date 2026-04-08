# Supabase Integration Setup Guide

This document explains how the Supabase integration works in this Angular application.

## Overview

The application uses Supabase to store contact form submissions from the homepage newsletter/contact section.

## Files Created

1. **Environment Configuration**
   - `src/environments/environment.ts` - Development configuration
   - `src/environments/environment.prod.ts` - Production configuration
   - `src/environments/environment.template.ts` - Template for new deployments

2. **Service**
   - `src/app/services/supabase.service.ts` - Handles all Supabase interactions

3. **Database Schema**
   - `supabase-schema.sql` - SQL script to create the required table and policies

## Database Setup

### 1. Create the Table

Go to your Supabase project SQL Editor and run the script in `supabase-schema.sql`. This will:
- Create the `tjs_messages` table
- Enable Row Level Security (RLS)
- Create policies to allow anonymous inserts (for the contact form)
- Create policies to allow authenticated users to view messages
- Add indexes for better performance

### 2. Table Structure

```sql
CREATE TABLE public.tjs_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Row Level Security (RLS)

The table has RLS enabled with two policies:
- **Anonymous Insert**: Allows anyone to submit the contact form
- **Authenticated Select**: Only authenticated users can view submissions

## How It Works

1. **User submits the form** on the homepage
2. **Form validation** checks for required fields and email format
3. **Data is sent** to Supabase via the `SupabaseService`
4. **Success/Error message** is displayed to the user
5. **Form is reset** on successful submission

## Form Fields

- **name**: Prénom (optional)
- **phone**: Nom (optional) 
- **email**: Email address (required)
- **message**: User message (required)

## Configuration

### Environment Variables

The Supabase credentials are stored in environment files:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

### Security Notes

⚠️ **Important**: 
- Environment files are listed in `.gitignore` to prevent committing sensitive keys
- The anon key is safe to use in client-side code as it's protected by RLS policies
- Never commit your service role key to the repository

## Testing

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Navigate to the homepage** and scroll to the contact form

3. **Fill out the form** and submit

4. **Check Supabase** dashboard to verify the data was inserted

## Viewing Submissions

To view form submissions:

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Select the `tjs_messages` table
4. You'll see all submissions with timestamps

## Troubleshooting

### Form submission fails
- Check browser console for errors
- Verify Supabase URL and anon key in environment files
- Ensure RLS policies are correctly set up
- Check that the table exists in your Supabase project

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Check that `@supabase/supabase-js` is listed in package.json

### Build errors
- Ensure environment files exist for both development and production
- Check that `angular.json` has the correct fileReplacements configuration

## Production Deployment

When deploying to production:

1. Ensure `environment.prod.ts` has the correct credentials
2. Build the app: `npm run build`
3. The build process will automatically use the production environment file
4. Deploy the contents of the `dist` folder

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase JavaScript Client](https://supabase.io/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.io/docs/guides/auth/row-level-security)

