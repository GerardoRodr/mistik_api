import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WholesalersService } from './wholesalers.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WholesalersService', () => {
  let service: WholesalersService;
  let prisma: PrismaService;

  const mockWholesaler = {
    id: 'w-1',
    code: 'COSTAMAR',
    name: 'Costamar Travel',
    type: 'WHOLESALER',
    ruc: '20123456789',
    contactEmail: 'operaciones@costamar.com',
    contactPhone: '+5116169000',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    wholesaler: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WholesalersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WholesalersService>(WholesalersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe listar consolidadoras activas ordenadas por nombre por defecto', async () => {
      mockPrismaService.wholesaler.findMany.mockResolvedValue([mockWholesaler]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('COSTAMAR');
      expect(mockPrismaService.wholesaler.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    });

    it('debe listar todas las consolidadoras cuando onlyActive es false', async () => {
      mockPrismaService.wholesaler.findMany.mockResolvedValue([mockWholesaler]);

      const result = await service.findAll(false);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.wholesaler.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findById', () => {
    it('debe lanzar NotFoundException si no existe la consolidadora', async () => {
      mockPrismaService.wholesaler.findUnique.mockResolvedValue(null);

      await expect(service.findById('w-404')).rejects.toThrow(NotFoundException);
    });

    it('debe retornar la consolidadora si existe', async () => {
      mockPrismaService.wholesaler.findUnique.mockResolvedValue(mockWholesaler);

      const result = await service.findById('w-1');

      expect(result.id).toBe('w-1');
      expect(result.name).toBe('Costamar Travel');
    });
  });

  describe('create', () => {
    it('debe lanzar ConflictException si ya existe una consolidadora con el mismo codigo', async () => {
      mockPrismaService.wholesaler.findUnique.mockResolvedValue(mockWholesaler);

      await expect(
        service.create({
          code: 'COSTAMAR',
          name: 'Costamar Duplicado',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe registrar y retornar la consolidadora creada', async () => {
      mockPrismaService.wholesaler.findUnique.mockResolvedValue(null);
      mockPrismaService.wholesaler.create.mockResolvedValue(mockWholesaler);

      const result = await service.create({
        code: 'COSTAMAR',
        name: 'Costamar Travel',
      });

      expect(result.code).toBe('COSTAMAR');
      expect(mockPrismaService.wholesaler.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debe actualizar una consolidadora existente', async () => {
      mockPrismaService.wholesaler.findUnique.mockResolvedValue(mockWholesaler);
      mockPrismaService.wholesaler.update.mockResolvedValue({
        ...mockWholesaler,
        name: 'Costamar Actualizado',
      });

      const result = await service.update('w-1', {
        name: 'Costamar Actualizado',
      });

      expect(result.name).toBe('Costamar Actualizado');
    });
  });
});
