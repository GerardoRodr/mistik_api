import { BadRequestException, ConflictException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TaskStateService } from './task-state.service';

describe('TaskStateService (WBS 8.1.2.1)', () => {
  let service: TaskStateService;

  beforeEach(() => {
    service = new TaskStateService();
  });

  describe('normalizeStatus', () => {
    it('debe mapear BACKLOG a TaskStatus.PENDING', () => {
      expect(service.normalizeStatus('BACKLOG')).toBe(TaskStatus.PENDING);
      expect(service.normalizeStatus('pending')).toBe(TaskStatus.PENDING);
    });

    it('debe mapear IN_REVIEW a TaskStatus.UNDER_REVIEW', () => {
      expect(service.normalizeStatus('IN_REVIEW')).toBe(TaskStatus.UNDER_REVIEW);
      expect(service.normalizeStatus('under_review')).toBe(
        TaskStatus.UNDER_REVIEW,
      );
    });

    it('debe mapear IN_PROGRESS y DONE correctamente', () => {
      expect(service.normalizeStatus('IN_PROGRESS')).toBe(
        TaskStatus.IN_PROGRESS,
      );
      expect(service.normalizeStatus('DONE')).toBe(TaskStatus.DONE);
      expect(service.normalizeStatus('COMPLETED')).toBe(TaskStatus.DONE);
    });

    it('debe lanzar BadRequestException para estados invalidos', () => {
      expect(() => service.normalizeStatus('INVALID_STATE')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('toKanbanColumn', () => {
    it('debe traducir enums de base de datos a nombres de columnas Kanban', () => {
      expect(service.toKanbanColumn(TaskStatus.PENDING)).toBe('BACKLOG');
      expect(service.toKanbanColumn(TaskStatus.IN_PROGRESS)).toBe('IN_PROGRESS');
      expect(service.toKanbanColumn(TaskStatus.UNDER_REVIEW)).toBe('IN_REVIEW');
      expect(service.toKanbanColumn(TaskStatus.DONE)).toBe('DONE');
      expect(service.toKanbanColumn(TaskStatus.CANCELLED)).toBe('CANCELLED');
    });
  });

  describe('validateTransition', () => {
    it('debe permitir transiciones validas en el flujo', () => {
      expect(() =>
        service.validateTransition(TaskStatus.PENDING, TaskStatus.IN_PROGRESS),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(
          TaskStatus.IN_PROGRESS,
          TaskStatus.UNDER_REVIEW,
        ),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(TaskStatus.UNDER_REVIEW, TaskStatus.DONE),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(TaskStatus.DONE, TaskStatus.IN_PROGRESS),
      ).not.toThrow();
    });

    it('debe lanzar BadRequestException si el estado destino es el mismo', () => {
      expect(() =>
        service.validateTransition(TaskStatus.PENDING, TaskStatus.PENDING),
      ).toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException para saltos no autorizados en el flujo', () => {
      expect(() =>
        service.validateTransition(TaskStatus.PENDING, TaskStatus.DONE),
      ).toThrow(ConflictException);

      expect(() =>
        service.validateTransition(TaskStatus.PENDING, TaskStatus.UNDER_REVIEW),
      ).toThrow(ConflictException);
    });
  });

  describe('computeLifecycleTimestamps', () => {
    it('debe registrar completedAt cuando la tarea pasa a DONE', () => {
      const timestamps = service.computeLifecycleTimestamps(
        TaskStatus.UNDER_REVIEW,
        TaskStatus.DONE,
      );

      expect(timestamps.completedAt).toBeInstanceOf(Date);
      expect(timestamps.movedAt).toBeInstanceOf(Date);
    });

    it('debe limpiar completedAt cuando una tarea DONE se reabre a IN_PROGRESS', () => {
      const timestamps = service.computeLifecycleTimestamps(
        TaskStatus.DONE,
        TaskStatus.IN_PROGRESS,
      );

      expect(timestamps.completedAt).toBeNull();
      expect(timestamps.movedAt).toBeInstanceOf(Date);
    });
  });
});
