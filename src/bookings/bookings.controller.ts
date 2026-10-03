import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { TransitionBookingDto } from './dto/transition-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

// Controlador REST para gestion de reservas y maquina de estados de vuelos
@ApiTags('Reservas y Vuelos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Registrar nueva reserva o expediente preliminar
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Registrar nueva reserva turistica o de vuelo',
    description:
      'Crea una reserva en estado PENDING con opcion de asociar pasajeros iniciales y codigo PNR',
  })
  @ApiResponse({
    status: 201,
    description: 'Reserva registrada exitosamente con codigo autogenerado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada invalidos o faltantes',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente titular especificado no existe',
  })
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.bookingsService.create(dto, user?.id);
  }

  // Listar reservas con filtros y paginacion
  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Listar reservas con paginacion y filtros de busqueda',
    description:
      'Retorna reservas paginadas con soporte de filtro por estado, tipo de servicio, cliente y busqueda',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de reservas obtenido exitosamente',
  })
  async findAll(@Query() query: QueryBookingDto) {
    return this.bookingsService.findAll(query);
  }

  // Obtener expediente detallado de una reserva
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Consultar detalle completo de expediente de reserva',
  })
  @ApiParam({ name: 'id', description: 'UUID de la reserva' })
  @ApiResponse({
    status: 200,
    description: 'Expediente de reserva obtenido con pasajeros y pagos',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva no encontrada',
  })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findById(id);
  }

  // Consultar transiciones validas para el estado actual
  @Get(':id/transitions')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Consultar transiciones de estado permitidas',
    description:
      'Devuelve el estado actual y los estados destino a los que se puede transicionar',
  })
  @ApiParam({ name: 'id', description: 'UUID de la reserva' })
  @ApiResponse({
    status: 200,
    description: 'Lista de estados destino permitidos segun la maquina de estados',
  })
  async getAllowedTransitions(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.getAllowedTransitions(id);
  }

  // Ejecutar cambio de estado a traves de la maquina de estados
  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Ejecutar transicion de estado en el flujo operativo',
    description:
      'Aplica validaciones de negocio en la maquina de estados y actualiza el estado relacional',
  })
  @ApiParam({ name: 'id', description: 'UUID de la reserva' })
  @ApiResponse({
    status: 200,
    description: 'Transicion ejecutada exitosamente con auditoria registrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Violacion de regla de negocio o datos faltantes para la transicion',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Transicion no permitida en la maquina de estados',
  })
  async transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionBookingDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.bookingsService.transition(id, dto, user);
  }
}
