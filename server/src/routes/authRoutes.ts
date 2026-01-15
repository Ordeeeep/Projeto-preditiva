import express from 'express';
import { authOperations } from '../database/auth';
import { generateToken, authenticateToken } from '../middleware/auth';
import { sendPasswordResetEmail, sendPasswordResetWhatsApp } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { Request, Response } from 'express';

const router = express.Router();

// Registrar novo usuário
router.post('/register', async (req, res) => {
  try {
    const { nomeCompleto, email, whatsapp, senha } = req.body;

    console.log('Tentativa de registro:', { nomeCompleto, email, whatsapp, senhaLength: senha?.length });

    if (!nomeCompleto || !email || !whatsapp || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Validar WhatsApp (deve ter pelo menos 10 dígitos)
    const whatsappNumbers = whatsapp.replace(/\D/g, '');
    if (whatsappNumbers.length < 10 || whatsappNumbers.length > 15) {
      return res.status(400).json({ error: 'WhatsApp inválido. Deve ter entre 10 e 15 dígitos' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Verificar se email já existe
    const usuarioExistente = await authOperations.getUserByEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Normalizar WhatsApp (apenas números)
    const whatsappNormalizado = whatsapp.replace(/\D/g, '');

    const usuario = await authOperations.createUser({
      nomeCompleto,
      email,
      whatsapp: whatsappNormalizado,
      senha
    });

    const token = generateToken(usuario.id, usuario.email);

    console.log('Usuário criado com sucesso:', usuario.id);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      usuario,
      token
    });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      type: error.name || 'UnknownError'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const usuario = await authOperations.verifyPassword(email, senha);
    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = generateToken(usuario.id, usuario.email);

    res.json({
      message: 'Login realizado com sucesso',
      usuario,
      token
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter usuário atual
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const usuario = await authOperations.getUserById(req.userId!);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(usuario);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, metodo } = req.body; // metodo: 'email' ou 'whatsapp'

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const usuario = await authOperations.getUserByEmail(email);
    if (!usuario) {
      // Por segurança, não revelar se o email existe ou não
      return res.json({ message: 'Se o email existir, você receberá instruções para recuperar sua senha' });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira em 1 hora

    await authOperations.createResetToken(email, token, expiresAt);

    if (metodo === 'whatsapp') {
      await sendPasswordResetWhatsApp(usuario.whatsapp, token, usuario.nomeCompleto);
      res.json({ message: 'Senha temporária enviada por WhatsApp' });
    } else {
      const result = await sendPasswordResetEmail(email, token, usuario.nomeCompleto);
      
      if (result.success) {
        if (result.resetUrl) {
          // SMTP não configurado - retornar token completo e link
          res.json({ 
            message: 'SMTP não configurado. Use o link abaixo ou o token completo para redefinir sua senha.',
            token: token, // Token completo
            resetUrl: result.resetUrl,
            smtpConfigurado: false
          });
        } else {
          res.json({ message: 'Email de recuperação enviado com sucesso' });
        }
      } else {
        // Em caso de erro, ainda retornar token e link se disponível
        res.status(500).json({ 
          error: 'Erro ao enviar email. Verifique a configuração SMTP ou consulte o console do servidor.',
          token: result.resetUrl ? token : undefined, // Token completo se resetUrl disponível
          resetUrl: result.resetUrl
        });
      }
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resetar senha com token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    console.log('Tentativa de reset de senha:', { tokenLength: token?.length, senhaLength: novaSenha?.length });

    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    console.log('Validando token...');
    const email = await authOperations.validateResetToken(token);
    if (!email) {
      console.log('Token inválido ou expirado');
      return res.status(400).json({ error: 'Token inválido ou expirado. Solicite uma nova recuperação de senha.' });
    }

    console.log('Token válido para email:', email);
    console.log('Atualizando senha...');
    await authOperations.updatePassword(email, novaSenha);
    console.log('Senha atualizada com sucesso');
    
    console.log('Marcando token como usado...');
    await authOperations.markTokenAsUsed(token);
    console.log('Token marcado como usado');

    res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login com a nova senha.' });
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

export default router;

