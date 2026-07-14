@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Cannot find Node.js. Please install Node.js first.
  pause
  exit /b 1
)

set "NODE=node"

if not exist "node_modules\vite\bin\vite.js" (
  echo Dependencies are missing. Please run npm install first.
  pause
  exit /b 1
)

start "Kiddo Learning App Server" /min "%NODE%" "node_modules\vite\bin\vite.js" --host 0.0.0.0 --port 5173 --strictPort
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5173"

echo App opened at http://127.0.0.1:5173
echo On iPad, use this computer's Wi-Fi IPv4 address with port 5173.
endlocal
