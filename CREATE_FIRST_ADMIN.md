# Creating the First Admin User

## Method 1: Via Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor:**
   - In the left menu, click **SQL Editor**
   - Click **"New query"**

3. **Find your User ID:**
   ```sql
   -- List all users in auth.users
   SELECT id, email, created_at 
   FROM auth.users 
   ORDER BY created_at DESC;
   ```
   - Copy the `id` of the user you want to make an admin

4. **Create/Update the user_profile:**
   ```sql
   -- Replace YOUR_USER_ID with the ID you found in the previous step
   INSERT INTO user_profiles (id, email, status, is_admin)
   VALUES (
     'YOUR_USER_ID',
     'your-email@example.com',  -- Replace with your email
     'approved',
     true
   )
   ON CONFLICT (id) 
   DO UPDATE SET 
     status = 'approved',
     is_admin = true;
   ```

5. **Run the query:**
   - Click **"Run"** or **Ctrl+Enter**

6. **Verify the user is an admin:**
   ```sql
   SELECT id, email, status, is_admin 
   FROM user_profiles 
   WHERE is_admin = true;
   ```

## Method 2: Via Supabase Dashboard (if you have access)

1. **Go to Table Editor:**
   - In the left menu, click **Table Editor**
   - Select the **`user_profiles`** table

2. **Find the user:**
   - Search for your user by email
   - Or create a new row if it doesn't exist

3. **Update the fields:**
   - `id`: The User ID from `auth.users`
   - `email`: The user's email
   - `status`: `approved`
   - `is_admin`: `true` (check the checkbox)

4. **Save**

## Method 3: Via API (after first login)

If you've already signed in with Google, you can use SQL Editor:

```sql
-- Find your user by email
SELECT id, email 
FROM auth.users 
WHERE email = 'your-email@gmail.com';

-- Update the profile
UPDATE user_profiles 
SET status = 'approved', is_admin = true 
WHERE email = 'your-email@gmail.com';
```

## Automatic Personal Hub Creation

After marking a user as approved, the Trigger should automatically create a Personal Hub. If it didn't happen:

```sql
-- Check if Personal Hub exists
SELECT h.*, hm.role
FROM hubs h
INNER JOIN hub_members hm ON h.id = hm.hub_id
WHERE hm.user_id = 'YOUR_USER_ID' AND h.type = 'personal';

-- If it doesn't exist, create manually:
DO $$
DECLARE
  user_id UUID := 'YOUR_USER_ID';
  user_email TEXT;
  user_name TEXT;
  new_hub_id UUID;
BEGIN
  -- Get user details
  SELECT email, raw_user_meta_data->>'full_name' INTO user_email, user_name
  FROM auth.users WHERE id = user_id;
  
  -- Create Personal Hub
  INSERT INTO hubs (name, type, color_theme, icon, created_by)
  VALUES (
    COALESCE(user_name, user_email) || '''s Hub',
    'personal',
    'green',
    'person',
    user_id
  )
  RETURNING id INTO new_hub_id;
  
  -- Add user as owner
  INSERT INTO hub_members (hub_id, user_id, role)
  VALUES (new_hub_id, user_id, 'owner');
  
  -- Update last_active_hub_id
  UPDATE user_profiles 
  SET last_active_hub_id = new_hub_id 
  WHERE id = user_id;
  
  RAISE NOTICE 'Personal Hub created: %', new_hub_id;
END $$;
```

## Verification

1. **Sign in to the application:**
   - Go to: http://localhost:3000/login
   - Sign in with Google (the account you marked as admin)

2. **Check access to Admin Panel:**
   - Go to: http://localhost:3000/admin
   - You should see the admin dashboard

3. **Check if you have a Personal Hub:**
   - You should be automatically redirected to `/hub/[hub_id]/items`
   - Or you'll see the Hub Switcher in the Header

## Troubleshooting

**If you can't see the Admin Panel:**
```sql
-- Check the status
SELECT id, email, status, is_admin 
FROM user_profiles 
WHERE email = 'your-email@gmail.com';
```

**If there's no Personal Hub:**
- Run the manual creation script (Method 3 above)
- Or approve the user through the Admin Panel (if you have another admin)

**If there's an RLS error:**
- Make sure the migration ran successfully
- Check that RLS policies exist:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
  ```
