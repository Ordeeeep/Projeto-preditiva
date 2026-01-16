import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { frotaOperations, frotaImportOperations } from '../database';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Listar frotas com status de acompanhamento
router.get('/', async (req, res) => {
  try {
    const frotas = await frotaOperations.listWithStatus();
    res.json(frotas);
  } catch (error: any) {
    console.error('❌ Erro ao listar frotas na rota:', error);
    res.status(500).json({ 
      error: error.message || 'Erro desconhecido ao listar frotas',
      details: error.stack
    });
  }
});

// Exportar progresso das frotas em Excel
router.get('/export/excel', async (req, res) => {
  try {
    const frotas = await frotaOperations.listWithStatus();
    
    // Preparar dados para exportação
    const dados = frotas.map((frota) => ({
      ID: frota.id,
      Nome: frota.nome,
      Modelo: frota.modelo,
      Classe: frota.classe,
      'Intervalo de Troca': `${frota.intervaloTroca} ${frota.unidade}`,
      'KM Inicial': frota.kmInicial,
      'KM Acumulado': frota.kmAcumulado,
      Progresso: `${frota.progresso.toFixed(1)}%`,
      'KM Restante': frota.kmRestante,
      'Próximo Limite': frota.proximoLimite,
      'Status da Análise': frota.statusAnalise || 'NORMAL',
      'Data Última Análise': frota.dataUltimaAnalise || '-',
      'Data Criação': frota.createdAt?.slice(0, 10) || '-',
    }));

    // Criar workbook
    const ws = xlsx.utils.json_to_sheet(dados);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Frotas');

    // Definir larguras das colunas
    ws['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
    ];

    // Gerar arquivo
    const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="progresso-frotas-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('❌ [EXPORT EXCEL] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Exportar progresso das frotas em CSV
router.get('/export/csv', async (req, res) => {
  try {
    const frotas = await frotaOperations.listWithStatus();
    
    // Preparar dados para exportação
    const dados = frotas.map((frota) => ({
      ID: frota.id,
      Nome: frota.nome,
      Modelo: frota.modelo,
      Classe: frota.classe,
      'Intervalo de Troca': `${frota.intervaloTroca} ${frota.unidade}`,
      'KM Inicial': frota.kmInicial,
      'KM Acumulado': frota.kmAcumulado,
      Progresso: `${frota.progresso.toFixed(1)}%`,
      'KM Restante': frota.kmRestante,
      'Próximo Limite': frota.proximoLimite,
      'Status da Análise': frota.statusAnalise || 'NORMAL',
      'Data Última Análise': frota.dataUltimaAnalise || '-',
      'Data Criação': frota.createdAt?.slice(0, 10) || '-',
    }));

    // Gerar CSV
    const csv = dados.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="progresso-frotas-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('\uFEFF' + csv); // BOM para UTF-8
  } catch (error: any) {
    console.error('❌ [EXPORT CSV] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Criar nova frota
router.post('/', async (req, res) => {
  try {
    const { nome, modelo, classe, intervaloTroca, unidade = 'km', kmInicial } = req.body;
    if (!nome || !modelo || !classe || !intervaloTroca || !kmInicial) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, modelo, classe, intervaloTroca, kmInicial' });
    }
    if (Number(intervaloTroca) <= 0 || Number(kmInicial) < 0) {
      return res.status(400).json({ error: 'intervaloTroca deve ser > 0 e kmInicial não pode ser negativo' });
    }

    const frota = await frotaOperations.create({
      nome,
      modelo,
      classe,
      intervaloTroca: Number(intervaloTroca),
      unidade,
      kmInicial: Number(kmInicial),
    });

    const frotas = await frotaOperations.listWithStatus();
    const criada = frotas.find((f) => f.id === frota.id);
    res.status(201).json(criada || frota);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar rodagem diária
router.post('/:id/logs', async (req, res) => {
  try {
    const { data, kmRodado } = req.body;
    if (!kmRodado || Number(kmRodado) <= 0) {
      return res.status(400).json({ error: 'kmRodado deve ser maior que zero' });
    }
    const logData = data || new Date().toISOString().slice(0, 10);

    await frotaOperations.addLog({
      frotaId: req.params.id,
      data: logData,
      kmRodado: Number(kmRodado),
    });

    const frotas = await frotaOperations.listWithStatus();
    const frotaAtualizada = frotas.find((f) => f.id === req.params.id);
    res.status(201).json(frotaAtualizada);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar frota
router.put('/:id', async (req, res) => {
  try {
    const { nome, modelo, classe, intervaloTroca, unidade, kmInicial } = req.body;
    if (!nome && !modelo && !classe && !intervaloTroca && !unidade && kmInicial === undefined) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    if (intervaloTroca && Number(intervaloTroca) <= 0) {
      return res.status(400).json({ error: 'intervaloTroca deve ser > 0' });
    }

    const updated = await frotaOperations.update(req.params.id, {
      nome,
      modelo,
      classe,
      intervaloTroca: intervaloTroca ? Number(intervaloTroca) : undefined,
      unidade,
      kmInicial: kmInicial !== undefined ? Number(kmInicial) : undefined,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Frota não encontrada' });
    }

    const frotas = await frotaOperations.listWithStatus();
    const frotaAtualizada = frotas.find((f) => f.id === req.params.id);
    res.json(frotaAtualizada);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar frota
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await frotaOperations.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Frota não encontrada' });
    }
    res.json({ message: 'Frota deletada com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status da análise
router.post('/:id/analise', async (req, res) => {
  try {
    const { status, data } = req.body;
    if (!status || !data) {
      return res.status(400).json({ error: 'Campos obrigatórios: status, data' });
    }
    if (!['NORMAL', 'ANORMAL', 'CRITICO'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use: NORMAL, ANORMAL ou CRITICO' });
    }

    const updated = await frotaOperations.updateStatusAnalise(req.params.id, status, data);
    if (!updated) {
      return res.status(404).json({ error: 'Frota não encontrada' });
    }

    const frotas = await frotaOperations.listWithStatus();
    const frotaAtualizada = frotas.find((f) => f.id === req.params.id);
    res.json(frotaAtualizada);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resetar rodagem após coleta
router.post('/:id/reset-rodagem', async (req, res) => {
  try {
    const updated = await frotaOperations.resetRodagem(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Frota não encontrada' });
    }

    const frotas = await frotaOperations.listWithStatus();
    const frotaAtualizada = frotas.find((f) => f.id === req.params.id);
    res.json(frotaAtualizada);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Importar logs de rodagem em massa
router.post('/import-logs', async (req, res) => {
  console.log('\n\n🔥 ====== ROTA /api/frotas/import-logs ACIONADA ======');
  console.log('✓ Request chegou no servidor');
  console.log('✓ Arquivo recebido:', req.file ? req.file.originalname : 'NENHUM');
  
  try {
    if (!req.file) {
      console.log('❌ Nenhum arquivo foi enviado');
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }

    console.log('📥 [IMPORT LOGS FROTAS] Arquivo recebido:', req.file.originalname);
    const filename = req.file.originalname || '';
    const buffer = req.file.buffer;
    let rows: any[] = [];

    if (/\.xlsx?$/.test(filename) || req.file.mimetype.includes('sheet')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      // Tratar como CSV/TSV/Texto simples
      const text = buffer.toString('utf8');
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      if (lines.length === 0) {
        return res.status(400).json({ error: 'Arquivo vazio' });
      }
      const header = lines[0].split(/\t|,|;/).map((h) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/\t|,|;/).map((c) => c.trim());
        const obj: any = {};
        header.forEach((h, idx) => {
          obj[h] = cols[idx] ?? '';
        });
        rows.push(obj);
      }
    }

    console.log('📥 [IMPORT LOGS FROTAS] Linhas a importar:', rows.length);
    console.log('📥 [IMPORT LOGS FROTAS] Colunas:', Object.keys(rows[0] || {}));

    const results = await frotaImportOperations.importLogs(rows);
    
    console.log('📥 [IMPORT LOGS FROTAS] Resultado:', results);
    res.json(results);
  } catch (error: any) {
    console.error('❌ [IMPORT LOGS FROTAS] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
  console.log('🔥 ====== FIM DA ROTA /api/frotas/import-logs ======\n\n');
});

// Importar frotas em massa
router.post('/import-frotas', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }

    const filename = req.file.originalname || '';
    const buffer = req.file.buffer;
    let rows: any[] = [];

    if (/\.xlsx?$/.test(filename) || req.file.mimetype.includes('sheet')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      // Tratar como CSV/TSV/Texto simples
      const text = buffer.toString('utf8');
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      if (lines.length === 0) {
        return res.status(400).json({ error: 'Arquivo vazio' });
      }
      const header = lines[0].split(/\t|,|;/).map((h) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/\t|,|;/).map((c) => c.trim());
        const obj: any = {};
        header.forEach((h, idx) => {
          obj[h] = cols[idx] ?? '';
        });
        rows.push(obj);
      }
    }

    const imported: string[] = [];
    const errors: any[] = [];

    // Evitar duplicar frotas já existentes no SQLite
    const existentes = await frotaOperations.listWithStatus();
    const nomesExistentes = new Set(existentes.map((f) => f.nome.toLowerCase().trim()));

    for (const row of rows) {
      try {
        // Aceitar múltiplos nomes de colunas (agora todas em minúsculas)
        const nome = row.frota || row.numero || row.nome || '';
        const modelo = row.modelo || '';
        const classe = row.classe || '';
        
        // Capturar intervalo de troca do arquivo
        const intervaloRaw = row.intervalo || row.intervalodetroca || '';
        const intervaloTroca = intervaloRaw ? parseFloat(intervaloRaw.toString().replace(/\./g, '').replace(',', '.')) : 1;
        
        // Mapear km/horas para unidade (agora em minúsculas)
        let unidadeRaw = row.unidade || row['kmhoras'] || row['km/horas'] || row['kmhoras'] || 'km';
        unidadeRaw = unidadeRaw.toString().toLowerCase().trim();
        
        // Verificar se é hora/horas (aceita várias variações)
        const isHora = unidadeRaw === 'hora' || unidadeRaw === 'horas' || unidadeRaw === 'h' || unidadeRaw.includes('hora');
        const unidadeFinal = isHora ? 'hora' : 'km';
        
        // KM Inicial é opcional, padrão 0
        const kmInicial = parseFloat(row.kminicial || row.horasiniciais || '0');

        if (!nome || !modelo || !classe) {
          errors.push({ row, error: 'Campos obrigatórios faltando: frota/numero, modelo, classe' });
          continue;
        }

        const nomeNormalizado = nome.toString().trim().toLowerCase();
        if (nomesExistentes.has(nomeNormalizado)) {
          console.log(`⏭️ Frota "${nome}" já existe no banco local. Ignorando...`);
          continue;
        }

        // Marca como existente para evitar checar novamente no mesmo arquivo
        nomesExistentes.add(nomeNormalizado);
 frotaOperations.create({
          nome: nome.toString().trim(),
          modelo: modelo.toString().trim(),
          classe: classe.toString().trim(),
          intervaloTroca,
          unidade: unidadeFinal,
          kmInicial,
        });

        imported.push(nome);
      } catch (error: any) {
        errors.push({ row, error: error.message });
      }
    }

    res.json({ imported: imported.length, errors });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENDPOINT DE DEBUG - Testar conexão com banco
router.get('/debug/health', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Testando saúde do banco de dados...');
    
    // Tentar listar frotas
    const frotas = await frotaOperations.listWithStatus();
    
    res.json({ 
      status: 'ok',
      message: 'Banco de dados está funcionando',
      frotasCount: frotas.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ [DEBUG] Erro na saúde do banco:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      error: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
