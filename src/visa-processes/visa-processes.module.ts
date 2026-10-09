import { Module } from '@nestjs/common';
import { VisaProcessesController } from './visa-processes.controller';
import { VisaProcessesService } from './visa-processes.service';
import { VisaStateMachineService } from './state-machine/visa-state-machine.service';
import { AuthModule } from '../auth/auth.module';

// Modulo para gestion de tramites consulares DS-160 y maquina de estados
@Module({
  imports: [AuthModule],
  controllers: [VisaProcessesController],
  providers: [VisaProcessesService, VisaStateMachineService],
  exports: [VisaProcessesService, VisaStateMachineService],
})
export class VisaProcessesModule {}
