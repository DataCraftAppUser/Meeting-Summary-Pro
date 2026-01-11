# Troubleshooting: "Unsupported provider: provider is not enabled"

## Step-by-Step Debugging

### Step 1: Verify Google Provider is Enabled

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication → Sign In / Providers:**
   - Left menu → Authentication
   - Under "CONFIGURATION" → Click "Sign In / Providers"

3. **Check Google Provider:**
   - Find "Google" in the list
   - **The toggle should be ON (green/enabled)**
   - If it's OFF, click it to enable

4. **Open Google Settings:**
   - Click on "Google" (not just the toggle)
   - You should see a form with:
     - Client ID (for OAuth)
     - Client Secret (for OAuth)
     - Authorized Client IDs (optional)

### Step 2: Verify Credentials are Saved

1. **Check if Client ID is filled:**
   - Should start with something like: `xxxxx-xxxxx.apps.googleusercontent.com`
   - If empty, paste your Client ID from Google Cloud Console

2. **Check if Client Secret is filled:**
   - Should start with: `GOCSPX-xxxxx`
   - If empty, paste your Client Secret from Google Cloud Console

3. **IMPORTANT: Click "Save" or "Update"**
   - Even if the toggle is ON, you MUST save after entering credentials
   - Look for a "Save" or "Update" button at the bottom of the form

### Step 3: Verify URL Configuration

1. **Go to Authentication → URL Configuration:**
   - Left menu → Authentication
   - Under "CONFIGURATION" → Click "URL Configuration"

2. **Check Redirect URLs:**
   - Should include:
     ```
     http://localhost:3000/**
     https://meetingsummaryfrontend.vercel.app/**
     ```

3. **If missing, add them:**
   - Click "+ Add URL"
   - Add: `http://localhost:3000/**`
   - Click "+ Add URL" again
   - Add: `https://meetingsummaryfrontend.vercel.app/**`
   - Save

### Step 4: Common Issues & Solutions

#### Issue 1: Toggle is ON but credentials are empty
**Solution:** Enter Client ID and Secret, then click "Save"

#### Issue 2: Credentials are entered but toggle is OFF
**Solution:** Enable the toggle, then click "Save"

#### Issue 3: Everything looks correct but still not working
**Solution:** Try this reset procedure:
1. Turn OFF the Google toggle
2. Click "Save"
3. Wait 5 seconds
4. Turn ON the Google toggle
5. Re-enter Client ID and Secret (even if they're already there)
6. Click "Save"
7. Wait 10 seconds
8. Try logging in again

#### Issue 4: Wrong Client ID/Secret
**Solution:** 
- Double-check in Google Cloud Console → Credentials
- Make sure you're copying the correct values
- Client ID should end with `.apps.googleusercontent.com`
- Client Secret should start with `GOCSPX-`

### Step 5: Verify in Google Cloud Console

Make sure your OAuth Client has:
- **Application type:** Web application
- **Authorized redirect URIs** includes:
  - `http://localhost:3000/auth/callback`
  - `https://meetingsummaryfrontend.vercel.app/auth/callback`
  - `https://ovbcuszskcjvddarvrre.supabase.co/auth/v1/callback`

### Step 6: Test Again

After making changes:
1. Wait 10-15 seconds for changes to propagate
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try logging in again

## Quick Checklist:

- [ ] Google toggle is ON in Supabase
- [ ] Client ID is entered and saved
- [ ] Client Secret is entered and saved
- [ ] "Save" button was clicked after entering credentials
- [ ] Redirect URLs are configured in Supabase
- [ ] Redirect URIs are configured in Google Cloud Console
- [ ] Waited 10-15 seconds after saving
- [ ] Cleared browser cache

## Still Not Working?

If you've done all the above and it still doesn't work:

1. **Check Supabase Logs:**
   - Dashboard → Logs → Auth Logs
   - Look for any errors related to Google OAuth

2. **Check Browser Console:**
   - Press F12
   - Go to Console tab
   - Look for any errors

3. **Verify Project:**
   - Make sure you're configuring the correct Supabase project
   - Check the project URL matches: `ovbcuszskcjvddarvrre.supabase.co`

4. **Try Incognito Mode:**
   - Open browser in incognito/private mode
   - Try logging in again

## Alternative: Test with Supabase Test Mode

If you're in development, you can also test with Supabase's test mode:
- Some Supabase projects have a "Test Mode" toggle
- This might bypass some validation checks
- But for production, you need proper OAuth setup
