import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { TaskStateService } from './task-state.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService (WBS 8.1.2.1)', () => {
  let service: TasksService;
  let stateService: TaskStateService;

  const validTaskId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTask = {
    id: validTaskId,
    title: 'Validar documentacion DS-160',
    description: 'Revisar codigo de 10 caracteres',
    status: TaskStatus.PENDING,
    priority: 'HIGH',
    dueDate: new Date('2026-11-30T18:00:00.000Z'),
    bookingId: '123e4567-e89b-12d3-a456-426614174001',
    assignedToId: '123e4567-e89b-12d3-a456-426614174002',
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedTo: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Carlos Asesor',
      email: 'carlos@mistik.com',
      role: 'AGENT',
    },
    booking: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      bookingCode: 'RES-2026-001',
      status: 'CONFIRMED',
      customer: {
        id: '123e4567-e89b-12d3-a456-426614174003',
        firstName: 'Maria',
        lastName: 'Lopez',
        documentNumber: '45678912',
      },
    },
    appointments: [],
  };

  const mockPrismaService = {
    serviceTask: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        TaskStateService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    stateService = module.get<TaskStateService>(TaskStateService);
    jest.clearAllMocks();
  });

  describe('transitionStatus', () => {
    it('debe lanzar NotFoundException si la tarea no existe', async () => {
      mockPrismaService.serviceTask.findUnique.mockResolvedValue(null);

      await expect(
        service.transitionStatus('task-404', {
          targetStatus: 'IN_PROGRESS',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe transicionar exitosamente de BACKLOG a IN_PROGRESS con registro de fechas', async () => {
      mockPrismaService.serviceTask.findUnique.mockResolvedValue(mockTask);
      const updatedTask = {
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
        updatedAt: new Date(),
      };
      mockPrismaService.serviceTask.update.mockResolvedValue(updatedTask);

      const result = await service.transitionStatus(validTaskId, {
        targetStatus: 'IN_PROGRESS',
        notes: 'Iniciando atencion de la solicitud',
      });

      expect(result.transition.success).toBe(true);
      expect(result.transition.previousColumn).toBe('BACKLOG');
      expect(result.transition.targetColumn).toBe('IN_PROGRESS');
      expect(result.transition.movedAt).toBeInstanceOf(Date);
      expect(result.task.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('debe registrar completedAt al mover la tarjeta a DONE', async () => {
      const taskInReview = {
        ...mockTask,
        status: TaskStatus.UNDER_REVIEW,
      };
      mockPrismaService.serviceTask.findUnique.mockResolvedValue(taskInReview);
      const updatedTaskDone = {
        ...mockTask,
        status: TaskStatus.DONE,
        completedAt: new Date(),
      };
      mockPrismaService.serviceTask.update.mockResolvedValue(updatedTaskDone);

      const result = await service.transitionStatus(validTaskId, {
        targetStatus: 'DONE',
      });

      expect(result.transition.targetColumn).toBe('DONE');
      expect(result.transition.completedAt).toBeInstanceOf(Date);
      expect(mockPrismaService.serviceTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TaskStatus.DONE,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar listado paginado regular de tareas', async () => {
      mockPrismaService.serviceTask.count.mockResolvedValue(1);
      mockPrismaService.serviceTask.findMany.mockResolvedValue([mockTask]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect((result as any).data).toHaveLength(1);
    });

    it('debe retornar columnas agrupadas para vista Kanban cuando groupByStatus=true', async () => {
      mockPrismaService.serviceTask.findMany.mockResolvedValue([mockTask]);

      const result = (await service.findAll({
        groupByStatus: true,
      })) as any;

      expect(result).toHaveProperty('columns');
      expect(result.columns).toHaveProperty('BACKLOG');
      expect(result.columns).toHaveProperty('IN_PROGRESS');
      expect(result.columns).toHaveProperty('IN_REVIEW');
      expect(result.columns).toHaveProperty('DONE');
      expect(result.columns.BACKLOG).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('debe retornar detalle de la tarea con columna Kanban', async () => {
      mockPrismaService.serviceTask.findUnique.mockResolvedValue(mockTask);

      const result = await service.findById(validTaskId);

      expect(result.id).toBe(validTaskId);
      expect(result.kanbanColumn).toBe('BACKLOG');
    });

    it('debe lanzar NotFoundException si no existe la tarea', async () => {
      mockPrismaService.serviceTask.findUnique.mockResolvedValue(null);

      await expect(service.findById('task-404')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('debe crear una nueva tarea operativa en estado PENDING', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({ id: 'b-1' });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u-1' });
      mockPrismaService.serviceTask.create.mockResolvedValue(mockTask);

      const result = await service.create({
        title: 'Nueva tarea operativa',
        bookingId: '123e4567-e89b-12d3-a456-426614174001',
        assignedToId: '123e4567-e89b-12d3-a456-426614174002',
      });

      expect(result.id).toBe(validTaskId);
      expect(result.kanbanColumn).toBe('BACKLOG');
    });
  });
});
