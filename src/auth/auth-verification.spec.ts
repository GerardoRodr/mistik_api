import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from './auth.module';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Verificacion funcional de los tres escenarios exigidos en el Hito 4
describe('Verificacion Funcional de Autenticacion (Hito 4)', () => {
  let app: INestApplication;
  const rawSeedPassword = 'Admin2026!';
  let hashedSeedPassword: string;

  const mockAdminUser = {
    id: 'u-seed-admin',
    email: 'admin@mistiktours.com',
    name: 'Administrador Mistik',
    password: '',
    role: Role.ADMIN,
    isActive: true,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  beforeAll(async () => {
    hashedSeedPassword = await bcrypt.hash(rawSeedPassword, 10);
    mockAdminUser.password = hashedSeedPassword;

    mockUsersService.findByEmail.mockImplementation((email: string) => {
      if (email === mockAdminUser.email) {
        return Promise.resolve(mockAdminUser);
      }
      return Promise.resolve(null);
    });

    mockUsersService.findById.mockImplementation((id: string) => {
      if (id === mockAdminUser.id) {
        return Promise.resolve(mockAdminUser);
      }
      return Promise.resolve(null);
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
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
  });

  afterAll(async () => {
    await app.close();
  });

  // Condicion 1: Peticion a /auth/profile sin token retorna 401 Unauthorized
  it('1. Peticion a /auth/profile sin token debe retornar 401 Unauthorized', async () => {
    await request(app.getHttpServer()).get('/auth/profile').expect(401);
  });

  // Condicion 2: Peticion a POST /auth/login con credenciales validas retorna accessToken
  let jwtToken = '';
  it('2. Peticion a POST /auth/login con credenciales de seed debe retornar accessToken', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@mistiktours.com',
        password: rawSeedPassword,
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.user).toEqual({
      id: mockAdminUser.id,
      email: mockAdminUser.email,
      name: mockAdminUser.name,
      role: mockAdminUser.role,
    });

    jwtToken = response.body.accessToken;
  });

  // Condicion 3: Peticion a /auth/profile con el token generado retorna 200 OK
  it('3. Peticion a /auth/profile con el token generado debe retornar 200 OK', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body).toEqual({
      id: mockAdminUser.id,
      email: mockAdminUser.email,
      name: mockAdminUser.name,
      role: mockAdminUser.role,
      isActive: true,
    });
  });
});
