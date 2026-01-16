import axios from 'axios';
import { AnaliseOleo } from '../types';

// Usar proxy se disponível, senão usar URL completa
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutos de timeout para importação
});

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

export const analiseService = {
  async getAll(): Promise<AnaliseOleo[]> {
    const response = await api.get<AnaliseOleo[]>('/analises');
    return response.data;
  },

  async getById(id: string): Promise<AnaliseOleo> {
    const response = await api.get<AnaliseOleo>(`/analises/${id}`);
    return response.data;
  },

  async create(analise: Omit<AnaliseOleo, 'id' | 'createdAt'>): Promise<AnaliseOleo> {
    const response = await api.post<AnaliseOleo>('/analises', analise);
    return response.data;
  },

  async update(id: string, analise: Partial<AnaliseOleo>): Promise<AnaliseOleo> {
    const response = await api.put<AnaliseOleo>(`/analises/${id}`, analise);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/analises/${id}`);
  },

  async importFile(file: File): Promise<{ imported: number; errors: any[] }> {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/analises/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

