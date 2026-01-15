import nodemailer from 'nodemailer';

// Verificar se SMTP está configurado
const isSmtpConfigured = () => {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== '' && process.env.SMTP_PASS !== '');
};

// Criar transporter apenas se SMTP estiver configurado
const getTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
};

export const sendPasswordResetEmail = async (email: string, token: string, nome: string): Promise<{ success: boolean; resetUrl?: string }> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  // Se SMTP não estiver configurado, retornar informações para exibir no console
  if (!isSmtpConfigured()) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📧 RECUPERAÇÃO DE SENHA (SMTP não configurado)');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Email: ${email}`);
    console.log(`Nome: ${nome}`);
    console.log(`Token Completo: ${token}`);
    console.log(`Link de Reset: ${resetUrl}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    return {
      success: true,
      resetUrl
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      resetUrl
    };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@analiseoleo.com',
    to: email,
    subject: 'Recuperação de Senha - Sistema de Análises de Óleo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #3182ce; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .code { background: #1e1e2e; color: #e0e0e0; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔬 Recuperação de Senha</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${nome}</strong>!</p>
            <p>Você solicitou a recuperação de senha para sua conta no Sistema de Análises de Óleo.</p>
            <p>Clique no botão abaixo para redefinir sua senha:</p>
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
            <p><small>Este link expira em 1 hora. Se você não solicitou esta recuperação, ignore este email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao enviar email:', error.message);
    // Em caso de erro, ainda retornar o link
    return {
      success: false,
      resetUrl
    };
  }
};

export const sendPasswordResetWhatsApp = async (whatsapp: string, token: string, nome: string) => {
  // Implementação para WhatsApp usando Twilio ou similar
  // Por enquanto, apenas retorna true (implementar conforme necessidade)
  const senhaTemporaria = token.substring(0, 8).toUpperCase();
  console.log(`WhatsApp para ${whatsapp}: Senha temporária: ${senhaTemporaria}`);
  return true;
};

