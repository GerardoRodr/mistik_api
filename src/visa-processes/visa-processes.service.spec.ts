import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VisaProcessesService } from './visa-processes.service';
import { PrismaService } from '../prisma/prisma.service';
import { VisaStateMachineService } from './state-machine/visa-state-machine.service';
import { VisaProcessStep } from './state-machine/visa-state-machine.types';

describe('VisaProcessesService (WBS 7.1.2.1)', () => {
  let service: VisaProcessesService;
  let prisma: PrismaService;
  let stateMachine: VisaStateMachineService;

  const mockBooking = {
    id: 'b-1',
    bookingCode: 'RES-001',
    customerId: 'c-1',
  };

  const mockPassenger = {
    id: 'p-1',
    bookingId: 'b-1',
    documentNumber: '74859612',
    firstName: 'Lucia',
    lastName: 'Mendez',
  };

  const mockVisaProcess = {
    id: 'vp-1',
    bookingId: 'b-1',
    passengerId: 'p-1',
    confirmationCode: 'AA00123456',
    consularFeePaid: false,
    consularFeeAmount: 185.0,
    currency: 'USD',
    currentStep: VisaProcessStep.REGISTRO_DS160,
    casDate: null,
    embassyDate: null,
    booking: mockBooking,
    passenger: mockPassenger,
    appointments: [],
  };

  const mockPrismaService = {
    booking: { findUnique: jest.fn() },
    passenger: { findFirst: jest.fn() },
    visaProcess: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockStateMachine = {
    normalizeStep: jest.fn().mockImplementation((s) => s),
    canTransition: jest.fn().mockReturnValue(true),
    getAllowedTransitions: jest
      .fn()
      .mockReturnValue([VisaProcessStep.PAGO_ARANCEL]),
    validateTransition: jest.fn(),
    buildTransitionResult: jest.fn().mockImplementation((from, to) => ({
      success: true,
      previousStep: from,
      newStep: to,
      allowedNextSteps: [VisaProcessStep.CITA_CONSOLIDADA],
      message: `Fase consular actualizada exitosamente a ${to}`,
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisaProcessesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: VisaStateMachineService, useValue: mockStateMachine },
      ],
    }).compile();

    service = module.get<VisaProcessesService>(VisaProcessesService);
    prisma = module.get<PrismaService>(PrismaService);
    stateMachine = module.get<VisaStateMachineService>(
      VisaStateMachineService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe lanzar NotFoundException si la reserva no existe', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ bookingId: 'b-404' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si el pasajero no pertenece a la reserva', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.passenger.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ bookingId: 'b-1', passengerId: 'p-invalido' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe registrar el tramite consular y calcular transiciones y timeline', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.passenger.findFirst.mockResolvedValue(mockPassenger);
      mockPrismaService.visaProcess.create.mockResolvedValue(mockVisaProcess);

      const result = await service.create({
        bookingId: 'b-1',
        passengerId: 'p-1',
        confirmationCode: 'AA00123456',
      });

      expect(result.id).toBe('vp-1');
      expect(result.allowedTransitions).toEqual([
        VisaProcessStep.PAGO_ARANCEL,
      ]);
      expect(result.timeline).toBeDefined();
      expect(mockPrismaService.visaProcess.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe retornar listado paginado', async () => {
      mockPrismaService.visaProcess.count.mockResolvedValue(1);
      mockPrismaService.visaProcess.findMany.mockResolvedValue([mockVisaProcess]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findById', () => {
    it('debe lanzar NotFoundException si no existe el tramite', async () => {
      mockPrismaService.visaProcess.findUnique.mockResolvedValue(null);

      await expect(service.findById('vp-404')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe retornar el expediente completo con timeline y transiciones', async () => {
      mockPrismaService.visaProcess.findUnique.mockResolvedValue(
        mockVisaProcess,
      );

      const result = await service.findById('vp-1');

      expect(result.id).toBe('vp-1');
      expect(result.timeline).toBeDefined();
      expect(result.allowedTransitions).toBeDefined();
    });
  });

  describe('transitionStatus', () => {
    it('debe lanzar NotFoundException si no existe el expediente consular', async () => {
      mockPrismaService.visaProcess.findUnique.mockResolvedValue(null);

      await expect(
        service.transitionStatus('vp-404', {
          targetStep: VisaProcessStep.PAGO_ARANCEL,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe invocar la maquina de estados y persistir la nueva fase', async () => {
      mockPrismaService.visaProcess.findUnique.mockResolvedValue(
        mockVisaProcess,
      );
      const updatedProcess = {
        ...mockVisaProcess,
        currentStep: VisaProcessStep.PAGO_ARANCEL,
      };
      mockPrismaService.visaProcess.update.mockResolvedValue(updatedProcess);

      const result = await service.transitionStatus('vp-1', {
        targetStep: VisaProcessStep.PAGO_ARANCEL,
        confirmationCode: 'AA00123456',
      });

      expect(mockStateMachine.validateTransition).toHaveBeenCalled();
      expect(result.transition.success).toBe(true);
      expect(result.transition.newStep).toBe(VisaProcessStep.PAGO_ARANCEL);
      expect(result.visaProcess.currentStep).toBe(
        VisaProcessStep.PAGO_ARANCEL,
      );
    });
  });
});
