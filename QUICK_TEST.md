# 🚀 בדיקה מהירה - Frontend לא טוען פריטים

## ✅ שלב 1: בדוק Backend מקומי

```powershell
# בדוק שה-Backend רץ
Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing

# בדוק Workspaces
Invoke-WebRequest -Uri "http://localhost:5000/api/workspaces" -UseBasicParsing

# בדוק Items  
Invoke-WebRequest -Uri "http://localhost:5000/api/items" -UseBasicParsing
```

**אם מקבלים 200 OK** ✅ - Backend עובד  
**אם מקבלים 404** ❌ - יש בעיה ב-routes

---

## ✅ שלב 2: בדוק Frontend Configuration

### 1. בדוק את ה-.env:
```powershell
cd frontend
Get-Content .env
```

**צריך להיות:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 2. אם השתנה, רענן את ה-Frontend:
```powershell
# עצור את ה-Frontend (Ctrl+C)
# הפעל מחדש
npm start
```

---

## ✅ שלב 3: בדוק ב-Console של הדפדפן

1. פתח `http://localhost:3000`
2. לחץ F12 (Developer Tools)
3. לך ל-**Network** tab
4. רענן את הדף (F5)
5. חפש בקשות ל-`/api/workspaces` ו-`/api/items`

**בדוק:**
- **Request URL**: האם זה `http://localhost:5000/api/...` או Vercel?
- **Status**: 200 = טוב, 404 = route לא נמצא
- **Response**: מה השרת מחזיר?

---

## 🔧 פתרונות מהירים

### פתרון 1: Backend לא רץ
```powershell
cd backend
npm run dev
```

### פתרון 2: Frontend לא קורא את ה-.env
```powershell
cd frontend
# עצור את ה-Frontend
# מחק cache
Remove-Item -Recurse -Force node_modules\.cache
# הפעל מחדש
npm start
```

### פתרון 3: Frontend מפנה ל-Vercel במקום localhost
בדוק אם יש קובץ `.env.production` או `.env.local`:
```powershell
cd frontend
Get-ChildItem .env*
```

אם יש, מחק או שנה ל-localhost.

---

## 🎯 בדיקה מהירה - הכל ביחד

```powershell
# 1. בדוק Backend
Write-Host "=== Backend ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5000/api/workspaces" -UseBasicParsing
    Write-Host "✅ Workspaces: $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Workspaces: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. בדוק Frontend .env
Write-Host "`n=== Frontend Config ===" -ForegroundColor Cyan
cd frontend
if (Test-Path .env) {
    $env = Get-Content .env
    Write-Host "Current: $env" -ForegroundColor Yellow
    if ($env -match "localhost:5000/api") {
        Write-Host "✅ מוגדר נכון" -ForegroundColor Green
    } else {
        Write-Host "❌ צריך להיות: REACT_APP_API_URL=http://localhost:5000/api" -ForegroundColor Red
    }
} else {
    Write-Host "❌ קובץ .env לא קיים!" -ForegroundColor Red
}
```

---

## 📋 Checklist

- [ ] Backend רץ על פורט 5000
- [ ] `/api/workspaces` מחזיר 200
- [ ] `/api/items` מחזיר 200  
- [ ] Frontend `.env` = `http://localhost:5000/api`
- [ ] Frontend רץ על פורט 3000
- [ ] אין שגיאות CORS ב-Console
- [ ] Network requests מצליחים
