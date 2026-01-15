import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../database.sqlite');
const sqlPath = path.join(__dirname, '../database.sql');

console.log('🗄️  Inicializando banco de dados...');

// Remover banco antigo se existir
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Banco de dados antigo removido');
}

// Criar novo banco
const db = new sqlite3.Database(dbPath);

// Ler e executar SQL
const sql = fs.readFileSync(sqlPath, 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('❌ Erro ao criar banco de dados:', err);
    process.exit(1);
  }
  
  console.log('✅ Banco de dados criado com sucesso!');
  console.log('📊 Estrutura:');
  console.log('   - Tabela: analises_oleo');
  console.log('   - Tabela: frotas (com campo modelo)');
  console.log('   - Tabela: frota_logs');
  console.log('   - Índices criados para melhor performance');
  
  db.close();
  process.exit(0);
});
