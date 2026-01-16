Param(
    [string]$Destination = "C:\Users\lpedr\OneDrive\Desktop\app"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot/..").Path
$iconSource = Join-Path $repoRoot "assets/app-icon.png"
$iconDir = Join-Path $repoRoot "assets"
$iconIco = Join-Path $iconDir "app-icon.ico"

# Garantir ícones (opcional)
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null
if ((Test-Path $iconSource) -and (Test-Path $iconIco)) {
    Write-Host "==> Ícone encontrado, será utilizado..." -ForegroundColor Cyan
} else {
    Write-Host "==> Aviso: Ícone PNG/ICO não encontrado. O .exe usará ícone padrão." -ForegroundColor Yellow
    $iconIco = $null
}

Write-Host "==> Iniciando build do frontend (client)..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\client"
# Instalar dependências com fallback (ci -> install)
if (Test-Path package-lock.json) {
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "npm ci falhou no client; tentando npm install..."
        npm install
        if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependências no client" }
    }
} else {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependências no client" }
}

# Verificar react-scripts
npx --yes react-scripts --version | Out-Null
if ($LASTEXITCODE -ne 0) { throw "react-scripts não encontrado após instalação do client" }

# Build client
npm run build
if ($LASTEXITCODE -ne 0) { throw "Falha ao rodar build do client" }
Pop-Location

# Copiar build do client para server/public
$publicDir = Join-Path -Path "$PSScriptRoot\..\server" -ChildPath "public"
if (Test-Path $publicDir) { Remove-Item -Recurse -Force $publicDir }
New-Item -ItemType Directory -Force -Path $publicDir | Out-Null
Copy-Item -Recurse -Force "$PSScriptRoot\..\client\build\*" $publicDir

Write-Host "==> Build do backend (server)..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\server"
if (Test-Path package-lock.json) {
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "npm ci falhou no server; tentando npm install..."
        npm install
        if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependências no server" }
    }
} else {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependências no server" }
}

# Verificar tsc
npx --yes tsc -v | Out-Null
if ($LASTEXITCODE -ne 0) { throw "TypeScript (tsc) não encontrado após instalação do server" }

# Build server
npm run build
if ($LASTEXITCODE -ne 0) { throw "Falha ao compilar o server (tsc)" }

# Empacotar com pkg para o destino
Write-Host "==> Empacotando .exe com pkg..." -ForegroundColor Cyan
npx pkg dist/bootstrap.js --targets node18-win-x64 --output "$Destination\sistema.exe"
Pop-Location

# Aplicar ícone ao executável (se disponível)
if ($iconIco -and (Test-Path $iconIco)) {
    Write-Host "==> Aplicando ícone ao executável..." -ForegroundColor Cyan
    $nodeScript = "const rcedit=require('rcedit'); rcedit(process.argv[2], { icon: process.argv[3] }).catch(err => { console.error(err); process.exit(1); });"
    node -e "$nodeScript" -- "$Destination\sistema.exe" "$iconIco"
    if ($LASTEXITCODE -ne 0) { 
        Write-Warning "Falha ao aplicar ícone, continuando com ícone padrão..."
    }
} else {
    Write-Host "==> Pulando aplicação de ícone (arquivo não encontrado)..." -ForegroundColor Yellow
}

# Copiar pasta public (estáticos) para junto do exe
Write-Host "==> Copiando arquivos estáticos (public)..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
Copy-Item -Recurse -Force "$publicDir" "$Destination\public"

## Preparar binding nativo do sqlite3 para o pkg (copiar ao lado do .exe)
Write-Host "==> Preparando binding nativo do sqlite3..." -ForegroundColor Cyan
$sqliteNode = Join-Path "$PSScriptRoot\..\server\node_modules\sqlite3\build\Release" "node_sqlite3.node"
if (Test-Path $sqliteNode) {
    Copy-Item -Force $sqliteNode (Join-Path $Destination "node_sqlite3.node")
    Write-Host "   Copiado: $sqliteNode -> $Destination\node_sqlite3.node" -ForegroundColor DarkGray
} else {
    Write-Warning "Arquivo node_sqlite3.node não encontrado. Se o .exe falhar, verifique dependências do sqlite3."
}

# Copiar banco existente, se houver (APPDATA/AnaliseOleo)
$AppData = $env:APPDATA
if ($AppData) {
    $DataDir = Join-Path $AppData "AnaliseOleo"
    if (Test-Path (Join-Path $DataDir "database.sqlite")) {
        Write-Host "==> Copiando banco existente para o destino..." -ForegroundColor Cyan
        Copy-Item -Force (Join-Path $DataDir "database.sqlite") (Join-Path $Destination "database.sqlite")
    }
}

Write-Host "✅ Processo concluído. Abra: $Destination\sistema.exe" -ForegroundColor Green
