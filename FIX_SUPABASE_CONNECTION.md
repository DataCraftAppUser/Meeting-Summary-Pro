# Fix Supabase Connection - Frontend Connected to Wrong Project

## Current Situation

Your frontend is connected to Supabase project: **`rfmpptvrnpzyxqidiomx`**

This appears to be your **PRODUCTION** project (based on `backend/setup-env.ps1`).

Your `frontend/.env` file is **missing Supabase variables**, so the app might be using cached/wrong values.

## Step 1: Identify Your DEV Project

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Login to your account

2. **Check your projects:**
   - Look at the project selector (top left)
   - You should see multiple projects (DEV and PROD)
   - Note the Project ID for your **DEV** project
   - It should be different from `rfmpptvrnpzyxqidiomx`

3. **Get DEV project credentials:**
   - Select your **DEV** project
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon public** key (starts with `eyJ...`)

## Step 2: Update frontend/.env

Open `frontend/.env` and add/update these lines:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=https://YOUR-DEV-PROJECT-ID.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-dev-anon-key-here
```

**Replace:**
- `YOUR-DEV-PROJECT-ID` with your actual DEV project ID
- `your-dev-anon-key-here` with your actual DEV anon key

## Step 3: Restart Frontend

1. **Stop the frontend server:**
   - Press `Ctrl+C` in the terminal where it's running

2. **Restart:**
   ```bash
   cd frontend
   npm start
   ```

3. **Check browser console:**
   - Open http://localhost:3000
   - Press `F12` → Console tab
   - You should see:
     ```
     🔍 Supabase Connection Debug:
     URL: https://YOUR-DEV-PROJECT-ID.supabase.co
     Project ID: YOUR-DEV-PROJECT-ID
     Has Anon Key: true
     ```

## Step 4: Verify Google OAuth is Enabled

After fixing the connection, verify Google OAuth is enabled in your **DEV** project:

1. **In Supabase Dashboard (DEV project):**
   - Go to **Authentication** → **Providers**
   - Find **Google** in the list
   - Make sure it's **Enabled** (toggle ON)
   - Verify **Client ID** and **Client Secret** are set correctly

2. **Try logging in again:**
   - Go to http://localhost:3000/login
   - Click "Sign in with Google"
   - Should work now!

## Quick Check: Which Project Am I Connected To?

After restarting, check the browser console. The Project ID should match your **DEV** project, not `rfmpptvrnpzyxqidiomx`.

---

**Note:** If you're not sure which project is DEV vs PROD, check:
- **DEV** = Usually has test data, used for development
- **PROD** = Has real/production data, used for live app
