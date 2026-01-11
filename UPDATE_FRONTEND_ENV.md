# עדכון frontend/.env - חיבור ל-DEV במקום PROD

## הבעיה
הפרונט מתחבר ל-PROD (`rfmpptvrnpzyxqidiomx`) במקום ל-DEV.

## פתרון: מצא את ה-DEV Project ID ועדכן את .env

### שלב 1: מצא את ה-DEV Project ID

1. **פתח Supabase Dashboard:**
   - לך ל: https://supabase.com/dashboard
   - התחבר לחשבון שלך

2. **בחר את הפרויקט DEV:**
   - ברשימת הפרויקטים (משמאל למעלה), בחר את הפרויקט **DEV**
   - **לא** את `rfmpptvrnpzyxqidiomx` (זה PROD)

3. **העתק את ה-Project ID:**
   - ה-URL בדפדפן יראה כך: `https://supabase.com/dashboard/project/XXXXX`
   - או ה-URL של הפרויקט: `https://XXXXX.supabase.co`
   - ה-`XXXXX` הוא ה-Project ID של ה-DEV

4. **קבל את ה-Anon Key:**
   - ב-DEV project, לך ל: **Settings** → **API**
   - העתק את ה-**anon public** key (מתחיל ב-`eyJ...`)

### שלב 2: עדכן את frontend/.env

פתח את הקובץ `frontend/.env` והוסף/עדכן את השורות הבאות:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=https://YOUR-DEV-PROJECT-ID.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-dev-anon-key-here
```

**החלף:**
- `YOUR-DEV-PROJECT-ID` → ה-Project ID של ה-DEV שלך
- `your-dev-anon-key-here` → ה-anon key של ה-DEV

### שלב 3: הפעל מחדש את הפרונט

1. **עצור את השרת:**
   - לחץ `Ctrl+C` בטרמינל שבו רץ הפרונט

2. **הפעל מחדש:**
   ```powershell
   cd frontend
   npm start
   ```

3. **בדוק בקונסול:**
   - פתח http://localhost:3000
   - לחץ `F12` → Console
   - צריך לראות:
     ```
     🔍 Supabase Connection Debug:
     URL: https://YOUR-DEV-PROJECT-ID.supabase.co
     Project ID: YOUR-DEV-PROJECT-ID  ← צריך להיות שונה מ-rfmpptvrnpzyxqidiomx
     Has Anon Key: true
     ```

### שלב 4: בדוק ש-Google OAuth מופעל ב-DEV

1. **ב-Supabase Dashboard (DEV project):**
   - לך ל: **Authentication** → **Providers**
   - מצא **Google** ברשימה
   - ודא שהוא **מופעל** (toggle ON)
   - ודא ש-**Client ID** ו-**Client Secret** מוגדרים נכון

2. **נסה להתחבר:**
   - לך ל: http://localhost:3000/login
   - לחץ "Sign in with Google"
   - צריך לעבוד עכשיו! ✅

---

## איך לדעת איזה פרויקט הוא DEV?

- **DEV** = בדרך כלל יש בו נתוני בדיקה, משמש לפיתוח
- **PROD** = יש בו נתונים אמיתיים, משמש לאפליקציה חיה

אם אתה לא בטוח, בדוק:
- איזה פרויקט יש בו את הטבלאות והנתונים שלך לפיתוח?
- איזה פרויקט רץ עליו המיגרציה `migration_07_multi_tenant_hubs.sql`?
