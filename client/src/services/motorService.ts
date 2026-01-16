import axios from 'axios';
import { MotorStatus, MotorCreate, MotorLogCreate } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Criar instância com configurações
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const motorService = {
  async getAll(): Promise<MotorStatus[]> {
    const response = await api.get<MotorStatus[]>('/motores');
    return response.data;
  },

  async create(motor: MotorCreate): Promise<MotorStatus> {
    const response = await api.post<MotorStatus>('/motores', motor);
    return response.data;
  },

  async update(id: string, updates: Partial<MotorCreate>): Promise<MotorStatus> {
    const response = await api.put<MotorStatus>(`/motores/${id}`, updates);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/motores/${id}`);
  },

  async addLog(id: string, log: MotorLogCreate): Promise<MotorStatus> {
    console.log('🔵 [motorService.addLog] Enviando:', { id, log });
    const response = await api.post<MotorStatus>(`/motores/${id}/logs`, log);
    console.log('🟢 [motorService.addLog] Resposta:', response.data);
    return response.data;
  },

  async resetHoras(id: string, dataIntervencao?: string): Promise<MotorStatus> {
    const response = await api.post<MotorStatus>(`/motores/${id}/reset`, dataIntervencao ? { dataIntervencao } : {});
    return response.data;
  },

  async importMotores(file: File): Promise<{ imported: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    // Para upload, usar URL completa (proxy Vite não funciona bem com multipart)
    const uploadUrl = import.meta.env.DEV 
      ? 'http://localhost:3001/api/motores/import/file'
      : '/api/motores/import/file';
    // Usar axios diretamente, SEM a instância 'api' para evitar conflito de headers
    const response = await axios.post<{ imported: number; errors: any[] }>(
      uploadUrl,
      formData,
      { 
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        timeout: 120000
      }
    );
    return response.data;
  },

  async importLogs(file: File): Promise<{ imported: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    // Para upload, usar URL completa (proxy Vite não funciona bem com multipart)
    const uploadUrl = import.meta.env.DEV 
      ? 'http://localhost:3001/api/motores/import/logs'
      : '/api/motores/import/logs';
    console.log('📤 Enviando para:', uploadUrl);
    // Usar axios diretamente, SEM a instância 'api' para evitar conflito de headers
    const response = await axios.post<{ imported: number; errors: any[] }>(
      uploadUrl,
      formData,
      { 
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        timeout: 120000
      }
    );
    return response.data;
  },

  async exportToExcel(): Promise<Blob> {
    const response = await api.get('/motores/export/excel', { responseType: 'blob' });
    return response.data;
  },

  async exportToCsv(): Promise<Blob> {
    const response = await api.get('/motores/export/csv', { responseType: 'blob' });
    return response.data;
  },
};
