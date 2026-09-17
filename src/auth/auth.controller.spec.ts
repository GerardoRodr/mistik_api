import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('debe invocar authService.login y retornar el resultado', async () => {
      const loginDto = {
        email: 'admin@mistiktours.com',
        password: 'Admin2026!',
      };

      const expectedResult = {
        accessToken: 'mocked.jwt.token',
        user: {
          id: 'u-1',
          email: 'admin@mistiktours.com',
          name: 'Administrador Mistik',
          role: Role.ADMIN,
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);
      expect(result).toEqual(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
