import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertsGateway } from './alerts.gateway';
import { AlertsService } from './alerts.service';
import { AlertsCronService } from './alerts.cron';
import { PrismaModule } from '../prisma/prisma.module';

// Modulo para automatizacion de alertas operativas y WebSockets (WBS 9.1.1, 9.1.2)
@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [AlertsGateway, AlertsService, AlertsCronService],
  exports: [AlertsGateway, AlertsService],
})
export class AlertsModule {}
