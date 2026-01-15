import axios from 'axios';
import { MotorStatus, MotorCreate, MotorLogCreate } from '../types';

const API_URL = '/api/motores';

export const motorService = {
  async getAll(): Promise<MotorStatus[]> {
    const response = await axios.get<MotorStatus[]>(API_URL);
    return response.data;
  },

  async create(motor: MotorCreate): Promise<MotorStatus> {
    const response = await axios.post<MotorStatus>(API_URL, motor);
    return response.data;
  },

  async update(id: string, updates: Partial<MotorCreate>): Promise<MotorStatus> {
    const response = await axios.put<MotorStatus>(`${API_URL}/${id}`, updates);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  },

  async addLog(id: string, log: MotorLogCreate): Promise<MotorStatus> {
    const response = await axios.post<MotorStatus>(`${API_URL}/${id}/logs`, log);
    return response.data;
  },

  async resetHoras(id: string, dataIntervencao?: string): Promise<MotorStatus> {
    const response = await axios.post<MotorStatus>(`${API_URL}/${id}/reset`, dataIntervencao ? { dataIntervencao } : {});
    return response.data;
  },

  async importMotores(file: File): Promise<{ imported: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<{ imported: number; errors: any[] }>(
      `${API_URL}/import/file`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async importLogs(file: File): Promise<{ imported: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<{ imported: number; errors: any[] }>(
      `${API_URL}/import/logs`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async exportToExcel(): Promise<Blob> {
    const response = await axios.get(`${API_URL}/export/excel`, { responseType: 'blob' });
    return response.data;
  },

  async exportToCsv(): Promise<Blob> {
    const response = await axios.get(`${API_URL}/export/csv`, { responseType: 'blob' });
    return response.data;
  },
};
