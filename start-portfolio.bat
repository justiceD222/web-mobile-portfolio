@echo off
cd /d "%~dp0"
echo Starting Justice Denison portfolio with visitor alerts...
echo.
echo Open this address in your browser:
echo http://127.0.0.1:8791/
echo.
start "" "http://127.0.0.1:8791/"
node server.js
echo.
echo Server stopped. Press any key to close this window.
pause >nul
