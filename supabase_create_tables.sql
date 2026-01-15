-- 🗄️ Script SQL para criar tabelas no Supabase
-- Copie e cole no SQL Editor do Supabase

-- Tabela: frotas
CREATE TABLE IF NOT EXISTS frotas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  modelo TEXT NOT NULL,
  classe TEXT NOT NULL,
  intervalo_troca REAL NOT NULL,
  unidade TEXT DEFAULT 'km',
  km_inicial REAL NOT NULL DEFAULT 0,
  status_analise TEXT DEFAULT 'NORMAL',
  data_ultima_analise TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: frota_logs
CREATE TABLE IF NOT EXISTS frota_logs (
  id TEXT PRIMARY KEY,
  frota_id TEXT NOT NULL REFERENCES frotas(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  km_rodado REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: analises_oleo
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_frota_logs_frota_id ON frota_logs(frota_id);
CREATE INDEX IF NOT EXISTS idx_frotas_nome ON frotas(nome);
CREATE INDEX IF NOT EXISTS idx_analises_numero ON analises_oleo(numero_amostra);
