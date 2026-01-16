@echo off
chcp 65001 >nul
cls
title Parando Projeto Preditiva

echo.
echo ======================================
echo   PARANDO PROJETO PREDITIVA
echo ======================================
echo.

echo Finalizando processos Node.js...
taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Processos encerrados com sucesso
) else (
    echo [!] Nenhum processo Node encontrado
)

timeout /t 2 /nobreak

echo.
echo Projeto parado! As portas foram liberadas.
echo.
pause
