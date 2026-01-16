import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { initDatabase } from './database';
import analiseRoutes from './routes/analiseRoutes';
import frotaRoutes from './routes/frotaRoutes';
import motorRoutes from './routes/motorRoutes';
import authRoutes from './routes/authRoutes';
import { spawn } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// ✅ Processar JSON PRIMEIRO (para requisições JSON normais)
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Depois, processar multipart file uploads
const upload = multer({ storage: multer.memoryStorage() });
app.use(upload.single('file'));

// ✅ Log IMEDIATO após multer
app.use((req, res, next) => {
  if (req.path.includes('import')) {
    console.log(`\n[APÓS MULTER] ${req.method} ${req.path}`);
    console.log(`  File: ${req.file ? req.file.originalname : 'NENHUM'}`);
  }
  next();
});

// ✅ LOG GLOBAL DE TODAS AS REQUISIÇÕES
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && req.method === 'POST') {
    console.log(`\n📨 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    console.log(`   Content-Type: ${req.headers['content-type']}`);
    console.log(`   Arquivo: ${req.file ? req.file.originalname : 'NENHUM'}`);
  }
  next();
});

// Inicializar bancos de dados
initDatabase();

// ✅ Middleware para logar ANTES de processar rotas
app.use((req, res, next) => {
  if (req.path.includes('import/logs')) {
    console.log(`\n[PRÉ-ROTA] ${req.method} ${req.path}`);
    console.log(`  File disponível: ${req.file ? 'SIM' : 'NÃO'}`);
  }
  next();
});

// Rotas abertas (auth desativada)
app.use('/api/analises', analiseRoutes);
app.use('/api/frotas', frotaRoutes);
app.use('/api/motores', motorRoutes);
app.use('/api/auth', authRoutes);

// ❌ Middleware para rotas não encontradas
app.use('/api/*', (req, res) => {
  console.log(`\n❌ ROTA NÃO ENCONTRADA: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando' });
});

// 🔍 Endpoint de diagnóstico
app.get('/api/debug/info', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    message: 'Sistema funcionando'
  });
});

// Servir frontend estático (SPA)
const isPkg = (process as any).pkg;
const baseDir = isPkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../../');
// Em dev: client/build. Em empacotado: pasta "public" ao lado do .exe
const staticDirDev = path.join(baseDir, 'client', 'build');
const staticDirProd = path.join(baseDir, 'public');
const staticDir = fs.existsSync(staticDirProd) ? staticDirProd : staticDirDev;

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  // Catch-all para SPA (exceto rotas /api)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    return next();
  });
} else {
  console.warn(`Pasta estática não encontrada: ${staticDir}`);
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

