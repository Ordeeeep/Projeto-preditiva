@echo off
echo ========================================
echo   Iniciando Servidor Backend
echo ========================================
echo.
cd server
echo Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias...
    call npm install
)
echo.
echo Iniciando servidor na porta 3001...
echo.
call npm run dev
pause




