# Service-Role Key Setup Guide

## 🚨 **CRITICAL: Fix "User not allowed" Error**

The error `{"code":"not_admin","message":"User not allowed"}` occurs because the adminSupabase client doesn't have the service-role key configured. This key is required for admin operations like inviting users.

## 📋 **Step-by-Step Solution**

### **Step 1: Get Your Service-Role Key**

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Scroll down to **Service roles**
5. Copy the **service_role** key (it starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

⚠️ **IMPORTANT**: This key bypasses Row Level Security. Keep it secure!

### **Step 2: Configure the Key**

#### **Option A: Local Development (Recommended)**

1. Create a new file: `src/environments/environment.local.ts`
2. Copy the content from `src/environments/environment.local.example.ts`
3. Replace the placeholder with your actual service-role key:

```typescript
// src/environments/environment.local.ts
export const environment = {
  production: false,
  supabase: {
    url: 'https://iuvbnejalukjapgnpzzz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dmJuZWphbHVramFwZ25wenp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjA1MTksImV4cCI6MjA4Njk5NjUxOX0.2f1lm2tKJm_TCYs3yvzOOeDa78Aj5GhzgTcy6W-y-MM',
    serviceRoleKey: 'YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE'
  }
};
```

#### **Option B: Environment Variable**

1. Create a `.env` file in your project root
2. Add your service-role key:

```bash
# .env
NG_APP_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. Update `src/environments/environment.ts`:

```typescript
serviceRoleKey: process.env.NG_APP_SUPABASE_SERVICE_ROLE_KEY || ''
```

### **Step 3: Update Angular Configuration**

Edit `angular.json` to use the local environment:

```json
{
  "projects": {
    "your-project-name": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            },
            "development": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts", 
                  "with": "src/environments/environment.local.ts"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### **Step 4: Restart Development Server**

```bash
# Stop the current server (Ctrl+C)
# Start with development configuration
ng serve --configuration=development
```

## 🔧 **Alternative Quick Fix**

If you want to test immediately without setting up environment files:

1. Edit `src/environments/environment.ts` directly:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://iuvbnejalukjapgnpzzz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dmJuZWphbHVramFwZ25wenp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjA1MTksImV4cCI6MjA4Njk5NjUxOX0.2f1lm2tKJm_TCYs3yvzOOeDa78Aj5GhzgTcy6W-y-MM',
    serviceRoleKey: 'YOUR_SERVICE_ROLE_KEY_HERE' // ← Add your key here
  }
};
```

2. Restart the development server

## 🧪 **Testing the Fix**

1. **Login as admin** in your TJS admin panel
2. **Navigate to Comité section**
3. **Click "Inviter un membre"**
4. **Fill in the form** with valid email and name
5. **Select a role** (Admin or Committee Member)
6. **Click "Inviter"**

**Expected Result**: ✅ Success message appears, no "User not allowed" error

## 🔍 **Debugging Tips**

### **Check Console Logs**
Open browser developer tools and check the console for:
- Network requests to Supabase
- Error messages
- Service-role key being used

### **Verify Service-Role Key**
Test your service-role key with this simple check:

```typescript
// Add this temporarily to your component to test
async testServiceRole() {
  try {
    const { data, error } = await this.adminSupabase.auth.admin.listUsers();
    console.log('Service-role key working:', data ? 'YES' : 'NO');
    if (error) console.error('Service-role error:', error);
  } catch (err) {
    console.error('Service-role test failed:', err);
  }
}
```

### **Check Supabase Dashboard**
1. Go to **Authentication** → **Users**
2. Verify new users are being created when you invite
3. Check the **Logs** section for any errors

## 🚫 **Common Issues & Solutions**

### **Issue**: Service-role key not working
**Solution**: 
- Verify you copied the correct key (service_role, not anon or public)
- Check for extra spaces or line breaks
- Ensure the key hasn't expired

### **Issue**: Still getting "User not allowed"
**Solution**:
- Verify your admin user has the correct role (Admin or Committee Member)
- Check that the database permissions script was executed
- Ensure RLS policies are correctly configured

### **Issue**: Environment file not being used
**Solution**:
- Restart the development server after changing environment files
- Verify the correct configuration is being used
- Check that the file replacement is configured in angular.json

## 📁 **Files Created/Modified**

- ✅ `src/environments/environment.local.example.ts` - Template for local config
- ✅ `SERVICE_ROLE_KEY_SETUP.md` - This guide
- ✅ Updated `src/environments/environment.ts` - Added comments and guidance
- ✅ `db/fix-invite-permissions.sql` - Database permissions fix
- ✅ Enhanced error handling in committee members component

## 🎯 **Next Steps**

1. **Follow this guide** to configure your service-role key
2. **Test the invite functionality** 
3. **Verify users are created** in your Supabase dashboard
4. **Update the changelog** if everything works

Once the service-role key is properly configured, the committee member invitation system should work without any "User not allowed" errors.