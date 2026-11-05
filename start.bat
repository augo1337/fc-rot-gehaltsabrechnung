@echo off
REM ============================================================
REM  FC ROT Praemienabrechnung - lokaler Teststart (Windows)
REM  Doppelklick auf diese Datei startet die App im Browser.
REM ============================================================
cd /d "%~dp0"

echo.
echo   FC ROT Praemienabrechnung wird gestartet...
echo   Browser oeffnet sich gleich unter http://localhost:8900
echo.
echo   Zum Beenden: dieses Fenster schliessen.
echo.

REM Browser nach kurzer Verzoegerung oeffnen
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8900/index.html"

REM Lokalen Webserver starten (Python 3)
python -m http.server 8900
