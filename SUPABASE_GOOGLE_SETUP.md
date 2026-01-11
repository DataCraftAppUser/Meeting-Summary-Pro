# Setting Up Google OAuth in Supabase - Exact Instructions

## ⚠️ Important: Where You Need to Be

You need to be in **"Sign In / Providers"** and NOT in **"OAuth Apps"**.

## Exact Steps:

### Step 1: Navigate to the Right Place

1. **In the left menu of Supabase Dashboard:**
   - Under **"CONFIGURATION"** (not "MANAGE")
   - Click on **"Sign In / Providers"** (not "OAuth Apps")

### Step 2: Enable Google Provider

1. **You'll see a list of Providers:**
   - Email
   - Google
   - Apple
   - GitHub
   - etc.

2. **Find "Google" in the list**

3. **Enable Google:**
   - Click the **Toggle** next to Google to enable it
   - Or click on **"Google"** to open the settings

### Step 3: Enter the Credentials

1. **You'll see two fields:**
   - **Client ID (for OAuth)**: Paste your Client ID from Google Cloud Console here
   - **Client Secret (for OAuth)**: Paste your Client Secret from Google Cloud Console here

2. **Authorized Client IDs:**
   - Leave empty (or add the Client ID if required)

3. **Save:**
   - Click **"Save"** or **"Update"**

### Step 4: Check Redirect URLs

1. **In the left menu, under "CONFIGURATION":**
   - Click on **"URL Configuration"**

2. **Make sure "Redirect URLs" includes:**
   ```
   http://localhost:3000/**
   https://your-frontend-domain.vercel.app/**
   ```

3. **If needed, add:**
   - Click **"+ Add URL"**
   - Add your URL

## Navigation Summary:

```
Supabase Dashboard
├── Authentication (in left menu)
    ├── CONFIGURATION ← You need to be here!
    │   ├── Sign In / Providers ← Here! (not OAuth Apps)
    │   │   └── Google ← Enable and enter credentials
    │   └── URL Configuration ← Check redirect URLs
    └── MANAGE (not here!)
        └── OAuth Apps ← This is NOT the right place!
```

## What to Do Now:

1. **Go to the left menu**
2. **Under "CONFIGURATION"** (not "MANAGE")
3. **Click on "Sign In / Providers"**
4. **Find Google and enable it**
5. **Paste the Client ID and Client Secret**

## If You Don't See "Sign In / Providers":

- Make sure you're in the correct Supabase Dashboard
- Try refreshing the page
- Make sure you have appropriate permissions for the project

## After You Finish:

1. Save the settings
2. Try signing in through your application
3. If there's an error, check the browser Console
