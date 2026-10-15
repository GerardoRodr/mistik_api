import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('TasksController (WBS 8.1.2.1)', () => {
  let controller: TasksController;
  let service: TasksService;

  const validTaskId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTask = {
    id: validTaskId,
    title: 'Validar confirmacion DS-160',
    status: 'PENDING',
    kanbanColumn: 'BACKLOG',
  };

  const mockTasksService = {
    transitionStatus: jest.fn().mockResolvedValue({
      transition: {
        success: true,
        previousColumn: 'BACKLOG',
        targetColumn: 'IN_PROGRESS',
        movedAt: new Date(),
        completedAt: null,
      },
      task: {
        ...mockTask,
        status: 'IN_PROGRESS',
        kanbanColumn: 'IN_PROGRESS',
      },
    }),
    findAll: jest.fn().mockResolvedValue({
      data: [mockTask],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    }),
    findById: jest.fn().mockResolvedValue(mockTask),
    create: jest.fn().mockResolvedValue(mockTask),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  describe('transitionStatus', () => {
    it('debe invocar service.transitionStatus con id, DTO y usuario', async () => {
      const dto = { targetStatus: 'IN_PROGRESS', notes: 'Iniciando tarea' };
      const user = { id: 'u-1', email: 'agent@mistik.com', role: Role.AGENT };

      const result = await controller.transitionStatus(validTaskId, dto, user);

      expect(service.transitionStatus).toHaveBeenCalledWith(
        validTaskId,
        dto,
        user,
      );
      expect(result.transition.success).toBe(true);
      expect(result.transition.targetColumn).toBe('IN_PROGRESS');
    });
  });

  describe('findAll', () => {
    it('debe invocar service.findAll con query', async () => {
      const query = { page: 1, limit: 20 };
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('debe invocar service.findById con UUID', async () => {
      const result = await controller.findById(validTaskId);

      expect(service.findById).toHaveBeenCalledWith(validTaskId);
      expect(result.id).toBe(validTaskId);
    });
  });

  describe('create', () => {
    it('debe invocar service.create con DTO', async () => {
      const dto = { title: 'Nueva tarea operativa' };
      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(validTaskId);
    });
  });
});
