import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

// Nombres de columnas visuales del tablero Kanban
export type KanbanColumn =
  | 'BACKLOG'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'CANCELLED';

// Motor de transicion de estados y marcas de tiempo del flujo Kanban (WBS 8.1.2.1)
@Injectable()
export class TaskStateService {
  // Mapa de transiciones permitidas segun la enumeracion de base de datos
  private readonly allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
    [TaskStatus.IN_PROGRESS]: [
      TaskStatus.UNDER_REVIEW,
      TaskStatus.PENDING,
      TaskStatus.CANCELLED,
    ],
    [TaskStatus.UNDER_REVIEW]: [
      TaskStatus.DONE,
      TaskStatus.IN_PROGRESS,
      TaskStatus.CANCELLED,
    ],
    [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
    [TaskStatus.CANCELLED]: [TaskStatus.PENDING],
  };

  // Normalizar valor recibido desde el frontend o DTO hacia el enum de Prisma
  normalizeStatus(input: string): TaskStatus {
    if (!input) {
      throw new BadRequestException('El estado destino es requerido');
    }

    const upper = input.toUpperCase().trim();

    switch (upper) {
      case 'BACKLOG':
      case 'PENDING':
        return TaskStatus.PENDING;
      case 'IN_PROGRESS':
        return TaskStatus.IN_PROGRESS;
      case 'IN_REVIEW':
      case 'UNDER_REVIEW':
        return TaskStatus.UNDER_REVIEW;
      case 'DONE':
      case 'COMPLETED':
        return TaskStatus.DONE;
      case 'CANCELLED':
        return TaskStatus.CANCELLED;
      default:
        throw new BadRequestException(
          `Estado '${input}' no es valido. Estados permitidos: BACKLOG, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED`,
        );
    }
  }

  // Convertir estado de persistencia a nomenclatura visual Kanban
  toKanbanColumn(status: TaskStatus): KanbanColumn {
    switch (status) {
      case TaskStatus.PENDING:
        return 'BACKLOG';
      case TaskStatus.IN_PROGRESS:
        return 'IN_PROGRESS';
      case TaskStatus.UNDER_REVIEW:
        return 'IN_REVIEW';
      case TaskStatus.DONE:
        return 'DONE';
      case TaskStatus.CANCELLED:
        return 'CANCELLED';
      default:
        return 'BACKLOG';
    }
  }

  // Obtener lista de columnas siguientes permitidas para la tarea
  getAllowedNextColumns(currentStatus: TaskStatus): KanbanColumn[] {
    const nextStatuses = this.allowedTransitions[currentStatus] || [];
    return nextStatuses.map((s) => this.toKanbanColumn(s));
  }

  // Validar si la transicion entre columnas es legal
  validateTransition(
    currentStatus: TaskStatus,
    targetStatus: TaskStatus,
  ): void {
    if (currentStatus === targetStatus) {
      throw new BadRequestException(
        `La tarea ya se encuentra en el estado '${this.toKanbanColumn(targetStatus)}'`,
      );
    }

    const allowed = this.allowedTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      const currentName = this.toKanbanColumn(currentStatus);
      const targetName = this.toKanbanColumn(targetStatus);
      const allowedNames = allowed
        .map((s) => this.toKanbanColumn(s))
        .join(', ');

      throw new ConflictException(
        `Transicion no permitida: no se puede mover una tarjeta de '${currentName}' a '${targetName}'. Transiciones permitidas: [${allowedNames}]`,
      );
    }
  }

  // Calcular timestamps de ciclo de vida (movedAt, completedAt)
  computeLifecycleTimestamps(
    currentStatus: TaskStatus,
    targetStatus: TaskStatus,
  ): {
    completedAt: Date | null;
    movedAt: Date;
  } {
    const now = new Date();
    let completedAt: Date | null = null;

    if (targetStatus === TaskStatus.DONE) {
      completedAt = now;
    } else if (currentStatus === TaskStatus.DONE) {
      // Si la tarea se reabre desde DONE, se resetea completedAt
      completedAt = null;
    }

    return {
      completedAt,
      movedAt: now,
    };
  }
}
