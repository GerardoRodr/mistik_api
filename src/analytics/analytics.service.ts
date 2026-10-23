import { Injectable } from '@nestjs/common';
import { BookingStatus, ServiceType, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Servicio de Business Intelligence, analitica financiera y cuellos de botella (WBS 11.1.2)
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // Resumen financiero de ingresos devengados vs cobrados (WBS 11.1.2.1)
  async getFinancialSummary() {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { not: BookingStatus.CANCELLED },
      },
      select: {
        id: true,
        serviceType: true,
        totalAmount: true,
        currency: true,
      },
    });

    const payments = await this.prisma.paymentRecord.findMany({
      where: {
        booking: {
          status: { not: BookingStatus.CANCELLED },
        },
      },
      select: {
        amount: true,
        currency: true,
      },
    });

    const totalAccrued = bookings.reduce(
      (sum, b) => sum + Number(b.totalAmount),
      0,
    );
    const totalCollected = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const totalPending = Math.max(0, totalAccrued - totalCollected);
    const collectionRate =
      totalAccrued > 0
        ? parseFloat(((totalCollected / totalAccrued) * 100).toFixed(1))
        : 0;

    const breakdownByService: Record<
      ServiceType,
      { count: number; totalAmount: number }
    > = {
      [ServiceType.FLIGHT]: { count: 0, totalAmount: 0 },
      [ServiceType.VISA]: { count: 0, totalAmount: 0 },
      [ServiceType.PACKAGE]: { count: 0, totalAmount: 0 },
      [ServiceType.OTHER]: { count: 0, totalAmount: 0 },
    };

    for (const b of bookings) {
      if (breakdownByService[b.serviceType]) {
        breakdownByService[b.serviceType].count += 1;
        breakdownByService[b.serviceType].totalAmount += Number(b.totalAmount);
      }
    }

    return {
      financialSummary: {
        totalAccrued: parseFloat(totalAccrued.toFixed(2)),
        totalCollected: parseFloat(totalCollected.toFixed(2)),
        totalPending: parseFloat(totalPending.toFixed(2)),
        collectionRate,
        currency: 'USD',
        activeBookingsCount: bookings.length,
        totalPaymentsCount: payments.length,
      },
      breakdownByService: Object.entries(breakdownByService).map(
        ([serviceType, data]) => ({
          serviceType,
          count: data.count,
          totalAmount: parseFloat(data.totalAmount.toFixed(2)),
          percentage:
            totalAccrued > 0
              ? parseFloat(((data.totalAmount / totalAccrued) * 100).toFixed(1))
              : 0,
        }),
      ),
    };
  }

  // Embudo de conversion de expedientes consulares (WBS 11.1.2.2)
  async getVisaConversion() {
    const visaProcesses = await this.prisma.visaProcess.findMany({
      select: {
        id: true,
        currentStep: true,
        consularFeePaid: true,
        casDate: true,
        embassyDate: true,
      },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        visaProcessId: { not: null },
      },
      select: {
        id: true,
        status: true,
        location: true,
        appointmentDate: true,
      },
    });

    const totalExpedientes = visaProcesses.length;

    const stepCounts: Record<string, number> = {
      REGISTRO_DS160: 0,
      PAGO_ARANCEL: 0,
      CITA_CONSOLIDADA: 0,
      CONCLUIDO: 0,
    };

    for (const vp of visaProcesses) {
      if (stepCounts[vp.currentStep] !== undefined) {
        stepCounts[vp.currentStep] += 1;
      } else {
        stepCounts.REGISTRO_DS160 += 1;
      }
    }

    const funnel = [
      {
        step: 'REGISTRO_DS160',
        name: 'Registro DS-160 Inicial',
        count: totalExpedientes,
        percentage: 100,
      },
      {
        step: 'PAGO_ARANCEL',
        name: 'Arancel MRV Cancelado',
        count: visaProcesses.filter((v) => v.consularFeePaid).length,
        percentage:
          totalExpedientes > 0
            ? parseFloat(
                (
                  (visaProcesses.filter((v) => v.consularFeePaid).length /
                    totalExpedientes) *
                  100
                ).toFixed(1),
              )
            : 0,
      },
      {
        step: 'CITA_CONSOLIDADA',
        name: 'Citas CAS / Embajada Asignadas',
        count: visaProcesses.filter((v) => v.casDate || v.embassyDate).length,
        percentage:
          totalExpedientes > 0
            ? parseFloat(
                (
                  (visaProcesses.filter((v) => v.casDate || v.embassyDate).length /
                    totalExpedientes) *
                  100
                ).toFixed(1),
              )
            : 0,
      },
      {
        step: 'CONCLUIDO',
        name: 'Tramites Consulares Concluidos',
        count: stepCounts.CONCLUIDO,
        percentage:
          totalExpedientes > 0
            ? parseFloat(((stepCounts.CONCLUIDO / totalExpedientes) * 100).toFixed(1))
            : 0,
      },
    ];

    return {
      totalExpedientes,
      totalAppointments: appointments.length,
      stepDistribution: stepCounts,
      funnel,
      completionRate:
        totalExpedientes > 0
          ? parseFloat(((stepCounts.CONCLUIDO / totalExpedientes) * 100).toFixed(1))
          : 0,
    };
  }

  // Indicadores de cuellos de botella y limites WIP en Kanban (WBS 11.1.2.3)
  async getKanbanBottlenecks() {
    const tasks = await this.prisma.serviceTask.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Limites de Trabajo en Progreso (WIP)
    const wipLimits: Record<string, number | null> = {
      BACKLOG: null,
      IN_PROGRESS: 3,
      UNDER_REVIEW: 2,
      DONE: null,
      CANCELLED: null,
    };

    const columnCounts: Record<string, number> = {
      BACKLOG: 0,
      IN_PROGRESS: 0,
      UNDER_REVIEW: 0,
      DONE: 0,
      CANCELLED: 0,
    };

    let totalLeadTimeHours = 0;
    let completedTasksWithDates = 0;

    const now = new Date();
    const overdueTasks: any[] = [];

    for (const t of tasks) {
      let col = 'BACKLOG';
      if (t.status === TaskStatus.IN_PROGRESS) col = 'IN_PROGRESS';
      else if (t.status === TaskStatus.UNDER_REVIEW) col = 'UNDER_REVIEW';
      else if (t.status === TaskStatus.DONE) col = 'DONE';
      else if (t.status === TaskStatus.CANCELLED) col = 'CANCELLED';

      columnCounts[col] += 1;

      // Calcular lead time para tareas completadas
      if (t.status === TaskStatus.DONE && t.completedAt) {
        const leadMs = t.completedAt.getTime() - t.createdAt.getTime();
        const leadHours = leadMs / (1000 * 60 * 60);
        totalLeadTimeHours += leadHours;
        completedTasksWithDates += 1;
      }

      // Detectar tareas vencidas no terminadas
      if (
        t.status !== TaskStatus.DONE &&
        t.status !== TaskStatus.CANCELLED &&
        t.dueDate &&
        t.dueDate < now
      ) {
        overdueTasks.push({
          id: t.id,
          title: t.title,
          status: t.status,
          dueDate: t.dueDate,
          assignedTo: t.assignedTo?.name || 'Sin asignar',
        });
      }
    }

    const columnsAnalysis = Object.keys(columnCounts).map((col) => {
      const count = columnCounts[col];
      const limit = wipLimits[col];
      const isBottleneck = limit !== null && count > limit;
      const utilization = limit !== null ? parseFloat(((count / limit) * 100).toFixed(1)) : null;

      return {
        column: col,
        taskCount: count,
        wipLimit: limit,
        isBottleneck,
        utilizationPercentage: utilization,
        status: isBottleneck ? 'SATURADA' : 'NORMAL',
      };
    });

    const averageLeadTimeHours =
      completedTasksWithDates > 0
        ? parseFloat((totalLeadTimeHours / completedTasksWithDates).toFixed(1))
        : 0;

    return {
      columnsAnalysis,
      bottlenecksDetected: columnsAnalysis.filter((c) => c.isBottleneck),
      hasBottlenecks: columnsAnalysis.some((c) => c.isBottleneck),
      metrics: {
        totalTasks: tasks.length,
        completedTasks: columnCounts.DONE,
        overdueTasksCount: overdueTasks.length,
        averageLeadTimeHours,
      },
      overdueTasks,
    };
  }
}
