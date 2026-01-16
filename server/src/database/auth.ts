import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

export interface Usuario {
  id?: string;
  nomeCompleto: string;
  email: string;
  whatsapp: string;
  senha: string;
  createdAt?: string;
}

export interface UsuarioPublico {
  id: string;
  nomeCompleto: string;
  email: string;
  whatsapp: string;
  createdAt?: string;
}

export interface ResetToken {
  id?: string;
  email: string;
  token: string;
  expiresAt: string;
  usado: number;
}

// Helpers para promisificar o SQLite
const dbRun = (query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
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

export const initAuthDatabase = () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome_completo TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      whatsapp TEXT NOT NULL,
      senha_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reset_tokens (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      usado INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  queries.forEach((q) => {
    db.run(q, (err) => {
      if (err) console.error('Erro ao criar tabela de auth:', err);
    });
  });
};

export const authOperations = {
  async createUser(usuario: Omit<Usuario, 'id' | 'createdAt'>): Promise<UsuarioPublico> {
    try {
      const id = uuidv4();
      
      console.log('Criando hash da senha...');
      const senhaHash = await bcrypt.hash(usuario.senha, 10);
      console.log('Hash criado com sucesso');
      
      console.log('Inserindo usuário no banco...');
      await dbRun(
        `INSERT INTO usuarios (id, nome_completo, email, whatsapp, senha_hash) VALUES (?, ?, ?, ?, ?)`,
        [id, usuario.nomeCompleto, usuario.email, usuario.whatsapp, senhaHash]
      );
      
      console.log('Usuário inserido com sucesso');

      return {
        id,
        nomeCompleto: usuario.nomeCompleto,
        email: usuario.email,
        whatsapp: usuario.whatsapp
      };
    } catch (error: any) {
      console.error('Erro em createUser:', error);
      throw error;
    }
  },

  async getUserByEmail(email: string): Promise<Usuario | undefined> {
    const row: any = await dbGet(
      `SELECT * FROM usuarios WHERE email = ? LIMIT 1`,
      [email]
    );
    
    if (!row) return undefined;

    return {
      id: row.id,
      nomeCompleto: row.nome_completo,
      email: row.email,
      whatsapp: row.whatsapp,
      senha: row.senha_hash,
      createdAt: row.created_at
    };
  },

  async getUserById(id: string): Promise<UsuarioPublico | undefined> {
    const row: any = await dbGet(
      `SELECT id, nome_completo, email, whatsapp, created_at FROM usuarios WHERE id = ? LIMIT 1`,
      [id]
    );
    
    if (!row) return undefined;

    return {
      id: row.id,
      nomeCompleto: row.nome_completo,
      email: row.email,
      whatsapp: row.whatsapp,
      createdAt: row.created_at
    };
  },

  async verifyPassword(email: string, senha: string): Promise<UsuarioPublico | null> {
    const usuario = await this.getUserByEmail(email);
    if (!usuario) return null;

    const isValid = await bcrypt.compare(senha, usuario.senha);
    if (!isValid) return null;

    return {
      id: usuario.id!,
      nomeCompleto: usuario.nomeCompleto,
      email: usuario.email,
      whatsapp: usuario.whatsapp,
      createdAt: usuario.createdAt
    };
  },

  async updatePassword(email: string, novaSenha: string): Promise<boolean> {
    try {
      console.log('Atualizando senha para email:', email);
      const senhaHash = await bcrypt.hash(novaSenha, 10);
      
      const result = await dbRun(
        `UPDATE usuarios SET senha_hash = ? WHERE email = ?`,
        [senhaHash, email]
      );
      
      console.log('Resultado da atualização:', { changes: result.changes, email });
      
      if (result.changes === 0) {
        console.warn('Nenhuma linha foi atualizada. Email pode não existir:', email);
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  },

  async createResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    const id = uuidv4();
    
    // Invalidar tokens anteriores
    await dbRun(
      `UPDATE reset_tokens SET usado = 1 WHERE email = ? AND usado = 0`,
      [email]
    );
    
    await dbRun(
      `INSERT INTO reset_tokens (id, email, token, expires_at) VALUES (?, ?, ?, ?)`,
      [id, email, token, expiresAt.toISOString()]
    );
  },

  async validateResetToken(token: string): Promise<string | null> {
    const row: any = await dbGet(
      `SELECT email, expires_at, usado FROM reset_tokens WHERE token = ? LIMIT 1`,
      [token]
    );
    
    if (!row) return null;
    if (row.usado === 1) return null;
    
    const expiresAt = new Date(row.expires_at);
    if (expiresAt < new Date()) return null;
    
    return row.email;
  },

  async markTokenAsUsed(token: string): Promise<void> {
    await dbRun(
      `UPDATE reset_tokens SET usado = 1 WHERE token = ?`,
      [token]
    );
  }
};


