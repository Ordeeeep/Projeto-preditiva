import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../database.sqlite');

console.log('🔧 Adicionando campos de análise...');

const db = new sqlite3.Database(dbPath);

const commands = [
  `ALTER TABLE frotas ADD COLUMN status_analise TEXT DEFAULT 'NORMAL'`,
  `ALTER TABLE frotas ADD COLUMN data_ultima_analise TEXT`
];

let completed = 0;

commands.forEach((cmd, index) => {
  db.run(cmd, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error(`❌ Erro no comando ${index + 1}:`, err.message);
    } else if (err) {
      console.log(`✅ Campo ${index + 1} já existe`);
    } else {
      console.log(`✅ Campo ${index + 1} adicionado com sucesso`);
    }
    
    completed++;
    if (completed === commands.length) {
      db.close();
      console.log('✅ Todos os campos processados!');
      process.exit(0);
    }
  });
});
