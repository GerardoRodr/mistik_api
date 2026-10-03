import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { BookingStatus, Role, ServiceType } from '@prisma/client';
import { BookingsModule } from './bookings.module';
import { BookingsService } from './bookings.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Pruebas de Integracion - BookingsModule (Semana 7 - 6.1.2.1)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let agentToken: string;

  const mockAgentUser = {
    id: 'u-agent-1',
    email: 'agent@mistiktours.com',
    name: 'Asesor Comercial',
    role: Role.AGENT,
    isActive: true,
  };

  const validUuid = 'c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d';
  const customerUuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

  const mockBookingsService = {
    create: jest.fn().mockImplementation((dto, userId) =>
      Promise.resolve({
        id: validUuid,
        bookingCode: 'RES-TEST01',
        customerId: dto.customerId,
        serviceType: dto.serviceType,
        totalAmount: dto.totalAmount,
        currency: dto.currency || 'USD',
        status: BookingStatus.PENDING,
        createdById: userId,
        allowedTransitions: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      }),
    ),
    findAll: jest.fn().mockResolvedValue({
      data: [
        {
          id: validUuid,
          bookingCode: 'RES-TEST01',
          status: BookingStatus.PENDING,
          serviceType: ServiceType.FLIGHT,
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }),
    findById: jest.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        bookingCode: 'RES-TEST01',
        status: BookingStatus.PENDING,
        serviceType: ServiceType.FLIGHT,
        customer: { id: customerUuid, firstName: 'Lucia', lastName: 'Mendez' },
        passengers: [],
        allowedTransitions: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      }),
    ),
    getAllowedTransitions: jest.fn().mockImplementation((id) =>
      Promise.resolve({
        bookingId: id,
        currentStatus: BookingStatus.PENDING,
        allowedTransitions: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      }),
    ),
    transition: jest.fn().mockImplementation((id, dto) =>
      Promise.resolve({
        transition: {
          success: true,
          previousStatus: BookingStatus.PENDING,
          newStatus: dto.targetStatus,
          allowedNextStates: [BookingStatus.IN_PROCESS, BookingStatus.CANCELLED],
          message: `Transicion de estado ejecutada exitosamente a ${dto.targetStatus}`,
        },
        booking: {
          id,
          bookingCode: 'RES-TEST01',
          status: dto.targetStatus,
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
    customer: { findUnique: jest.fn() },
    booking: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'aud-1' }) },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [BookingsModule],
    })
      .overrideProvider(BookingsService)
      .useValue(mockBookingsService)
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
    it('debe rechazar GET /api/v1/bookings con 401 si no se envia token', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/bookings');
      expect(response.status).toBe(401);
    });

    it('debe rechazar POST /api/v1/bookings con 401 sin autenticacion', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          customerId: customerUuid,
          serviceType: ServiceType.FLIGHT,
          totalAmount: 300,
        });
      expect(response.status).toBe(401);
    });
  });

  describe('Operaciones REST de Reservas Aereas', () => {
    it('GET /api/v1/bookings debe retornar listado con token Bearer', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
    });

    it('POST /api/v1/bookings debe registrar reserva y devolver 201 Created', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customerId: customerUuid,
          serviceType: ServiceType.FLIGHT,
          totalAmount: 650,
          currency: 'USD',
          pnr: 'LIM456',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(validUuid);
      expect(response.body.allowedTransitions).toBeDefined();
    });

    it('GET /api/v1/bookings/:id/transitions debe retornar transiciones permitidas', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/bookings/${validUuid}/transitions`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.currentStatus).toBe(BookingStatus.PENDING);
      expect(response.body.allowedTransitions).toContain(BookingStatus.CONFIRMED);
    });

    it('POST /api/v1/bookings/:id/transition debe ejecutar transicion exitosa', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/bookings/${validUuid}/transition`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          targetStatus: BookingStatus.CONFIRMED,
          pnr: 'LIM456',
        });

      expect(response.status).toBe(200);
      expect(response.body.transition.success).toBe(true);
      expect(response.body.transition.newStatus).toBe(BookingStatus.CONFIRMED);
    });

    it('GET /api/v1/bookings/:id debe validar que el parametro sea UUID valido', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/bookings/id-invalido-123')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(400);
    });
  });
});
