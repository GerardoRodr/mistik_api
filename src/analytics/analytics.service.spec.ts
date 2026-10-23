import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceType, TaskStatus } from '@prisma/client';

describe('AnalyticsService (WBS 11.1.2.1, 11.1.2.2, 11.1.2.3)', () => {
  let service: AnalyticsService;

  const mockPrismaService = {
    booking: {
      findMany: jest.fn(),
    },
    paymentRecord: {
      findMany: jest.fn(),
    },
    visaProcess: {
      findMany: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
    serviceTask: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  describe('getFinancialSummary (WBS 11.1.2.1)', () => {
    it('debe calcular metricas de ingresos devengados, recaudados y saldos pendientes', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([
        { id: 'b1', serviceType: ServiceType.FLIGHT, totalAmount: 1000.0, currency: 'USD' },
        { id: 'b2', serviceType: ServiceType.VISA, totalAmount: 500.0, currency: 'USD' },
      ]);

      mockPrismaService.paymentRecord.findMany.mockResolvedValue([
        { amount: 800.0, currency: 'USD' },
      ]);

      const result = await service.getFinancialSummary();

      expect(result.financialSummary.totalAccrued).toBe(1500.0);
      expect(result.financialSummary.totalCollected).toBe(800.0);
      expect(result.financialSummary.totalPending).toBe(700.0);
      expect(result.financialSummary.collectionRate).toBe(53.3);
      expect(result.breakdownByService).toHaveLength(4);
    });
  });

  describe('getVisaConversion (WBS 11.1.2.2)', () => {
    it('debe generar el embudo de conversion consular con porcentajes de avance', async () => {
      mockPrismaService.visaProcess.findMany.mockResolvedValue([
        {
          id: 'vp-1',
          currentStep: 'CONCLUIDO',
          consularFeePaid: true,
          casDate: new Date(),
          embassyDate: new Date(),
        },
        {
          id: 'vp-2',
          currentStep: 'PAGO_ARANCEL',
          consularFeePaid: true,
          casDate: null,
          embassyDate: null,
        },
      ]);

      mockPrismaService.appointment.findMany.mockResolvedValue([
        { id: 'a1', status: 'SCHEDULED' },
      ]);

      const result = await service.getVisaConversion();

      expect(result.totalExpedientes).toBe(2);
      expect(result.funnel).toHaveLength(4);
      expect(result.stepDistribution.CONCLUIDO).toBe(1);
      expect(result.completionRate).toBe(50);
    });
  });

  describe('getKanbanBottlenecks (WBS 11.1.2.3)', () => {
    it('debe detectar cuellos de botella cuando las tareas superan el limite WIP', async () => {
      const tasks = [
        { id: 't1', status: TaskStatus.IN_PROGRESS, createdAt: new Date(), dueDate: null },
        { id: 't2', status: TaskStatus.IN_PROGRESS, createdAt: new Date(), dueDate: null },
        { id: 't3', status: TaskStatus.IN_PROGRESS, createdAt: new Date(), dueDate: null },
        { id: 't4', status: TaskStatus.IN_PROGRESS, createdAt: new Date(), dueDate: null }, // 4 tareas > limite WIP (3)
      ];

      mockPrismaService.serviceTask.findMany.mockResolvedValue(tasks);

      const result = await service.getKanbanBottlenecks();

      expect(result.hasBottlenecks).toBe(true);
      const inProgressCol = result.columnsAnalysis.find((c) => c.column === 'IN_PROGRESS');
      expect(inProgressCol?.isBottleneck).toBe(true);
      expect(inProgressCol?.taskCount).toBe(4);
      expect(inProgressCol?.wipLimit).toBe(3);
    });
  });
});
