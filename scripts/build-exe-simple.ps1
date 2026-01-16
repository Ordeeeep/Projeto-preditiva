Param(
    [string]$Destination = "C:\Users\lpedr\OneDrive\Desktop\app"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot/..").Path

Write-Host "==> Iniciando build do frontend (client)..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\client"

npm install
if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependencias no client" }

npm run build
if ($LASTEXITCODE -ne 0) { throw "Falha ao rodar build do client" }
Pop-Location

$publicDir = Join-Path -Path "$PSScriptRoot\..\server" -ChildPath "public"
if (Test-Path $publicDir) { Remove-Item -Recurse -Force $publicDir }
New-Item -ItemType Directory -Force -Path $publicDir | Out-Null
Copy-Item -Recurse -Force "$PSScriptRoot\..\client\build\*" $publicDir

Write-Host "==> Build do backend (server)..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\server"

npm install
if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependencias no server" }

npm run build
if ($LASTEXITCODE -ne 0) { throw "Falha ao compilar o server (tsc)" }

Write-Host "==> Empacotando .exe com pkg..." -ForegroundColor Cyan
npx pkg dist/bootstrap.js --targets node18-win-x64 --output "$Destination\sistema.exe"
if ($LASTEXITCODE -ne 0) { throw "Falha ao empacotar com pkg" }

Pop-Location

Write-Host "==> Copiando arquivos estaticos (public)..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
Copy-Item -Recurse -Force "$publicDir" "$Destination\public" -ErrorAction SilentlyContinue

Write-Host "==> Preparando binding nativo do sqlite3..." -ForegroundColor Cyan
$sqliteNode = Join-Path "$PSScriptRoot\..\server\node_modules\sqlite3\build\Release" "node_sqlite3.node"
if (Test-Path $sqliteNode) {
    Copy-Item -Force $sqliteNode (Join-Path $Destination "node_sqlite3.node")
    Write-Host "   Copiado: $sqliteNode -> $Destination\node_sqlite3.node" -ForegroundColor Green
}

Write-Host "`n### Build concluido com sucesso!" -ForegroundColor Green
Write-Host "Executavel criado em: $Destination\sistema.exe" -ForegroundColor Cyan
