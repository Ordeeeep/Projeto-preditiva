-- Banco de Dados - Sistema de Análises de Óleo e Frotas
-- Criado em: 16/12/2025

-- Habilitar chaves estrangeiras
PRAGMA foreign_keys = ON;

-- Tabela de Análises de Óleo
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
);

-- Tabela de Frotas
CREATE TABLE IF NOT EXISTS frotas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  modelo TEXT NOT NULL DEFAULT 'N/A',
  classe TEXT NOT NULL DEFAULT 'N/A',
  intervalo_troca REAL NOT NULL,
  unidade TEXT DEFAULT 'km',
  km_inicial REAL NOT NULL,
  status_analise TEXT DEFAULT 'NORMAL',
  data_ultima_analise TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Logs de Frotas (Rodagem Diária)
CREATE TABLE IF NOT EXISTS frota_logs (
  id TEXT PRIMARY KEY,
  frota_id TEXT NOT NULL,
  data TEXT NOT NULL,
  km_rodado REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(frota_id) REFERENCES frotas(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_analises_data ON analises_oleo(data_coleta);
CREATE INDEX IF NOT EXISTS idx_analises_equipamento ON analises_oleo(equipamento);
CREATE INDEX IF NOT EXISTS idx_frota_logs_frota_id ON frota_logs(frota_id);
CREATE INDEX IF NOT EXISTS idx_frota_logs_data ON frota_logs(data);
