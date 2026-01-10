@echo off
echo ========================================
echo   Stopping Meeting Summary Pro Servers
echo ========================================
echo.

echo Closing processes on port 5000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo   Killing PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Closing processes on port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo   Killing PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Done! All servers stopped.
echo.
pause
