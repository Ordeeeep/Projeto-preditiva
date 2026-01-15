import React, { useState, useEffect } from 'react';
import './AnaliseForm.css';
import { AnaliseOleo } from '../types';

interface AnaliseFormProps {
  analise?: AnaliseOleo | null;
  onSave: (analise: Omit<AnaliseOleo, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const AnaliseForm: React.FC<AnaliseFormProps> = ({ analise, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    numeroAmostra: '',
    dataColeta: '',
    equipamento: '',
    tipoOleo: '',
    observacoes: '',
    status: 'AG. ENVIO',
  });

  useEffect(() => {
    if (analise) {
      setFormData({
        numeroAmostra: analise.numeroAmostra || '',
        dataColeta: analise.dataColeta || '',
        equipamento: analise.equipamento || '',
        tipoOleo: analise.tipoOleo || '',
        observacoes: analise.observacoes || '',
        status: analise.status || 'AG. ENVIO',
      });
    }
  }, [analise]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const analiseData = {
      numeroAmostra: formData.numeroAmostra,
      dataColeta: formData.dataColeta,
      equipamento: formData.equipamento,
      tipoOleo: formData.tipoOleo,
      observacoes: formData.observacoes || undefined,
      status: formData.status,
    };

    onSave(analiseData);
  };

  return (
    <div className="form-container">
      <h2>{analise ? 'Editar Análise' : 'Nova Análise de Óleo'}</h2>
      
      <form onSubmit={handleSubmit} className="analise-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numeroAmostra">Número da Amostra *</label>
            <input
              type="text"
              id="numeroAmostra"
              name="numeroAmostra"
              value={formData.numeroAmostra}
              onChange={handleChange}
              required
              placeholder="Ex: AM-2024-001"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dataColeta">Data de Coleta *</label>
            <input
              type="date"
              id="dataColeta"
              name="dataColeta"
              value={formData.dataColeta}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="equipamento">Equipamento *</label>
            <input
              type="text"
              id="equipamento"
              name="equipamento"
              value={formData.equipamento}
              onChange={handleChange}
              required
              placeholder="Ex: Compressor 01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tipoOleo">Tipo de Óleo *</label>
            <input
              type="text"
              id="tipoOleo"
              name="tipoOleo"
              value={formData.tipoOleo}
              onChange={handleChange}
              required
              placeholder="Ex: Óleo Hidráulico ISO 46"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="AG. ENVIO">AG. ENVIO</option>
            <option value="AG. RESULTADO">AG. RESULTADO</option>
            <option value="FINALIZADO">FINALIZADO</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="observacoes">Observação</label>
          <textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={4}
            placeholder="Observações adicionais sobre a análise..."
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-success">
            {analise ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnaliseForm;

