import path from 'path';
import fs from 'fs';

async function ensureDbPath(): Promise<void> {
  const isPkg = (process as any).pkg;
  const exeDir = isPkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../..');
  const localCfgFile = path.join(exeDir, 'config.json');

  // Tentar ler config.json local primeiro
  if (fs.existsSync(localCfgFile)) {
    try {
      const raw = fs.readFileSync(localCfgFile, 'utf-8');
      const cfg = JSON.parse(raw);
      if (cfg && typeof cfg.dbPath === 'string') {
        process.env.ANALISEOLEO_DB_PATH = cfg.dbPath;
        return;
      }
    } catch (e) {
      console.error('Erro ao ler config.json:', e);
    }
  }

  // Usar caminho padrão como fallback
  const appName = 'AnaliseOleo';
  const appData = process.env.APPDATA || exeDir;
  const cfgDir = path.join(appData, appName);
  const defaultPath = path.join(cfgDir, 'database.sqlite');

  if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true });

  process.env.ANALISEOLEO_DB_PATH = defaultPath;
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
