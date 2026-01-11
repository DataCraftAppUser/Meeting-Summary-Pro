# How to Approve Your First User

Since you're the first user and there's no admin yet, you need to approve yourself directly in the database.

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your **DEV** project (`ovbcuszskcjvddarvrre`)
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Approve Your User

Run this SQL query (replace `badlbayev@gmail.com` with your actual email if different):

```sql
-- Approve your user and make them admin
UPDATE user_profiles
SET 
  status = 'approved',
  is_admin = true
WHERE email = 'badlbayev@gmail.com';

-- Verify the update
SELECT id, email, status, is_admin, created_at
FROM user_profiles
WHERE email = 'badlbayev@gmail.com';
```

## Step 3: Refresh Your Browser

1. Go back to your app: http://localhost:3000
2. **Refresh the page** (`F5`)
3. You should now be redirected to your hub!

## What Happens Next?

After approval:
- Your status changes from `pending` → `approved`
- You become an admin (`is_admin = true`)
- A **Personal Hub** is automatically created for you (via the trigger `trigger_create_personal_hub_on_approval`)
- You'll be redirected to `/hub/[your-hub-id]/items`

## Access Admin Panel

As an admin, you can now:
- Go to: http://localhost:3000/admin
- Approve/reject other pending users
- Create shared hubs
- Manage hub membership

---

**Note:** If you want to approve other users later, you can use the Admin Panel at `/admin` instead of SQL.
