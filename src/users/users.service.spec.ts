import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('debe retornar un usuario si el correo existe', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'admin@mistiktours.com',
        name: 'Admin',
        role: Role.ADMIN,
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('admin@mistiktours.com');
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@mistiktours.com' },
      });
    });

    it('debe retornar null si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('inexistente@mistiktours.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('debe retornar un usuario por su identificador unico', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'agent@mistiktours.com',
        name: 'Agente',
        role: Role.AGENT,
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('u-1');
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u-1' },
      });
    });
  });

  describe('create', () => {
    it('debe crear un usuario con la contrasena hasheada con bcrypt', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockImplementation((args) =>
        Promise.resolve({
          id: 'u-2',
          ...args.data,
        }),
      );

      const result = await service.create({
        email: 'nuevo@mistiktours.com',
        password: 'Password123',
        name: 'Nuevo Usuario',
        role: Role.AGENT,
      });

      expect(result.id).toBe('u-2');
      expect(result.email).toBe('nuevo@mistiktours.com');
      expect(result.password).not.toBe('Password123');
      const isMatch = await bcrypt.compare('Password123', result.password);
      expect(isMatch).toBe(true);
    });

    it('debe lanzar ConflictException si el correo ya esta registrado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u-1' });

      await expect(
        service.create({
          email: 'admin@mistiktours.com',
          password: 'Password123',
          name: 'Duplicado',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
