# 🔐 Environment Variables Setup Guide

## ✅ Step 1: Get Supabase Credentials

1. Go to: https://supabase.com/dashboard
2. Sign in or create an account
3. Create a new project (or use existing):
   - Project name: "meeting-summaries" (or any name)
   - Database password: Create a strong password (save it!)
   - Region: Choose closest to you (Europe recommended)
4. Wait 2-3 minutes for project setup
5. Go to: **Settings → API**
6. Copy these values:
   - **Project URL** → Use for `SUPABASE_URL`
   - **anon public** key → Use for `REACT_APP_SUPABASE_ANON_KEY` (frontend)
   - **service_role** key → Use for `SUPABASE_SERVICE_KEY` (backend) ⚠️ Keep this secret!

---

## ✅ Step 2: Get Gemini API Key

1. Go to: https://console.cloud.google.com
2. Sign in with your Google account
3. Create a new project (or select existing):
   - Project name: "meeting-summary-app"
4. Enable the API:
   - Go to: **APIs & Services → Library**
   - Search: "Generative Language API"
   - Click **Enable**
5. Create API Key:
   - Go to: **APIs & Services → Credentials**
   - Click: **Create Credentials → API Key**
   - Copy the API key
   - (Optional) Click **Restrict Key** → Select "Generative Language API" for security

---

## ✅ Step 3: Update backend/.env

Open `backend/.env` and replace:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here
JWT_SECRET=generate-a-random-string-here
```

**To generate JWT_SECRET:**
- Use any random string (at least 32 characters)
- Or use: `openssl rand -hex 32` (if you have OpenSSL)
- Or just type random characters

---

## ✅ Step 4: Update frontend/.env

Open `frontend/.env` and replace:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Use the **anon/public** key here, NOT the service_role key!

---

## ✅ Step 5: Setup Database

After creating Supabase project:

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy the entire content from `database/schema.sql`
4. Paste and click **Run** (or press F5)
5. Wait for success message
6. Repeat for `database/views.sql`

---

## ✅ Step 6: Verify Setup

### Test Backend:
```powershell
cd backend
npm run dev
```

Should see:
```
✅ Connected to Supabase
✅ Gemini API ready
📡 Server running on port 5000
```

### Test Frontend:
```powershell
cd frontend
npm start
```

Should open browser at http://localhost:3000

---

## 🐛 Troubleshooting

### "Supabase connection failed"
- Check that URLs and keys are correct
- Make sure you ran `database/schema.sql` in Supabase SQL Editor

### "Gemini API error"
- Verify API key is correct
- Make sure "Generative Language API" is enabled in Google Cloud

### "CORS Error"
- Make sure `FRONTEND_URL=http://localhost:3000` in `backend/.env`

---

## 🔒 Security Notes

- ⚠️ **Never commit `.env` files to Git!**
- ⚠️ **Never share your `SUPABASE_SERVICE_KEY` or `GEMINI_API_KEY`**
- ✅ The `.env` files are already in `.gitignore` (should be)

---

## 💰 Cost Estimate

- **Supabase:** Free tier (500MB database) - $0/month
- **Gemini API:** ~$0.0015 per summary - ~$0.045/month for 30 summaries
- **Total:** Less than $1/year! 🎉

---

**Ready?** Once you've filled in the `.env` files, we can test the servers!
