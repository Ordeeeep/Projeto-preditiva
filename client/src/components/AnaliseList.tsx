import React, { useState } from 'react';
import './AnaliseList.css';
import { AnaliseOleo } from '../types';

interface AnaliseListProps {
  analises: AnaliseOleo[];
  onEdit: (analise: AnaliseOleo) => void;
  onDelete: (id: string) => void;
}

type SortField = 'numeroAmostra' | 'equipamento' | 'tipoOleo' | 'dataColeta' | 'status';
type SortOrder = 'asc' | 'desc' | null;

const AnaliseList: React.FC<AnaliseListProps> = ({ analises, onEdit, onDelete }) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedAnalises = () => {
    if (!sortField || !sortOrder) {
      return analises;
    }

    const sorted = [...analises].sort((a, b) => {
      let aValue: any = a[sortField as keyof AnaliseOleo];
      let bValue: any = b[sortField as keyof AnaliseOleo];

      if (sortField === 'dataColeta') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return ' ⇅';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const sortedAnalises = getSortedAnalises();

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

      <div className="table-container">
        <table className="analise-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('numeroAmostra')} className="sortable">
                Nº Amostra{getSortIndicator('numeroAmostra')}
              </th>
              <th onClick={() => handleSort('equipamento')} className="sortable">
                Equipamento{getSortIndicator('equipamento')}
              </th>
              <th onClick={() => handleSort('tipoOleo')} className="sortable">
                Tipo de Óleo{getSortIndicator('tipoOleo')}
              </th>
              <th onClick={() => handleSort('dataColeta')} className="sortable">
                Data de Coleta{getSortIndicator('dataColeta')}
              </th>
              <th onClick={() => handleSort('status')} className="sortable">
                Status{getSortIndicator('status')}
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedAnalises.map((analise) => (
              <tr key={analise.id}>
                <td>{analise.numeroAmostra}</td>
                <td>{analise.equipamento}</td>
                <td>{analise.tipoOleo}</td>
                <td>{formatDate(analise.dataColeta)}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(analise.status)}`}>
                    {analise.status || 'AG. ENVIO'}
                  </span>
                </td>
                <td className="actions-cell">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnaliseList;

