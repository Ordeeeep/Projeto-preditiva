@echo off
REM Script para recompilar o servidor

echo.
echo ===================================
echo Recompilando servidor...
echo ===================================
echo.

cd /d c:\Users\usuario\Desktop\PROG\novo-projeto\server

echo Limpando arquivos compilados...
if exist dist (
    rmdir /s /q dist
    echo ✓ Pasta dist removida
)

echo.
echo Recompilando TypeScript...
call npm run build

echo.
if exist dist\routes\frotaRoutes.js (
    echo ✅ Compilação concluída com sucesso!
    echo.
    echo Agora execute para iniciar o servidor:
    echo npm start
    echo.
) else (
    echo ❌ Erro na compilação!
    echo.
)

pause
