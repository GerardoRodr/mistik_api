import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BookingStatus, ServiceType } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { FlightStateMachineService } from './state-machine/flight-state-machine.service';

describe('BookingsService (Paquete 6.1.2.1)', () => {
  let service: BookingsService;
  let prisma: PrismaService;
  let stateMachine: FlightStateMachineService;

  const mockCustomer = {
    id: 'c-1',
    documentType: 'DNI',
    documentNumber: '74859612',
    firstName: 'Lucia',
    lastName: 'Mendez',
  };

  const mockBooking = {
    id: 'b-1',
    bookingCode: 'RES-001',
    customerId: 'c-1',
    serviceType: ServiceType.FLIGHT,
    status: BookingStatus.PENDING,
    totalAmount: 500,
    currency: 'USD',
    notes: 'Reserva vuelo Lima-Trujillo',
    customer: mockCustomer,
    passengers: [
      {
        id: 'p-1',
        bookingId: 'b-1',
        documentType: 'DNI',
        documentNumber: '74859612',
        firstName: 'Lucia',
        lastName: 'Mendez',
        pnr: 'LIM456',
        ticketNumber: null,
      },
    ],
    tasks: [],
  };

  const mockPrismaService = {
    customer: {
      findUnique: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    passenger: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockStateMachine = {
    canTransition: jest.fn().mockReturnValue(true),
    getAllowedTransitions: jest
      .fn()
      .mockReturnValue([BookingStatus.CONFIRMED, BookingStatus.CANCELLED]),
    validateTransition: jest.fn(),
    buildTransitionResult: jest.fn().mockImplementation((from, to) => ({
      success: true,
      previousStatus: from,
      newStatus: to,
      allowedNextStates: [BookingStatus.IN_PROCESS, BookingStatus.CANCELLED],
      message: `Transicion de estado ejecutada exitosamente a ${to}`,
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FlightStateMachineService, useValue: mockStateMachine },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
    stateMachine = module.get<FlightStateMachineService>(
      FlightStateMachineService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          customerId: 'c-inexistente',
          serviceType: ServiceType.FLIGHT,
          totalAmount: 600,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe registrar reserva con pasajeros e incluir transiciones permitidas', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.booking.create.mockResolvedValue(mockBooking);

      const result = await service.create(
        {
          customerId: 'c-1',
          serviceType: ServiceType.FLIGHT,
          totalAmount: 500,
          pnr: 'LIM456',
          passengers: [
            {
              documentType: 'DNI',
              documentNumber: '74859612',
              firstName: 'Lucia',
              lastName: 'Mendez',
            },
          ],
        },
        'user-1',
      );

      expect(result.id).toBe('b-1');
      expect(result.allowedTransitions).toEqual([
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ]);
      expect(mockPrismaService.booking.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe retornar listado paginado de reservas', async () => {
      mockPrismaService.booking.count.mockResolvedValue(1);
      mockPrismaService.booking.findMany.mockResolvedValue([mockBooking]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findById', () => {
    it('debe lanzar NotFoundException si no existe la reserva', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.findById('b-404')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe retornar la reserva detallada con transiciones calculadas', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findById('b-1');

      expect(result.id).toBe('b-1');
      expect(result.allowedTransitions).toBeDefined();
    });
  });

  describe('transition', () => {
    it('debe lanzar NotFoundException si la reserva no existe', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.transition('b-404', {
          targetStatus: BookingStatus.CONFIRMED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe invocar la maquina de estados y actualizar en base de datos', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      const updatedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      };
      mockPrismaService.booking.update.mockResolvedValue(updatedBooking);

      const result = await service.transition(
        'b-1',
        {
          targetStatus: BookingStatus.CONFIRMED,
          pnr: 'LIM456',
        },
        { id: 'user-1', role: 'ADMIN' },
      );

      expect(mockStateMachine.validateTransition).toHaveBeenCalled();
      expect(result.transition.success).toBe(true);
      expect(result.transition.newStatus).toBe(BookingStatus.CONFIRMED);
      expect(result.booking.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('findPassengersByBooking (WBS 6.1.2.2)', () => {
    it('debe lanzar NotFoundException si no se encuentra la reserva o PNR', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.findPassengersByBooking('PNR404'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe retornar pasajeros enriquecidos con issueStatus PENDIENTE_EMISION y EMITIDO', async () => {
      const bookingWithTickets = {
        ...mockBooking,
        passengers: [
          {
            id: 'p-1',
            documentNumber: '74859612',
            firstName: 'Lucia',
            lastName: 'Mendez',
            pnr: 'LIM456',
            ticketNumber: null,
          },
          {
            id: 'p-2',
            documentNumber: '70112233',
            firstName: 'Carlos',
            lastName: 'Mendoza',
            pnr: 'LIM456',
            ticketNumber: '045-1234567890',
          },
        ],
      };

      mockPrismaService.booking.findFirst.mockResolvedValue(bookingWithTickets);

      const result = await service.findPassengersByBooking('LIM456');

      expect(result.booking.bookingCode).toBe('RES-001');
      expect(result.totalPassengers).toBe(2);
      expect(result.passengers[0].issueStatus).toBe('PENDIENTE_EMISION');
      expect(result.passengers[1].issueStatus).toBe('EMITIDO');
    });
  });
});
