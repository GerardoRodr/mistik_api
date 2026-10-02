import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { FlightStateMachineService } from './state-machine/flight-state-machine.service';
import { AuthModule } from '../auth/auth.module';

// Modulo para gestion transaccional de reservas y maquina de estados de vuelos
@Module({
  imports: [AuthModule],
  controllers: [BookingsController],
  providers: [BookingsService, FlightStateMachineService],
  exports: [BookingsService, FlightStateMachineService],
})
export class BookingsModule {}
