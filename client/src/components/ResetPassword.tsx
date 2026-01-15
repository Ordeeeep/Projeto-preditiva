import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import './Auth.css';

interface ResetPasswordProps {
  token?: string;
  onSuccess?: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token: tokenProp, onSuccess }) => {
  const [token, setToken] = useState(tokenProp || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenProp) {
      setToken(tokenProp);
    } else {
      // Tentar pegar token da URL
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      if (tokenFromUrl) {
        setToken(tokenFromUrl);
      } else {
        setError('Token inválido ou ausente');
      }
    }
  }, [tokenProp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, novaSenha);
      setMessage('Senha redefinida com sucesso!');
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Nova Senha</h1>
          <p>Digite sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          {!token && (
            <div className="form-group">
              <label htmlFor="tokenInput">Token de Recuperação *</label>
              <input
                type="text"
                id="tokenInput"
                onChange={(e) => setToken(e.target.value)}
                required
                placeholder="Cole aqui o token completo recebido"
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
              <p style={{ fontSize: '0.85rem', color: '#a0aec0', marginTop: '5px' }}>
                Cole o token completo que você recebeu ao solicitar a recuperação de senha
              </p>
            </div>
          )}

          {token && (
            <div className="form-group">
              <label>Token</label>
              <input
                type="text"
                value={token}
                disabled
                style={{ 
                  background: '#2d3748', 
                  color: '#a0aec0',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="novaSenha">Nova Senha</label>
            <input
              type="password"
              id="novaSenha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
            <input
              type="password"
              id="confirmarSenha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              placeholder="Digite a senha novamente"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading || !token}>
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

