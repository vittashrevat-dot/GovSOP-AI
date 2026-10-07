@echo off
REM ============================================================
REM  GovSOP AI - one-click launcher (Windows)
REM  Double-click this file to start both servers and open the app.
REM ============================================================

setlocal
set "ROOT=%~dp0"
set "NODEDIR=C:\Program Files\nodejs"

REM Put Node on PATH for this session (installer adds it system-wide,
REM but already-open shells may not have picked it up).
set "PATH=%NODEDIR%;%PATH%"

echo.
echo  Starting GovSOP AI...
echo    backend  -> http://localhost:8000
echo    frontend -> http://localhost:3000
echo.

REM --- Backend (FastAPI on :8000) in its own window ---
start "GovSOP AI - Backend" cmd /k ""%ROOT%backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8000 --app-dir "%ROOT%backend""

REM --- Frontend (Next.js on :3000) in its own window ---
start "GovSOP AI - Frontend" cmd /k "cd /d "%ROOT%frontend" && "%NODEDIR%\npm.cmd" run dev"

REM Give the dev server a moment to boot, then open the browser.
timeout /t 6 /nobreak >nul
start "" "http://localhost:3000"

echo  Two server windows opened. Close them (or press Ctrl+C in each) to stop.
echo  You can close THIS window now.
echo.
pause
endlocal
