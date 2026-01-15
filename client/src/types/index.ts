export interface AnaliseOleo {
  id?: string;
  numeroAmostra: string;
  dataColeta: string;
  equipamento: string;
  tipoOleo: string;
  viscosidade?: number;
  acidez?: number;
  agua?: number;
  particulas?: number;
  observacoes?: string;
  status?: string;
  createdAt?: string;
}

export interface Frota {
  id?: string;
  nome: string;
  modelo: string;
  classe: string;
  intervaloTroca: number;
  unidade?: string; // km ou hora
  kmInicial: number;
  statusAnalise?: string; // NORMAL, ANORMAL, CRITICO
  dataUltimaAnalise?: string;
  createdAt?: string;
}

export interface FrotaStatus extends Frota {
  kmAcumulado: number;
  progresso: number; // 0-100
  kmRestante: number;
  proximoLimite: number;
  intervaloAjustado: number; // intervalo ajustado baseado no status
}

export interface FrotaCreate {
  nome: string;
  modelo: string;
  classe: string;
  intervaloTroca: number;
  unidade?: string;
  kmInicial: number;
}

export interface FrotaLogCreate {
  data: string;
  kmRodado: number;
}

// ============= MOTOR TYPES =============

export interface Motor {
  id?: string;
  numeroMotor: string;
  frotaMotor: string;
  modeloMotor: string;
  classeFrota: string;
  unidade: string; // VVAA, Floresta, Cambuí, Panorama
  vidaMotor: number;
  horasInicial: number;
  dataIntervencao?: string;
  equipamentoAtual?: string;
  createdAt?: string;
}

export interface MotorStatus extends Motor {
  horasAcumuladas: number;
  progresso: number; // 0-100
  horasRestantes: number;
  proximaManutencao: number;
}

export interface MotorCreate {
  numeroMotor: string;
  frotaMotor: string;
  modeloMotor: string;
  classeFrota: string;
  unidade: string;
  vidaMotor: number;
  horasInicial: number;
  dataIntervencao?: string;
  equipamentoAtual?: string;
}

export interface MotorLogCreate {
  data: string;
  horasRodado: number;
}




