import axios from 'axios';
import { FrotaStatus, FrotaCreate, FrotaLogCreate } from '../types';

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? '/api' : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const frotaService = {
  async getAll(): Promise<FrotaStatus[]> {
    const response = await api.get<FrotaStatus[]>('/frotas');
    return response.data;
  },

  async create(frota: FrotaCreate): Promise<FrotaStatus> {
    const response = await api.post<FrotaStatus>('/frotas', frota);
    return response.data;
  },

  async addLog(frotaId: string, log: FrotaLogCreate): Promise<FrotaStatus> {
    const response = await api.post<FrotaStatus>(`/frotas/${frotaId}/logs`, log);
    return response.data;
  },

  async importLogs(file: File): Promise<{ imported: number; errors: any[] }> {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/frotas/import-logs', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async importFrotas(file: File): Promise<{ imported: number; errors: any[] }> {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/frotas/import-frotas', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async update(frotaId: string, frota: Partial<FrotaCreate>): Promise<FrotaStatus> {
    const response = await api.put<FrotaStatus>(`/frotas/${frotaId}`, frota);
    return response.data;
  },

  async delete(frotaId: string): Promise<void> {
    await api.delete(`/frotas/${frotaId}`);
  },

  async updateStatusAnalise(frotaId: string, status: string, data: string): Promise<FrotaStatus> {
    const response = await api.post<FrotaStatus>(`/frotas/${frotaId}/analise`, { status, data });
    return response.data;
  },

  async resetRodagem(frotaId: string): Promise<FrotaStatus> {
    const response = await api.post<FrotaStatus>(`/frotas/${frotaId}/reset-rodagem`);
    return response.data;
  },

  async exportToExcel(): Promise<Blob> {
    const response = await api.get('/frotas/export/excel', {
      responseType: 'blob',
      transformResponse: undefined,
    });
    return response.data;
  },

  async exportToCsv(): Promise<Blob> {
    const response = await api.get('/frotas/export/csv', {
      responseType: 'blob',
      transformResponse: undefined,
    });
    return response.data;
  },
};
