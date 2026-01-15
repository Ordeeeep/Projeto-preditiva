import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
    process.exit(1);
  }
});

db.all('SELECT nome FROM frotas ORDER BY nome ASC', [], (err, rows: any[]) => {
  if (err) {
    console.error('Erro ao consultar frotas:', err);
    process.exit(1);
  }

  console.log(`\n✅ Total de frotas encontradas: ${rows.length}\n`);
  console.log('📋 Nomes das frotas:');
  console.log('================================');
  
  // Gerar conteúdo do arquivo TXT
  let txtContent = 'frota\tkm/hr\tdata\n';
  
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.nome}`);
    txtContent += `${row.nome}\t100\t16/12/2025\n`;
  });

  // Salvar arquivo
  const filePath = path.join(__dirname, '../../rodados_128.txt');
  fs.writeFileSync(filePath, txtContent);
  console.log(`\n📄 Arquivo gerado: ${filePath}`);

  db.close();
});
