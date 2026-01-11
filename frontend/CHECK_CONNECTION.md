# How to Check Which Supabase Project You're Connected To

## Quick Check in Browser Console

1. **Open your app:** http://localhost:3000
2. **Open Developer Tools:** Press `F12`
3. **Go to Console tab**
4. **Type this and press Enter:**
   ```javascript
   console.log('Supabase URL:', window.location.origin);
   ```
5. **Or check Network tab:**
   - Go to **Network** tab
   - Try to sign in
   - Look for requests to `*.supabase.co`
   - The domain will show which project

## Check Environment Variables

The app uses these environment variables:
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anon key

If `.env` file doesn't exist, the app might be using:
- Default values (empty strings)
- Values from build-time
- Values from Vercel (if deployed)

## Create .env File

Create `frontend/.env` with:

```env
REACT_APP_SUPABASE_URL=https://ovbcuszskcjvddarvrre.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_API_URL=http://localhost:5000
```

**Important:** Replace with your actual DEV project values!

## Verify in Code

Add this temporarily to `frontend/src/services/supabase.ts`:

```typescript
console.log('🔍 Supabase Config:', {
  url: process.env.REACT_APP_SUPABASE_URL,
  hasKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
});
```

Then check browser console when app loads.
