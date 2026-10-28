@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\iaia.ps1" -Action Start %*
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" if not defined IAIA_NO_PAUSE pause
exit /b %RESULT%
