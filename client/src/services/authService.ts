import axios from 'axios';

// Usar proxy se disponível, senão usar URL completa
// Em desenvolvimento (Vite), usa /api que é roteado para localhost:3001
// Em produção, usa URL completa
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutos de timeout
});

export interface Usuario {
  id: string;
  nomeCompleto: string;
  email: string;
  whatsapp: string;
}

export interface AuthResponse {
  usuario: Usuario;
  token: string;
  message?: string;
}

export const authService = {
  async login(email: string, senha: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, senha });
    return response.data;
  },

  async register(nomeCompleto: string, email: string, whatsapp: string, senha: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', {
      nomeCompleto,
      email,
      whatsapp,
      senha
    });
    return response.data;
  },

  async getCurrentUser(token: string): Promise<Usuario> {
    const response = await api.get<Usuario>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async forgotPassword(email: string, metodo: 'email' | 'whatsapp' = 'email'): Promise<{ 
    message: string; 
    token?: string; 
    resetUrl?: string; 
    smtpConfigurado?: boolean;
  }> {
    const response = await api.post<{ 
      message: string; 
      token?: string; 
      resetUrl?: string; 
      smtpConfigurado?: boolean;
    }>('/auth/forgot-password', { email, metodo });
    return response.data;
  },

  async resetPassword(token: string, novaSenha: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', { token, novaSenha });
    return response.data;
  },
};

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de rede
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Tempo de conexão esgotado. Verifique se o servidor está rodando.';
    } else if (error.message === 'Network Error' || !error.response) {
      error.message = 'Erro de conexão. Verifique se o servidor está rodando na porta 3001.';
    }
    return Promise.reject(error);
  }
);

export default api;

