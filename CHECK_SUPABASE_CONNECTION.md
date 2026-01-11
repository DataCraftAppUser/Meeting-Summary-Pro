# How to Check Which Supabase Project Your Frontend is Connected To

## Method 1: Check Browser Console (Easiest)

1. **Open your app in browser:**
   - Go to: http://localhost:3000

2. **Open Developer Tools:**
   - Press `F12` or `Ctrl+Shift+I`
   - Go to **Console** tab

3. **Check Supabase URL:**
   - Type this in the console and press Enter:
   ```javascript
   console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
   ```
   - Or check the network tab for requests to Supabase

4. **Check in Network Tab:**
   - Go to **Network** tab in Developer Tools
   - Try to sign in
   - Look for requests to `*.supabase.co`
   - The URL will show which project you're connected to

## Method 2: Check .env File

1. **Open `frontend/.env` file:**
   ```bash
   # In your project root
   cat frontend/.env
   # Or open it in your editor
   ```

2. **Check `REACT_APP_SUPABASE_URL`:**
   - Should be something like: `https://xxxxx.supabase.co`
   - Compare this with your Supabase Dashboard URL

3. **Verify it matches your DEV project:**
   - Go to Supabase Dashboard
   - Check the project URL in the address bar
   - It should match the URL in `.env`

## Method 3: Add Debug Code (Temporary)

Add this to your `frontend/src/services/supabase.ts` temporarily:

```typescript
console.log('🔍 Supabase Connection Debug:');
console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('Project ID:', process.env.REACT_APP_SUPABASE_URL?.split('//')[1]?.split('.')[0]);
```

Then check the browser console when the app loads.

## Method 4: Check Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard

2. **Check which project is selected:**
   - Look at the project selector (top left)
   - Note the project URL (e.g., `ovbcuszskcjvddarvrre.supabase.co`)

3. **Compare with your .env:**
   - Your `.env` should have: `REACT_APP_SUPABASE_URL=https://ovbcuszskcjvddarvrre.supabase.co`
   - If it's different, that's the problem!

## Quick Fix: Update .env

If you found you're connected to the wrong project:

1. **Get the correct URL from Supabase Dashboard:**
   - Settings → API → Project URL

2. **Get the correct anon key:**
   - Settings → API → anon public key

3. **Update `frontend/.env`:**
   ```env
   REACT_APP_SUPABASE_URL=https://your-dev-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-dev-anon-key
   ```

4. **Restart the frontend:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   cd frontend
   npm start
   ```

## Important Notes:

- **React apps need restart after .env changes**
- **Make sure you're editing the correct `.env` file** (in `frontend/` folder)
- **Check if there's a `.env.local` or `.env.production`** that might override `.env`
