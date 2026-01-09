@echo off
setlocal

:: Configuration
set "NODE_VERSION=v20.10.0"
set "NODE_DIST=node-%NODE_VERSION%-win-x64"
set "NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/%NODE_DIST%.zip"
set "LOCAL_BIN=%~dp0bin"

:: Check if node is available globally
where node >nul 2>nul
if %errorlevel% equ 0 (
    goto :run
)

:: Check if local node exists
if exist "%LOCAL_BIN%\%NODE_DIST%\node.exe" (
    set "PATH=%LOCAL_BIN%\%NODE_DIST%;%PATH%"
    goto :run
)

:: Node not found, download it
echo Node.js not found. Downloading...
if not exist "%LOCAL_BIN%" mkdir "%LOCAL_BIN%"

powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%LOCAL_BIN%\node.zip'"
if %errorlevel% neq 0 (
    exit /b 1
)

powershell -Command "Expand-Archive -Path '%LOCAL_BIN%\node.zip' -DestinationPath '%LOCAL_BIN%' -Force"
del "%LOCAL_BIN%\node.zip"

:: Set path to use local node
set "PATH=%LOCAL_BIN%\%NODE_DIST%;%PATH%"

:run
:: Check dependencies
if not exist "%~dp0node_modules" (
    call npm install
)

:: Start the app
call npm start
