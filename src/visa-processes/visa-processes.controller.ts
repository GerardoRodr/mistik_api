import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { VisaProcessesService } from './visa-processes.service';
import { CreateVisaProcessDto } from './dto/create-visa-process.dto';
import { UpdateVisaStatusDto } from './dto/update-visa-status.dto';
import { QueryVisaProcessDto } from './dto/query-visa-process.dto';

// Controlador REST para gestion y avance de tramites consulares DS-160 (WBS 7.1.2.1)
@ApiTags('Tramites Consulares')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/visa-processes')
export class VisaProcessesController {
  constructor(private readonly visaService: VisaProcessesService) {}

  // Registrar nuevo expediente de tramite consular
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Registrar nuevo expediente de tramite consular DS-160',
    description:
      'Inicia un expediente en fase REGISTRO_DS160 asociado a una reserva y opcionalmente a un pasajero',
  })
  @ApiResponse({
    status: 201,
    description: 'Expediente consular creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada invalidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva o pasajero no encontrado',
  })
  async create(@Body() dto: CreateVisaProcessDto) {
    return this.visaService.create(dto);
  }

  // Listar expedientes consulares con filtros y paginacion
  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Listar tramites consulares con filtros y paginacion',
    description:
      'Retorna expedientes consulares paginados con soporte de busqueda por codigo DS-160, documento de pasajero y reserva',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de expedientes consulares obtenido exitosamente',
  })
  async findAll(@Query() query: QueryVisaProcessDto) {
    return this.visaService.findAll(query);
  }

  // Obtener detalle completo de un tramite con citas y linea de tiempo
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Consultar detalle y linea de tiempo de un tramite consular',
  })
  @ApiParam({ name: 'id', description: 'UUID del tramite consular' })
  @ApiResponse({
    status: 200,
    description: 'Expediente consular obtenido con linea de tiempo y citas',
  })
  @ApiResponse({
    status: 404,
    description: 'Tramite consular no encontrado',
  })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.visaService.findById(id);
  }

  // Transicionar fase en la maquina de estados consular
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Avanzar o transicionar fase del tramite consular DS-160',
    description:
      'Ejecuta validaciones secuenciales en la maquina de estados (DS-160, arancel $185 USD, citas CAS/Embajada)',
  })
  @ApiParam({ name: 'id', description: 'UUID del tramite consular' })
  @ApiResponse({
    status: 200,
    description: 'Fase consular actualizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Violacion de regla de negocio o datos faltantes para la fase',
  })
  @ApiResponse({
    status: 404,
    description: 'Tramite consular no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Transicion no permitida en la maquina de estados',
  })
  async transitionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisaStatusDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.visaService.transitionStatus(id, dto, user);
  }
}
