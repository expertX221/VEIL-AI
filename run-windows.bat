@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20+ is required. Install it from https://nodejs.org and rerun.
  pause
  exit /b 1
)
echo VEIL//AI - Private Intelligence Console
echo Open http://127.0.0.1:8787 in your browser after startup.
node server.mjs
pause
