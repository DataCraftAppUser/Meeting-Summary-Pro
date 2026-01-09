# 🚀 Deployment Guide - Meeting Summary Pro

מדריך הפצה מלא לפרודקשן - Vercel + Supabase + Google Cloud

---

## 📋 לפני שמתחילים - Checklist

- [ ] חשבון Supabase מוכן עם Database
- [ ] Google Cloud עם Gemini API Key
- [ ] חשבון GitHub עם הקוד
- [ ] חשבון Vercel (או Railway)

---

## 🗄️ שלב 1: Supabase Database Setup

### 1.1 הרץ את הSchema:

```sql
-- Log in to Supabase Dashboard
-- https://supabase.com/dashboard

-- Project Settings → Database → SQL Editor

-- Run these files in order:
1. database/schema.sql     (טבלאות, triggers, RLS)
2. database/views.sql      (Views ל-Power BI)
```

### 1.2 שמור את הפרטים:
```
✅ Project URL: https://xxxx.supabase.co
✅ anon/public key: eyJhbGc... (לFrontend)
✅ service_role key: eyJhbGc... (לBackend בלבד!)
```

---

## 🔧 שלב 2: Backend Deploy (Vercel)

### 2.1 Prepare for Vercel:

צור `vercel.json` בתיקיית `backend/`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ]
}
```

### 2.2 Install Vercel CLI:

```bash
npm install -g vercel
```

### 2.3 Deploy Backend:

```bash
cd backend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Project name: meeting-summary-backend
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist
```

### 2.4 הגדר Environment Variables:

ב-Vercel Dashboard → Settings → Environment Variables:

```
SUPABASE_URL = https://xxxx.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGc... (service_role!)
GEMINI_API_KEY = AIzaSy...
NODE_ENV = production
JWT_SECRET = random-strong-secret-key-change-me
FRONTEND_URL = https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS = 60000
RATE_LIMIT_MAX_REQUESTS = 100
AI_RATE_LIMIT_MAX = 10
```

### 2.5 Redeploy:

```bash
vercel --prod
```

✅ **Backend URL:** `https://meeting-summary-backend.vercel.app`

---

## 🎨 שלב 3: Frontend Deploy (Vercel)

### 3.1 Deploy Frontend:

```bash
cd frontend

# Deploy
vercel

# Follow prompts:
# - Project name: meeting-summary-frontend
# - Framework: Create React App
# - Build command: npm run build
# - Output directory: build
```

### 3.2 הגדר Environment Variables:

ב-Vercel Dashboard:

```
REACT_APP_SUPABASE_URL = https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGc... (anon key!)
REACT_APP_API_URL = https://meeting-summary-backend.vercel.app/api
REACT_APP_NAME = Meeting Summary Pro
REACT_APP_VERSION = 1.0.0
REACT_APP_AUTO_SAVE_INTERVAL = 60000
```

### 3.3 Redeploy:

```bash
vercel --prod
```

✅ **Frontend URL:** `https://meeting-summary-frontend.vercel.app`

---

## 🔐 שלב 4: Update CORS

חזור ל-Backend Deploy → Settings → Environment Variables:

עדכן את `FRONTEND_URL`:

```
FRONTEND_URL = https://meeting-summary-frontend.vercel.app
```

Redeploy Backend:

```bash
cd backend
vercel --prod
```

---

## ✅ שלב 5: בדיקות

### 5.1 Backend Health Check:

```bash
curl https://meeting-summary-backend.vercel.app/health
```

Expected:

```json
{
  "status": "OK",
  "timestamp": "2025-01-...",
  "environment": "production"
}
```

### 5.2 Gemini AI Test:

```bash
curl https://meeting-summary-backend.vercel.app/api/ai/test
```

Expected:

```json
{
  "success": true,
  "message": "Gemini API is working"
}
```

### 5.3 Frontend Test:

1. פתח `https://meeting-summary-frontend.vercel.app`
2. צור חשבון (אם יש Auth)
3. צור סיכום ראשון
4. לחץ "שמור ועבד בAI"
5. ודא שהעיבוד עובד ✅

---

## 🎯 אופציה 2: Railway (חלופה לVercel Backend)

Railway מתאים יותר ל-Backend ארוך טווח (אם Vercel Serverless לא מספיק).

### Deploy ל-Railway:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy Backend
cd backend
railway init
railway up

# Set environment variables via dashboard
railway open
```

הגדר את כל ה-Environment Variables בדאשבורד.

---

## 📊 שלב 6: חיבור Power BI

### Connection String:

```
Server: db.xxxxxxxxxxxx.supabase.co
Database: postgres
Port: 5432
Username: postgres
Password: [Your Supabase DB Password]
```

### Views זמינים:

- `vw_meetings_summary`
- `vw_client_summary`
- `vw_project_summary`
- `vw_monthly_stats`
- `vw_weekly_activity`

**ראה:** `docs/POWER_BI.md` למדריך מפורט

---

## 🔄 CI/CD (אופציונלי)

### Auto-deploy מ-GitHub:

1. ב-Vercel Dashboard → Settings → Git Integration
2. חבר את הרפוזיטורי
3. כל push ל-`main` יעשה deploy אוטומטי ✅

---

## 🐛 בעיות נפוצות

### CORS Error:

**Problem:** Frontend לא יכול להגיע ל-Backend

**Solution:**

1. בדוק ש-`FRONTEND_URL` נכון ב-Backend env vars
2. בדוק ש-`REACT_APP_API_URL` נכון ב-Frontend env vars
3. Redeploy שניהם

### Gemini API Error:

**Problem:** "AI service configuration error"

**Solution:**

1. בדוק ש-`GEMINI_API_KEY` נכון
2. ודא שהפעלת "Generative Language API" ב-Google Cloud Console
3. בדוק quota: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

### Database Connection Failed:

**Problem:** Backend לא מצליח להתחבר ל-Supabase

**Solution:**

1. בדוק `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
2. ודא Network Access ב-Supabase מאפשר 0.0.0.0/0
3. בדוק Database Status ב-Supabase Dashboard

---

## 📈 Monitoring

### Vercel Analytics (חינם):

- ב-Vercel Dashboard → Analytics
- מראה pageviews, performance, errors

### Supabase Monitoring:

- ב-Supabase Dashboard → Database → Monitoring
- CPU, Memory, Connections

### Gemini Usage:

- ב-Google Cloud Console → APIs & Services → Quotas
- עוקב אחרי מספר requests וקרדיטים

---

## 💰 עלויות צפויות (30 סיכומים/חודש)

| שירות | Free Tier | עלות חודשית |
|-------|-----------|-------------|
| **Vercel** | ✅ מספיק | $0 |
| **Supabase** | ✅ 500MB | $0 |
| **Google Gemini** | $300 קרדיט חדשים | $0.045 |
| **סה"כ** | - | **$0.045** |

🎉 **פחות מדולר לשנה!**

---

## 🎊 מזל טוב! האפליקציה חיה!

```
Frontend: https://meeting-summary-frontend.vercel.app
Backend: https://meeting-summary-backend.vercel.app
Database: Supabase
AI: Google Gemini 1.5 Flash
```

**צריך עזרה?** ראה `README.md` או פתח Issue ב-GitHub.

---

**Built with ❤️ | Deployed with 🚀**
