import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

// Controlador REST para registro de pagos y calculo de saldos deudores (WBS 11.1.1)
@ApiTags('Pagos y Finanzas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/bookings')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Registrar abono de pago con comprobante en Google Drive (WBS 11.1.1.2)
  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Registrar abono de pago con enlace a comprobante en Google Drive',
    description:
      'Registra un abono transaccional asociado a la reserva y recalcula el saldo deudor',
  })
  @ApiParam({ name: 'id', description: 'UUID de la reserva Booking' })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado y saldo recalculado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Enlace invalido o monto menor o igual a cero',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva no encontrada',
  })
  async createPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(id, dto);
  }

  // Consultar balance y saldo deudor en tiempo real (WBS 11.1.1.3)
  @Get(':id/balance')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Consultar estado financiero y saldo deudor de una reserva',
    description:
      'Retorna monto total, total abonado, saldo pendiente de pago y estado de liquidacion (PAID, PARTIAL, UNPAID)',
  })
  @ApiParam({ name: 'id', description: 'UUID de la reserva Booking' })
  @ApiResponse({
    status: 200,
    description: 'Balance financiero obtenido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva no encontrada',
  })
  async getBalance(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.getBookingBalance(id);
  }
}
