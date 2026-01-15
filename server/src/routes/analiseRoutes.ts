import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { dbOperations } from '../database';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Listar todas as análises
router.get('/', async (req, res) => {
  try {
    const analises = await dbOperations.getAll();
    res.json(analises);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter análise por ID
router.get('/:id', async (req, res) => {
  try {
    const analise = await dbOperations.getById(req.params.id);
    if (!analise) {
      return res.status(404).json({ error: 'Análise não encontrada' });
    }
    res.json(analise);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar nova análise
router.post('/', async (req, res) => {
  try {
    const { numeroAmostra, dataColeta, equipamento, tipoOleo, observacoes, status } = req.body;

    if (!numeroAmostra || !dataColeta || !equipamento || !tipoOleo) {
      return res.status(400).json({ error: 'Campos obrigatórios: numeroAmostra, dataColeta, equipamento, tipoOleo' });
    }

    const analise = await dbOperations.create({
      numeroAmostra,
      dataColeta,
      equipamento,
      tipoOleo,
      observacoes,
      status
    });

    res.status(201).json(analise);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Número de amostra já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Atualizar análise
router.put('/:id', async (req, res) => {
  try {
    const updated = await dbOperations.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Análise não encontrada' });
    }
    const analise = await dbOperations.getById(req.params.id);
    res.json(analise);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar análise
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dbOperations.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Análise não encontrada' });
    }
    res.json({ message: 'Análise deletada com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Importar análises em massa (arquivo .txt/.csv/.xlsx)
router.post('/import', upload.single('file'), async (req, res) => {
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
      // tratar como CSV/TSV/Texto simples
      const text = buffer.toString('utf8');
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      if (lines.length === 0) {
        return res.status(400).json({ error: 'Arquivo vazio' });
      }
      const header = lines[0].split(/\t|,|;/).map((h) => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/\t|,|;/).map((c) => c.trim());
        const obj: any = {};
        header.forEach((h, idx) => {
          obj[h] = cols[idx] ?? '';
        });
        rows.push(obj);
      }
    }

    const results: { imported: number; errors: any[] } = { imported: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // suportar cabeçalhos comuns em português e sem acento
      const numeroAmostra = row.numeroAmostra || row.numero_amostra || row['Número Amostra'] || row['numeroAmostra'];
      const dataColeta = row.dataColeta || row.data_coleta || row['Data Coleta'];
      const equipamento = row.equipamento || row['Equipamento'];
      const tipoOleo = row.tipoOleo || row.tipo_oleo || row['Tipo Óleo'] || row['Tipo Oleo'];

      if (!numeroAmostra || !dataColeta || !equipamento || !tipoOleo) {
        results.errors.push({ row: i + 1, error: 'Campos obrigatórios ausentes', data: row });
        continue;
      }

      try {
        await dbOperations.create({
          numeroAmostra: String(numeroAmostra),
          dataColeta: String(dataColeta),
          equipamento: String(equipamento),
          tipoOleo: String(tipoOleo),
          observacoes: row.observacoes || row.Observacoes || '',
          // campos opcionais numéricos - tentar converter
          viscosidade: row.viscosidade ? Number(row.viscosidade) : undefined,
          acidez: row.acidez ? Number(row.acidez) : undefined,
          agua: row.agua ? Number(row.agua) : undefined,
          particulas: row.particulas ? Number(row.particulas) : undefined,
          status: row.status || 'AG. ENVIO'
        });
        results.imported += 1;
      } catch (error: any) {
        results.errors.push({ row: i + 1, error: error.message || String(error), data: row });
      }
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

