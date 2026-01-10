# 🚀 מדריך פריסה מהיר ל-Vercel

## ✅ לפני שמתחילים - Checklist

- [ ] חשבון GitHub עם הקוד
- [ ] חשבון Supabase עם Database מוגדר
- [ ] Google Gemini API Key
- [ ] חשבון Vercel (חינם!)

---

## שלב 1: הכנת הפרויקט 📦

### 1.1 וודא שהקוד ב-Git

```bash
# בתיקייה הראשית של הפרויקט
git status

# אם יש שינויים שלא נשמרו:
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## שלב 2: פריסת Backend ל-Vercel 🔧

### 2.1 התקן Vercel CLI

```powershell
npm install -g vercel
```

### 2.2 התחבר ל-Vercel

```powershell
vercel login
```

יפתח דפדפן - אשר את ההתחברות.

### 2.3 Deploy Backend

```powershell
cd backend
vercel
```

**עקוב אחרי ההנחיות:**

```
? Set up and deploy "backend"? Yes
? Which scope? [Your Account]
? Link to existing project? No
? What's your project's name? meeting-summary-backend
? In which directory is your code located? ./
? Want to override the settings? No
```

Vercel יעלה את הקוד ויתן לך URL זמני כמו:
`https://meeting-summary-backend-xxx.vercel.app`

### 2.4 הגדר Environment Variables

עכשיו צריך להגדיר את המשתנים ב-Vercel:

**אופציה 1: דרך Dashboard (מומלץ)**

1. פתח: https://vercel.com/dashboard
2. בחר את הפרויקט `meeting-summary-backend`
3. לך ל-Settings → Environment Variables
4. הוסף את כל המשתנים הבאים:

```
SUPABASE_URL = https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGc... (ה-service_role key!)
GEMINI_API_KEY = AIzaSy...
NODE_ENV = production
JWT_SECRET = your-super-secret-key-please-change-this
FRONTEND_URL = https://meeting-summary-frontend.vercel.app
RATE_LIMIT_WINDOW_MS = 60000
RATE_LIMIT_MAX_REQUESTS = 100
AI_RATE_LIMIT_MAX = 10
```

**⚠️ חשוב:**
- השתמש ב-`service_role` key מ-Supabase (לא ב-`anon` key!)
- שמור את ה-JWT_SECRET במקום בטוח

**אופציה 2: דרך CLI**

```powershell
vercel env add SUPABASE_URL
# הזן את הערך כשזה מבקש
vercel env add SUPABASE_SERVICE_KEY
vercel env add GEMINI_API_KEY
# וכו' לכל משתנה...
```

### 2.5 Redeploy עם המשתנים

```powershell
vercel --prod
```

✅ **Backend מוכן!** שמור את ה-URL שקיבלת:
`https://meeting-summary-backend.vercel.app`

---

## שלב 3: פריסת Frontend ל-Vercel 🎨

### 3.1 Deploy Frontend

```powershell
cd ..\frontend
vercel
```

**עקוב אחרי ההנחיות:**

```
? Set up and deploy "frontend"? Yes
? Which scope? [Your Account]
? Link to existing project? No
? What's your project's name? meeting-summary-frontend
? In which directory is your code located? ./
? Want to override the settings? No
```

### 3.2 הגדר Environment Variables

ב-Vercel Dashboard:

1. בחר את הפרויקט `meeting-summary-frontend`
2. Settings → Environment Variables
3. הוסף:

```
REACT_APP_SUPABASE_URL = https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGc... (ה-anon key הזה!)
REACT_APP_API_URL = https://meeting-summary-backend.vercel.app/api
REACT_APP_NAME = Meeting Summary Pro
REACT_APP_VERSION = 1.0.0
REACT_APP_AUTO_SAVE_INTERVAL = 60000
```

**⚠️ חשוב:**
- כאן משתמשים ב-`anon` key מ-Supabase (לא `service_role`!)
- ה-`REACT_APP_API_URL` צריך להצביע ל-Backend שעלה קודם

### 3.3 Redeploy

```powershell
vercel --prod
```

✅ **Frontend מוכן!**
`https://meeting-summary-frontend.vercel.app`

---

## שלב 4: עדכון CORS ב-Backend 🔄

עכשיו שיש לנו את כתובת ה-Frontend האמיתית, צריך לעדכן את ה-CORS:

1. חזור ל-Backend ב-Vercel Dashboard
2. Settings → Environment Variables
3. ערוך את `FRONTEND_URL`:

```
FRONTEND_URL = https://meeting-summary-frontend.vercel.app
```

4. Redeploy:

```powershell
cd ..\backend
vercel --prod
```

---

## שלב 5: בדיקות ✅

### 5.1 בדוק Backend

פתח בדפדפן:
```
https://meeting-summary-backend.vercel.app/health
```

צריך לקבל:
```json
{
  "status": "OK",
  "timestamp": "2026-01-10T...",
  "environment": "production"
}
```

### 5.2 בדוק Frontend

פתח:
```
https://meeting-summary-frontend.vercel.app
```

נסה:
1. צור חשבון חדש (אם יש Auth)
2. צור סיכום ראשון
3. לחץ "שמור ועבד בAI"
4. ודא שהסיכום מעובד נכון ✨

### 5.3 בדוק AI

בדפדפן, פתח Console (F12) וודא שאין שגיאות CORS או API.

---

## שלב 6: הגדרות נוספות (אופציונלי) ⚙️

### 6.1 הוסף Domain משלך

ב-Vercel Dashboard → Settings → Domains:
```
mydomain.com → meeting-summary-frontend
api.mydomain.com → meeting-summary-backend
```

### 6.2 Auto-Deploy מ-GitHub

ב-Vercel Dashboard → Settings → Git:

1. חבר את הרפוזיטורי
2. כל push ל-`main` יעשה deploy אוטומטי! 🎉

### 6.3 הגדר Redirects (אם נדרש)

צור `vercel.json` ב-Frontend:

```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

---

## 🐛 פתרון בעיות נפוצות

### בעיה: "CORS Error" ב-Console

**פתרון:**

1. בדוק ש-`FRONTEND_URL` ב-Backend נכון
2. בדוק ש-`REACT_APP_API_URL` ב-Frontend נכון
3. Redeploy את שני הצדדים:

```powershell
cd backend
vercel --prod

cd ..\frontend
vercel --prod
```

### בעיה: "Failed to fetch" או "Network Error"

**פתרון:**

1. בדוק ש-Backend עובד:
   ```
   https://your-backend.vercel.app/health
   ```

2. בדוק ש-Environment Variables הוגדרו נכון ב-Vercel Dashboard

3. חפש logs ב-Vercel Dashboard → Functions → View Logs

### בעיה: "Gemini API Error"

**פתרון:**

1. ודא ש-`GEMINI_API_KEY` נכון ב-Backend Environment Variables
2. בדוק ב-Google Cloud Console שהפעלת את "Generative Language API"
3. בדוק quota: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

### בעיה: "Database Connection Failed"

**פתרון:**

1. בדוק ש-`SUPABASE_URL` + `SUPABASE_SERVICE_KEY` נכונים
2. ב-Supabase Dashboard → Settings → API - העתק שוב את הערכים
3. ודא ש-Database Status הוא "Healthy"

### בעיה: "Build Failed"

**פתרון:**

1. בדוק logs ב-Vercel Dashboard
2. נסה build מקומי:

```powershell
cd backend
npm run build

cd ..\frontend
npm run build
```

3. אם יש שגיאות TypeScript, תקן אותן ועשה push

---

## 📊 ניטור ומעקב

### Vercel Analytics

ב-Vercel Dashboard → Analytics תראה:
- Pageviews
- Performance
- Errors
- User traffic

### Vercel Logs

ב-Vercel Dashboard → Functions → View Logs:
- Backend logs בזמן אמת
- Errors
- API calls

### Supabase Monitoring

ב-Supabase Dashboard → Database → Monitoring:
- CPU usage
- Memory
- Database connections
- Query performance

---

## 💰 עלויות צפויות

| שירות | Free Tier | צריכת חודשית (30 סיכומים) |
|-------|-----------|----------------------------|
| **Vercel** | 100GB bandwidth<br>100 builds/day | מספיק בשפע! |
| **Supabase** | 500MB DB<br>2GB storage | מספיק! |
| **Google Gemini** | $300 קרדיט חדשים | $0.045/חודש |
| **סה"כ** | - | **~$0 (חינם!)** |

🎉 **בזכות $300 הקרדיט מ-Google, האפליקציה חינמית לחלוטין לשנתיים!**

---

## 🎊 מזל טוב! האפליקציה באוויר! 🚀

```
✅ Frontend: https://meeting-summary-frontend.vercel.app
✅ Backend: https://meeting-summary-backend.vercel.app
✅ Database: Supabase
✅ AI: Google Gemini 1.5 Flash
```

### מה הלאה?

1. 🎨 **Customize** - התאם צבעים, לוגו, שם
2. 🌐 **Domain** - חבר דומיין משלך
3. 📊 **Analytics** - עקוב אחרי שימוש
4. 🔒 **Security** - הוסף Auth אם נדרש
5. 📈 **Scale** - הוסף תכונות חדשות

---

## 📞 צריך עזרה?

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Gemini API Docs**: https://ai.google.dev/docs

**שאלות?** פתח Issue ב-GitHub או שלח מייל.

---

**Built with ❤️ | Deployed with 🚀 Vercel**

**Version**: 1.0.0  
**Last Updated**: January 2026
