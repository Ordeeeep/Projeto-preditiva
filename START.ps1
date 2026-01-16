# Script para iniciar o sistema completo
# Uso: .\START.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO SISTEMA COMPLETO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node -v 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Node.js nao instalado!" -ForegroundColor Red
    exit 1
}
Write-Host "OK Node.js $nodeVersion" -ForegroundColor Green

# Instalar dependencias raiz se necessario
if (!(Test-Path "node_modules")) {
    Write-Host "Instalando dependencias do projeto root..." -ForegroundColor Yellow
    npm install
}

# Instalar dependencias do servidor
if (!(Test-Path "server\node_modules")) {
    Write-Host "Instalando dependencias do servidor..." -ForegroundColor Yellow
    Push-Location server
    npm install
    Pop-Location
}

# Instalar dependencias do cliente
if (!(Test-Path "client\node_modules")) {
    Write-Host "Instalando dependencias do cliente..." -ForegroundColor Yellow
    Push-Location client
    npm install
    Pop-Location
}

# Compilar servidor
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   COMPILANDO SERVIDOR..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Push-Location server
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERRO] Falha ao compilar servidor!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Iniciar sistema
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Abra o navegador em: http://localhost:3000" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

npm run dev
