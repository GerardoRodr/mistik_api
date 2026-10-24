import { Injectable, Logger } from '@nestjs/common';
import { BookingStatus, ServiceType, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsGateway } from './alerts.gateway';

// Servicio de negocio para deteccion y emision de alertas operativas (WBS 9.1.1.1, 9.1.1.2)
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsGateway: AlertsGateway,
  ) {}

  // Detecta vuelos proximos de 24 a 48 horas y emite alerta de check-in (WBS 9.1.1.1)
  async checkUpcomingFlightCheckins(): Promise<any[]> {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const upcomingTasks = await this.prisma.serviceTask.findMany({
      where: {
        status: {
          notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
        },
        dueDate: {
          gte: in24Hours,
          lte: in48Hours,
        },
        booking: {
          serviceType: ServiceType.FLIGHT,
          status: BookingStatus.CONFIRMED,
        },
      },
      include: {
        booking: {
          include: {
            customer: true,
            passengers: true,
          },
        },
      },
    });

    const emittedAlerts: any[] = [];

    for (const task of upcomingTasks) {
      const booking = task.booking;
      if (!booking) continue;

      const firstPassenger = booking.passengers?.[0];
      const pnr = firstPassenger?.pnr || 'SIN-PNR';
      const passengerName = firstPassenger
        ? `${firstPassenger.firstName} ${firstPassenger.lastName}`
        : `${booking.customer.firstName} ${booking.customer.lastName}`;

      const alertPayload = {
        type: 'FLIGHT_CHECKIN_DUE',
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        pnr,
        passengerName,
        customerEmail: booking.customer.email,
        customerPhone: booking.customer.phoneNumber,
        message: `Recordatorio de Check-in: Vuelo con PNR ${pnr} para ${passengerName} programado dentro de las proximas 24-48 horas.`,
        emittedAt: new Date().toISOString(),
      };

      this.alertsGateway.emitCheckinAlert(alertPayload);
      emittedAlerts.push(alertPayload);
      this.logger.log(`Alerta de check-in emitida para reserva ${booking.bookingCode} (PNR: ${pnr})`);
    }

    return emittedAlerts;
  }

  // Detecta citas consulares escalonadas a 30, 15 y 7 dias y emite alertas (WBS 9.1.1.2)
  async checkUpcomingVisaAppointments(): Promise<any[]> {
    const now = new Date();

    const pendingAppointments = await this.prisma.appointment.findMany({
      where: {
        reminderSent: false,
        status: 'SCHEDULED',
        visaProcessId: {
          not: null,
        },
        appointmentDate: {
          gt: now,
        },
      },
      include: {
        visaProcess: {
          include: {
            passenger: true,
            booking: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    const emittedAlerts: any[] = [];

    for (const appt of pendingAppointments) {
      const diffMs = appt.appointmentDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Umbrales escalonados de alerta: 30, 15 y 7 dias
      if (diffDays === 30 || diffDays === 15 || diffDays === 7) {
        const applicant = appt.visaProcess?.passenger
          ? `${appt.visaProcess.passenger.firstName} ${appt.visaProcess.passenger.lastName}`
          : appt.visaProcess?.booking?.customer
            ? `${appt.visaProcess.booking.customer.firstName} ${appt.visaProcess.booking.customer.lastName}`
            : 'Postulante';

        const alertPayload = {
          type: 'VISA_APPOINTMENT_REMINDER',
          appointmentId: appt.id,
          title: appt.title,
          appointmentDate: appt.appointmentDate,
          location: appt.location,
          daysRemaining: diffDays,
          applicantName: applicant,
          confirmationCode: appt.visaProcess?.confirmationCode || null,
          bookingCode: appt.visaProcess?.booking?.bookingCode || null,
          message: `Recordatorio Consular: Cita programada en ${diffDays} dias para ${applicant} en ${appt.location}.`,
          emittedAt: new Date().toISOString(),
        };

        this.alertsGateway.emitVisaAlert(alertPayload);

        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSent: true },
        });

        emittedAlerts.push(alertPayload);
        this.logger.log(`Alerta consular emitida para cita ${appt.id} (${diffDays} dias restantes)`);
      }
    }

    return emittedAlerts;
  }
}
