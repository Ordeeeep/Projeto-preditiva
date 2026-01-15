import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './database';
import analiseRoutes from './routes/analiseRoutes';
import frotaRoutes from './routes/frotaRoutes';
import motorRoutes from './routes/motorRoutes';
import authRoutes from './routes/authRoutes';
import { spawn } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Inicializar bancos de dados
initDatabase();

console.log('💾 Usando banco local (SQLite)');

// Rotas abertas (auth desativada)
app.use('/api/analises', analiseRoutes);
app.use('/api/frotas', frotaRoutes);
app.use('/api/motores', motorRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando' });
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

