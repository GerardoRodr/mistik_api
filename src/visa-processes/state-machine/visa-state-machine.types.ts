// Fases oficiales del flujo consular DS-160
export enum VisaProcessStep {
  REGISTRO_DS160 = 'REGISTRO_DS160',
  PAGO_ARANCEL = 'PAGO_ARANCEL',
  CITA_CONSOLIDADA = 'CITA_CONSOLIDADA',
  CONCLUIDO = 'CONCLUIDO',
}

// Contexto de datos requeridos para transiciones consulares
export interface VisaTransitionContext {
  userId?: string;
  userRole?: string;
  confirmationCode?: string;
  consularFeePaid?: boolean;
  consularFeeAmount?: number;
  casDate?: Date | string | null;
  embassyDate?: Date | string | null;
  notes?: string;
}

// Resultado estructurado tras aplicar una transicion de fase
export interface VisaTransitionResult {
  success: boolean;
  previousStep: string;
  newStep: string;
  allowedNextSteps: string[];
  message: string;
}
