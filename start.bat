@echo off
echo ========================================================
echo   RankCraft AI - SEO Content Studio
echo   Starting Backend API and Frontend Dev Server...
echo ========================================================

start cmd /k "python backend/app.py"
timeout /t 2 /nobreak >nul
start cmd /k "cd frontend && npm run dev"

echo.
echo Servers started:
echo   - Backend API: http://127.0.0.1:5000
echo   - Frontend Studio: http://localhost:5174
echo.
pause
