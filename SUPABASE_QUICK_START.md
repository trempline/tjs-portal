# Supabase Quick Start - TJS Messages

## ✅ What's Been Set Up

Your Angular application is now fully integrated with Supabase to store contact form submissions!

## 📋 Quick Checklist

### 1. Create the Database Table (REQUIRED)

Go to your Supabase project and run this SQL:

```sql
-- Copy the entire contents of supabase-schema.sql and run it in Supabase SQL Editor
```

Or manually:
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `snbnywhixglgxstoqiyc`
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase-schema.sql`
5. Click **Run**

### 2. Test the Form

1. Start your dev server: `npm start`
2. Navigate to the homepage
3. Scroll to the contact form section
4. Fill in the form and submit
5. Check Supabase Table Editor to see your submission!

## 📁 Files Created

```
src/
├── environments/
│   ├── environment.ts          # Dev config (has your credentials)
│   ├── environment.prod.ts     # Prod config (has your credentials)
│   └── environment.template.ts # Template for future use
└── app/
    └── services/
        └── supabase.service.ts # Handles all Supabase operations

Root files:
├── supabase-schema.sql        # Database schema
├── SUPABASE_SETUP.md          # Detailed documentation
└── SUPABASE_QUICK_START.md    # This file
```

## 🎯 How It Works

1. User fills out the form on homepage
2. Clicks "Devenir hôte" button
3. Data is validated (email format, required fields)
4. Sent to Supabase → `tjs_messages` table
5. Success message shown to user
6. Form is cleared

## 🔍 Viewing Submissions

**In Supabase Dashboard:**
1. Go to **Table Editor**
2. Select `tjs_messages` table
3. See all submissions with timestamps

**Columns:**
- `id` - Auto-generated ID
- `name` - User's first name
- `phone` - User's last name (labeled as phone in form)
- `email` - User's email (required)
- `message` - User's message (required)
- `created_at` - Timestamp of submission

## 🛡️ Security

✅ Row Level Security (RLS) is enabled
✅ Anonymous users can only INSERT (submit forms)
✅ Only authenticated users can SELECT (view submissions)
✅ Environment files are gitignored

## 🚀 Production Deployment

When deploying:
1. Run `npm run build`
2. Deploy the `dist/web` folder
3. Environment variables will automatically switch to production config

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify the table exists in Supabase
3. Ensure RLS policies are active
4. Check that credentials in environment files are correct

## Current Configuration

**Supabase URL:** https://snbnywhixglgxstoqiyc.supabase.co
**Table:** public.tjs_messages
**Status:** ✅ Code ready, ⏳ Database table needs to be created

