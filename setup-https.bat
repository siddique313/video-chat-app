@echo off
echo 🚀 Setting up HTTPS for video chat app...

REM Check if mkcert is installed
where mkcert >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ mkcert not found. Please install it first:
    echo 1. Download from https://github.com/FiloSottile/mkcert/releases
    echo 2. Or install with Chocolatey: choco install mkcert
    echo 3. Or install with Scoop: scoop install mkcert
    pause
    exit /b 1
)

REM Install local CA
echo 📜 Installing local CA...
mkcert -install

REM Get local IP
echo 🌐 Getting local IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%
echo Local IP: %LOCAL_IP%

REM Create certificates
echo 🔐 Creating certificates...
mkcert localhost 127.0.0.1 ::1 %LOCAL_IP%

REM Rename certificates
if exist "localhost+3.pem" (
    ren "localhost+3.pem" "localhost.pem"
    ren "localhost+3-key.pem" "localhost-key.pem"
) else if exist "localhost+4.pem" (
    ren "localhost+4.pem" "localhost.pem"
    ren "localhost+4-key.pem" "localhost-key.pem"
)

echo ✅ HTTPS setup complete!
echo.
echo 🚀 Start your app with HTTPS (both Next.js and socket server):
echo    npm run dev:full:https
echo.
echo 🌐 Then open in browser (use your IP so it says "Secure"):
echo    https://localhost:3000
echo    https://%LOCAL_IP%:3000
echo.
echo 🔒 Using HTTPS removes the "Not secure" warning.
pause
