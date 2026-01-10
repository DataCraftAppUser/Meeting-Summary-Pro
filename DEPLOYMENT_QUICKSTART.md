# 🚀 Quick Start Commands - Vercel Deployment

## Backend Deployment

```powershell
cd backend
vercel login
vercel
```

After setting environment variables in Vercel Dashboard:
```powershell
vercel --prod
```

## Frontend Deployment

```powershell
cd frontend
vercel
```

After setting environment variables in Vercel Dashboard:
```powershell
vercel --prod
```

## Environment Variables Checklist

### Backend
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_KEY
- [ ] GEMINI_API_KEY
- [ ] NODE_ENV
- [ ] JWT_SECRET
- [ ] FRONTEND_URL
- [ ] RATE_LIMIT_WINDOW_MS
- [ ] RATE_LIMIT_MAX_REQUESTS
- [ ] AI_RATE_LIMIT_MAX

### Frontend
- [ ] REACT_APP_SUPABASE_URL
- [ ] REACT_APP_SUPABASE_ANON_KEY
- [ ] REACT_APP_API_URL
- [ ] REACT_APP_NAME
- [ ] REACT_APP_VERSION
- [ ] REACT_APP_AUTO_SAVE_INTERVAL

## Verification URLs

- Backend Health: https://your-backend.vercel.app/health
- Frontend: https://your-frontend.vercel.app

---

**See VERCEL_DEPLOYMENT.md for detailed instructions**
