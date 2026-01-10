@echo off
echo ========================================
echo   Meeting Summary Pro - Start Servers
echo ========================================
echo.

REM סגירת תהליכים קיימים על פורטים 5000 ו-3000
echo [1/4] Closing existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Closing process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Closing process on port 3000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 >nul
echo.

REM בדיקת Node.js
echo [2/4] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)
node --version
echo.

REM בדיקת npm
echo [3/4] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)
npm --version
echo.

REM הוראות להרצה
echo [4/4] Instructions:
echo.
echo ========================================
echo   Backend (Terminal 1):
echo ========================================
echo   cd backend
echo   npm run dev
echo.
echo ========================================
echo   Frontend (Terminal 2 - New Window):
echo ========================================
echo   cd frontend
echo   npm start
echo.
echo ========================================
echo.
echo Opening two new CMD windows...
echo.

REM פתיחת חלונות חדשים
start "Backend - Port 5000" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 >nul
start "Frontend - Port 3000" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   Servers starting in new windows...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
