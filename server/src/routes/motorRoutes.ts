import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { motorOperations, motorImportOperations } from '../database';

console.log('[MOTOR ROUTES] Arquivo sendo carregado...');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Middleware que loga TODAS as requisições para motores
router.use((req, res, next) => {
  console.log(`[MOTOR ROUTER] ${req.method} ${req.path}`);
  next();
});

// Listar motores com status de acompanhamento
router.get('/', async (req, res) => {
  try {
    const motores = await motorOperations.listWithStatus();
    res.json(motores);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar progresso dos motores em Excel
router.get('/export/excel', async (req, res) => {
  try {
    console.log('📊 [EXPORT EXCEL MOTORES] Iniciando exportação...');
    const motores = await motorOperations.listWithStatus();
    console.log(`📊 [EXPORT EXCEL MOTORES] Total de motores: ${motores.length}`);
    
    // Preparar dados para exportação
    const dados = motores.map((motor) => ({
      ID: motor.id,
      'Número Motor': motor.numeroMotor,
      'Frota Motor': motor.frotaMotor,
      'Modelo Motor': motor.modeloMotor,
      'Classe da Frota': motor.classeFrota,
      'Unidade': motor.unidade,
      'Vida Motor': `${motor.vidaMotor} horas`,
      'Horas Acumuladas': motor.horasAcumuladas,
      'Progresso': `${motor.progresso.toFixed(1)}%`,
      'Horas Restantes': motor.horasRestantes,
      'Próxima Manutenção': motor.proximaManutencao,
      'Equipamento Atual': motor.equipamentoAtual || '-',
      'Data Criação': motor.createdAt?.slice(0, 10) || '-',
    }));

    // Criar workbook
    const ws = xlsx.utils.json_to_sheet(dados);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Motores');

    // Definir larguras das colunas
    ws['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
    ];

    // Gerar arquivo
    const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="motores-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('❌ [EXPORT EXCEL MOTORES] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Exportar progresso dos motores em CSV
router.get('/export/csv', async (req, res) => {
  try {
    console.log('📄 [EXPORT CSV MOTORES] Iniciando exportação...');
    const motores = await motorOperations.listWithStatus();
    console.log(`📄 [EXPORT CSV MOTORES] Total de motores: ${motores.length}`);
    
    // Preparar dados para exportação
    const dados = motores.map((motor) => ({
      ID: motor.id,
      'Número Motor': motor.numeroMotor,
      'Frota Motor': motor.frotaMotor,
      'Modelo Motor': motor.modeloMotor,
      'Classe da Frota': motor.classeFrota,
      'Unidade': motor.unidade,
      'Vida Motor': `${motor.vidaMotor} horas`,
      'Horas Acumuladas': motor.horasAcumuladas,
      'Progresso': `${motor.progresso.toFixed(1)}%`,
      'Horas Restantes': motor.horasRestantes,
      'Próxima Manutenção': motor.proximaManutencao,
      'Equipamento Atual': motor.equipamentoAtual || '-',
      'Data Criação': motor.createdAt?.slice(0, 10) || '-',
    }));

    // Converter para CSV
    const ws = xlsx.utils.json_to_sheet(dados);
    const csv = xlsx.utils.sheet_to_csv(ws);
    console.log(`📄 [EXPORT CSV MOTORES] Arquivo gerado com ${csv.length} caracteres`);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="progresso-motores-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('\uFEFF' + csv); // BOM para UTF-8
    console.log('✅ [EXPORT CSV MOTORES] Exportação concluída com sucesso');
  } catch (error: any) {
    console.error('❌ [EXPORT CSV MOTORES] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Criar novo motor
router.post('/', async (req, res) => {
  try {
    const { numeroMotor, frotaMotor, modeloMotor, classeFrota, unidade, vidaMotor, horasInicial, dataIntervencao, equipamentoAtual } = req.body;
    
    console.log('📝 [CREATE MOTOR] Dados recebidos:', {
      numeroMotor, frotaMotor, modeloMotor, classeFrota, unidade, vidaMotor, horasInicial, dataIntervencao, equipamentoAtual
    });
    
    if (!numeroMotor || !frotaMotor || !modeloMotor || !classeFrota || !vidaMotor || horasInicial === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios: numeroMotor, frotaMotor, modeloMotor, classeFrota, vidaMotor, horasInicial' });
    }
    if (Number(vidaMotor) <= 0 || Number(horasInicial) < 0) {
      return res.status(400).json({ error: 'vidaMotor deve ser > 0 e horasInicial não pode ser negativo' });
    }

    const motor = await motorOperations.create({
      numeroMotor,
      frotaMotor,
      modeloMotor,
      classeFrota,
      unidade: unidade || 'VVAA',
      vidaMotor: Number(vidaMotor),
      horasInicial: Number(horasInicial),
      dataIntervencao: dataIntervencao || undefined,
      equipamentoAtual: equipamentoAtual || '',
    });

    const motores = await motorOperations.listWithStatus();
    const criado = motores.find((m) => m.id === motor.id);
    res.status(201).json(criado || motor);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ROTAS /import/* DEVEM VIR ANTES DE /:id/*
// Importar motores de arquivo
router.post('/import/file', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const workbook = xlsx.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = xlsx.utils.sheet_to_json(sheet);

    console.log('📋 [IMPORT MOTORES] Primeiras linhas do arquivo:');
    console.log(JSON.stringify(dados.slice(0, 2), null, 2));
    console.log('📋 [IMPORT MOTORES] Colunas encontradas:', Object.keys(dados[0] || {}));

    const resultado = await motorImportOperations.importMotores(dados);

    res.json(resultado);
  } catch (error: any) {
    console.error('❌ [IMPORT MOTORES] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Importar horas de arquivo
router.post('/import/logs', async (req, res) => {
  console.log('\n\n🚨🚨🚨 ROTA /import/logs ACIONADA!!! 🚨🚨🚨');
  console.log('File:', req.file ? req.file.originalname : 'NENHUM');
  console.log('\n\n🔥 ====== ROTA /api/motores/import/logs ACIONADA ======');
  console.log('✓ Request chegou no servidor');
  console.log('✓ Arquivo recebido:', req.file ? req.file.originalname : 'NENHUM');
  
  try {
    if (!req.file) {
      console.log('❌ Nenhum arquivo foi enviado');
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    console.log('📥 [IMPORT LOGS MOTORES] Arquivo recebido:', req.file.originalname);
    const workbook = xlsx.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = xlsx.utils.sheet_to_json(sheet);

    console.log('📥 [IMPORT LOGS MOTORES] Linhas a importar:', dados.length);
    console.log('📥 [IMPORT LOGS MOTORES] Colunas:', Object.keys(dados[0] || {}));

    const resultado = await motorImportOperations.importLogs(dados);
    
    console.log('📥 [IMPORT LOGS MOTORES] Resultado:', resultado);
    res.json(resultado);
  } catch (error: any) {
    console.error('❌ [IMPORT LOGS MOTORES] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
  console.log('🔥 ====== FIM DA ROTA /api/motores/import/logs ======\n\n');
});

// Registrar horas de funcionamento diário
router.post('/:id/logs', async (req, res) => {
  try {
    console.log(`\n📝 [ADICIONAR HORAS MOTOR] ID: ${req.params.id}`);
    console.log(`   Content-Type: ${req.headers['content-type']}`);
    console.log(`   Body completo:`, JSON.stringify(req.body));
    console.log(`   Chaves do body:`, Object.keys(req.body));
    
    const { data, horasRodado } = req.body;
    console.log(`   data="${data}", horasRodado="${horasRodado}"`);
    
    if (!horasRodado || Number(horasRodado) <= 0) {
      console.log(`   ❌ Validação falhou: horasRodado inválido`);
      return res.status(400).json({ error: 'horasRodado deve ser > 0' });
    }

    console.log(`   ✅ Adicionando log...`);
    await motorOperations.addLog(req.params.id, {
      data: data || new Date().toISOString().split('T')[0],
      horasRodado: Number(horasRodado),
    });

    console.log(`   ✅ Log adicionado com sucesso`);
    const motores = await motorOperations.listWithStatus();
    const atualizado = motores.find((m) => m.id === req.params.id);
    res.json(atualizado);
  } catch (error: any) {
    console.error(`   ❌ ERRO:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar motor
router.put('/:id', async (req, res) => {
  try {
    const { numeroMotor, frotaMotor, modeloMotor, classeFrota, unidade, vidaMotor, horasInicial, equipamentoAtual } = req.body;
    
    const updates: any = {};
    if (numeroMotor !== undefined) updates.numeroMotor = numeroMotor;
    if (frotaMotor !== undefined) updates.frotaMotor = frotaMotor;
    if (modeloMotor !== undefined) updates.modeloMotor = modeloMotor;
    if (classeFrota !== undefined) updates.classeFrota = classeFrota;
    if (unidade !== undefined) updates.unidade = unidade;
    if (vidaMotor !== undefined) updates.vidaMotor = Number(vidaMotor);
    if (horasInicial !== undefined) updates.horasInicial = Number(horasInicial);
    if (equipamentoAtual !== undefined) updates.equipamentoAtual = equipamentoAtual;

    await motorOperations.update(req.params.id, updates);
    
    const motores = await motorOperations.listWithStatus();
    const atualizado = motores.find((m) => m.id === req.params.id);
    res.json(atualizado);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar motor
router.delete('/:id', async (req, res) => {
  try {
    await motorOperations.delete(req.params.id);
    res.json({ message: 'Motor deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resetar rodagem (marcar manutenção realizada)
router.post('/:id/reset', async (req, res) => {
  try {
    const { dataIntervencao } = req.body || {};
    await motorOperations.resetHoras(req.params.id, dataIntervencao);
    const motores = await motorOperations.listWithStatus();
    const atualizado = motores.find((m) => m.id === req.params.id);
    res.json(atualizado);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
