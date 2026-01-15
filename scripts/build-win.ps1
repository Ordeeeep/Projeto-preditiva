# Builds client and server, then packages Windows .exe to a target folder.
param(
  [string]$OutDir = "E:\projeto-2026"
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path "$PSScriptRoot/..").Path
$iconSource = Join-Path $repoRoot "assets/app-icon.png"
$iconDir = Join-Path $repoRoot "assets"
$iconIco = Join-Path $iconDir "app-icon.ico"

New-Item -ItemType Directory -Force -Path $iconDir | Out-Null
if (-not (Test-Path $iconSource)) { throw "Icone PNG nao encontrado em $iconSource" }

Write-Host "==> Gerando .ico a partir do PNG..."
$genIco = "const pngToIco=require('png-to-ico'); const fs=require('fs'); pngToIco(['$iconSource']).then(buf=>fs.writeFileSync('$iconIco',buf)).catch(err=>{console.error(err); process.exit(1);});"
node -e "$genIco"
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $iconIco)) { throw "Falha ao gerar .ico" }

Write-Host "==> Criando pasta de saída: $OutDir"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Push-Location "$PSScriptRoot\..\client"
try {
  Write-Host "==> Instalando dependências do client (se necessário)"
  if (-not (Test-Path node_modules)) { npm install }
  Write-Host "==> Criando build do client"
  npm run build
} finally {
  Pop-Location
}

Push-Location "$PSScriptRoot\..\server"
try {
  Write-Host "==> Instalando dependências do server (se necessário)"
  if (-not (Test-Path node_modules)) { npm install }
  Write-Host "==> Compilando TypeScript do server"
  npm run build
} finally {
  Pop-Location
}

Write-Host "==> Copiando build do frontend para $OutDir/public"
Copy-Item -Recurse -Force "$PSScriptRoot\..\client\build" "$OutDir\public"

Write-Host "==> Empacotando .exe com pkg"
Push-Location "$PSScriptRoot\..\server"
try {
  npx pkg dist/index.js --targets node18-win-x64 --output "$OutDir\sistema.exe"
} finally {
  Pop-Location
}

Write-Host "==> Aplicando ícone ao executável..."
$nodeScript = "const rcedit=require('rcedit'); rcedit(process.argv[2], { icon: process.argv[3] }).catch(err => { console.error(err); process.exit(1); });"
node -e "$nodeScript" -- "$OutDir\sistema.exe" "$iconIco"
if ($LASTEXITCODE -ne 0) { throw "Falha ao aplicar ícone via rcedit" }

Write-Host "==> Concluído. Para iniciar, execute: $OutDir\sistema.exe"
Write-Host "   O banco ficará em %APPDATA%\\AnaliseOleo\\database.sqlite"
