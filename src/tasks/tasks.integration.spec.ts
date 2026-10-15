import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { TasksModule } from './tasks.module';
import { TasksService } from './tasks.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Pruebas de Integracion - TasksModule (Semana 9 - WBS 8.1.2.1)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let agentToken: string;

  const validTaskId = '123e4567-e89b-12d3-a456-426614174000';

  const mockAgentUser = {
    id: 'u-agent-1',
    email: 'asesor@mistiktours.com',
    name: 'Asesor Comercial',
    role: Role.AGENT,
    isActive: true,
  };

  const mockTasksService = {
    transitionStatus: jest.fn().mockImplementation((id, dto) =>
      Promise.resolve({
        transition: {
          success: true,
          previousColumn: 'BACKLOG',
          targetColumn: dto.targetStatus,
          movedAt: new Date(),
          completedAt: dto.targetStatus === 'DONE' ? new Date() : null,
          allowedNextColumns: ['IN_REVIEW', 'BACKLOG', 'CANCELLED'],
          notes: dto.notes || null,
        },
        task: {
          id,
          title: 'Validar confirmacion DS-160',
          status: dto.targetStatus,
          kanbanColumn: dto.targetStatus,
        },
      }),
    ),
    findAll: jest.fn().mockResolvedValue({
      data: [
        {
          id: validTaskId,
          title: 'Validar confirmacion DS-160',
          status: 'PENDING',
          kanbanColumn: 'BACKLOG',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    }),
    findById: jest.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        title: 'Validar confirmacion DS-160',
        status: 'PENDING',
        kanbanColumn: 'BACKLOG',
      }),
    ),
    create: jest.fn().mockImplementation((dto) =>
      Promise.resolve({
        id: validTaskId,
        title: dto.title,
        status: 'PENDING',
        kanbanColumn: 'BACKLOG',
      }),
    ),
  };

  const mockUsersService = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === mockAgentUser.id) return Promise.resolve(mockAgentUser);
      return Promise.resolve(null);
    }),
  };

  const mockPrismaService = {
    serviceTask: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'aud-1' }) },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TasksModule],
    })
      .overrideProvider(TasksService)
      .useValue(mockTasksService)
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
    agentToken = jwtService.sign({
      sub: mockAgentUser.id,
      email: mockAgentUser.email,
      role: mockAgentUser.role,
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Verificacion de Seguridad e Inyeccion de JwtAuthGuard', () => {
    it('debe rechazar peticion sin token con 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tasks/${validTaskId}/status`)
        .send({ targetStatus: 'IN_PROGRESS' });

      expect(response.status).toBe(401);
    });

    it('debe permitir transicion de columna con token valido de asesor', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tasks/${validTaskId}/status`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ targetStatus: 'IN_PROGRESS', notes: 'Iniciando tarea' });

      expect(response.status).toBe(200);
      expect(response.body.transition.success).toBe(true);
      expect(response.body.transition.targetColumn).toBe('IN_PROGRESS');
      expect(mockTasksService.transitionStatus).toHaveBeenCalled();
    });

    it('debe consultar listado de tareas con token valido', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });
});
