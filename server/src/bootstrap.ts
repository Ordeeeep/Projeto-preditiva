import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { execSync } from 'child_process';

function printSelectionHint(defaultPath: string) {
  console.log('============================================================');
  console.log(' Selecione o arquivo do banco (.sqlite ou .db)');
  console.log(' - Você pode digitar o caminho abaixo.');
  console.log(' - Ou, se o seletor abrir, escolha pelo explorador.');
  console.log(` - Sugestão: ${defaultPath}`);
  console.log('============================================================');
}

function showFileDialog(defaultDir: string): string | null {
  try {
    // Script PowerShell para abrir FileOpenDialog do Windows
    const escapedDir = defaultDir.replace(/\\/g, '\\\\');
    const ps = `
      Add-Type -AssemblyName System.Windows.Forms | Out-Null
      [System.Windows.Forms.Application]::EnableVisualStyles()
      $dialog = New-Object System.Windows.Forms.OpenFileDialog
      $dialog.Title = 'Selecione o arquivo SQLite (.sqlite ou .db)'
      $dialog.Filter = 'SQLite Database (*.sqlite;*.db)|*.sqlite;*.db|Todos os arquivos (*.*)|*.*'
      $dialog.InitialDirectory = '${escapedDir}'
      $dialog.DefaultExt = 'sqlite'
      $dialog.AddExtension = $true
      $dialog.CheckFileExists = $false
      $dialog.RestoreDirectory = $true
      $dialog.Multiselect = $false
      $null = $dialog.ShowDialog()
      if ($dialog.FileName) { Write-Output $dialog.FileName } else { Write-Output 'CANCELLED' }
    `;
    
    const result = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -STA -Command "${ps.replace(/\"/g, '\\\\"')}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (!result || result === 'CANCELLED') return null;
    return result;
  } catch (e: any) {
    try {
      console.error('Falha ao abrir o seletor de arquivo:', e?.message || e);
      if (e?.stdout) console.error('stdout:', String(e.stdout));
      if (e?.stderr) console.error('stderr:', String(e.stderr));
    } catch {}
    return null;
  }
}

function promptInputPath(defaultPath: string): string | null {
  try {
    const escapedDefault = defaultPath.replace(/\\/g, '\\\\');
    const ps = `
      Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
      $r = [Microsoft.VisualBasic.Interaction]::InputBox('Informe o caminho completo do banco (.sqlite ou .db):', 'Digite o caminho do banco', '${escapedDefault}')
      if ([string]::IsNullOrWhiteSpace($r)) { Write-Output 'CANCELLED' } else { Write-Output $r }
    `;
    const result = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -STA -Command "${ps.replace(/\"/g, '\\\\"')}"`, {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    if (!result || result === 'CANCELLED') return null;
    return result;
  } catch {
    return null;
  }
}

function promptConsolePath(defaultPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`Digite o caminho completo do banco (.sqlite ou .db) ou pressione Enter para usar o sugerido [${defaultPath}]: `, (answer) => {
      rl.close();
      const value = answer.trim() || defaultPath;
      if (!value) return resolve(null);
      resolve(value);
    });
  });
}

async function ensureDbPath(): Promise<void> {
  // Perguntar o caminho do banco, mas permitir env/config para destravar casos sem UI

  const isPkg = (process as any).pkg;
  const exeDir = isPkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../..');
  const appName = 'AnaliseOleo';
  const appData = process.env.APPDATA || exeDir;
  const cfgDir = path.join(appData, appName);
  const cfgFile = path.join(cfgDir, 'config.json');
  const localCfgFile = path.join(exeDir, 'config.json');

  if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true });

  let savedDbPath: string | undefined;
  let localDbPath: string | undefined;
  if (fs.existsSync(cfgFile)) {
    try {
      const raw = fs.readFileSync(cfgFile, 'utf-8');
      const cfg = JSON.parse(raw);
      if (cfg && typeof cfg.dbPath === 'string') savedDbPath = cfg.dbPath;
    } catch {}
  }
  if (fs.existsSync(localCfgFile)) {
    try {
      const raw = fs.readFileSync(localCfgFile, 'utf-8');
      const cfg = JSON.parse(raw);
      if (cfg && typeof cfg.dbPath === 'string') localDbPath = cfg.dbPath;
    } catch {}
  }

  // Caminho padrão sugerido
  const defaultDbPath = path.join(cfgDir, 'database.sqlite');

  // Se a variável de ambiente já foi definida externamente, use-a direto
  if (process.env.ANALISEOLEO_DB_PATH) {
    process.env.ANALISEOLEO_DB_PATH = process.env.ANALISEOLEO_DB_PATH;
    console.log(`Usando caminho do banco da variável de ambiente: ${process.env.ANALISEOLEO_DB_PATH}`);
    return;
  }

  // Se existir config.json ao lado do .exe (prioridade), use-o para destravar sem UI
  if (localDbPath) {
    process.env.ANALISEOLEO_DB_PATH = localDbPath;
    console.log(`Usando caminho do banco de config.json ao lado do executável: ${localDbPath}`);
    return;
  }

  // Abrir dialog GUI para selecionar arquivo
  console.log('Abrindo seletor de arquivo SQLite...');
  const initialDir = savedDbPath && fs.existsSync(path.dirname(savedDbPath))
    ? path.dirname(savedDbPath)
    : cfgDir;
  let chosen: string | null = null;
  printSelectionHint(path.join(initialDir, 'database.sqlite'));
  let attempts = 0;
  while (!chosen && attempts < 2) {
    attempts++;
    const guiPick = showFileDialog(initialDir);
    if (guiPick) { chosen = guiPick; break; }
    console.log('Nenhum arquivo selecionado no seletor. Você pode digitar o caminho manualmente.');
    const typed = promptInputPath(path.join(initialDir, 'database.sqlite'));
    if (typed) { chosen = typed; break; }
    console.log('Nenhum caminho informado no InputBox. Tente digitando no console abaixo.');
    if (process.stdin.isTTY) {
      const consoleTyped = await promptConsolePath(path.join(initialDir, 'database.sqlite'));
      if (consoleTyped) { chosen = consoleTyped; break; }
    }
    console.log('Nenhum caminho informado. Tentando novamente...');
  }
  if (!chosen) {
    // Fallback seguro para não travar em ambientes sem UI
    chosen = path.join(initialDir, 'database.sqlite');
    console.log('Nenhum caminho selecionado ou informado. Usando caminho padrão:', chosen);
  }

  const chosenDir = path.dirname(chosen);
  if (!fs.existsSync(chosenDir)) fs.mkdirSync(chosenDir, { recursive: true });

  process.env.ANALISEOLEO_DB_PATH = chosen;
  try {
    fs.writeFileSync(cfgFile, JSON.stringify({ dbPath: chosen }, null, 2), 'utf-8');
  } catch {}
}

async function main() {
  // Ajuste do local para bindings nativos (fallback)
  const isPkg = (process as any).pkg;
  const baseDir = isPkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../..');
  // Ajuste: usar o diretório base (onde o .exe fica) como local dos bindings
  // O script de build copia node_sqlite3.node para este diretório
  process.env.NODE_BINDINGS_COMPILED_DIR = baseDir;

  await ensureDbPath();

  // Carregar app
  await import('./index');
}

main();
