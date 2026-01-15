import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { initAuthDatabase } from './database/auth';

// Determinar caminho do banco: 1) env ANALISEOLEO_DB_PATH, 2) config padrão em %APPDATA%/AnaliseOleo/database.sqlite
const envDbPath = process.env.ANALISEOLEO_DB_PATH;
let dbPath: string;
if (envDbPath && envDbPath.trim() !== '') {
  dbPath = envDbPath;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
} else {
  const isPkg = (process as any).pkg;
  const exeDir = isPkg ? path.dirname(process.execPath) : process.cwd();
  const appName = 'AnaliseOleo';
  const appData = process.env.APPDATA || exeDir;
  const dataDir = path.join(appData, appName);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  dbPath = path.join(dataDir, 'database.sqlite');
}
const db = new sqlite3.Database(dbPath);

// Habilitar constraints de chave estrangeira
db.run('PRAGMA foreign_keys = ON');

// Promisificar métodos do banco
const dbRun = (query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = <T = any>(query: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows as unknown as T[]) || []);
    });
  });
};

const dbGet = <T = any>(query: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as unknown as T | undefined);
    });
  });
};

export interface AnaliseOleo {
  id?: string;
  numeroAmostra: string;
  dataColeta: string;
  equipamento: string;
  tipoOleo: string;
  viscosidade?: number;
  acidez?: number;
  agua?: number;
  particulas?: number;
  observacoes?: string;
  status?: string;
  createdAt?: string;
}

export interface Frota {
  id?: string;
  nome: string;
  modelo: string;
  classe: string;
  intervaloTroca: number; // km ou horas para troca
  unidade?: string; // 'km' ou 'hora'
  kmInicial: number; // odômetro no cadastro
  statusAnalise?: string; // 'NORMAL' | 'ANORMAL' | 'CRITICO'
  dataUltimaAnalise?: string;
  createdAt?: string;
}

export interface FrotaLog {
  id?: string;
  frotaId: string;
  data: string; // ISO date
  kmRodado: number; // incremento diário
  createdAt?: string;
}

export interface FrotaStatus extends Frota {
  kmAcumulado: number; // soma dos km rodados desde o cadastro
  progresso: number; // 0-100
  kmRestante: number;
  proximoLimite: number; // kmInicial + intervaloTroca
  intervaloAjustado: number; // intervalo considerando status da análise
}

export const initDatabase = () => {
  const queries = [
    `
      CREATE TABLE IF NOT EXISTS analises_oleo (
        id TEXT PRIMARY KEY,
        numero_amostra TEXT NOT NULL UNIQUE,
        data_coleta TEXT NOT NULL,
        equipamento TEXT NOT NULL,
        tipo_oleo TEXT NOT NULL,
        viscosidade REAL,
        acidez REAL,
        agua REAL,
        particulas INTEGER,
        observacoes TEXT,
        status TEXT DEFAULT 'AG. ENVIO',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS frotas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        modelo TEXT NOT NULL,
        classe TEXT,
        intervalo_troca REAL NOT NULL,
        unidade TEXT DEFAULT 'km',
        km_inicial REAL NOT NULL,
        status_analise TEXT DEFAULT 'NORMAL',
        data_ultima_analise TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS frota_logs (
        id TEXT PRIMARY KEY,
        frota_id TEXT NOT NULL,
        data TEXT NOT NULL,
        km_rodado REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(frota_id) REFERENCES frotas(id) ON DELETE CASCADE
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS motores (
        id TEXT PRIMARY KEY,
        numero_motor TEXT NOT NULL UNIQUE,
        frota_motor TEXT NOT NULL,
        modelo_motor TEXT NOT NULL,
        classe_frota TEXT NOT NULL,
        unidade TEXT DEFAULT 'VVAA',
        vida_motor REAL NOT NULL,
        horas_inicial REAL NOT NULL,
        data_intervencao TEXT,
        equipamento_atual TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS motor_logs (
        id TEXT PRIMARY KEY,
        motor_id TEXT NOT NULL,
        data TEXT NOT NULL,
        horas_rodado REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(motor_id) REFERENCES motores(id) ON DELETE CASCADE
      )
    `,
  ];

  queries.forEach((q) => {
    db.run(q, (err) => {
      if (err) {
        console.error('Erro ao criar tabela:', err);
      }
    });
  });

  // Garantir colunas adicionais (classe, status_analise, data_ultima_analise)
  const safeAlter = (sql: string, tableName: string) => {
    db.run(sql, (err) => {
      if (err && !`${err.message}`.includes('duplicate column')) {
        console.warn(`⚠️ Aviso ao ajustar tabela ${tableName}:`, err.message);
      } else if (!err) {
        console.log(`✅ Coluna adicionada em ${tableName}`);
      } else {
        console.log(`ℹ️ Coluna já existe em ${tableName}`);
      }
    });
  };

  safeAlter("ALTER TABLE frotas ADD COLUMN classe TEXT;", "frotas");
  safeAlter("ALTER TABLE frotas ADD COLUMN status_analise TEXT DEFAULT 'NORMAL';", "frotas");
  safeAlter("ALTER TABLE frotas ADD COLUMN data_ultima_analise TEXT;", "frotas");
  safeAlter("ALTER TABLE motores ADD COLUMN data_intervencao TEXT;", "motores");
  
  console.log('🔧 Verificando estrutura da tabela motores...');
  db.all("PRAGMA table_info(motores)", [], (err, columns: any) => {
    if (err) {
      console.error('❌ Erro ao verificar estrutura:', err);
    } else {
      console.log('📋 Colunas da tabela motores:', columns.map((c: any) => c.name).join(', '));
      const hasDataIntervencao = columns.some((c: any) => c.name === 'data_intervencao');
      if (hasDataIntervencao) {
        console.log('✅ Coluna data_intervencao existe!');
      } else {
        console.log('❌ Coluna data_intervencao NÃO existe!');
      }
    }
  });
  
  // Inicializar tabelas de autenticação
  initAuthDatabase();

  console.log('✅ Banco de dados inicializado');
  console.log(`📂 Arquivo do banco: ${dbPath}`);
};

export const dbOperations = {
  async create(analise: AnaliseOleo): Promise<AnaliseOleo> {
    const id = uuidv4();
    const query = `
      INSERT INTO analises_oleo 
      (id, numero_amostra, data_coleta, equipamento, tipo_oleo, viscosidade, acidez, agua, particulas, observacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await dbRun(query, [
      id,
      analise.numeroAmostra,
      analise.dataColeta,
      analise.equipamento,
      analise.tipoOleo,
      null, // viscosidade
      null, // acidez
      null, // agua
      null, // particulas
      analise.observacoes || null,
      analise.status || 'AG. ENVIO'
    ]);

    return { ...analise, id };
  },

  async getAll(): Promise<AnaliseOleo[]> {
    const query = 'SELECT * FROM analises_oleo ORDER BY created_at DESC';
    const rows: any[] = await dbAll(query);
    
    return rows.map(row => ({
      id: row.id,
      numeroAmostra: row.numero_amostra,
      dataColeta: row.data_coleta,
      equipamento: row.equipamento,
      tipoOleo: row.tipo_oleo,
      viscosidade: row.viscosidade,
      acidez: row.acidez,
      agua: row.agua,
      particulas: row.particulas,
      observacoes: row.observacoes,
      status: row.status,
      createdAt: row.created_at
    }));
  },

  async getById(id: string): Promise<AnaliseOleo | undefined> {
    const query = 'SELECT * FROM analises_oleo WHERE id = ?';
    const row: any = await dbGet(query, [id]);
    
    if (!row) return undefined;

    return {
      id: row.id,
      numeroAmostra: row.numero_amostra,
      dataColeta: row.data_coleta,
      equipamento: row.equipamento,
      tipoOleo: row.tipo_oleo,
      viscosidade: row.viscosidade,
      acidez: row.acidez,
      agua: row.agua,
      particulas: row.particulas,
      observacoes: row.observacoes,
      status: row.status,
      createdAt: row.created_at
    };
  },

  async update(id: string, analise: Partial<AnaliseOleo>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (analise.numeroAmostra) {
      fields.push('numero_amostra = ?');
      values.push(analise.numeroAmostra);
    }
    if (analise.dataColeta) {
      fields.push('data_coleta = ?');
      values.push(analise.dataColeta);
    }
    if (analise.equipamento) {
      fields.push('equipamento = ?');
      values.push(analise.equipamento);
    }
    if (analise.tipoOleo) {
      fields.push('tipo_oleo = ?');
      values.push(analise.tipoOleo);
    }
    if (analise.viscosidade !== undefined) {
      fields.push('viscosidade = ?');
      values.push(analise.viscosidade);
    }
    if (analise.acidez !== undefined) {
      fields.push('acidez = ?');
      values.push(analise.acidez);
    }
    if (analise.agua !== undefined) {
      fields.push('agua = ?');
      values.push(analise.agua);
    }
    if (analise.particulas !== undefined) {
      fields.push('particulas = ?');
      values.push(analise.particulas);
    }
    if (analise.observacoes !== undefined) {
      fields.push('observacoes = ?');
      values.push(analise.observacoes);
    }
    if (analise.status) {
      fields.push('status = ?');
      values.push(analise.status);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const query = `UPDATE analises_oleo SET ${fields.join(', ')} WHERE id = ?`;
    
    const result = await dbRun(query, values);
    return result.changes > 0;
  },

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM analises_oleo WHERE id = ?';
    const result = await dbRun(query, [id]);
    return result.changes > 0;
  }
};

export const frotaOperations = {
  async create(frota: Frota): Promise<Frota> {
    const id = uuidv4();
    const query = `
      INSERT INTO frotas (id, nome, modelo, classe, intervalo_troca, unidade, km_inicial)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await dbRun(query, [id, frota.nome, frota.modelo, frota.classe, frota.intervaloTroca, frota.unidade || 'km', frota.kmInicial]);
    return { ...frota, id, unidade: frota.unidade || 'km' };
  },

  async addLog(log: FrotaLog): Promise<FrotaLog> {
    const id = uuidv4();
    const query = `
      INSERT INTO frota_logs (id, frota_id, data, km_rodado)
      VALUES (?, ?, ?, ?)
    `;
    await dbRun(query, [id, log.frotaId, log.data, log.kmRodado]);
    return { ...log, id };
  },

  async listWithStatus(): Promise<FrotaStatus[]> {
    const query = `
      SELECT 
        f.id, f.nome, f.modelo, f.classe, f.intervalo_troca, f.unidade, f.km_inicial, f.status_analise, f.data_ultima_analise, f.created_at,
        IFNULL(SUM(l.km_rodado), 0) as km_acumulado
      FROM frotas f
      LEFT JOIN frota_logs l ON l.frota_id = f.id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `;

    const rows: any[] = await dbAll(query);
    return rows.map((row) => {
      const kmAcumulado = Number(row.km_acumulado) || 0;
      const statusAnalise = row.status_analise || 'NORMAL';
      
      // Calcular intervalo ajustado baseado no status da análise
      let fatorAjuste = 1.0; // NORMAL = 100%
      if (statusAnalise === 'ANORMAL') fatorAjuste = 0.5; // 50%
      if (statusAnalise === 'CRITICO') fatorAjuste = 0.25; // 25%
      
      const intervaloAjustado = Math.round(row.intervalo_troca * fatorAjuste);
      const progresso = Math.min(100, Math.round((kmAcumulado / intervaloAjustado) * 100));
      const kmRestante = Math.max(0, intervaloAjustado - kmAcumulado);
      
      return {
        id: row.id,
        nome: row.nome,
        modelo: row.modelo || 'N/A',
        classe: row.classe || 'N/A',
        intervaloTroca: row.intervalo_troca,
        unidade: row.unidade || 'km',
        kmInicial: row.km_inicial,
        statusAnalise,
        dataUltimaAnalise: row.data_ultima_analise,
        createdAt: row.created_at,
        kmAcumulado,
        progresso,
        kmRestante,
        proximoLimite: row.km_inicial + intervaloAjustado,
        intervaloAjustado,
      } as FrotaStatus;
    });
  },

  async update(id: string, frota: Partial<Frota>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (frota.nome) {
      fields.push('nome = ?');
      values.push(frota.nome);
    }
    if (frota.modelo) {
      fields.push('modelo = ?');
      values.push(frota.modelo);
    }
    if (frota.classe) {
      fields.push('classe = ?');
      values.push(frota.classe);
    }
    if (frota.intervaloTroca !== undefined) {
      fields.push('intervalo_troca = ?');
      values.push(frota.intervaloTroca);
    }
    if (frota.unidade) {
      fields.push('unidade = ?');
      values.push(frota.unidade);
    }
    if (frota.kmInicial !== undefined) {
      fields.push('km_inicial = ?');
      values.push(frota.kmInicial);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const query = `UPDATE frotas SET ${fields.join(', ')} WHERE id = ?`;
    const result = await dbRun(query, values);
    return result.changes > 0;
  },

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM frotas WHERE id = ?';
    const result = await dbRun(query, [id]);
    return result.changes > 0;
  },

  async updateStatusAnalise(id: string, status: string, data: string): Promise<boolean> {
    const query = 'UPDATE frotas SET status_analise = ?, data_ultima_analise = ? WHERE id = ?';
    const result = await dbRun(query, [status, data, id]);
    return result.changes > 0;
  },

  async resetRodagem(id: string): Promise<boolean> {
    // Zera o kmAcumulado (reseta a contagem após coleta de óleo)
    const query = 'DELETE FROM frota_logs WHERE frota_id = ?';
    const result = await dbRun(query, [id]);
    return true; // Sempre retorna true mesmo se não havia logs
  },
};

export interface ImportLogResult {
  imported: number;
  errors: { row: number; error: string; data?: any }[];
}

export const frotaImportOperations = {
  async importFrotas(rows: any[]): Promise<ImportLogResult> {
    // Imports de frotas: columns= nome, modelo, classe, intervalo_troca, unidade, km_inicial
    const results: ImportLogResult = { imported: 0, errors: [] };
    const seen = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nome = row.nome || row.Nome || row['NOME'] || row.numero;
      const modelo = row.modelo || row.Modelo || row['MODELO'];
      const classe = row.classe || row.Classe || row['CLASSE'] || row.tipo;
      const intervaloTroca = row['intervalo_troca'] || row['intervalo troca'] || row.intervalo;
      const kmInicial = row['km_inicial'] || row['km inicial'] || row.km || 0;
      const unidade = row.unidade || row.Unidade || row['UNIDADE'] || 'km';

      if (!nome || !modelo || !classe || !intervaloTroca) {
        results.errors.push({
          row: i + 1,
          error: 'Campos obrigatórios ausentes: nome, modelo, classe, intervalo_troca',
          data: row,
        });
        continue;
      }

      // Deduplica dentro do arquivo
      const key = `${nome}-${modelo}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      try {
        await frotaOperations.create({
          nome: String(nome).trim(),
          modelo: String(modelo).trim(),
          classe: String(classe).trim(),
          intervaloTroca: Number(intervaloTroca),
          unidade: String(unidade).trim() || 'km',
          kmInicial: Number(kmInicial) || 0,
        });
        results.imported += 1;
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          error: error.message || String(error),
          data: row,
        });
      }
    }

    return results;
  },

  async importLogs(rows: any[]): Promise<ImportLogResult> {
    const results: ImportLogResult = { imported: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const frotaIdentifier = row.frota || row.Frota || row['FROTA'] || row.numero || row.nome;
      const kmRodado = row['km/hr'] || row['km/hora'] || row['KM/HR'] || row.kmhr || row.kmrodado || row['km rodado'];
      const data = row.data || row.Data || row['DATA'] || row.dia;

      if (!frotaIdentifier || !kmRodado || !data) {
        results.errors.push({
          row: i + 1,
          error: 'Campos obrigatórios ausentes: frota, km/hr, data',
          data: row,
        });
        console.log(`❌ Linha ${i + 1}: Campos ausentes`);
        continue;
      }

      try {
        // Buscar frota pelo nome (número da frota exato)
        const frotaStr = String(frotaIdentifier).trim();
        const frota = await dbGet<{ id: string; nome: string }>('SELECT id, nome FROM frotas WHERE nome = ? LIMIT 1', [frotaStr]);
        
        if (!frota) {
          results.errors.push({
            row: i + 1,
            error: `Frota "${frotaStr}" não encontrada`,
            data: row,
          });
          continue;
        }

        // Converter data do formato DD/MM/YYYY para YYYY-MM-DD
        let dataFormatada = data;
        if (typeof data === 'string' && data.includes('/')) {
          const [dia, mes, ano] = data.split('/');
          dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        }

        await frotaOperations.addLog({
          frotaId: frota.id,
          data: dataFormatada,
          kmRodado: Number(kmRodado),
        });

        results.imported += 1;
      } catch (error: any) {
        console.log(`❌ Linha ${i + 1}: Erro: ${error.message}`);
        results.errors.push({
          row: i + 1,
          error: error.message || String(error),
          data: row,
        });
      }
    }

    return results;
  },
};

export const analiseOperations = {
  async list(): Promise<AnaliseOleo[]> {
    return await dbAll<AnaliseOleo>('SELECT * FROM analises_oleo ORDER BY dataColeta DESC');
  },

  async create(analise: AnaliseOleo): Promise<AnaliseOleo> {
    const id = uuidv4();
    const query = `INSERT INTO analises_oleo (id, numero_amostra, data_coleta, equipamento, tipo_oleo, viscosidade, acidez, agua, particulas, observacoes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await dbRun(query, [
      id,
      analise.numeroAmostra,
      analise.dataColeta,
      analise.equipamento,
      analise.tipoOleo,
      analise.viscosidade || null,
      analise.acidez || null,
      analise.agua || null,
      analise.particulas || null,
      analise.observacoes || null,
      analise.status || 'PENDENTE',
      new Date().toISOString(),
    ]);
    return { ...analise, id };
  },

  async update(id: string, analise: Partial<AnaliseOleo>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (analise.status) {
      fields.push('status = ?');
      values.push(analise.status);
    }
    if (analise.observacoes) {
      fields.push('observacoes = ?');
      values.push(analise.observacoes);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const query = `UPDATE analises_oleo SET ${fields.join(', ')} WHERE id = ?`;
    const result = await dbRun(query, values);
    return result.changes > 0;
  },

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM analises_oleo WHERE id = ?';
    const result = await dbRun(query, [id]);
    return result.changes > 0;
  },
};

export const analiseImportOperations = {
  async importAnalises(rows: any[]): Promise<ImportLogResult> {
    const results: ImportLogResult = { imported: 0, errors: [] };
    const seen = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const numeroAmostra = row['numero_amostra'] || row['Número Amostra'] || row.numero || row.id_amostra;
      const dataColeta = row['data_coleta'] || row['Data Coleta'] || row.data;
      const equipamento = row.equipamento || row.Equipamento;
      const tipoOleo = row['tipo_oleo'] || row['Tipo Óleo'] || row.tipo;
      const viscosidade = row.viscosidade || row.Viscosidade;
      const acidez = row.acidez || row.Acidez;
      const agua = row.agua || row.Água;
      const particulas = row.particulas || row.Partículas;
      const observacoes = row.observacoes || row.Observações;

      if (!numeroAmostra || !dataColeta) {
        results.errors.push({
          row: i + 1,
          error: 'Campos obrigatórios ausentes: numero_amostra, data_coleta',
          data: row,
        });
        continue;
      }

      // Deduplica
      if (seen.has(String(numeroAmostra))) {
        continue;
      }
      seen.add(String(numeroAmostra));

      try {
        await analiseOperations.create({
          numeroAmostra: String(numeroAmostra).trim(),
          dataColeta: String(dataColeta).trim(),
          equipamento: String(equipamento).trim(),
          tipoOleo: String(tipoOleo).trim(),
          viscosidade: viscosidade ? Number(viscosidade) : undefined,
          acidez: acidez ? Number(acidez) : undefined,
          agua: agua ? Number(agua) : undefined,
          particulas: particulas ? Number(particulas) : undefined,
          observacoes: observacoes ? String(observacoes).trim() : undefined,
          status: 'REGISTRADO',
        });
        results.imported += 1;
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          error: error.message || String(error),
          data: row,
        });
      }
    }

    return results;
  },
};

// ============= MOTOR OPERATIONS =============

export interface Motor {
  id?: string;
  numeroMotor: string;
  frotaMotor: string;
  modeloMotor: string;
  classeFrota: string;
  unidade: string; // VVAA, Floresta, Cambuí, Panorama
  vidaMotor: number;
  horasInicial: number;
  dataIntervencao?: string;
  equipamentoAtual?: string;
  createdAt?: string;
}

export interface MotorLog {
  id?: string;
  motorId: string;
  data: string;
  horasRodado: number;
  createdAt?: string;
}

export interface MotorStatus extends Motor {
  horasAcumuladas: number;
  progresso: number; // 0-100
  horasRestantes: number;
  proximaManutencao: number;
}

export const motorOperations = {
  async create(motor: Motor): Promise<Motor> {
    const id = uuidv4();
    
    console.log('💾 [CREATE MOTOR] Recebendo:', {
      numeroMotor: motor.numeroMotor,
      dataIntervencao: motor.dataIntervencao,
      dataIntervencao_tipo: typeof motor.dataIntervencao,
    });
    
    const query = `
      INSERT INTO motores 
      (id, numero_motor, frota_motor, modelo_motor, classe_frota, unidade, vida_motor, horas_inicial, data_intervencao, equipamento_atual)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      motor.numeroMotor,
      motor.frotaMotor,
      motor.modeloMotor,
      motor.classeFrota,
      motor.unidade,
      motor.vidaMotor,
      motor.horasInicial,
      motor.dataIntervencao || null,
      motor.equipamentoAtual || null,
    ];

    console.log('📝 [INSERT QUERY] Valores:', {
      data_intervencao_index8: values[8],
    });
    
    await dbRun(query, values);
    console.log('✅ [CREATE MOTOR] Motor criado com sucesso');

    // Verificar se realmente foi salvo
    const verificacao = await dbGet<any>('SELECT * FROM motores WHERE id = ?', [id]);
    console.log('🔍 [VERIFICAÇÃO] Dados salvos no banco:', {
      id: verificacao?.id,
      numero_motor: verificacao?.numero_motor,
      data_intervencao: verificacao?.data_intervencao,
    });

    return { ...motor, id };
  },

  async listWithStatus(): Promise<MotorStatus[]> {
    const motores = await dbAll<any>('SELECT * FROM motores ORDER BY numero_motor ASC');
    
    console.log(`📦 [listWithStatus] Total de motores no banco: ${motores.length}`);
    
    const resultado = await Promise.all(
      motores.map(async (motorData) => {
        // Mapear snake_case para camelCase
        const motor: Motor = {
          id: motorData.id,
          numeroMotor: motorData.numero_motor,
          frotaMotor: motorData.frota_motor,
          modeloMotor: motorData.modelo_motor,
          classeFrota: motorData.classe_frota,
          unidade: motorData.unidade,
          vidaMotor: motorData.vida_motor,
          horasInicial: motorData.horas_inicial,
          dataIntervencao: motorData.data_intervencao,
          equipamentoAtual: motorData.equipamento_atual,
          createdAt: motorData.created_at,
        };

        const logs = await dbAll<any>(
          'SELECT * FROM motor_logs WHERE motor_id = ? ORDER BY data DESC',
          [motor.id]
        );

        console.log(`  📊 Motor ${motor.numeroMotor}: ${logs.length} logs encontrados`);
        if (logs.length > 0) {
          console.log(`    Logs:`, JSON.stringify(logs, null, 2));
        }

        const horasAcumuladas = logs.reduce((sum, log) => sum + log.horas_rodado, 0);
        const totalHoras = motor.horasInicial + horasAcumuladas;
        const progresso = (totalHoras / motor.vidaMotor) * 100;
        const horasRestantes = Math.max(0, motor.vidaMotor - totalHoras);
        const proximaManutencao = motor.horasInicial + motor.vidaMotor;

        if (logs.length > 0 || motor.horasInicial > 0) {
          console.log(`📊 [STATUS] Motor ${motor.numeroMotor}: ${totalHoras} horas (${motor.horasInicial} inicial + ${horasAcumuladas} acumuladas) / ${motor.vidaMotor} (${progresso.toFixed(1)}%)`);
        }

        return {
          ...motor,
          horasAcumuladas,
          progresso,
          horasRestantes,
          proximaManutencao,
        } as MotorStatus;
      })
    );

    return resultado;
  },

  async addLog(motorId: string, log: Omit<MotorLog, 'id' | 'motorId' | 'createdAt'>): Promise<void> {
    const id = uuidv4();
    const query = `
      INSERT INTO motor_logs (id, motor_id, data, horas_rodado)
      VALUES (?, ?, ?, ?)
    `;
    
    console.log('📝 [ADD LOG] Motor:', motorId, 'Horas:', log.horasRodado, 'Data:', log.data);
    await dbRun(query, [id, motorId, log.data, log.horasRodado]);
    console.log('✅ [ADD LOG] Log inserido com sucesso');
  },

  async update(motorId: string, updates: Partial<Motor>): Promise<void> {
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.numeroMotor !== undefined) {
      setClauses.push('numero_motor = ?');
      values.push(updates.numeroMotor);
    }
    if (updates.frotaMotor !== undefined) {
      setClauses.push('frota_motor = ?');
      values.push(updates.frotaMotor);
    }
    if (updates.modeloMotor !== undefined) {
      setClauses.push('modelo_motor = ?');
      values.push(updates.modeloMotor);
    }
    if (updates.classeFrota !== undefined) {
      setClauses.push('classe_frota = ?');
      values.push(updates.classeFrota);
    }
    if (updates.unidade !== undefined) {
      setClauses.push('unidade = ?');
      values.push(updates.unidade);
    }
    if (updates.vidaMotor !== undefined) {
      setClauses.push('vida_motor = ?');
      values.push(updates.vidaMotor);
    }
    if (updates.horasInicial !== undefined) {
      setClauses.push('horas_inicial = ?');
      values.push(updates.horasInicial);
    }
    if (updates.dataIntervencao !== undefined) {
      setClauses.push('data_intervencao = ?');
      values.push(updates.dataIntervencao);
    }
    if (updates.equipamentoAtual !== undefined) {
      setClauses.push('equipamento_atual = ?');
      values.push(updates.equipamentoAtual);
    }

    if (setClauses.length === 0) return;

    values.push(motorId);
    const query = `UPDATE motores SET ${setClauses.join(', ')} WHERE id = ?`;
    await dbRun(query, values);
  },

  async delete(motorId: string): Promise<void> {
    await dbRun('DELETE FROM motores WHERE id = ?', [motorId]);
  },

  async resetHoras(motorId: string, dataIntervencao?: string): Promise<void> {
    // Deletar todos os logs do motor (zera acumulado)
    await dbRun('DELETE FROM motor_logs WHERE motor_id = ?', [motorId]);
    // Zerar horas iniciais e registrar data de intervenção
    const data = dataIntervencao || new Date().toISOString().slice(0, 10);
    await dbRun('UPDATE motores SET horas_inicial = 0, data_intervencao = ? WHERE id = ?', [data, motorId]);
  },
};

export const motorImportOperations = {
  async importMotores(dados: any[]): Promise<{ imported: number; errors: any[] }> {
    const results = { imported: 0, errors: [] as any[] };
    const seen = new Set<string>();

    console.log('📥 [IMPORT MOTORES] Total de linhas:', dados.length);
    if (dados.length > 0) {
      console.log('📥 [IMPORT MOTORES] Primeiras 2 linhas do arquivo:');
      console.log(JSON.stringify(dados.slice(0, 2), null, 2));
      console.log('🔑 [IMPORT MOTORES] Colunas encontradas:', Object.keys(dados[0] || {}));
    }

    for (let idx = 0; idx < dados.length; idx++) {
      const row = dados[idx];
      
      // Função auxiliar para buscar valor flexível (com e sem espaços, maiúsculas/minúsculas)
      const getField = (obj: any, ...names: string[]): any => {
        for (const name of names) {
          // Busca exata
          if (obj[name] !== undefined && obj[name] !== null && obj[name] !== '') return obj[name];
          
          // Busca case-insensitive e sem espaços
          const lowerName = name.toLowerCase().replace(/\s+/g, '');
          for (const key of Object.keys(obj)) {
            if (key.toLowerCase().replace(/\s+/g, '') === lowerName && obj[key] !== null && obj[key] !== '') {
              return obj[key];
            }
          }
        }
        return undefined;
      };

      const numeroMotor = getField(row, 'numeroMotor', 'pinacao', 'pinação', 'pinacao motor', 'pinação motor');
      const frotaMotor = getField(row, 'frotaMotor', 'frota', 'agregado');
      const modeloMotor = getField(row, 'modeloMotor', 'tipo', 'modelo');
      const classeFrota = getField(row, 'classeFrota', 'classe');
      const unidade = getField(row, 'unidade');
      const vidaMotor = getField(row, 'vidaMotor', 'vida util', 'vida útil', 'vidasutil', 'vidautil');
      const horasInicial = getField(row, 'horasInicial', 'vida atual', 'vidaatual');
      let dataIntervencao = getField(row, 'dataIntervencao', 'data', 'dataintervencao', 'data intervencao', 'data_intervencao');
      const equipamentoAtual = getField(row, 'equipamentoAtual', 'equipamento');

      // Se a data é um número (formato Excel), converter para data
      const dataAntesConversao = dataIntervencao;
      if (dataIntervencao && typeof dataIntervencao === 'number') {
        // Formato Excel: dias desde 1900-01-01
        const excelDate = new Date((dataIntervencao - 25569) * 86400 * 1000);
        dataIntervencao = excelDate.toISOString().slice(0, 10);
        console.log(`📅 [CONVERSÃO DATA] ${dataAntesConversao} (número Excel) -> ${dataIntervencao} (data convertida)`);
      }

      console.log(`🔍 [LINHA ${idx + 1}] Extraído:`, {
        numeroMotor,
        frotaMotor,
        modeloMotor,
        classeFrota,
        vidaMotor,
        horasInicial,
        dataIntervencao_original: dataAntesConversao,
        dataIntervencao_final: dataIntervencao,
      });

      if (!numeroMotor || !frotaMotor || !modeloMotor || !classeFrota || !vidaMotor || horasInicial === undefined) {
        results.errors.push({ row, erro: 'Campos obrigatórios ausentes' });
        continue;
      }

      if (seen.has(String(numeroMotor))) {
        continue;
      }
      seen.add(String(numeroMotor));

      try {
        console.log('🚀 [ANTES CREATE] Dados que serão criados:', {
          numeroMotor,
          frotaMotor,
          modeloMotor,
          classeFrota,
          unidade,
          vidaMotor,
          horasInicial,
          dataIntervencao,
          equipamentoAtual,
        });
        
        await motorOperations.create({
          numeroMotor: String(numeroMotor).trim(),
          frotaMotor: String(frotaMotor).trim(),
          modeloMotor: String(modeloMotor).trim(),
          classeFrota: String(classeFrota).trim(),
          unidade: String(unidade || 'VVAA').trim(),
          vidaMotor: Number(vidaMotor),
          horasInicial: Number(horasInicial),
          dataIntervencao: dataIntervencao ? String(dataIntervencao).trim() : undefined,
          equipamentoAtual: equipamentoAtual ? String(equipamentoAtual).trim() : undefined,
        });
        console.log(`✅ [IMPORT] Linha ${idx + 1} importada com sucesso`);
        results.imported++;
      } catch (err: any) {
        console.log(`❌ [IMPORT] Linha ${idx + 1} erro: ${err.message}`);
        console.log(`❌ [IMPORT] Stack completo:`, err);
        results.errors.push({ row, erro: err.message });
      }
    }

    return results;
  },

  async importLogs(dados: any[]): Promise<{ imported: number; errors: any[] }> {
    const results = { imported: 0, errors: [] as any[] };

    for (const row of dados) {
      const { numeroMotor, data, horasRodado } = row;

      if (!numeroMotor || !data || !horasRodado) {
        results.errors.push({ row, erro: 'Campos obrigatórios ausentes' });
        continue;
      }

      try {
        const motorData = await dbGet<any>(
          'SELECT * FROM motores WHERE numero_motor = ?',
          [String(numeroMotor).trim()]
        );

        if (!motorData) {
          results.errors.push({ row, erro: 'Motor não encontrado' });
          continue;
        }

        // Mapear para o tipo Motor
        const motor: Motor = {
          id: motorData.id,
          numeroMotor: motorData.numero_motor,
          frotaMotor: motorData.frota_motor,
          modeloMotor: motorData.modelo_motor,
          classeFrota: motorData.classe_frota,
          unidade: motorData.unidade,
          vidaMotor: motorData.vida_motor,
          horasInicial: motorData.horas_inicial,
          equipamentoAtual: motorData.equipamento_atual,
        };

        await motorOperations.addLog(motor.id!, {
          data: String(data).trim(),
          horasRodado: Number(horasRodado),
        });
        results.imported++;
      } catch (err: any) {
        results.errors.push({ row, erro: err.message });
      }
    }

    return results;
  },
};

export default db;

