@echo off
cd /d "C:\MyMealsKostALL\MyMealsMaid"

echo ============================
echo   MyMealsKost Bot
echo ============================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo Starting bot...
echo.

call npm start

echo.
echo ============================
echo   Bot has stopped!
echo ============================
echo.
pause