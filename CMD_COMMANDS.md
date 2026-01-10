# 🚀 פקודות CMD להרצת השרתים

## 📋 פקודות מהירות

### סגירת תהליכים קיימים:

```cmd
REM סגירת Backend (פורט 5000)
for /f "tokens=5" %a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %a

REM סגירת Frontend (פורט 3000)
for /f "tokens=5" %a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %a
```

### הרצת Backend (Terminal 1):

```cmd
cd backend
npm run dev
```

### הרצת Frontend (Terminal 2 - חלון חדש):

```cmd
cd frontend
npm start
```

---

## 🎯 שימוש ב-Batch Files

### אפשרות 1: START_SERVERS.bat
פשוט לחץ כפול על `START_SERVERS.bat` - זה יפתח שני חלונות CMD אוטומטית!

### אפשרות 2: STOP_SERVERS.bat
לחץ כפול על `STOP_SERVERS.bat` כדי לסגור את כל השרתים.

---

## 📝 פקודות ידניות (אם צריך)

### 1. סגירת תהליכים ידנית:

```cmd
REM מצא את ה-PID של התהליך
netstat -ano | findstr ":5000"
netstat -ano | findstr ":3000"

REM סגור את התהליך (החלף XXXX ב-PID)
taskkill /F /PID XXXX
```

### 2. הרצת Backend:

```cmd
cd C:\Users\Badlb\OneDrive\Cursor\Meeting-Summary-Pro\backend
npm run dev
```

**צריך לראות:**
```
🚀 Meeting Summary Pro Backend
📡 Server running on port 5000
✅ Connected to Supabase
✅ Gemini API ready
```

### 3. הרצת Frontend:

```cmd
cd C:\Users\Badlb\OneDrive\Cursor\Meeting-Summary-Pro\frontend
npm start
```

**צריך לראות:**
```
Compiled successfully!
You can now view meeting-summary-frontend in the browser.
  Local:            http://localhost:3000
```

---

## 🔍 בדיקות מהירות

### בדוק שהשרתים רצים:

```cmd
netstat -ano | findstr ":5000"
netstat -ano | findstr ":3000"
```

### בדוק Backend:

```cmd
curl http://localhost:5000/health
```

או פתח בדפדפן:
```
http://localhost:5000/health
```

### בדוק Frontend:

פתח בדפדפן:
```
http://localhost:3000
```

---

## ⚠️ פתרון בעיות

### "Port already in use"
```cmd
REM מצא וסגור את התהליך
netstat -ano | findstr ":5000"
taskkill /F /PID [PID_NUMBER]
```

### "npm is not recognized"
- ודא ש-Node.js מותקן
- בדוק: `node --version`
- בדוק: `npm --version`

### "Cannot find module"
```cmd
cd backend
npm install

cd ../frontend
npm install
```

---

## 📋 Checklist מהיר

- [ ] סגרתי תהליכים קיימים על פורטים 5000 ו-3000
- [ ] Backend רץ: `npm run dev` ב-`backend/`
- [ ] Frontend רץ: `npm start` ב-`frontend/`
- [ ] Backend זמין: `http://localhost:5000/health`
- [ ] Frontend זמין: `http://localhost:3000`

---

**💡 טיפ:** השתמש ב-`START_SERVERS.bat` להרצה אוטומטית!
