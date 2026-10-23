import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AlertsService } from './alerts.service';

// Cron Jobs para ejecucion periodica de alertas operativas y consulares (WBS 9.1.1.1, 9.1.1.2)
@Injectable()
export class AlertsCronService {
  private readonly logger = new Logger(AlertsCronService.name);

  constructor(private readonly alertsService: AlertsService) {}

  // Cron Job de Check-ins proximos de 24 a 48 horas (cada 30 minutos)
  @Cron('0 */30 * * * *')
  async handleFlightCheckinsCron() {
    this.logger.log('Ejecutando Cron Job: Verificacion de Check-ins de vuelo (24-48h)...');
    try {
      const results = await this.alertsService.checkUpcomingFlightCheckins();
      this.logger.log(`Cron Job Check-ins completado. Alertas emitidas: ${results.length}`);
    } catch (error) {
      this.logger.error('Error al ejecutar Cron Job de Check-ins de vuelo', error);
    }
  }

  // Cron Job de Alertas Escalonadas de Citas Consulares (diariamente a las 08:00 AM)
  @Cron('0 0 8 * * *')
  async handleVisaAppointmentsCron() {
    this.logger.log('Ejecutando Cron Job: Verificacion de Citas Consulares escalonadas (30, 15, 7 dias)...');
    try {
      const results = await this.alertsService.checkUpcomingVisaAppointments();
      this.logger.log(`Cron Job Citas Consulares completado. Alertas emitidas: ${results.length}`);
    } catch (error) {
      this.logger.error('Error al ejecutar Cron Job de Citas Consulares', error);
    }
  }
}
