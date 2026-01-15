import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../database.sqlite');

console.log('🔧 Adicionando coluna classe...');

const db = new sqlite3.Database(dbPath);

db.run(`ALTER TABLE frotas ADD COLUMN classe TEXT NOT NULL DEFAULT 'N/A'`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ Coluna classe já existe!');
    } else {
      console.error('❌ Erro ao adicionar coluna:', err.message);
    }
  } else {
    console.log('✅ Coluna classe adicionada com sucesso!');
  }
  
  db.close();
  process.exit(0);
});
