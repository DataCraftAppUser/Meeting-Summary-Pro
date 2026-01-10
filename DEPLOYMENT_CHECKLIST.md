# 🎯 Deployment Checklist - Meeting Summary Pro

## Pre-Deployment Checklist

### 1. Database (Supabase)
- [ ] Account created
- [ ] Database schema loaded (`database/schema.sql`)
- [ ] Views created (`database/views.sql`)
- [ ] Copy Project URL
- [ ] Copy `anon` key (for frontend)
- [ ] Copy `service_role` key (for backend)

### 2. Google Gemini API
- [ ] Google Cloud account created
- [ ] Project created
- [ ] Generative Language API enabled
- [ ] API Key generated
- [ ] Quota checked (should be 60 requests/min on free tier)

### 3. GitHub
- [ ] Code pushed to repository
- [ ] All changes committed
- [ ] Branch is `main` or `master`

### 4. Vercel Account
- [ ] Account created at https://vercel.com
- [ ] Connected to GitHub account

---

## Deployment Steps

### Step 1: Deploy Backend

```powershell
# Install Vercel CLI (one time)
npm install -g vercel

# Login
vercel login

# Deploy backend
cd backend
vercel

# After deployment, go to Vercel Dashboard and set environment variables
# Then redeploy:
vercel --prod
```

**Backend Environment Variables:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (service_role!)
GEMINI_API_KEY=AIzaSy...
NODE_ENV=production
JWT_SECRET=random-secret-change-this
FRONTEND_URL=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_MAX=10
```

✅ **Backend URL**: Save it! `https://meeting-summary-backend-xxx.vercel.app`

### Step 2: Deploy Frontend

```powershell
cd ../frontend
vercel

# After deployment, set environment variables in Vercel Dashboard
# Then redeploy:
vercel --prod
```

**Frontend Environment Variables:**
```
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ... (anon key!)
REACT_APP_API_URL=https://your-backend.vercel.app/api
REACT_APP_NAME=Meeting Summary Pro
REACT_APP_VERSION=1.0.0
REACT_APP_AUTO_SAVE_INTERVAL=60000
```

✅ **Frontend URL**: `https://meeting-summary-frontend-xxx.vercel.app`

### Step 3: Update Backend CORS

Go back to Backend environment variables and update:
```
FRONTEND_URL=https://meeting-summary-frontend-xxx.vercel.app
```

Then redeploy backend:
```powershell
cd backend
vercel --prod
```

---

## Verification

### Test Backend
```
https://your-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-01-10T...",
  "environment": "production"
}
```

### Test Frontend
1. Open `https://your-frontend.vercel.app`
2. Create a test meeting
3. Try AI processing
4. Verify no console errors

---

## Post-Deployment

### Optional: Custom Domain
1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `app.yourdomain.com` for frontend)
3. Add API subdomain (e.g., `api.yourdomain.com` for backend)
4. Update environment variables accordingly

### Optional: Enable Auto-Deploy
1. Vercel Dashboard → Settings → Git
2. Connect your GitHub repository
3. Every push to `main` will auto-deploy! 🎉

---

## Troubleshooting

### Issue: CORS Error
**Solution**: Check `FRONTEND_URL` in backend and `REACT_APP_API_URL` in frontend match actual URLs

### Issue: "Failed to fetch"
**Solution**: Check backend health endpoint and environment variables

### Issue: "Gemini API Error"
**Solution**: Verify `GEMINI_API_KEY` is correct and API is enabled in Google Cloud Console

### Issue: Database Connection Failed
**Solution**: Check Supabase URL and keys are correct

---

## Files Created for Deployment

- ✅ `backend/vercel.json` - Vercel configuration for backend
- ✅ `backend/.vercelignore` - Files to exclude from deployment
- ✅ `VERCEL_DEPLOYMENT.md` - Detailed deployment guide (Hebrew)
- ✅ `DEPLOYMENT_QUICKSTART.md` - Quick reference
- ✅ `DEPLOYMENT_CHECKLIST.md` - This file

---

**Need help?** See full guide in `VERCEL_DEPLOYMENT.md`

**Version**: 1.0.0  
**Ready to deploy**: ✅
