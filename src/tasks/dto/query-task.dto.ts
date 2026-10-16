import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Priority, TaskStatus } from '@prisma/client';

// DTO para la consulta de tareas operativas y bandeja Kanban
export class QueryTaskDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado de la tarea (PENDING, IN_PROGRESS, UNDER_REVIEW, DONE, CANCELLED)',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsString({ message: 'status debe ser una cadena de texto' })
  status?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por nivel de prioridad',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'priority debe ser LOW, MEDIUM, HIGH o URGENT' })
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'UUID del colaborador asignado',
    example: 'u1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b',
  })
  @IsOptional()
  @IsUUID('4', { message: 'assignedToId debe ser un UUID v4 valido' })
  assignedToId?: string;

  @ApiPropertyOptional({
    description: 'UUID de la reserva asociada',
    example: 'c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d',
  })
  @IsOptional()
  @IsUUID('4', { message: 'bookingId debe ser un UUID v4 valido' })
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Texto para busqueda en titulo o descripcion de la tarea',
    example: 'visa',
  })
  @IsOptional()
  @IsString({ message: 'search debe ser una cadena de texto' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Agrupar resultados por columnas del tablero Kanban (BACKLOG, IN_PROGRESS, IN_REVIEW, DONE)',
    default: false,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  groupByStatus?: boolean = false;

  @ApiPropertyOptional({
    description: 'Numero de pagina',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por pagina',
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
