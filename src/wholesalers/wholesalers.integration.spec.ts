import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { WholesalersModule } from './wholesalers.module';
import { WholesalersService } from './wholesalers.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

// Pruebas de integracion para WholesalersModule
describe('Pruebas de Integracion - WholesalersModule', () => {
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

  const mockWholesaler = {
    id: 'w-1',
    code: 'COSTAMAR',
    name: 'Costamar Travel',
    type: 'WHOLESALER',
    ruc: '20123456789',
    contactEmail: 'operaciones@costamar.com',
    contactPhone: '+5116169000',
    isActive: true,
  };

  const mockWholesalersService = {
    findAll: jest.fn().mockResolvedValue([mockWholesaler]),
    findById: jest.fn().mockResolvedValue(mockWholesaler),
    create: jest.fn().mockResolvedValue(mockWholesaler),
    update: jest.fn().mockResolvedValue(mockWholesaler),
  };

  const mockUsersService = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === mockAdminUser.id) return Promise.resolve(mockAdminUser);
      return Promise.resolve(null);
    }),
  };

  const mockPrismaService = {
    wholesaler: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [WholesalersModule],
    })
      .overrideProvider(WholesalersService)
      .useValue(mockWholesalersService)
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

  it('GET /api/v1/wholesalers sin token debe retornar 401 Unauthorized', async () => {
    await request(app.getHttpServer()).get('/api/v1/wholesalers').expect(401);
  });

  it('GET /api/v1/wholesalers con token valido debe retornar 200 OK y listado', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/wholesalers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].code).toBe('COSTAMAR');
  });

  it('GET /api/v1/wholesalers/:id con token valido debe retornar 200 OK y detalle', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/wholesalers/w-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.id).toBe('w-1');
    expect(response.body.name).toBe('Costamar Travel');
  });
});
