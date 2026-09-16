import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('debe retornar los datos seguros del usuario si las credenciales son correctas', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const mockUser = {
        id: 'u-1',
        email: 'test@mistiktours.com',
        name: 'Usuario Prueba',
        password: hashedPassword,
        role: Role.AGENT,
        isActive: true,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@mistiktours.com',
        plainPassword,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('u-1');
      expect(result.email).toBe('test@mistiktours.com');
      expect((result as any).password).toBeUndefined();
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('inexistente@mistiktours.com', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el usuario esta inactivo', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'inactivo@mistiktours.com',
        isActive: false,
        password: 'hash',
      });

      await expect(
        service.validateUser('inactivo@mistiktours.com', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la contrasena es incorrecta', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'test@mistiktours.com',
        isActive: true,
        password: hashedPassword,
      });

      await expect(
        service.validateUser('test@mistiktours.com', 'WrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('debe retornar accessToken y los datos del usuario autenticado', async () => {
      const plainPassword = 'Admin2026!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const mockUser = {
        id: 'u-admin',
        email: 'admin@mistiktours.com',
        name: 'Administrador Mistik',
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mocked.jwt.token');

      const result = await service.login({
        email: 'admin@mistiktours.com',
        password: plainPassword,
      });

      expect(result).toHaveProperty('accessToken', 'mocked.jwt.token');
      expect(result).toHaveProperty('user');
      expect(result.user).toEqual({
        id: 'u-admin',
        email: 'admin@mistiktours.com',
        name: 'Administrador Mistik',
        role: Role.ADMIN,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'u-admin',
        email: 'admin@mistiktours.com',
        role: Role.ADMIN,
      });
    });
  });
});
