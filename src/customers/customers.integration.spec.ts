import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { CustomersModule } from './customers.module';
import { CustomersService } from './customers.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('Pruebas de Integracion - CustomersModule (Semana 6)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;

  const mockAdminUser = {
    id: 'u-admin-1',
    email: 'admin@mistiktours.com',
    name: 'Admin',
    role: Role.ADMIN,
    isActive: true,
  };

  const mockCustomersService = {
    findAll: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'c-1',
          documentType: 'DNI',
          documentNumber: '70001122',
          firstName: 'Juan',
          lastName: 'Perez',
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }),
    findById: jest.fn().mockResolvedValue({
      id: 'c-1',
      documentType: 'DNI',
      documentNumber: '70001122',
      firstName: 'Juan',
      lastName: 'Perez',
      bookings: [],
      passengers: [],
    }),
    create: jest.fn().mockImplementation((dto) =>
      Promise.resolve({
        id: 'c-new',
        ...dto,
      }),
    ),
    update: jest.fn().mockImplementation((id, dto) =>
      Promise.resolve({
        id,
        ...dto,
      }),
    ),
  };

  const mockUsersService = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === mockAdminUser.id) return Promise.resolve(mockAdminUser);
      return Promise.resolve(null);
    }),
  };

  const mockPrismaService = {
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CustomersModule],
    })
      .overrideProvider(CustomersService)
      .useValue(mockCustomersService)
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
    adminToken = jwtService.sign({
      sub: mockAdminUser.id,
      email: mockAdminUser.email,
      role: mockAdminUser.role,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/customers sin token debe retornar 401 Unauthorized', async () => {
    await request(app.getHttpServer()).get('/api/v1/customers').expect(401);
  });

  it('GET /api/v1/customers con token valido debe retornar 200 OK y listado paginado', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/customers?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data.length).toBe(1);
  });

  it('POST /api/v1/customers con token valido debe crear cliente y retornar 201 Created', async () => {
    const newCustomer = {
      documentType: 'DNI',
      documentNumber: '75395148',
      firstName: 'Lucia',
      lastName: 'Mendez',
      email: 'lucia.mendez@gmail.com',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newCustomer)
      .expect(201);

    expect(response.body).toHaveProperty('id', 'c-new');
    expect(response.body.documentNumber).toBe(newCustomer.documentNumber);
  });

  it('GET /api/v1/customers/:id con token valido debe retornar expediente 360', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/customers/c-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', 'c-1');
    expect(response.body).toHaveProperty('bookings');
    expect(response.body).toHaveProperty('passengers');
  });

  it('PATCH /api/v1/customers/:id con token valido debe actualizar expediente', async () => {
    const updateDto = { firstName: 'Juan Manuel' };

    const response = await request(app.getHttpServer())
      .patch('/api/v1/customers/c-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateDto)
      .expect(200);

    expect(response.body).toHaveProperty('id', 'c-1');
    expect(response.body.firstName).toBe('Juan Manuel');
  });
});
