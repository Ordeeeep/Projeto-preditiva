import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AnaliseForm from './components/AnaliseForm';
import AnaliseList from './components/AnaliseList';
import { AnaliseOleo, FrotaStatus, FrotaCreate, FrotaLogCreate, MotorStatus, MotorCreate, MotorLogCreate } from './types';
import { analiseService } from './services/analiseService';
import { frotaService } from './services/frotaService';
import { motorService } from './services/motorService';
import './App.css';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [resetToken, setResetToken] = useState<string>('');

  useEffect(() => {
    // Verificar se há token na URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setView('reset-password');
    }
  }, []);

  const switchToLogin = () => setView('login');
  const switchToRegister = () => setView('register');
  const switchToForgotPassword = () => setView('forgot-password');

  return (
    <div className="auth-page">
      {view === 'login' && (
        <Login
          onSwitchToRegister={switchToRegister}
          onSwitchToForgotPassword={switchToForgotPassword}
        />
      )}
      {view === 'register' && <Register onSwitchToLogin={switchToLogin} />}
      {view === 'forgot-password' && <ForgotPassword onSwitchToLogin={switchToLogin} />}
      {view === 'reset-password' && (
        <ResetPassword token={resetToken} onSuccess={switchToLogin} />
      )}

      <div className="auth-credit">Desenvolvido por Pedro Lucas - 2025</div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [analises, setAnalises] = useState<AnaliseOleo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnalise, setEditingAnalise] = useState<AnaliseOleo | null>(null);
  const [activeTab, setActiveTab] = useState<'analises' | 'frotas' | 'editar' | 'motores' | 'editarMotores'>('frotas');
  const [frotas, setFrotas] = useState<FrotaStatus[]>([]);
  const [loadingFrotas, setLoadingFrotas] = useState(false);
  const [newFrota, setNewFrota] = useState<FrotaCreate>({ nome: '', modelo: '', classe: '', intervaloTroca: 0, unidade: 'km', kmInicial: 0 });
  const [newLog, setNewLog] = useState<{ frotaId: string; kmRodado: string; data: string }>(
    { frotaId: '', kmRodado: '', data: new Date().toISOString().slice(0, 10) }
  );
  const [editingFrota, setEditingFrota] = useState<FrotaStatus | null>(null);
  const [editingFrotaData, setEditingFrotaData] = useState<Partial<FrotaCreate>>({});
  const [showStatusAnaliseModal, setShowStatusAnaliseModal] = useState(false);
  const [frotaStatusAnalise, setFrotaStatusAnalise] = useState<{ id: string; nome: string } | null>(null);
  const [novoStatusAnalise, setNovoStatusAnalise] = useState<string>('NORMAL');
  const [dataAnalise, setDataAnalise] = useState<string>(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchTermEdit, setSearchTermEdit] = useState<string>('');
  const [filterProximity, setFilterProximity] = useState<'todos' | 'proximos' | 'atrasados'>('todos');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'NORMAL' | 'ANORMAL' | 'CRITICO'>('todos');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortFieldAcomp, setSortFieldAcomp] = useState<'nome' | 'modelo' | 'classe' | 'intervaloTroca' | 'kmAcumulado' | 'progresso' | 'proximoLimite' | null>(null);
  const [sortDirectionAcomp, setSortDirectionAcomp] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<'nome' | 'intervaloTroca' | 'kmAcumulado' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedFrotas, setSelectedFrotas] = useState<Set<string>>(new Set());
  const [motores, setMotores] = useState<MotorStatus[]>([]);
  const [loadingMotores, setLoadingMotores] = useState(false);
  const [newMotor, setNewMotor] = useState<MotorCreate>({ numeroMotor: '', frotaMotor: '', modeloMotor: '', classeFrota: '', unidade: 'Selecione', vidaMotor: 0, horasInicial: 0 });
  const [newMotorLog, setNewMotorLog] = useState<{ numeroMotor: string; horasRodado: string; data: string }>({ numeroMotor: '', horasRodado: '', data: new Date().toISOString().slice(0, 10) });
  const [editingMotor, setEditingMotor] = useState<MotorStatus | null>(null);
  const [editingMotorData, setEditingMotorData] = useState<Partial<MotorCreate>>({});
  const [searchTermMotores, setSearchTermMotores] = useState<string>('');
  const [searchTermEditMotores, setSearchTermEditMotores] = useState<string>('');
  const [selectedMotores, setSelectedMotores] = useState<Set<string>>(new Set());
  const [itemsPerPageMotores, setItemsPerPageMotores] = useState<number>(10);
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, completed: false });
  const [importType, setImportType] = useState<'frotas' | 'rodagem' | 'motores' | 'motor-logs'>('frotas');
  const { usuario, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputFrotaRef = useRef<HTMLInputElement | null>(null);
  const fileInputImportFrotasRef = useRef<HTMLInputElement | null>(null);
  const fileInputImportMotoresRef = useRef<HTMLInputElement | null>(null);
  const fileInputMotorLogRef = useRef<HTMLInputElement | null>(null);

  // Função para formatar números com separador de milhares
  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  // Formata datas em pt-BR sem alterar pelo fuso horário
  const formatDateBR = (value?: string): string => {
    if (!value) return '';
    const s = value.trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const [, y, mo, d] = m;
      return `${d}/${mo}/${y}`;
    }
    const date = new Date(s);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
    return s;
  };

  // useEffect(() => {
  //   loadAnalises();
  // }, []);

  useEffect(() => {
    if (activeTab === 'frotas') {
      loadFrotas();
    } else if (activeTab === 'motores') {
      loadMotores();
    }
  }, [activeTab]);

  const loadAnalises = async () => {
    try {
      setLoading(true);
      const data = await analiseService.getAll();
      setAnalises(data);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
      alert('Erro ao carregar análises. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (analise: Omit<AnaliseOleo, 'id' | 'createdAt'>) => {
    try {
      if (editingAnalise?.id) {
        await analiseService.update(editingAnalise.id, analise);
      } else {
        await analiseService.create(analise);
      }
      await loadAnalises();
      setShowForm(false);
      setEditingAnalise(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar análise');
    }
  };

  const handleEdit = (analise: AnaliseOleo) => {
    setEditingAnalise(analise);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta análise?')) {
      try {
        await analiseService.delete(id);
        await loadAnalises();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Erro ao excluir análise');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAnalise(null);
  };

  const handleEditFrota = (frota: FrotaStatus) => {
    setEditingFrota(frota);
    setEditingFrotaData({
      nome: frota.nome,
      modelo: frota.modelo,
      classe: frota.classe,
      intervaloTroca: frota.intervaloTroca,
      unidade: frota.unidade,
      kmInicial: frota.kmInicial,
    });
  };

  const handleSaveEditFrota = async () => {
    if (!editingFrota) return;
    try {
      await frotaService.update(editingFrota.id!, editingFrotaData);
      await loadFrotas();
      setEditingFrota(null);
      setEditingFrotaData({});
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar frota');
    }
  };

  const handleDeleteFrota = async (frotaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta frota e todos os seus registros?')) return;
    try {
      await frotaService.delete(frotaId);
      await loadFrotas();
      setEditingFrota(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir frota');
    }
  };

  const handleToggleSelectFrota = (frotaId: string) => {
    const newSelected = new Set(selectedFrotas);
    if (newSelected.has(frotaId)) {
      newSelected.delete(frotaId);
    } else {
      newSelected.add(frotaId);
    }
    setSelectedFrotas(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedFrotas.size === frotas.length) {
      setSelectedFrotas(new Set());
    } else {
      setSelectedFrotas(new Set(frotas.map(f => f.id!)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFrotas.size === 0) {
      alert('Selecione pelo menos uma frota para excluir');
      return;
    }
    
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedFrotas.size} frota(s) selecionada(s)?`)) return;
    
    try {
      const deletePromises = Array.from(selectedFrotas).map(id => frotaService.delete(id));
      await Promise.all(deletePromises);
      await loadFrotas();
      setSelectedFrotas(new Set());
      alert(`${selectedFrotas.size} frota(s) excluída(s) com sucesso!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir frotas');
    }
  };

  const loadFrotas = async () => {
    try {
      setLoadingFrotas(true);
      const data = await frotaService.getAll();
      setFrotas(data);
    } catch (error) {
      console.error('Erro ao carregar frotas:', error);
      alert('Erro ao carregar frotas.');
    } finally {
      setLoadingFrotas(false);
    }
  };

  const loadMotores = async () => {
    try {
      setLoadingMotores(true);
      const data = await motorService.getAll();
      setMotores(data);
    } catch (error) {
      console.error('Erro ao carregar motores:', error);
      alert('Erro ao carregar motores.');
    } finally {
      setLoadingMotores(false);
    }
  };

  const handleCreateMotor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('📤 [DEBUG] Enviando motor:', {
        ...newMotor,
        vidaMotor: Number(newMotor.vidaMotor),
        horasInicial: Number(newMotor.horasInicial),
      });
      const created = await motorService.create({
        ...newMotor,
        vidaMotor: Number(newMotor.vidaMotor),
        horasInicial: Number(newMotor.horasInicial),
      });
      await loadMotores();
      setNewMotor({ numeroMotor: '', frotaMotor: '', modeloMotor: '', classeFrota: '', unidade: 'Selecione', vidaMotor: 0, horasInicial: 0, dataIntervencao: '' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar motor');
    }
  };

  const handleAddMotorLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMotorLog.numeroMotor) {
      alert('Digite o número do agregado.');
      return;
    }
    try {
      // Buscar o motor pelo número
      const motor = motores.find(m => m.numeroMotor.toLowerCase() === newMotorLog.numeroMotor.toLowerCase());
      if (!motor) {
        alert('Motor não encontrado. Verifique o número digitado.');
        return;
      }
      
      const logData = {
        data: newMotorLog.data,
        horasRodado: Number(newMotorLog.horasRodado),
      };
      console.log('📤 [CLIENT] Enviando para motor:', motor.id, 'Dados:', logData);
      
      await motorService.addLog(motor.id!, logData);
      await loadMotores();
      setNewMotorLog((prev) => ({ ...prev, horasRodado: '', numeroMotor: '' }));
    } catch (error: any) {
      console.error('❌ Erro ao registrar horas:', error);
      console.error('Response:', error.response?.data);
      alert(error.response?.data?.error || 'Erro ao registrar horas do motor');
    }
  };

  const handleEditMotor = (motor: MotorStatus) => {
    setEditingMotor(motor);
    setEditingMotorData({
      numeroMotor: motor.numeroMotor,
      frotaMotor: motor.frotaMotor,
      modeloMotor: motor.modeloMotor,
      classeFrota: motor.classeFrota,
      unidade: motor.unidade,
      vidaMotor: motor.vidaMotor,
      horasInicial: motor.horasInicial,
      equipamentoAtual: motor.equipamentoAtual,
      dataIntervencao: motor.dataIntervencao,
    });
  };

  const handleSaveEditMotor = async () => {
    if (!editingMotor) return;
    try {
      await motorService.update(editingMotor.id!, editingMotorData);
      await loadMotores();
      setEditingMotor(null);
      setEditingMotorData({});
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar motor');
    }
  };

  const handleDeleteMotor = async (motorId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este motor?')) return;
    try {
      await motorService.delete(motorId);
      await loadMotores();
      setEditingMotor(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir motor');
    }
  };

  const handleResetMotor = async (motorId: string, numeroMotor: string) => {
    if (!window.confirm(`Confirma a manutenção do motor ${numeroMotor}?\n\nIsso irá zerar as horas acumuladas.`)) {
      return;
    }
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      await motorService.resetHoras(motorId, hoje);
      await loadMotores();
      alert('Manutenção registrada! Horas zeradas com sucesso.');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao resetar horas');
    }
  };

  const handleImportMotores = async (file: File) => {
    try {
      setImportType('motores');
      setShowImportProgress(true);
      setImportProgress({ current: 1, total: 100, completed: false });
      
      const result = await motorService.importMotores(file);
      
      setImportProgress({ 
        current: result.imported || 0, 
        total: (result.imported || 0) + (result.errors?.length || 0), 
        completed: true 
      });

      // Recarregar motores após importação bem-sucedida
      if (result.imported > 0) {
        setTimeout(() => {
          loadMotores();
        }, 1000);
      }
    } catch (error: any) {
      setShowImportProgress(false);
      alert(error.response?.data?.error || error.message || 'Erro ao importar agregados');
    } finally {
      if (fileInputImportMotoresRef.current) {
        (fileInputImportMotoresRef.current as HTMLInputElement).value = '';
      }
    }
  };

  const handleImportMotorLogs = async (file: File) => {
    try {
      setImportType('motor-logs');
      setShowImportProgress(true);
      setImportProgress({ current: 1, total: 100, completed: false });
      
      const result = await motorService.importLogs(file);
      
      setImportProgress({ 
        current: result.imported || 0, 
        total: (result.imported || 0) + (result.errors?.length || 0), 
        completed: true 
      });

      // Recarregar motores após importação bem-sucedida
      if (result.imported > 0) {
        setTimeout(() => {
          loadMotores();
        }, 1000);
      }
    } catch (error: any) {
      setShowImportProgress(false);
      alert(error.response?.data?.error || error.message || 'Erro ao importar arquivo de motores');
    } finally {
      if (fileInputMotorLogRef.current) {
        (fileInputMotorLogRef.current as HTMLInputElement).value = '';
      }
    }
  };

  const handleExportMotoresExcel = async () => {
    try {
      const blob = await motorService.exportToExcel();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `progresso-agregados-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Erro ao exportar para Excel: ' + (error.message || 'Tente novamente'));
    }
  };

  const handleToggleSelectMotor = (motorId: string) => {
    const newSelected = new Set(selectedMotores);
    if (newSelected.has(motorId)) {
      newSelected.delete(motorId);
    } else {
      newSelected.add(motorId);
    }
    setSelectedMotores(newSelected);
  };

  const handleToggleSelectAllMotores = () => {
    if (selectedMotores.size === motores.length) {
      setSelectedMotores(new Set());
    } else {
      setSelectedMotores(new Set(motores.map(m => m.id!)));
    }
  };

  const handleDeleteSelectedMotores = async () => {
    if (selectedMotores.size === 0) {
      alert('Selecione pelo menos um agregado para excluir');
      return;
    }
    
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedMotores.size} agregado(s) selecionado(s)?`)) return;
    
    try {
      const deletePromises = Array.from(selectedMotores).map(id => motorService.delete(id));
      await Promise.all(deletePromises);
      await loadMotores();
      setSelectedMotores(new Set());
      alert(`${selectedMotores.size} agregado(s) excluído(s) com sucesso!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir agregados');
    }
  };

  const handleCreateFrota = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await frotaService.create({
        ...newFrota,
        intervaloTroca: Number(newFrota.intervaloTroca),
        kmInicial: Number(newFrota.kmInicial),
      });
      await loadFrotas();
      setNewFrota({ nome: '', modelo: '', classe: '', intervaloTroca: 0, unidade: 'km', kmInicial: 0 });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar frota');
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.frotaId) {
      alert('Digite o número da frota.');
      return;
    }
    try {
      // Buscar a frota pelo nome
      const frota = frotas.find(f => f.nome.toLowerCase() === newLog.frotaId.toLowerCase());
      if (!frota) {
        alert('Frota não encontrada. Verifique o número digitado.');
        return;
      }
      
      await frotaService.addLog(frota.id!, {
        data: newLog.data,
        kmRodado: Number(newLog.kmRodado),
      });
      await loadFrotas();
      setNewLog((prev) => ({ ...prev, kmRodado: '', frotaId: '' }));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao registrar rodagem');
    }
  };

  const handleImportFrotaLogs = async (file: File) => {
    try {
      setImportType('rodagem');
      setShowImportProgress(true);
      setImportProgress({ current: 1, total: 100, completed: false });
      
      const result = await frotaService.importLogs(file);
      
      setImportProgress({ 
        current: result.imported || 0, 
        total: (result.imported || 0) + (result.errors?.length || 0), 
        completed: true 
      });
    } catch (error: any) {
      setShowImportProgress(false);
      alert(error.response?.data?.error || error.message || 'Erro ao importar arquivo de frotas');
    } finally {
      if (fileInputFrotaRef.current) {
        (fileInputFrotaRef.current as HTMLInputElement).value = '';
      }
    }
  };

  const handleImportFrotas = async (file: File) => {
    try {
      setShowImportProgress(true);
      setImportProgress({ current: 0, total: 0, completed: false });
      
      // Simulando progresso durante leitura do arquivo
      setImportProgress({ current: 1, total: 100, completed: false });
      
      const result = await frotaService.importFrotas(file);
      
      setImportProgress({ 
        current: result.imported || 0, 
        total: (result.imported || 0) + (result.errors?.length || 0), 
        completed: true 
      });
    } catch (error: any) {
      setShowImportProgress(false);
      alert(error.response?.data?.error || error.message || 'Erro ao importar frotas');
    } finally {
      if (fileInputImportFrotasRef.current) {
        (fileInputImportFrotasRef.current as HTMLInputElement).value = '';
      }
    }
  };

  const handleExportToExcel = async () => {
    try {
      const blob = await frotaService.exportToExcel();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `progresso-frotas-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Erro ao exportar para Excel: ' + (error.message || 'Tente novamente'));
    }
  };

  const handleExportToCsv = async () => {
    try {
      const blob = await frotaService.exportToCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `progresso-frotas-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Erro ao exportar para CSV: ' + (error.message || 'Tente novamente'));
    }
  };

  const handleOpenStatusAnalise = (frota: FrotaStatus) => {
    setFrotaStatusAnalise({ id: frota.id!, nome: frota.nome });
    setNovoStatusAnalise(frota.statusAnalise || 'NORMAL');
    setDataAnalise(frota.dataUltimaAnalise || new Date().toISOString().slice(0, 10));
    setShowStatusAnaliseModal(true);
  };

  const handleSort = (field: 'nome' | 'intervaloTroca' | 'kmAcumulado') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSortAcompanhamento = (field: 'nome' | 'modelo' | 'classe' | 'intervaloTroca' | 'kmAcumulado' | 'progresso' | 'proximoLimite') => {
    if (sortFieldAcomp === field) {
      setSortDirectionAcomp(sortDirectionAcomp === 'asc' ? 'desc' : 'asc');
    } else {
      setSortFieldAcomp(field);
      setSortDirectionAcomp('asc');
    }
  };

  const handleSaveStatusAnalise = async () => {
    if (!frotaStatusAnalise) return;
    try {
      await frotaService.updateStatusAnalise(frotaStatusAnalise.id, novoStatusAnalise, dataAnalise);
      await loadFrotas();
      setShowStatusAnaliseModal(false);
      setFrotaStatusAnalise(null);
      alert('Status de análise atualizado com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar status de análise');
    }
  };

  const handleResetRodagem = async (frotaId: string, frotaNome: string) => {
    if (!window.confirm(`Confirma que realizou a coleta de óleo da frota ${frotaNome}?\n\nIsso irá zerar a rodagem acumulada e reiniciar a contagem.`)) {
      return;
    }
    try {
      await frotaService.resetRodagem(frotaId);
      await loadFrotas();
      alert('Coleta registrada! Rodagem zerada com sucesso.');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao resetar rodagem');
    }
  };

  return (
    <div className="App">
      {/* Modal de Progresso de Importação */}
      {showImportProgress && (
        <div className="import-progress-modal">
          <div className="progress-content">
            <div className="progress-header">
              {importProgress.completed ? (
                <>
                  <div className="completed-icon">✅</div>
                  <h3>Importação Concluída!</h3>
                  <p>
                    {importType === 'frotas' 
                      ? 'Equipamentos cadastrados com sucesso.' 
                      : 'Rodagem importada com sucesso.'}
                  </p>
                </>
              ) : (
                <>
                  <h3>
                    {importType === 'frotas' ? '📥 Importando Equipamentos' : '📥 Importando Rodagem'}
                  </h3>
                  <p>Processando arquivo...</p>
                  <div className="spinner"></div>
                </>
              )}
            </div>

            {importProgress.completed && (
              <button 
                className="btn-refresh"
                onClick={() => {
                  setShowImportProgress(false);
                  loadFrotas();
                }}
              >
                🔄 Atualizar Página
              </button>
            )}
          </div>
        </div>
      )}

      <header className="App-header">
        <div className="header-content">
          {/* Login oculto: header simplificado */}
        </div>
      </header>

      <main className="App-main">
        <div className="tabs">
          {/* <button
            className={`tab-btn ${activeTab === 'analises' ? 'active' : ''}`}
            onClick={() => setActiveTab('analises')}
          >
            Análises de Óleo
          </button> */}
          <button
            className={`tab-btn ${activeTab === 'frotas' ? 'active' : ''}`}
            onClick={() => setActiveTab('frotas')}
          >
            Acompanhamento de frotas
          </button>
          <button
            className={`tab-btn ${activeTab === 'motores' ? 'active' : ''}`}
            onClick={() => setActiveTab('motores')}
          >
            Acompanhamento de agregados
          </button>
          <button
            className={`tab-btn ${activeTab === 'editar' ? 'active' : ''}`}
            onClick={() => { setActiveTab('editar'); loadFrotas(); }}
          >
            Gerenciar frotas
          </button>
          <button
            className={`tab-btn ${activeTab === 'editarMotores' ? 'active' : ''}`}
            onClick={() => { setActiveTab('editarMotores'); loadMotores(); }}
          >
            Gerenciar agregados
          </button>
        </div>

        {activeTab === 'analises' && (
          !showForm ? (
            <>
              <div className="actions-bar">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  + Nova Análise
                </button>

                <input
                  ref={(el) => (fileInputRef.current = el)}
                  type="file"
                  accept=".txt,.csv,.xlsx"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const result = await analiseService.importFile(file);
                      alert(`Importado: ${result.imported}. Erros: ${result.errors.length}`);
                      await loadAnalises();
                    } catch (error: any) {
                      alert(error.response?.data?.error || error.message || 'Erro ao importar arquivo');
                    } finally {
                      // limpar seleção para permitir re-upload do mesmo arquivo
                      if (e.target) (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />

                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  Importar amostras
                </button>
              </div>

              {loading ? (
                <div className="loading">Carregando análises...</div>
              ) : (
                <AnaliseList
                  analises={analises}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </>
          ) : (
            <AnaliseForm
              analise={editingAnalise}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )
        )}

        {activeTab === 'frotas' && (
          <section className="fleet-section">
            <div className="fleet-forms">
              <form className="fleet-card" onSubmit={handleCreateFrota}>
                <h3>Cadastrar frota</h3>

                <input
                  ref={(el) => (fileInputImportFrotasRef.current = el)}
                  type="file"
                  accept=".txt,.csv,.xlsx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportFrotas(file);
                    }
                  }}
                />

                <button
                  type="button"
                  className="btn btn-secondary btn-import-frotas"
                  onClick={() => fileInputImportFrotasRef.current && fileInputImportFrotasRef.current.click()}
                >
                  Importar equipamentos 
                </button>

                <label>
                  Número da frota
                  <input
                    type="text"
                    value={newFrota.nome}
                    onChange={(e) => setNewFrota({ ...newFrota, nome: e.target.value })}
                    placeholder="Digite o número da frota"
                    required
                  />
                </label>
                <label>
                  Modelo
                  <input
                    type="text"
                    value={newFrota.modelo}
                    onChange={(e) => setNewFrota({ ...newFrota, modelo: e.target.value })}
                    placeholder="Digite o modelo da frota"
                    required
                  />
                </label>
                <label>
                  Classe
                  <select
                    value={newFrota.classe}
                    onChange={(e) => setNewFrota({ ...newFrota, classe: e.target.value })}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="CAM. APOIO">CAM. APOIO</option>
                    <option value="CAV. MECANICO">CAV. MECANICO</option>
                    <option value="CAM. TRANSBORDO">CAM. TRANSBORDO</option>
                    <option value="CAV. SCANIA">CAV. SCANIA</option>
                    <option value="COLHEDORA">COLHEDORA</option>
                    <option value="MAQ. AMARELA">MAQ. AMARELA</option>
                    <option value="MOTO BOMBA">MOTO BOMBA</option>
                    <option value="PULVERIZADOR">PULVERIZADOR</option>
                    <option value="TRATOR">TRATOR</option>
                  </select>
                </label>
                <label>
                  Intervalo para troca (km/horas)
                  <input
                    type="number"
                    min={1}
                    value={newFrota.intervaloTroca}
                    onChange={(e) => setNewFrota({ ...newFrota, intervaloTroca: Number(e.target.value) })}
                    required
                  />
                </label>
                <label>
                  Unidade
                  <select
                    value={newFrota.unidade}
                    onChange={(e) => setNewFrota({ ...newFrota, unidade: e.target.value })}
                  >
                    <option value="km">km</option>
                    <option value="hora">hora</option>
                  </select>
                </label>
                <label>
                  Quilometragem/Horas no cadastro
                  <input
                    type="number"
                    min={0}
                    value={newFrota.kmInicial}
                    onChange={(e) => setNewFrota({ ...newFrota, kmInicial: Number(e.target.value) })}
                    required
                  />
                </label>
                <button type="submit" className="btn btn-success">Salvar frota</button>
              </form>

              <form className="fleet-card" onSubmit={handleAddLog}>
                <h3>Registrar km/hrs diário</h3>

                <input
                  ref={(el) => (fileInputFrotaRef.current = el)}
                  type="file"
                  accept=".txt,.csv,.xlsx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportFrotaLogs(file);
                    }
                  }}
                />

                <button
                  type="button"
                  className="btn btn-secondary btn-import-frotas"
                  onClick={() => fileInputFrotaRef.current && fileInputFrotaRef.current.click()}
                  style={{ marginBottom: '20px' }}
                >
                  Importar km/hrs  
                </button>

                <label>
                  Frota
                  <input
                    type="text"
                    value={newLog.frotaId}
                    onChange={(e) => setNewLog({ ...newLog, frotaId: e.target.value })}
                    placeholder="Digite o número da frota"
                    required
                  />
                </label>
                <label>
                  Km/Hora rodado
                  <input
                    type="number"
                    min={1}
                    value={newLog.kmRodado}
                    onChange={(e) => setNewLog({ ...newLog, kmRodado: e.target.value })}
                    placeholder="Digite o km/hora rodado"
                    required
                  />
                </label>
                <label>
                  Data
                  <input
                    type="date"
                    value={newLog.data}
                    onChange={(e) => setNewLog({ ...newLog, data: e.target.value })}
                    required
                  />
                </label>
                <button type="submit" className="btn btn-success">Registrar</button>
              </form>
            </div>

            <div className="fleet-list">
              <div className="fleet-hero">
                <h2>Acompanhamento de coleta de óleo</h2>
                <p>Progresso até a próxima coleta.</p>
              </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Buscar frota por número, modelo ou classe"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                    title="Limpar busca"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-buttons">
                <button 
                  className={`btn btn-filter ${filterProximity === 'todos' ? 'active' : ''}`}
                  onClick={() => setFilterProximity('todos')}
                >
                  Todos
                </button>
                <button 
                  className={`btn btn-filter ${filterProximity === 'proximos' ? 'active' : ''}`}
                  onClick={() => setFilterProximity('proximos')}
                >
                  🟡 Próximos (≥80%)
                </button>
                <button 
                  className={`btn btn-filter ${filterProximity === 'atrasados' ? 'active' : ''}`}
                  onClick={() => setFilterProximity('atrasados')}
                >
                  🔴 Atrasados (≥100%)
                </button>
                <button 
                  className={`btn btn-filter ${filterStatus === 'todos' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('todos')}
                >
                  Todos Status
                </button>
                <button 
                  className={`btn btn-filter ${filterStatus === 'NORMAL' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('NORMAL')}
                >
                  🟢 Normal
                </button>
                <button 
                  className={`btn btn-filter ${filterStatus === 'ANORMAL' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('ANORMAL')}
                >
                  🟡 Anormal
                </button>
                <button 
                  className={`btn btn-filter ${filterStatus === 'CRITICO' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('CRITICO')}
                >
                  🔴 Crítico
                </button>
                <div className="items-per-page">
                  <label>Mostrar:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="items-select"
                  >
                    <option value={10}>10 </option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={9999}>Todos</option>
                  </select>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={handleExportToExcel}
                  title="Exportar progresso das frotas em Excel"
                >
                  Exportar dados 
                </button>
              </div>

              {loadingFrotas ? (
                <div className="loading">Carregando frotas...</div>
              ) : frotas.length === 0 ? (
                <p className="fleet-empty">Nenhuma frota cadastrada ainda.</p>
              ) : (
                <div className="table-container">
                  <table className="frotas-table compact-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSortAcompanhamento('nome')} style={{ cursor: 'pointer' }}>
                          Frota {sortFieldAcomp === 'nome' && (sortDirectionAcomp === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSortAcompanhamento('modelo')} style={{ cursor: 'pointer' }}>
                          Modelo {sortFieldAcomp === 'modelo' && (sortDirectionAcomp === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSortAcompanhamento('classe')} style={{ cursor: 'pointer' }}>
                          Classe {sortFieldAcomp === 'classe' && (sortDirectionAcomp === 'asc' ? '↑' : '↓')}
                        </th>
                        <th>Un.</th>
                        <th>Atual</th>
                        <th onClick={() => handleSortAcompanhamento('intervaloTroca')} style={{ cursor: 'pointer' }}>
                          Intervalo {sortFieldAcomp === 'intervaloTroca' && (sortDirectionAcomp === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSortAcompanhamento('kmAcumulado')} style={{ cursor: 'pointer' }}>
                          Acumulado {sortFieldAcomp === 'kmAcumulado' && (sortDirectionAcomp === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSortAcompanhamento('proximoLimite')} style={{ cursor: 'pointer' }}>
                          Próx. Coleta {sortFieldAcomp === 'proximoLimite' && (sortDirectionAcomp === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSortAcompanhamento('progresso')} style={{ cursor: 'pointer' }}>
                          Progresso {sortFieldAcomp === 'progresso' && (sortDirectionAcomp === 'asc' ? '↑' : '↓')}
                        </th>
                        <th>Status</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frotas
                        .filter((frota) => {
                          // Filtro de busca
                          if (searchTerm) {
                            const search = searchTerm.toLowerCase();
                            const matchSearch = (
                              frota.nome.toLowerCase().includes(search) ||
                              frota.modelo.toLowerCase().includes(search) ||
                              frota.classe.toLowerCase().includes(search)
                            );
                            if (!matchSearch) return false;
                          }
                          
                          // Filtro de proximidade
                          if (filterProximity === 'proximos') {
                            if (!(frota.progresso >= 80 && frota.progresso < 100)) return false;
                          } else if (filterProximity === 'atrasados') {
                            if (!(frota.progresso >= 100)) return false;
                          }
                          
                          // Filtro de status
                          if (filterStatus !== 'todos') {
                            const status = frota.statusAnalise || 'NORMAL';
                            if (status !== filterStatus) return false;
                          }
                          
                          return true;
                        })
                        .sort((a, b) => {
                          if (!sortFieldAcomp) return 0;
                          
                          let aVal: any, bVal: any;
                          
                          if (sortFieldAcomp === 'nome' || sortFieldAcomp === 'modelo' || sortFieldAcomp === 'classe') {
                            aVal = a[sortFieldAcomp].toLowerCase();
                            bVal = b[sortFieldAcomp].toLowerCase();
                            return sortDirectionAcomp === 'asc' 
                              ? aVal.localeCompare(bVal) 
                              : bVal.localeCompare(aVal);
                          } else {
                            aVal = a[sortFieldAcomp];
                            bVal = b[sortFieldAcomp];
                            return sortDirectionAcomp === 'asc' 
                              ? aVal - bVal 
                              : bVal - aVal;
                          }
                        })
                        .slice(0, itemsPerPage)
                        .map((frota) => (
                          <tr key={frota.id} className={frota.progresso >= 100 ? 'row-alert' : frota.progresso >= 80 ? 'row-warning' : ''}>
                            <td><strong>{frota.nome}</strong></td>
                            <td>{frota.modelo}</td>
                            <td>{frota.classe}</td>
                            <td>{frota.unidade === 'hora' || frota.unidade === 'horas' ? 'HORAS' : 'KM'}</td>
                            <td>{formatNumber(frota.kmInicial + frota.kmAcumulado)}</td>
                            <td>{formatNumber(frota.intervaloTroca)}</td>
                            <td>{formatNumber(frota.kmAcumulado)}</td>
                            <td>{formatNumber(frota.proximoLimite)}</td>
                            <td>
                              <div className="progress-cell">
                                <div className="progress-bar-mini">
                                  <div 
                                    className={`progress-fill-mini ${frota.progresso >= 100 ? 'critical' : frota.progresso >= 80 ? 'warning' : ''}`}
                                    style={{ width: `${Math.min(frota.progresso, 100)}%` }}
                                  />
                                </div>
                                <span className="progress-text">{frota.progresso}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge-mini status-${(frota.statusAnalise || 'NORMAL').toLowerCase()}`}>
                                {frota.statusAnalise === 'CRITICO' ? '🔴' : frota.statusAnalise === 'ANORMAL' ? '🟡' : '🟢'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button 
                                  className="btn btn-success btn-xs"
                                  onClick={() => handleResetRodagem(frota.id!, frota.nome)}
                                  title="Marcar coleta realizada"
                                >
                                  ✅
                                </button>
                                <button 
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => handleOpenStatusAnalise(frota)}
                                  title="Atualizar análise"
                                >
                                  📋
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'editar' && (
          <section className="fleet-section">
            <div className="fleet-hero">
              <h2>Gerenciar frotas</h2>
              <p>Edite ou remova os equipamentos cadastrados.</p>
            </div>

            {editingFrota ? (
              <div className="fleet-edit-form">
                <h3>✏️ Editando "{editingFrota.nome}"</h3>
                <label>
                  Número da frota
                  <input
                    type="text"
                    placeholder="Ex: Frota A"
                    value={editingFrotaData.nome || ''}
                    onChange={(e) => setEditingFrotaData({ ...editingFrotaData, nome: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Modelo
                  <input
                    type="text"
                    placeholder="Ex: CH 5470"
                    value={editingFrotaData.modelo || ''}
                    onChange={(e) => setEditingFrotaData({ ...editingFrotaData, modelo: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Classe
                  <select
                    value={editingFrotaData.classe || ''}
                    onChange={(e) => setEditingFrotaData({ ...editingFrotaData, classe: e.target.value })}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="CAM. APOIO">CAM. APOIO</option>
                    <option value="CAM. MECANICO">CAM. MECANICO</option>
                    <option value="CAM. TRANSBORDO">CAM. TRANSBORDO</option>
                    <option value="CAV. SCANIA">CAV. SCANIA</option>
                    <option value="COLHEDORA">COLHEDORA</option>
                    <option value="MAQ. AMARELA">MAQ. AMARELA</option>
                    <option value="MOTO BOMBA">MOTO BOMBA</option>
                    <option value="PULVERIZADOR">PULVERIZADOR</option>
                    <option value="TRATOR">TRATOR</option>
                  </select>
                </label>
                <label>
                  Intervalo para troca
                  <input
                    type="number"
                    placeholder="Ex: 500"
                    min={1}
                    value={editingFrotaData.intervaloTroca || 0}
                    onChange={(e) => setEditingFrotaData({ ...editingFrotaData, intervaloTroca: Number(e.target.value) })}
                    required
                  />
                </label>
                <label>
                  Unidade de medida
                  <select
                    value={editingFrotaData.unidade || 'km'}
                    onChange={(e) => setEditingFrotaData({ ...editingFrotaData, unidade: e.target.value })}
                  >
                    <option value="km">Quilômetros (km)</option>
                    <option value="hora">Horas</option>
                  </select>
                </label>
                <label>
                  Valor inicial registrado
                  <input
                    type="number"
                    placeholder="Ex: 1000"
                    min={0}
                    value={editingFrotaData.kmInicial || 0}
                    onChange={(e) => setEditingFrotaData({ ...editingFrotaData, kmInicial: Number(e.target.value) })}
                    required
                  />
                </label>
                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleSaveEditFrota}>💾 Salvar</button>
                  <button className="btn btn-secondary" onClick={() => { setEditingFrota(null); setEditingFrotaData({}); }}>Cancelar</button>
                  <button className="btn btn-danger" onClick={() => handleDeleteFrota(editingFrota.id!)}>Deletar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Buscar por frota, modelo ou classe..."
                    value={searchTermEdit}
                    onChange={(e) => setSearchTermEdit(e.target.value)}
                    className="search-input"
                  />
                  {searchTermEdit && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchTermEdit('')}
                      title="Limpar busca"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {selectedFrotas.size > 0 && (
                  <div className="bulk-actions">
                    <span className="bulk-info">{selectedFrotas.size} frota(s) selecionada(s)</span>
                    <button className="btn btn-danger" onClick={handleDeleteSelected}>
                      🗑️ Excluir Selecionadas
                    </button>
                  </div>
                )}

                {loadingFrotas ? (
                  <div className="loading">Carregando frotas...</div>
                ) : frotas.length === 0 ? (
                  <p className="fleet-empty">Nenhuma frota cadastrada ainda.</p>
                ) : (
                  <table className="frotas-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            checked={selectedFrotas.size === frotas.length && frotas.length > 0}
                            onChange={handleToggleSelectAll}
                            title="Selecionar todos"
                          />
                        </th>
                        <th onClick={() => handleSort('nome')} style={{ cursor: 'pointer' }}>
                          Frota {sortField === 'nome' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th>Modelo</th>
                        <th onClick={() => handleSort('intervaloTroca')} style={{ cursor: 'pointer' }}>
                          Intervalo de Trocas {sortField === 'intervaloTroca' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort('kmAcumulado')} style={{ cursor: 'pointer' }}>
                          Acumulado {sortField === 'kmAcumulado' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th>KM/Horas</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frotas
                        .filter((frota) => {
                          if (!searchTermEdit) return true;
                          const search = searchTermEdit.toLowerCase();
                          return (
                            frota.nome.toLowerCase().includes(search) ||
                            frota.modelo.toLowerCase().includes(search) ||
                            frota.classe.toLowerCase().includes(search)
                          );
                        })
                        .sort((a, b) => {
                          if (!sortField) return 0;
                          
                          let aValue: any = a[sortField];
                          let bValue: any = b[sortField];
                          
                          if (sortField === 'nome') {
                            aValue = String(aValue).toLowerCase();
                            bValue = String(bValue).toLowerCase();
                            return sortDirection === 'asc' 
                              ? aValue.localeCompare(bValue)
                              : bValue.localeCompare(aValue);
                          }
                          
                          // Para números (intervaloTroca, kmAcumulado)
                          return sortDirection === 'asc' 
                            ? aValue - bValue
                            : bValue - aValue;
                        })
                        .map((frota) => (
                        <tr key={frota.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedFrotas.has(frota.id!)}
                              onChange={() => handleToggleSelectFrota(frota.id!)}
                            />
                          </td>
                          <td><strong>{frota.nome}</strong></td>
                          <td>{frota.modelo}</td>
                          <td>{formatNumber(frota.intervaloTroca)}</td>
                          <td>{formatNumber(frota.kmAcumulado)}</td>
                          <td>{frota.unidade === 'hora' ? 'HORAS' : 'KM'}</td>
                          <td>
                            <div className="table-actions">
                              <button className="btn btn-secondary" onClick={() => handleEditFrota(frota)}>✏️ Editar</button>
                              <button className="btn btn-danger" onClick={() => handleDeleteFrota(frota.id!)}>🗑️ Deletar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'motores' && (
          <section className="fleet-section">
            <div className="fleet-forms">
              <form className="fleet-card" onSubmit={handleCreateMotor}>
                <h3>Cadastro de agregados</h3>

                <input
                  ref={(el) => (fileInputImportMotoresRef.current = el)}
                  type="file"
                  accept=".txt,.csv,.xlsx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportMotores(file);
                    }
                  }}
                />

                <button
                  type="button"
                  className="btn btn-secondary btn-import-frotas"
                  onClick={() => fileInputImportMotoresRef.current && fileInputImportMotoresRef.current.click()}
                >
                  Importar agregados 
                </button>

                <label>
                  Pinação do agregado
                  <input
                    type="text"
                    value={newMotor.numeroMotor}
                    onChange={(e) => setNewMotor({ ...newMotor, numeroMotor: e.target.value })}
                    placeholder="Digite a pinação do agregado"
                    required
                  />
                </label>
                <label>
                  Frota de alocação do agregado
                  <input
                    type="text"
                    value={newMotor.frotaMotor}
                    onChange={(e) => setNewMotor({ ...newMotor, frotaMotor: e.target.value })}
                    placeholder="Digite a frota que está alocado o agregado"
                    required
                  />
                </label>
                <label>
                  Tipo de agregado
                  <input
                    type="text"
                    value={newMotor.modeloMotor}
                    onChange={(e) => setNewMotor({ ...newMotor, modeloMotor: e.target.value })}
                    placeholder="Digite o tipo do agregado"
                    required
                  />
                </label>
                <label>
                  Classe da frota
                  <select
                    value={newMotor.classeFrota}
                    onChange={(e) => setNewMotor({ ...newMotor, classeFrota: e.target.value })}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="CAM. APOIO">CAM. APOIO</option>
                    <option value="CAM. MECANICO">CAM. MECANICO</option>
                    <option value="CAM. TRANSBORDO">CAM. TRANSBORDO</option>
                    <option value="CAV. SCANIA">CAV. SCANIA</option>
                    <option value="COLHEDORA">COLHEDORA</option>
                    <option value="MAQ. AMARELA">MAQ. AMARELA</option>
                    <option value="MOTO BOMBA">MOTO BOMBA</option>
                    <option value="PULVERIZADOR">PULVERIZADOR</option>
                    <option value="TRATOR">TRATOR</option>
                  </select>
                </label>
                <label>
                  Unidade
                  <select
                    value={newMotor.unidade}
                    onChange={(e) => setNewMotor({ ...newMotor, unidade: e.target.value })}
                  >
                    <option value="Selecione">Selecione</option>
                    <option value="VVAA">VVAA</option>
                    <option value="Floresta">Floresta</option>
                    <option value="Cambuí">Cambuí</option>
                    <option value="Panorama">Panorama</option>
                  </select>
                </label>
                <label>
                  Vida útil do agregado (Km/Horas)
                  <input
                    type="number"
                    min={1}
                    value={newMotor.vidaMotor}
                    onChange={(e) => setNewMotor({ ...newMotor, vidaMotor: Number(e.target.value) })}
                    required
                  />
                </label>
                <label>
                  Vida atual do agregado (Km/Horas)
                  <input
                    type="number"
                    min={0}
                    value={newMotor.horasInicial}
                    onChange={(e) => setNewMotor({ ...newMotor, horasInicial: Number(e.target.value) })}
                    required
                  />
                </label>
                <label>
                  Data de intervenção
                  <input
                    type="date"
                    value={newMotor.dataIntervencao || ''}
                    onChange={(e) => setNewMotor({ ...newMotor, dataIntervencao: e.target.value })}
                  />
                </label>
                <button type="submit" className="btn btn-success">Salvar agregado</button>
              </form>

              <form className="fleet-card" onSubmit={handleAddMotorLog}>
                <h3>Registrar Km/horas agregado</h3>

                <input
                  ref={(el) => (fileInputMotorLogRef.current = el)}
                  type="file"
                  accept=".txt,.csv,.xlsx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportMotorLogs(file);
                    }
                  }}
                />

                <button
                  type="button"
                  className="btn btn-secondary btn-import-frotas"
                  onClick={() => fileInputMotorLogRef.current && fileInputMotorLogRef.current.click()}
                  style={{ marginBottom: '20px' }}
                >
                  Importar km/horas  
                </button>

                <label>
                  Pinação agregado
                  <input
                    type="text"
                    value={newMotorLog.numeroMotor}
                    onChange={(e) => setNewMotorLog({ ...newMotorLog, numeroMotor: e.target.value })}
                    placeholder="Digite o número do agregado"
                    required
                  />
                </label>
                <label>
                  Km/Horas de trabalho
                  <input
                    type="number"
                    min={1}
                    value={newMotorLog.horasRodado}
                    onChange={(e) => setNewMotorLog({ ...newMotorLog, horasRodado: e.target.value })}
                    placeholder="Digite as horas de funcionamento"
                    required
                  />
                </label>  
                <label>
                  Data
                  <input
                    type="date"
                    value={newMotorLog.data}
                    onChange={(e) => setNewMotorLog({ ...newMotorLog, data: e.target.value })}
                    required
                  />
                </label>
                <button type="submit" className="btn btn-success">Registrar</button>
              </form>
            </div>

            <div className="fleet-list">
              <div className="fleet-hero">
                <h2>Acompanhamento de vida útil dos agregados</h2>
              </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Buscar por tipo de agregado, pinação..."
                  value={searchTermMotores}
                  onChange={(e) => setSearchTermMotores(e.target.value)}
                  className="search-input"
                />
                {searchTermMotores && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTermMotores('')}
                    title="Limpar busca"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-buttons">
                <div className="items-per-page">
                  <label>Exibir:</label>
                  <select 
                    value={itemsPerPageMotores} 
                    onChange={(e) => setItemsPerPageMotores(Number(e.target.value))}
                    className="items-select"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>Todos</option>
                  </select>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={handleExportMotoresExcel}
                  title="Exportar progresso dos agregados em Excel"
                >
                  Exportar dados 
                </button>
              </div>

              {loadingMotores ? (
                <div className="loading">Carregando motores...</div>
              ) : motores.length === 0 ? (
                <p className="fleet-empty">Nenhum agregado cadastrado.</p>
              ) : (
                <div className="table-container">
                  <table className="frotas-table compact-table">
                    <thead>
                      <tr>
                        <th>Pinação</th>
                        <th>Agregado</th>
                        <th>Tipo</th>
                        <th>Classe</th>
                        <th>Unidade</th>
                        <th>Atual</th>
                        <th>Vida Útil</th>
                        <th>Intervenção</th>
                        <th>Progresso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {motores
                        .filter((motor) => {
                          if (searchTermMotores) {
                            const search = searchTermMotores.toLowerCase();
                            return (
                              motor.numeroMotor.toLowerCase().includes(search) ||
                              motor.modeloMotor.toLowerCase().includes(search) ||
                              motor.equipamentoAtual?.toLowerCase().includes(search)
                            );
                          }
                          return true;
                        })
                        .slice(0, itemsPerPageMotores === -1 ? undefined : itemsPerPageMotores)
                        .map((motor) => (
                          <tr key={motor.id} className={motor.progresso >= 100 ? 'row-alert' : motor.progresso >= 80 ? 'row-warning' : ''}>
                            <td><strong>{motor.numeroMotor}</strong></td>
                            <td>{motor.frotaMotor}</td>
                            <td>{motor.modeloMotor}</td>
                            <td>{motor.classeFrota}</td>
                            <td>{motor.unidade}</td>
                            <td>{formatNumber(motor.horasInicial + motor.horasAcumuladas)}</td>
                            <td>{formatNumber(motor.vidaMotor)}</td>
                            <td>
                              <div className="intervencao-cell">
                                <div className="intervencao-date">{motor.dataIntervencao ? formatDateBR(motor.dataIntervencao) : '-'}</div>
                              </div>
                            </td>
                            <td>
                              <div className="progress-cell">
                                <div className="progress-bar-mini">
                                  <div 
                                    className={`progress-fill-mini ${motor.progresso >= 100 ? 'critical' : motor.progresso >= 80 ? 'warning' : ''}`}
                                    style={{ width: `${Math.min(motor.progresso, 100)}%` }}
                                  />
                                </div>
                                <span className="progress-text">{motor.progresso.toFixed(0)}%</span>
                                {motor.progresso >= 100 && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ marginLeft: 8, padding: '6px 10px', fontSize: '0.85rem' }}
                                    title="Zerar horas (manutenção realizada)"
                                    onClick={() => handleResetMotor(motor.id!, motor.numeroMotor)}
                                  >
                                    Resetar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'editarMotores' && (
          <section className="fleet-section">
            <div className="fleet-hero">
              <h2>Gerenciar agregados</h2>
              <p>Edite ou remova os agregados cadastrados.</p>
            </div>

            {editingMotor ? (
              <div className="fleet-edit-form">
                <h3>✏️ Editando "{editingMotor.numeroMotor}"</h3>
                <label>
                  Número do agregado
                  <input
                    type="text"
                    placeholder="Ex: 12345"
                    value={editingMotorData.numeroMotor || ''}
                    onChange={(e) => setEditingMotorData({ ...editingMotorData, numeroMotor: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Frota do agregado
                  <input
                    type="text"
                    placeholder="Ex: Frota A"
                    value={editingMotorData.frotaMotor || ''}
                    onChange={(e) => setEditingMotorData({ ...editingMotorData, frotaMotor: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Tipo do agregado
                  <input
                    type="text"
                    placeholder="Ex: CUMMINS 6LTAA"
                    value={editingMotorData.modeloMotor || ''}
                    onChange={(e) => setEditingMotorData({ ...editingMotorData, modeloMotor: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Classe da frota
                  <select
                    value={editingMotorData.classeFrota || ''}
                    onChange={(e) => setEditingMotorData({ ...editingMotorData, classeFrota: e.target.value })}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="CAM. APOIO">CAM. APOIO</option>
                    <option value="CAM. MECANICO">CAM. MECANICO</option>
                    <option value="CAM. TRANSBORDO">CAM. TRANSBORDO</option>
                    <option value="CAV. SCANIA">CAV. SCANIA</option>
                    <option value="COLHEDORA">COLHEDORA</option>
                    <option value="MAQ. AMARELA">MAQ. AMARELA</option>
                    <option value="MOTO BOMBA">MOTO BOMBA</option>
                    <option value="PULVERIZADOR">PULVERIZADOR</option>
                    <option value="TRATOR">TRATOR</option>
                  </select>
                </label>
                <label>
                  Unidade
                  <select
                    value={editingMotorData.unidade || 'VVAA'}
                    onChange={(e) => setEditingMotorData({ ...editingMotorData, unidade: e.target.value })}
                  >
                    <option value="VVAA">VVAA</option>
                    <option value="Floresta">Floresta</option>
                    <option value="Cambuí">Cambuí</option>
                    <option value="Panorama">Panorama</option>
                  </select>
                </label>
                <label>
                  Vida útil do motor
                  <input
                    type="number"
                    placeholder="Ex: 7558"
                    min={1}
                    value={editingMotorData.vidaMotor || 0}
                    onChange={(e) => setEditingMotorData({ ...editingMotorData, vidaMotor: Number(e.target.value) })}
                    required
                  />
                </label>
                <label>
                  Vida atual do motor
                  <input
                    type="number"
                    placeholder="Ex: 5000"
                    min={0}
                    value={editingMotorData.horasInicial || 0}
                    onChange={(e) => setEditingMotorData({ ...editingMotorData, horasInicial: Number(e.target.value) })}
                    required
                  />
                </label>
                <label>
                  Data de intervenção
                  <input
                    type="date"
                    value={editingMotorData.dataIntervencao || ''}
                    onChange={(e) => setEditingMotorData({ ...editingMotorData, dataIntervencao: e.target.value })}
                  />
                </label>
                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleSaveEditMotor}>💾 Salvar</button>
                  <button className="btn btn-secondary" onClick={() => { setEditingMotor(null); setEditingMotorData({}); }}>Cancelar</button>
                  <button className="btn btn-danger" onClick={() => handleDeleteMotor(editingMotor.id!)}>Deletar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Buscar por número, modelo ou classe..."
                    value={searchTermEditMotores}
                    onChange={(e) => setSearchTermEditMotores(e.target.value)}
                    className="search-input"
                  />
                  {searchTermEditMotores && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchTermEditMotores('')}
                      title="Limpar busca"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {selectedMotores.size > 0 && (
                  <div className="bulk-actions">
                    <span className="bulk-info">{selectedMotores.size} motor(es) selecionado(s)</span>
                    <button className="btn btn-danger" onClick={handleDeleteSelectedMotores}>
                      🗑️ Excluir Selecionados
                    </button>
                  </div>
                )}

                {loadingMotores ? (
                  <div className="loading">Carregando motores...</div>
                ) : motores.length === 0 ? (
                  <p className="fleet-empty">Nenhum agregado cadastrado.</p>
                ) : (
                  <table className="frotas-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            checked={selectedMotores.size === motores.length && motores.length > 0}
                            onChange={handleToggleSelectAllMotores}
                            title="Selecionar todos"
                          />
                        </th>
                        <th>Pinação Agregado</th>
                        <th>Frota</th>
                        <th>Tipo</th>
                        <th>Classe</th>
                        <th>Unidade</th>
                        <th>Vida Atual</th>
                        <th>Vida Útil</th>
                        <th>Data Intervenção</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {motores
                        .filter((motor) => {
                          if (!searchTermEditMotores) return true;
                          const search = searchTermEditMotores.toLowerCase();
                          return (
                            motor.numeroMotor.toLowerCase().includes(search) ||
                            motor.modeloMotor.toLowerCase().includes(search) ||
                            motor.classeFrota.toLowerCase().includes(search)
                          );
                        })
                        .map((motor) => (
                        <tr key={motor.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedMotores.has(motor.id!)}
                              onChange={() => handleToggleSelectMotor(motor.id!)}
                            />
                          </td>
                          <td><strong>{motor.numeroMotor}</strong></td>
                          <td>{motor.frotaMotor}</td>
                          <td>{motor.modeloMotor}</td>
                          <td>{motor.classeFrota}</td>
                          <td>{motor.unidade}</td>
                          <td>{formatNumber(motor.horasInicial + motor.horasAcumuladas)}</td>
                          <td>{formatNumber(motor.vidaMotor)}</td>
                          <td>{motor.dataIntervencao ? formatDateBR(motor.dataIntervencao) : '-'}</td>
                          <td>
                            <div className="table-actions">
                              <button className="btn btn-secondary" onClick={() => handleEditMotor(motor)}>✏️ Editar</button>
                              <button className="btn btn-danger" onClick={() => handleDeleteMotor(motor.id!)}>🗑️ Deletar</button>
                              {motor.progresso >= 100 && (
                                <button className="btn btn-success" onClick={() => handleResetMotor(motor.id!, motor.numeroMotor)} title="Zerar horas (manutenção realizada)">♻️ Resetar</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </section>
        )}
      </main>

      {/* Modal de Status de Análise */}
      {showStatusAnaliseModal && frotaStatusAnalise && (
        <div className="modal-overlay" onClick={() => setShowStatusAnaliseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Atualizar Status de Análise</h2>
            <p><strong>Frota:</strong> {frotaStatusAnalise.nome}</p>
            
            <div className="form-group">
              <label>Status da análise:</label>
              <select 
                value={novoStatusAnalise}
                onChange={(e) => setNovoStatusAnalise(e.target.value)}
                className="form-select"
              >
                <option value="NORMAL">🟢 NORMAL - Próxima coleta no intervalo normal (100%)</option>
                <option value="ANORMAL">🟡 ANORMAL - Próxima coleta em 50% do intervalo</option>
                <option value="CRITICO">🔴 CRÍTICO - Próxima coleta em 25% do intervalo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Data da intervenção:</label>
              <input 
                type="date"
                value={dataAnalise}
                onChange={(e) => setDataAnalise(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSaveStatusAnalise}>
                Salvar
              </button>
              <button className="btn btn-secondary" onClick={() => setShowStatusAnaliseModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="App-footer">
        Desenvolvido por Pedro Lucas - 2025
        <p>
          <a 
            href="https://www.linkedin.com/in/ordeep" 
            style={{ color: 'white', textDecoration: 'none' }}
          >
            linkedin.com/in/ordeep
          </a>
        </p>
        <p>
          <a 
            href="https://github.com/Ordeeeep" 
            style={{ color: 'white', textDecoration: 'none' }}
          >
            github.com/Ordep
          </a>
        </p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const AppContent: React.FC = () => {
  return <Dashboard />;
};

export default App;
