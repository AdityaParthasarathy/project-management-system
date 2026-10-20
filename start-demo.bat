@echo off
REM Starts the API (port 5000) and the web app (port 3000) from the local copy. PostgreSQL must be running.
start "ProjectFlow API" cmd /k "cd /d %~dp0backend && npm run build && npm run start:prod"
start "ProjectFlow Web" cmd /k "cd /d %~dp0frontend && npm run build && npm run start"
echo Wait about 40 seconds, then open http://localhost:3000
