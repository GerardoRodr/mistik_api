import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { AlertsGateway } from './alerts.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, ServiceType, TaskStatus } from '@prisma/client';

describe('AlertsService (WBS 9.1.1.1, 9.1.1.2)', () => {
  let service: AlertsService;

  const mockPrismaService = {
    serviceTask: {
      findMany: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAlertsGateway = {
    emitCheckinAlert: jest.fn(),
    emitVisaAlert: jest.fn(),
    emitTaskMoved: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AlertsGateway, useValue: mockAlertsGateway },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    jest.clearAllMocks();
  });

  describe('checkUpcomingFlightCheckins (WBS 9.1.1.1)', () => {
    it('debe detectar vuelos proximos entre 24 y 48h y emitir alertas', async () => {
      const mockTask = {
        id: 'task-checkin-1',
        title: 'Check-in y emision de pase de abordar',
        status: TaskStatus.PENDING,
        dueDate: new Date(Date.now() + 30 * 60 * 60 * 1000), // 30 horas en el futuro
        booking: {
          id: 'booking-1',
          bookingCode: 'RES-FLIGHT-001',
          serviceType: ServiceType.FLIGHT,
          status: BookingStatus.CONFIRMED,
          customer: {
            firstName: 'Carlos',
            lastName: 'Mendoza',
            email: 'carlos@gmail.com',
            phoneNumber: '987654321',
          },
          passengers: [
            {
              id: 'pax-1',
              firstName: 'Carlos',
              lastName: 'Mendoza',
              pnr: 'LIM890',
            },
          ],
        },
      };

      mockPrismaService.serviceTask.findMany.mockResolvedValue([mockTask]);

      const alerts = await service.checkUpcomingFlightCheckins();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].pnr).toBe('LIM890');
      expect(alerts[0].passengerName).toBe('Carlos Mendoza');
      expect(mockAlertsGateway.emitCheckinAlert).toHaveBeenCalledTimes(1);
    });

    it('no debe emitir alertas si no hay tareas de vuelo en la ventana 24-48h', async () => {
      mockPrismaService.serviceTask.findMany.mockResolvedValue([]);

      const alerts = await service.checkUpcomingFlightCheckins();

      expect(alerts).toHaveLength(0);
      expect(mockAlertsGateway.emitCheckinAlert).not.toHaveBeenCalled();
    });
  });

  describe('checkUpcomingVisaAppointments (WBS 9.1.1.2)', () => {
    it('debe detectar citas consulares escalonadas a 15 dias y marcar reminderSent', async () => {
      const date15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      const mockAppointment = {
        id: 'appt-1',
        title: 'Entrevista Embajada',
        appointmentDate: date15Days,
        location: 'Embajada de EE.UU. en Lima',
        status: 'SCHEDULED',
        reminderSent: false,
        visaProcess: {
          confirmationCode: 'AA00B1C2D3',
          passenger: {
            firstName: 'Ana',
            lastName: 'Flores',
          },
          booking: {
            bookingCode: 'BK-VISA-001',
            customer: {
              firstName: 'Ana',
              lastName: 'Flores',
            },
          },
        },
      };

      mockPrismaService.appointment.findMany.mockResolvedValue([mockAppointment]);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        reminderSent: true,
      });

      const alerts = await service.checkUpcomingVisaAppointments();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].daysRemaining).toBe(15);
      expect(alerts[0].applicantName).toBe('Ana Flores');
      expect(mockAlertsGateway.emitVisaAlert).toHaveBeenCalled();
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'appt-1' },
          data: { reminderSent: true },
        }),
      );
    });
  });
});
