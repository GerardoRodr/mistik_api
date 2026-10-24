import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentsService (WBS 11.1.1.2, 11.1.1.3)', () => {
  let service: PaymentsService;

  const mockBooking = {
    id: 'booking-uuid-1',
    bookingCode: 'BK-2026-001',
    totalAmount: 1500.0,
    currency: Currency.USD,
    customer: {
      id: 'cust-1',
      firstName: 'Roberto',
      lastName: 'Gomez',
      documentNumber: '10293847',
    },
    payments: [],
  };

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
    },
    paymentRecord: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('debe registrar un pago exitosamente con enlace a Google Drive y recalcular saldo', async () => {
      mockPrismaService.booking.findUnique
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce({
          ...mockBooking,
          payments: [
            {
              id: 'pay-1',
              amount: 500.0,
              currency: Currency.USD,
              paymentMethod: 'TRANSFERENCIA',
              driveReceiptUrl: 'https://drive.google.com/file/d/test12345/view',
              paymentDate: new Date(),
            },
          ],
        });

      mockPrismaService.paymentRecord.create.mockResolvedValue({
        id: 'pay-1',
        amount: 500.0,
        currency: Currency.USD,
        paymentMethod: 'TRANSFERENCIA',
        driveReceiptUrl: 'https://drive.google.com/file/d/test12345/view',
        paymentDate: new Date(),
      });

      const result = await service.createPayment('booking-uuid-1', {
        amount: 500.0,
        paymentMethod: 'TRANSFERENCIA',
        driveReceiptUrl: 'https://drive.google.com/file/d/test12345/view',
      });

      expect(result.payment.id).toBe('pay-1');
      expect(result.balance.totalPaid).toBe(500.0);
      expect(result.balance.balanceDue).toBe(1000.0);
      expect(result.balance.paymentStatus).toBe('PARTIAL');
    });

    it('debe lanzar NotFoundException si la reserva no existe', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment('non-existent', {
          amount: 200.0,
          paymentMethod: 'YAPE',
          driveReceiptUrl: 'https://drive.google.com/file/d/abc/view',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si el enlace no es de Google Drive', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.createPayment('booking-uuid-1', {
          amount: 200.0,
          paymentMethod: 'YAPE',
          driveReceiptUrl: 'https://dropbox.com/file/d/abc/view',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBookingBalance', () => {
    it('debe calcular balance en estado PAID cuando el total pagado iguala o supera el monto total', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        payments: [
          { id: 'p1', amount: 800.0, paymentDate: new Date() },
          { id: 'p2', amount: 700.0, paymentDate: new Date() },
        ],
      });

      const balance = await service.getBookingBalance('booking-uuid-1');

      expect(balance.totalAmount).toBe(1500.0);
      expect(balance.totalPaid).toBe(1500.0);
      expect(balance.balanceDue).toBe(0.0);
      expect(balance.paymentStatus).toBe('PAID');
    });

    it('debe calcular balance en estado UNPAID cuando no hay pagos', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        payments: [],
      });

      const balance = await service.getBookingBalance('booking-uuid-1');

      expect(balance.totalAmount).toBe(1500.0);
      expect(balance.totalPaid).toBe(0.0);
      expect(balance.balanceDue).toBe(1500.0);
      expect(balance.paymentStatus).toBe('UNPAID');
    });
  });
});
