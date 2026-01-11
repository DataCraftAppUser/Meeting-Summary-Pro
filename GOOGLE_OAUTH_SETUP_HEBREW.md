# מדריך מפורט: הגדרת Google OAuth בקונסול של Google

## שלב 1: יצירת פרויקט ב-Google Cloud Console

1. **היכנס ל-Google Cloud Console:**
   - לך ל: https://console.cloud.google.com
   - התחבר עם חשבון Google שלך

2. **צור פרויקט חדש:**
   - לחץ על תפריט הפרויקטים בחלק העליון (ליד הלוגו של Google Cloud)
   - לחץ על **"NEW PROJECT"** או **"פרויקט חדש"**
   - תן שם לפרויקט: `Meeting-Summary-App` (או כל שם אחר)
   - לחץ על **"CREATE"** או **"צור"**
   - חכה כמה שניות עד שהפרויקט נוצר

## שלב 2: הגדרת OAuth Consent Screen

1. **פתח את OAuth Consent Screen:**
   - בתפריט השמאלי, לך ל: **APIs & Services** → **OAuth consent screen**
   - או: **APIs & Services** → **OAuth consent screen** (אם התפריט באנגלית)

2. **בחר סוג משתמשים:**
   - בחר **"External"** (חיצוני) - אם אין לך Google Workspace
   - או **"Internal"** - אם יש לך Google Workspace
   - לחץ **"CREATE"**

3. **מלא את פרטי האפליקציה:**
   - **App name** (שם האפליקציה): `Meeting Summary Pro`
   - **User support email** (אימייל תמיכה): האימייל שלך
   - **App logo** (לוגו): אפשר לדלג (אופציונלי)
   - **Application home page** (דף הבית): `http://localhost:3000` (לפיתוח)
   - **Authorized domains** (דומיינים מורשים): השאר ריק
   - **Developer contact information** (פרטי יצירת קשר): האימייל שלך
   - לחץ **"SAVE AND CONTINUE"**

4. **Scopes (היקף הרשאות):**
   - בדף הזה, לחץ **"SAVE AND CONTINUE"** (אין צורך להוסיף scopes נוספים)

5. **Test users (משתמשי בדיקה):**
   - אם בחרת "External", תראה דף של Test users
   - הוסף את האימייל שלך (או של משתמשים שאתה רוצה לאפשר)
   - לחץ **"SAVE AND CONTINUE"**

6. **Summary (סיכום):**
   - בדוק את הפרטים
   - לחץ **"BACK TO DASHBOARD"**

## שלב 3: יצירת OAuth Client ID

1. **לך ל-Credentials:**
   - בתפריט השמאלי, לך ל: **APIs & Services** → **Credentials**
   - או: **APIs & Services** → **Credentials**

2. **צור OAuth Client ID:**
   - לחץ על הכפתור **"+ CREATE CREDENTIALS"** בחלק העליון
   - בחר **"OAuth client ID"** מהתפריט הנפתח

3. **הגדר את ה-Client:**
   - **Application type**: בחר **"Web application"**
   - **Name**: תן שם, למשל `Meeting Summary Web Client`

4. **הוסף Authorized JavaScript origins:**
   - לחץ על **"+ ADD URI"**
   - הוסף:
     ```
     http://localhost:3000
     ```
   - אם יש לך domain של פרודקשן, הוסף גם:
     ```
     https://your-domain.vercel.app
     ```

5. **הוסף Authorized redirect URIs:**
   - לחץ על **"+ ADD URI"**
   - הוסף את ה-URLs הבאים (כל אחד בנפרד):
     ```
     http://localhost:3000/auth/callback
     ```
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
   - **חשוב:** החלף `your-project-id` ב-ID האמיתי של הפרויקט שלך ב-Supabase
   - למצוא את ה-ID: לך ל-Supabase Dashboard → Settings → API → Project URL

6. **צור את ה-Client:**
   - לחץ על **"CREATE"**
   - **חשוב מאוד:** תראה חלון עם:
     - **Your Client ID** - העתק ושמור אותו!
     - **Your Client Secret** - העתק ושמור אותו!
   - **אל תסגור את החלון עד ששמרת את שני הערכים!**

## שלב 4: שמירת הפרטים

שמור את הפרטים הבאים במקום בטוח:
- **Client ID**: `xxxxx-xxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxx`

אתה תצטרך אותם בשלב הבא (הגדרה ב-Supabase).

## שלב 5: בדיקה מהירה

לאחר שיצרת את ה-Client ID, תוכל לראות אותו ברשימת ה-Credentials:
- לך ל: **APIs & Services** → **Credentials**
- תראה את ה-Client ID שיצרת ברשימה
- לחץ עליו כדי לערוך/לצפות בפרטים

## טיפים חשובים:

1. **לסביבת פיתוח:**
   - השתמש ב-`http://localhost:3000`
   - אין צורך ב-HTTPS

2. **לפרודקשן:**
   - הוסף את ה-URL של ה-deployment שלך
   - ודא שהוא ב-HTTPS

3. **אם אתה משתמש ב-Vercel:**
   - הוסף את ה-URL של ה-deployment (למשל: `https://your-app.vercel.app`)
   - הוסף גם את ה-redirect URI: `https://your-app.vercel.app/auth/callback`

4. **אם יש שגיאה:**
   - ודא שה-Redirect URIs תואמים בדיוק (כולל http/https, slashes, וכו')
   - ודא שה-Client ID וה-Secret נכונים

## מה הלאה?

לאחר שסיימת, המשך ל:
1. הגדרת Google OAuth ב-Supabase (ראה `SETUP_GOOGLE_OAUTH.md` - שלב 2)
2. הדבק את ה-Client ID וה-Client Secret ב-Supabase Dashboard

## תמונות עזר (תיאור):

**מסך OAuth Consent Screen:**
```
┌─────────────────────────────────────┐
│ OAuth consent screen                │
├─────────────────────────────────────┤
│ User Type:                          │
│ ○ Internal  ● External              │
│                                     │
│ App name: [Meeting Summary Pro]     │
│ User support email: [your@email]    │
│ ...                                 │
│ [SAVE AND CONTINUE]                 │
└─────────────────────────────────────┘
```

**מסך יצירת OAuth Client ID:**
```
┌─────────────────────────────────────┐
│ Create OAuth client ID              │
├─────────────────────────────────────┤
│ Application type:                   │
│ ● Web application                   │
│                                     │
│ Name: [Meeting Summary Web Client] │
│                                     │
│ Authorized JavaScript origins:      │
│ [http://localhost:3000        ] [+]│
│                                     │
│ Authorized redirect URIs:          │
│ [http://localhost:3000/auth/...] [+]│
│ [https://xxx.supabase.co/auth/...] [+]│
│                                     │
│ [CREATE]                            │
└─────────────────────────────────────┘
```
