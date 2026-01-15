import React from 'react';
import './AnaliseList.css';
import { AnaliseOleo } from '../types';

interface AnaliseListProps {
  analises: AnaliseOleo[];
  onEdit: (analise: AnaliseOleo) => void;
  onDelete: (id: string) => void;
}

const AnaliseList: React.FC<AnaliseListProps> = ({ analises, onEdit, onDelete }) => {
  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'AG. ENVIO':
        return 'status-envio';
      case 'AG. RESULTADO':
        return 'status-resultado';
      case 'FINALIZADO':
        return 'status-finalizado';
      default:
        return 'status-envio';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (analises.length === 0) {
    return (
      <div className="empty-state">
        <p>Nenhuma análise cadastrada ainda.</p>
        <p>Clique em "Nova Análise" para começar!</p>
      </div>
    );
  }

  return (
    <div className="analise-list">
      <div className="list-header">
        <h2>Análises Cadastradas ({analises.length})</h2>
      </div>

      <div className="analise-grid">
        {analises.map((analise) => (
          <div key={analise.id} className="analise-card">
            <div className="card-header">
              <h3>{analise.numeroAmostra}</h3>
              <span className={`status-badge ${getStatusClass(analise.status)}`}>
                {analise.status || 'AG. ENVIO'}
              </span>
            </div>

            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Equipamento:</span>
                <span className="info-value">{analise.equipamento}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Tipo de Óleo:</span>
                <span className="info-value">{analise.tipoOleo}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Data de Coleta:</span>
                <span className="info-value">{formatDate(analise.dataColeta)}</span>
              </div>

              {analise.observacoes && (
                <div className="observacoes">
                  <span className="observacoes-label">Observação:</span>
                  <p>{analise.observacoes}</p>
                </div>
              )}
            </div>

            <div className="card-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onEdit(analise)}
              >
                Editar
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => analise.id && onDelete(analise.id)}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnaliseList;

