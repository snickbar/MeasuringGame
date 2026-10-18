@echo off
cd /d "%~dp0"
node scripts\start-browser-game.cjs
if errorlevel 1 pause
