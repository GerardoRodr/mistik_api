import { BookingStatus } from '@prisma/client';

// Contexto de ejecucion para validar la transicion
export interface TransitionContext {
  userId?: string;
  userRole?: string;
  pnr?: string;
  ticketNumber?: string;
  cancellationReason?: string;
  notes?: string;
}

// Resultado estructurado tras aplicar una transicion
export interface TransitionResult {
  success: boolean;
  previousStatus: BookingStatus;
  newStatus: BookingStatus;
  allowedNextStates: BookingStatus[];
  message: string;
}

// Definicion de regla de transicion permitida
export interface StateTransitionRule {
  from: BookingStatus;
  allowedTargets: BookingStatus[];
}
