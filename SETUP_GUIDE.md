# 🚀 מדריך הפעלה - Meeting Summary Pro

## ✅ שלב 1: בדיקת דרישות מקדימות

### 1.1 התקן Node.js (אם עדיין לא מותקן)
1. הורד מ: https://nodejs.org/ (גרסה 18 ומעלה)
2. התקן את Node.js
3. בדוק שההתקנה הצליחה:
   ```powershell
   node --version
   npm --version
   ```
   צריך לראות מספרי גרסה (למשל: v18.17.0)

---

## ✅ שלב 2: התקנת תלויות

### 2.1 התקן תלויות Backend
```powershell
cd backend
npm install
```

### 2.2 התקן תלויות Frontend
```powershell
cd ..\frontend
npm install
```

---

## ✅ שלב 3: הגדרת Environment Variables

### 3.1 צור קובץ `backend/.env`

צור קובץ חדש בשם `.env` בתיקיית `backend` עם התוכן הבא:

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini API
GEMINI_API_KEY=AIzaSy...

# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=my-super-secret-key-change-this-to-something-random
FRONTEND_URL=http://localhost:3000

# Rate Limits
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_MAX=10
```

**⚠️ חשוב:** החלף את הערכים:
- `SUPABASE_URL` - ה-URL של הפרויקט שלך ב-Supabase
- `SUPABASE_SERVICE_KEY` - ה-service_role key מ-Supabase
- `GEMINI_API_KEY` - ה-API key מ-Google Cloud
- `JWT_SECRET` - מחרוזת אקראית (למשל: `openssl rand -hex 32`)

### 3.2 צור קובץ `frontend/.env`

צור קובץ חדש בשם `.env` בתיקיית `frontend` עם התוכן הבא:

```env
# Supabase (anon key בלבד!)
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API
REACT_APP_API_URL=http://localhost:5000/api

# App
REACT_APP_NAME=Meeting Summary Pro
REACT_APP_VERSION=1.0.0
REACT_APP_AUTO_SAVE_INTERVAL=60000
```

**⚠️ חשוב:** החלף את הערכים:
- `REACT_APP_SUPABASE_URL` - אותו URL כמו ב-backend
- `REACT_APP_SUPABASE_ANON_KEY` - ה-anon/public key מ-Supabase (לא service_role!)

---

## ✅ שלב 4: הגדרת Database (Supabase)

### 4.1 צור פרויקט Supabase
1. לך ל: https://supabase.com/dashboard
2. צור פרויקט חדש
3. שמור את ה-URL וה-Keys

### 4.2 הרץ את סקריפטי ה-Database
1. לך ל-SQL Editor ב-Supabase Dashboard
2. העתק את התוכן מ-`database/schema.sql` והרץ אותו
3. העתק את התוכן מ-`database/views.sql` והרץ אותו

---

## ✅ שלב 5: הגדרת Gemini API

### 5.1 צור API Key
1. לך ל: https://console.cloud.google.com
2. צור פרויקט חדש או בחר פרויקט קיים
3. הפעל את "Generative Language API"
4. צור API Key: APIs & Services → Credentials → Create Credentials → API Key
5. העתק את ה-Key

---

## ✅ שלב 6: הפעלת השרתים

### 6.1 הפעל Backend (Terminal 1)
```powershell
cd backend
npm run dev
```

**✅ צריך לראות:**
```
🚀 Meeting Summary Pro Backend
📡 Server running on port 5000
✅ Connected to Supabase
✅ Gemini API ready
```

### 6.2 הפעל Frontend (Terminal 2 - חלון חדש)
```powershell
cd frontend
npm start
```

**✅ צריך לראות:**
- הדפדפן נפתח אוטומטית ל-http://localhost:3000
- או פתח ידנית: http://localhost:3000

---

## ✅ שלב 7: בדיקה

### 7.1 בדוק Backend
פתח דפדפן ולך ל:
```
http://localhost:5000/health
```

**✅ צריך לראות:**
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": ...,
  "environment": "development",
  "version": "1.0.0"
}
```

### 7.2 בדוק Frontend
1. פתח http://localhost:3000
2. לחץ "+ סיכום חדש"
3. מלא פרטים ונסה לשמור

---

## 🐛 פתרון בעיות

### בעיה: "Module not found"
**פתרון:**
```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### בעיה: "CORS Error"
**פתרון:** ודא שב-`backend/.env` יש:
```
FRONTEND_URL=http://localhost:3000
```

### בעיה: "Supabase connection failed"
**פתרון:**
1. בדוק שה-URL וה-Keys נכונים ב-`.env`
2. ודא שהרצת את `database/schema.sql` ב-Supabase

### בעיה: "Gemini API error"
**פתרון:**
1. בדוק שה-API Key נכון
2. ודא שהפעלת את "Generative Language API" ב-Google Cloud

### בעיה: "Port 5000 already in use"
**פתרון:** שנה את ה-PORT ב-`backend/.env`:
```
PORT=5001
```
ואז עדכן גם את `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5001/api
```

---

## 📝 הערות חשובות

1. **קבצי .env** - לעולם אל תעלה אותם ל-GitHub! הם מכילים מידע רגיש
2. **Node.js** - צריך גרסה 18 ומעלה
3. **שני חלונות Terminal** - צריך להריץ Backend ו-Frontend בנפרד
4. **Database** - צריך להריץ את סקריפטי ה-SQL ב-Supabase לפני השימוש

---

## 🎉 סיימת!

אם הכל עובד, אתה אמור לראות:
- ✅ Backend רץ על פורט 5000
- ✅ Frontend רץ על פורט 3000
- ✅ אפשר ליצור סיכומי פגישות
- ✅ עיבוד AI עובד

**בהצלחה! 🚀**
