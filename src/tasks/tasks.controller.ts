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
import { TasksService } from './tasks.service';
import { TransitionTaskStatusDto } from './dto/transition-task-status.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';

// Controlador REST para la gestion de tareas y transicion de estados del tablero Kanban (WBS 8.1.2.1)
@ApiTags('Kanban Tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Transicionar estado/columna de una tarea en el tablero Kanban (WBS 8.1.2.1)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Transicionar estado de tarea operativa en el tablero Kanban',
    description:
      'Mueve una tarjeta entre columnas (BACKLOG, IN_PROGRESS, IN_REVIEW, DONE), valida la maquina de transicion y registra marcas de tiempo movedAt y completedAt',
  })
  @ApiParam({ name: 'id', description: 'UUID de la tarea operativa ServiceTask' })
  @ApiResponse({
    status: 200,
    description: 'Estado de la tarea actualizado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Estado invalido o tarea ya en el estado solicitado',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea operativa no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Transicion no permitida en el flujo Kanban',
  })
  async transitionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionTaskStatusDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.tasksService.transitionStatus(id, dto, user);
  }

  // Listar tareas operativas con filtros y modo agrupado Kanban
  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Listar tareas operativas o agrupar por columnas Kanban',
    description:
      'Retorna tareas con soporte de filtros por prioridad, responsable, reserva y agrupacion por columnas',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de tareas o tablero Kanban obtenido exitosamente',
  })
  async findAll(@Query() query: QueryTaskDto) {
    return this.tasksService.findAll(query);
  }

  // Consultar detalle individual de tarea operativa
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Consultar detalle de una tarea operativa por UUID',
  })
  @ApiParam({ name: 'id', description: 'UUID de la tarea' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la tarea obtenido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea operativa no encontrada',
  })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findById(id);
  }

  // Registrar nueva tarea operativa
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Crear nueva tarea operativa para el tablero Kanban',
  })
  @ApiResponse({
    status: 201,
    description: 'Tarea creada exitosamente en columna BACKLOG',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada invalidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva o colaborador asignado no encontrado',
  })
  async create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }
}
