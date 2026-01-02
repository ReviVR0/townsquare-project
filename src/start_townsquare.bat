@echo off
REM === Start backend server ===
start cmd /k "cd /d C:\Users\USERNAME\Documents\GitHub\townsquare-project\server && node index.js"

REM === Start frontend server ===
start cmd /k "cd /d C:\Users\USERNAME\Documents\GitHub\townsquare-project\server && npm run serve"

REM === Open project folder in Explorer ===
start "" "C:\Users\USERNAME\Documents\GitHub\townsquare-project\"

REM === Optional: Keep main window open (remove 'pause' if not needed) ===
pause