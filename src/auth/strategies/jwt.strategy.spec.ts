import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { Role } from '@prisma/client';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('debe estar definido', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const payload: JwtPayload = {
      sub: 'u-1',
      email: 'admin@mistiktours.com',
      role: Role.ADMIN,
    };

    it('debe retornar el usuario seguro si existe y esta activo', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'u-1',
        email: 'admin@mistiktours.com',
        name: 'Admin',
        password: 'hashedpassword',
        role: Role.ADMIN,
        isActive: true,
      });

      const result = await strategy.validate(payload);

      expect(result).toBeDefined();
      expect(result.id).toBe('u-1');
      expect((result as any).password).toBeUndefined();
      expect(mockUsersService.findById).toHaveBeenCalledWith('u-1');
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si el usuario esta inactivo', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'u-1',
        email: 'admin@mistiktours.com',
        isActive: false,
      });

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
