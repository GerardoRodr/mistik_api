import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { BookingStatus, ServiceType, TaskStatus } from '@prisma/client';
import {
  StateTransitionRule,
  TransitionContext,
  TransitionResult,
} from './flight-state-machine.types';

// Motor desacoplado de maquina de estados para servicios aereos y reservas
@Injectable()
export class FlightStateMachineService {
  // Matriz determinista de transiciones validas
  private readonly transitionRules: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [
      BookingStatus.IN_PROCESS,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.IN_PROCESS]: [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.COMPLETED]: [],
    [BookingStatus.CANCELLED]: [],
  };

  // Verifica si una transicion esta contemplada en la matriz
  canTransition(from: BookingStatus, to: BookingStatus): boolean {
    const allowed = this.transitionRules[from] || [];
    return allowed.includes(to);
  }

  // Obtiene la lista de estados destino validos para el estado actual
  getAllowedTransitions(currentStatus: BookingStatus): BookingStatus[] {
    return this.transitionRules[currentStatus] || [];
  }

  // Valida todas las invariantes y reglas de negocio para la transicion
  validateTransition(
    booking: {
      status: BookingStatus;
      serviceType: ServiceType;
      passengers?: Array<{
        documentNumber?: string;
        firstName?: string;
        lastName?: string;
        pnr?: string | null;
        ticketNumber?: string | null;
      }>;
      tasks?: Array<{
        status: TaskStatus;
      }>;
    },
    targetStatus: BookingStatus,
    context?: TransitionContext,
  ): void {
    const currentStatus = booking.status;

    // Regla 1: No transicionar al mismo estado
    if (currentStatus === targetStatus) {
      throw new BadRequestException(
        `La reserva ya se encuentra en el estado ${targetStatus}`,
      );
    }

    // Regla 2: Verificar conexion valida en el grafo de estados
    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new ConflictException(
        `Transicion no permitida desde ${currentStatus} hacia ${targetStatus}`,
      );
    }

    // Regla 3: Validaciones hacia estado CONFIRMED
    if (targetStatus === BookingStatus.CONFIRMED) {
      if (!booking.passengers || booking.passengers.length === 0) {
        throw new BadRequestException(
          'No se puede confirmar una reserva sin pasajeros registrados',
        );
      }

      // Validar datos minimos de los pasajeros
      for (const p of booking.passengers) {
        if (!p.documentNumber || !p.firstName || !p.lastName) {
          throw new BadRequestException(
            'Todos los pasajeros deben tener documento, nombre y apellido completos',
          );
        }
      }

      // Si es servicio aereo, validar PNR de 6 caracteres alfanumericos
      if (booking.serviceType === ServiceType.FLIGHT) {
        const pnrCandidate =
          context?.pnr || booking.passengers.find((p) => p.pnr)?.pnr;

        if (!pnrCandidate) {
          throw new BadRequestException(
            'Se requiere un codigo PNR para confirmar una reserva de vuelo',
          );
        }

        const pnrRegex = /^[A-Za-z0-9]{6}$/;
        if (!pnrRegex.test(pnrCandidate)) {
          throw new BadRequestException(
            'El codigo PNR debe contener exactamente 6 caracteres alfanumericos',
          );
        }
      }
    }

    // Regla 4: Validaciones hacia estado IN_PROCESS
    if (targetStatus === BookingStatus.IN_PROCESS) {
      if (booking.serviceType === ServiceType.FLIGHT) {
        const hasTicket =
          Boolean(context?.ticketNumber) ||
          booking.passengers?.some((p) => Boolean(p.ticketNumber));

        if (!hasTicket) {
          throw new BadRequestException(
            'Se requiere registrar numero de boleto o ticket para procesar el vuelo',
          );
        }
      }
    }

    // Regla 5: Validaciones hacia estado COMPLETED
    if (targetStatus === BookingStatus.COMPLETED) {
      const pendingTasks =
        booking.tasks?.filter((t) => t.status === TaskStatus.PENDING) || [];

      if (pendingTasks.length > 0) {
        throw new BadRequestException(
          `No se puede completar la reserva con ${pendingTasks.length} tarea(s) pendiente(s)`,
        );
      }
    }

    // Regla 6: Validaciones hacia estado CANCELLED
    if (targetStatus === BookingStatus.CANCELLED) {
      if (currentStatus === BookingStatus.COMPLETED) {
        throw new ConflictException(
          'No es posible cancelar una reserva en estado final COMPLETADO',
        );
      }

      const reason = context?.cancellationReason?.trim();
      if (!reason || reason.length < 5) {
        throw new BadRequestException(
          'Debe especificar un motivo de cancelacion valido de al menos 5 caracteres',
        );
      }
    }
  }

  // Genera el resultado formal de la transicion ejecutada
  buildTransitionResult(
    previousStatus: BookingStatus,
    newStatus: BookingStatus,
  ): TransitionResult {
    return {
      success: true,
      previousStatus,
      newStatus,
      allowedNextStates: this.getAllowedTransitions(newStatus),
      message: `Transicion de estado ejecutada exitosamente a ${newStatus}`,
    };
  }
}
