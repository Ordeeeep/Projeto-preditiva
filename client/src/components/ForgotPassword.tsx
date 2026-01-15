import React, { useState } from 'react';
import { authService } from '../services/authService';
import './Auth.css';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [metodo, setMetodo] = useState<'email' | 'whatsapp'>('email');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response: any = await authService.forgotPassword(email, metodo);
      setMessage(response.message);
      
      // Se SMTP não estiver configurado, mostrar token e link
      if (response.token) {
        setToken(response.token);
        setResetUrl(response.resetUrl);
      } else {
        setToken('');
        setResetUrl('');
      }
    } catch (err: any) {
      // Se o erro contém token (SMTP falhou mas token foi criado)
      if (err.response?.data?.token) {
        setToken(err.response.data.token);
        setResetUrl(err.response.data.resetUrl);
        setMessage('SMTP não configurado. Use o link ou token abaixo para redefinir sua senha:');
      } else {
        setError(err.response?.data?.error || 'Erro ao solicitar recuperação');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔑 Recuperar Senha</h1>
          <p>Escolha como deseja receber sua senha temporária</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          
          {token && (
            <div className="senha-temporaria-box">
              <h3>🔑 Recuperação de Senha</h3>
              <p>SMTP não está configurado. Use uma das opções abaixo:</p>
              
              {resetUrl && (
                <div style={{ margin: '20px 0' }}>
                  <p><strong>Opção 1: Clique no link abaixo</strong></p>
                  <a 
                    href={resetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="reset-link-button"
                  >
                    Redefinir Senha
                  </a>
                </div>
              )}
              
              <div style={{ margin: '20px 0' }}>
                <p><strong>Opção 2: Copie o token e cole na tela de reset</strong></p>
                <div className="token-box">
                  <code className="token-code">{token}</code>
                  <button
                    type="button"
                    className="copy-button"
                    onClick={() => {
                      navigator.clipboard.writeText(token);
                      alert('Token copiado! Cole na tela de reset de senha.');
                    }}
                  >
                    📋 Copiar Token
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#a0aec0', marginTop: '10px' }}>
                  Vá para a tela de reset de senha e cole este token
                </p>
              </div>
              
              <p className="senha-note">⚠️ Este token expira em 1 hora</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="metodo">Método de Recuperação</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="metodo"
                  value="email"
                  checked={metodo === 'email'}
                  onChange={(e) => setMetodo(e.target.value as 'email' | 'whatsapp')}
                />
                <span>📧 Email</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="metodo"
                  value="whatsapp"
                  checked={metodo === 'whatsapp'}
                  onChange={(e) => setMetodo(e.target.value as 'email' | 'whatsapp')}
                />
                <span>💬 WhatsApp</span>
              </label>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Senha Temporária'}
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" className="link-button" onClick={onSwitchToLogin}>
            ← Voltar para login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

