@echo off
chcp 65001 >nul
cls
title INICIAR SISTEMA COMPLETO

echo.
echo ==========================================
echo   INICIANDO SISTEMA COMPLETO
echo ==========================================
echo.

REM Verifica Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao instalado!
    pause
    exit /b 1
)

REM Instala dependências se necessário
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

if not exist "server\node_modules" (
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    cd client
    call npm install
    cd ..
)

echo.
echo ==========================================
echo   COMPILANDO SERVIDOR...
echo ==========================================
echo.

cd server
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao compilar servidor!
    pause
    exit /b 1
)
cd ..

echo.
echo ==========================================
echo   INICIANDO...
echo ==========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Abra o navegador em: http://localhost:3000
echo Pressione Ctrl+C para parar tudo
echo.

npm run dev
