#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 Verificador de Banco de Dados - Sistema Análise Óleo\n');

// Determinar caminho do banco
const envDbPath = process.env.ANALISEOLEO_DB_PATH;
let dbPath;

if (envDbPath && envDbPath.trim() !== '') {
  dbPath = envDbPath;
} else {
  const appData = process.env.APPDATA || process.cwd();
  const dataDir = path.join(appData, 'AnaliseOleo');
  dbPath = path.join(dataDir, 'database.sqlite');
}

console.log(`📁 Caminho do banco: ${dbPath}`);
console.log(`✅ Arquivo existe: ${fs.existsSync(dbPath) ? 'SIM' : 'NÃO'}\n`);

if (!fs.existsSync(dbPath)) {
  console.log('⚠️  Banco não encontrado. Será criado automaticamente ao iniciar o servidor.');
  process.exit(0);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err.message);
    process.exit(1);
  }
});

// Habilitar constraints de chave estrangeira
db.run('PRAGMA foreign_keys = ON');

console.log('📊 Verificando tabelas...\n');

// Listar tabelas
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('❌ Erro ao listar tabelas:', err.message);
    db.close();
    process.exit(1);
  }

  if (!tables || tables.length === 0) {
    console.log('⚠️  Nenhuma tabela encontrada. O banco será inicializado.');
    db.close();
    process.exit(0);
  }

  const tableNames = tables.map(t => t.name);
  console.log(`✅ Tabelas encontradas: ${tableNames.join(', ')}\n`);

  // Verificar schema de cada tabela
  let checked = 0;
  tableNames.forEach((tableName) => {
    db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
      if (err) {
        console.error(`❌ Erro ao verificar schema de ${tableName}:`, err.message);
      } else {
        console.log(`📋 Tabela: ${tableName}`);
        if (columns && columns.length > 0) {
          columns.forEach(col => {
            console.log(`   - ${col.name} (${col.type})`);
          });
        }
      }

      checked++;
      if (checked === tableNames.length) {
        // Verificar dados
        console.log('\n📈 Contagem de registros:\n');
        let counted = 0;

        tableNames.forEach((tableName) => {
          db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, row) => {
            if (err) {
              console.log(`❌ ${tableName}: Erro ao contar`);
            } else {
              console.log(`✅ ${tableName}: ${row?.count || 0} registros`);
            }

            counted++;
            if (counted === tableNames.length) {
              console.log('\n✅ Verificação concluída!');
              
              // Testar query específica de frotas
              console.log('\n🧪 Testando query de frotas...');
              db.all(`
                SELECT 
                  f.id, f.nome, f.modelo, f.classe, f.intervalo_troca, f.unidade, f.km_inicial, f.status_analise, f.data_ultima_analise, f.created_at,
                  IFNULL(SUM(l.km_rodado), 0) as km_acumulado
                FROM frotas f
                LEFT JOIN frota_logs l ON l.frota_id = f.id
                GROUP BY f.id
                ORDER BY f.created_at DESC
              `, [], (err, rows) => {
                if (err) {
                  console.error('❌ Erro ao executar query de frotas:', err.message);
                } else {
                  console.log(`✅ Query executada com sucesso. Frotas retornadas: ${rows?.length || 0}`);
                  if (rows && rows.length > 0) {
                    console.log('   Amostra:', rows[0]);
                  }
                }
                
                db.close();
                process.exit(0);
              });
            }
          });
        });
      }
    });
  });
});
