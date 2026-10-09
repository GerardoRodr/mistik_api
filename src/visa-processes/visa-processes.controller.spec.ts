import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { VisaProcessesController } from './visa-processes.controller';
import { VisaProcessesService } from './visa-processes.service';
import { VisaProcessStep } from './state-machine/visa-state-machine.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('VisaProcessesController (WBS 7.1.2.1)', () => {
  let controller: VisaProcessesController;
  let service: VisaProcessesService;

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const mockProcess = {
    id: validUuid,
    bookingId: '123e4567-e89b-12d3-a456-426614174001',
    currentStep: VisaProcessStep.REGISTRO_DS160,
    confirmationCode: 'AA00123456',
    consularFeePaid: false,
  };

  const mockVisaService = {
    create: jest.fn().mockResolvedValue(mockProcess),
    findAll: jest.fn().mockResolvedValue({
      data: [mockProcess],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }),
    findById: jest.fn().mockResolvedValue(mockProcess),
    transitionStatus: jest.fn().mockResolvedValue({
      transition: {
        success: true,
        previousStep: VisaProcessStep.REGISTRO_DS160,
        newStep: VisaProcessStep.PAGO_ARANCEL,
        allowedNextSteps: [VisaProcessStep.CITA_CONSOLIDADA],
        message: 'Fase consular actualizada exitosamente a PAGO_ARANCEL',
      },
      visaProcess: {
        ...mockProcess,
        currentStep: VisaProcessStep.PAGO_ARANCEL,
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisaProcessesController],
      providers: [
        { provide: VisaProcessesService, useValue: mockVisaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VisaProcessesController>(
      VisaProcessesController,
    );
    service = module.get<VisaProcessesService>(VisaProcessesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe invocar service.create con el DTO', async () => {
      const dto = {
        bookingId: '123e4567-e89b-12d3-a456-426614174001',
        confirmationCode: 'AA00123456',
      };

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockProcess);
    });
  });

  describe('findAll', () => {
    it('debe invocar service.findAll con query', async () => {
      const query = { page: 1, limit: 10 };
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('debe invocar service.findById con el UUID', async () => {
      const result = await controller.findById(validUuid);

      expect(service.findById).toHaveBeenCalledWith(validUuid);
      expect(result.id).toBe(validUuid);
    });
  });

  describe('transitionStatus', () => {
    it('debe invocar service.transitionStatus con DTO y usuario', async () => {
      const dto = {
        targetStep: VisaProcessStep.PAGO_ARANCEL,
        confirmationCode: 'AA00123456',
      };
      const user = { id: 'u-1', email: 'agent@mistik.com', role: Role.AGENT };

      const result = await controller.transitionStatus(validUuid, dto, user);

      expect(service.transitionStatus).toHaveBeenCalledWith(
        validUuid,
        dto,
        user,
      );
      expect(result.transition.success).toBe(true);
      expect(result.visaProcess.currentStep).toBe(
        VisaProcessStep.PAGO_ARANCEL,
      );
    });
  });
});
