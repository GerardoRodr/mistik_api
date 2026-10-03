import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, Role, ServiceType } from '@prisma/client';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('BookingsController (Paquete 6.1.2.1)', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBooking = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    bookingCode: 'RES-001',
    customerId: '123e4567-e89b-12d3-a456-426614174001',
    serviceType: ServiceType.FLIGHT,
    status: BookingStatus.PENDING,
    totalAmount: 450,
  };

  const mockBookingsService = {
    create: jest.fn().mockResolvedValue(mockBooking),
    findAll: jest.fn().mockResolvedValue({
      data: [mockBooking],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }),
    findById: jest.fn().mockResolvedValue(mockBooking),
    getAllowedTransitions: jest.fn().mockResolvedValue({
      bookingId: mockBooking.id,
      currentStatus: BookingStatus.PENDING,
      allowedTransitions: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    }),
    transition: jest.fn().mockResolvedValue({
      transition: {
        success: true,
        previousStatus: BookingStatus.PENDING,
        newStatus: BookingStatus.CONFIRMED,
        allowedNextStates: [BookingStatus.IN_PROCESS, BookingStatus.CANCELLED],
        message: 'Transicion de estado ejecutada exitosamente a CONFIRMED',
      },
      booking: {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: mockBookingsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe invocar service.create con el DTO y usuario actual', async () => {
      const dto = {
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        serviceType: ServiceType.FLIGHT,
        totalAmount: 450,
      };

      const result = await controller.create(dto, {
        id: 'u-1',
        role: Role.AGENT,
      });

      expect(service.create).toHaveBeenCalledWith(dto, 'u-1');
      expect(result).toEqual(mockBooking);
    });
  });

  describe('findAll', () => {
    it('debe invocar service.findAll con los parametros de consulta', async () => {
      const query = { page: 1, limit: 10 };
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('debe invocar service.findById con el ID UUID', async () => {
      const result = await controller.findById(mockBooking.id);

      expect(service.findById).toHaveBeenCalledWith(mockBooking.id);
      expect(result.id).toBe(mockBooking.id);
    });
  });

  describe('getAllowedTransitions', () => {
    it('debe invocar service.getAllowedTransitions', async () => {
      const result = await controller.getAllowedTransitions(mockBooking.id);

      expect(service.getAllowedTransitions).toHaveBeenCalledWith(
        mockBooking.id,
      );
      expect(result.currentStatus).toBe(BookingStatus.PENDING);
    });
  });

  describe('transition', () => {
    it('debe invocar service.transition con el DTO y usuario', async () => {
      const dto = { targetStatus: BookingStatus.CONFIRMED, pnr: 'LIM456' };
      const user = { id: 'u-1', email: 'agent@mistik.com', role: Role.AGENT };

      const result = await controller.transition(mockBooking.id, dto, user);

      expect(service.transition).toHaveBeenCalledWith(mockBooking.id, dto, user);
      expect(result.transition.success).toBe(true);
      expect(result.booking.status).toBe(BookingStatus.CONFIRMED);
    });
  });
});
