# Next Steps After Setting Up Google OAuth

## ✅ What You've Completed:
- ✅ Database migration (step 1)
- ✅ Google OAuth setup in Google Cloud Console
- ✅ Google OAuth configuration in Supabase

## 🎯 What to Do Now:

### Step 1: Test Google OAuth Login

1. **Start your frontend:**
   ```bash
   cd frontend
   npm start
   ```

2. **Open your browser:**
   - Go to: http://localhost:3000/login
   - Click "Sign in with Google"
   - Select your Google account
   - You should be redirected back to the app

3. **What should happen:**
   - If this is your first login, you'll be redirected to `/waiting-approval`
   - Your user profile will be created automatically with `status: 'pending'`

### Step 2: Create Your First Admin User

After logging in once, you need to make yourself an admin:

1. **Go to Supabase SQL Editor:**
   - Supabase Dashboard → SQL Editor → New query

2. **Find your User ID:**
   ```sql
   SELECT id, email, created_at 
   FROM auth.users 
   ORDER BY created_at DESC;
   ```
   - Copy your `id` from the results

3. **Make yourself admin:**
   ```sql
   -- Replace YOUR_USER_ID with the ID you copied
   INSERT INTO user_profiles (id, email, status, is_admin)
   VALUES (
     'YOUR_USER_ID',
     'your-email@gmail.com',  -- Replace with your email
     'approved',
     true
   )
   ON CONFLICT (id) 
   DO UPDATE SET 
     status = 'approved',
     is_admin = true;
   ```

4. **Verify:**
   ```sql
   SELECT id, email, status, is_admin 
   FROM user_profiles 
   WHERE is_admin = true;
   ```

### Step 3: Check Personal Hub Creation

After marking yourself as approved, a Personal Hub should be created automatically:

```sql
-- Check if Personal Hub was created
SELECT h.*, hm.role
FROM hubs h
INNER JOIN hub_members hm ON h.id = hm.hub_id
WHERE hm.user_id = 'YOUR_USER_ID' AND h.type = 'personal';
```

**If no Personal Hub exists**, create it manually:
```sql
DO $$
DECLARE
  user_id UUID := 'YOUR_USER_ID';  -- Replace with your user ID
  user_email TEXT;
  user_name TEXT;
  new_hub_id UUID;
BEGIN
  SELECT email, raw_user_meta_data->>'full_name' INTO user_email, user_name
  FROM auth.users WHERE id = user_id;
  
  INSERT INTO hubs (name, type, color_theme, icon, created_by)
  VALUES (
    COALESCE(user_name, user_email) || '''s Hub',
    'personal',
    'green',
    'person',
    user_id
  )
  RETURNING id INTO new_hub_id;
  
  INSERT INTO hub_members (hub_id, user_id, role)
  VALUES (new_hub_id, user_id, 'owner');
  
  UPDATE user_profiles 
  SET last_active_hub_id = new_hub_id 
  WHERE id = user_id;
  
  RAISE NOTICE 'Personal Hub created: %', new_hub_id;
END $$;
```

### Step 4: Test the Full Flow

1. **Sign out and sign in again:**
   - Sign out from the app
   - Sign in again with Google
   - You should now be redirected to `/hub/[hub_id]/items` (not `/waiting-approval`)

2. **Check Admin Panel:**
   - Go to: http://localhost:3000/admin
   - You should see the admin dashboard
   - You can approve/reject other users here

3. **Check Hub Switcher:**
   - Look at the header
   - You should see your Personal Hub name with a green indicator
   - Click on it to see the hub switcher dropdown

### Step 5: Test Creating an Item

1. **Create a new item:**
   - Click "תוכן חדש" (New Content) button
   - Fill in the form
   - Save

2. **Verify:**
   - The item should be created with `hub_id`
   - You should see it in the items list

## 🔍 Troubleshooting

### If login doesn't work:
- Check browser Console (F12) for errors
- Verify Redirect URLs in Google Cloud Console match exactly
- Check Supabase logs: Dashboard → Logs → Auth Logs

### If you're stuck on `/waiting-approval`:
- Make sure you ran the SQL to set `status = 'approved'`
- Check: `SELECT * FROM user_profiles WHERE email = 'your-email@gmail.com';`

### If Admin Panel doesn't show:
- Verify `is_admin = true` in user_profiles
- Check browser Console for errors
- Try signing out and signing in again

### If no Personal Hub:
- Run the manual creation script (Step 3 above)
- Check if the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_create_personal_hub_on_approval';`

## 📋 Quick Checklist:

- [ ] Google OAuth login works
- [ ] User profile created automatically
- [ ] Made yourself admin via SQL
- [ ] Personal Hub created (automatically or manually)
- [ ] Can access `/admin` panel
- [ ] Can see Hub Switcher in header
- [ ] Can create items in your hub

## 🎉 You're Done!

Once all the above works, your multi-tenant hub architecture is fully set up and ready to use!
