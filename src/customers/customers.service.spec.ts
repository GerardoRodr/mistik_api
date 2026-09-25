import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockPrismaService = {
    customer: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe retornar lista paginada de clientes y metadata', async () => {
      const mockCustomers = [
        {
          id: 'c-1',
          documentType: 'DNI',
          documentNumber: '70001122',
          firstName: 'Juan',
          lastName: 'Perez',
        },
      ];

      mockPrismaService.customer.count.mockResolvedValue(1);
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.findAll({ page: 1, limit: 10, search: 'Juan' });

      expect(result.data).toEqual(mockCustomers);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockPrismaService.customer.count).toHaveBeenCalled();
      expect(mockPrismaService.customer.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('debe retornar el expediente 360 del cliente si existe', async () => {
      const mockCustomer = {
        id: 'c-1',
        documentType: 'DNI',
        documentNumber: '70001122',
        firstName: 'Juan',
        lastName: 'Perez',
        bookings: [],
        passengers: [],
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findById('c-1');
      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        include: {
          bookings: {
            include: {
              passengers: true,
              payments: true,
              visaProcesses: true,
              tasks: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          passengers: true,
        },
      });
    });

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.findById('c-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('debe crear un nuevo cliente si el documento no esta duplicado', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.create.mockResolvedValue({
        id: 'c-new',
        documentType: 'DNI',
        documentNumber: '78945612',
        firstName: 'Maria',
        lastName: 'Lopez',
      });

      const dto = {
        documentType: 'DNI',
        documentNumber: '78945612',
        firstName: 'Maria',
        lastName: 'Lopez',
      };

      const result = await service.create(dto);
      expect(result.id).toBe('c-new');
      expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
        data: dto,
      });
    });

    it('debe lanzar ConflictException si el documento ya existe', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue({ id: 'c-existente' });

      await expect(
        service.create({
          documentType: 'DNI',
          documentNumber: '78945612',
          firstName: 'Maria',
          lastName: 'Lopez',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('debe actualizar los datos del cliente', async () => {
      const existing = {
        id: 'c-1',
        documentNumber: '70001122',
        firstName: 'Juan',
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(existing);
      mockPrismaService.customer.update.mockResolvedValue({
        ...existing,
        firstName: 'Juan Carlos',
      });

      const result = await service.update('c-1', { firstName: 'Juan Carlos' });
      expect(result.firstName).toBe('Juan Carlos');
    });
  });
});
