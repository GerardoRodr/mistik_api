import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { VisaProcessesModule } from './visa-processes.module';
import { VisaProcessesService } from './visa-processes.service';
import { VisaProcessStep } from './state-machine/visa-state-machine.types';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Pruebas de Integracion - VisaProcessesModule (Semana 8 - WBS 7.1.2.1)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let agentToken: string;

  const validUuid = 'c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d';
  const bookingUuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

  const mockAgentUser = {
    id: 'u-agent-1',
    email: 'agent@mistiktours.com',
    name: 'Asesor Consular',
    role: Role.AGENT,
    isActive: true,
  };

  const mockVisaService = {
    create: jest.fn().mockImplementation((dto) =>
      Promise.resolve({
        id: validUuid,
        bookingId: dto.bookingId,
        confirmationCode: dto.confirmationCode || 'AA00123456',
        currentStep: VisaProcessStep.REGISTRO_DS160,
        consularFeePaid: false,
        allowedTransitions: [VisaProcessStep.PAGO_ARANCEL],
      }),
    ),
    findAll: jest.fn().mockResolvedValue({
      data: [
        {
          id: validUuid,
          bookingId: bookingUuid,
          currentStep: VisaProcessStep.REGISTRO_DS160,
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }),
    findById: jest.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        bookingId: bookingUuid,
        currentStep: VisaProcessStep.REGISTRO_DS160,
        confirmationCode: 'AA00123456',
        consularFeePaid: false,
        allowedTransitions: [VisaProcessStep.PAGO_ARANCEL],
        timeline: [],
      }),
    ),
    transitionStatus: jest.fn().mockImplementation((id, dto) =>
      Promise.resolve({
        transition: {
          success: true,
          previousStep: VisaProcessStep.REGISTRO_DS160,
          newStep: dto.targetStep,
          allowedNextSteps: [VisaProcessStep.CITA_CONSOLIDADA],
          message: `Fase consular actualizada exitosamente a ${dto.targetStep}`,
        },
        visaProcess: {
          id,
          bookingId: bookingUuid,
          currentStep: dto.targetStep,
        },
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
    booking: { findUnique: jest.fn() },
    passenger: { findFirst: jest.fn() },
    visaProcess: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'aud-1' }) },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [VisaProcessesModule],
    })
      .overrideProvider(VisaProcessesService)
      .useValue(mockVisaService)
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

  describe('Control de Acceso y Proteccion de Rutas (RNF 2.2.1.1)', () => {
    it('debe rechazar GET /api/v1/visa-processes con 401 sin token Bearer', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/visa-processes',
      );
      expect(response.status).toBe(401);
    });

    it('debe rechazar POST /api/v1/visa-processes con 401 sin autenticacion', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/visa-processes')
        .send({
          bookingId: bookingUuid,
        });
      expect(response.status).toBe(401);
    });
  });

  describe('Operaciones REST de Tramites Consulares', () => {
    it('GET /api/v1/visa-processes debe retornar listado con token Bearer', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/visa-processes')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
    });

    it('POST /api/v1/visa-processes debe registrar tramite y retornar 201 Created', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/visa-processes')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          bookingId: bookingUuid,
          confirmationCode: 'AA00123456',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(validUuid);
      expect(response.body.allowedTransitions).toBeDefined();
    });

    it('GET /api/v1/visa-processes/:id debe retornar detalle con UUID valido', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/visa-processes/${validUuid}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(validUuid);
    });

    it('PATCH /api/v1/visa-processes/:id/status debe ejecutar transicion exitosa', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/visa-processes/${validUuid}/status`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          targetStep: VisaProcessStep.PAGO_ARANCEL,
          confirmationCode: 'AA00123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.transition.success).toBe(true);
      expect(response.body.transition.newStep).toBe(
        VisaProcessStep.PAGO_ARANCEL,
      );
    });

    it('GET /api/v1/visa-processes/:id debe rechazar identificador que no sea UUID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/visa-processes/id-invalido')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(400);
    });
  });
});
