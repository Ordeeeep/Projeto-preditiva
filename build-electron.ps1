#!/usr/bin/env powershell

Write-Host "==> Preparando ícone..."
$repoRoot = (Resolve-Path "$PSScriptRoot").Path
$iconSource = Join-Path $repoRoot "assets/app-icon.png"
$iconDir = Join-Path $repoRoot "assets"
$iconIco = Join-Path $iconDir "app-icon.ico"
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null
if (-not (Test-Path $iconSource)) { throw "Icone PNG nao encontrado em $iconSource" }
$genIco = "const pngToIco=require('png-to-ico'); const fs=require('fs'); pngToIco(['$iconSource']).then(buf=>fs.writeFileSync('$iconIco',buf)).catch(err=>{console.error(err); process.exit(1);});"
node -e "$genIco"
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $iconIco)) { throw "Falha ao gerar .ico" }

Write-Host "==> Compilando TypeScript do servidor..."
Set-Location "./server"
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }
Set-Location ..

Write-Host "==> Compilando cliente React..."
Set-Location "./client"
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }
Set-Location ..

Write-Host "==> Empacotando com electron-builder..."
Set-Location "./server"
npm run build:exe
if ($LASTEXITCODE -ne 0) { exit 1 }
Set-Location ..

# Tentar aplicar ícone ao executável gerado (dist/sistema.exe)
$exePath = Join-Path $repoRoot "dist/sistema.exe"
if (Test-Path $exePath) {
	Write-Host "==> Aplicando ícone ao executável gerado..."
	$nodeScript = "const rcedit=require('rcedit'); rcedit(process.argv[2], { icon: process.argv[3] }).catch(err => { console.error(err); process.exit(1); });"
	node -e "$nodeScript" -- "$exePath" "$iconIco"
}

Write-Host "✅ Processo concluído!"
