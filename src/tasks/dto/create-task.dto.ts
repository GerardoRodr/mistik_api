import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Priority } from '@prisma/client';

// DTO para la creacion de una nueva tarea operativa (WBS 8.1.2.1)
export class CreateTaskDto {
  @ApiProperty({
    description: 'Titulo o descripcion breve de la tarea operativa',
    example: 'Validar confirmacion DS-160 y coordinar cita consular',
  })
  @IsString({ message: 'title debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'title no debe estar vacio' })
  title: string;

  @ApiPropertyOptional({
    description: 'Descripcion detallada de los requisitos de la tarea',
    example: 'Revisar formulario consular de 10 caracteres y comprobante Scotiabank',
  })
  @IsOptional()
  @IsString({ message: 'description debe ser una cadena de texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Nivel de prioridad operativa de la tarjeta',
    enum: Priority,
    default: Priority.MEDIUM,
    example: Priority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'priority debe ser LOW, MEDIUM, HIGH o URGENT' })
  priority?: Priority = Priority.MEDIUM;

  @ApiPropertyOptional({
    description: 'Fecha limite o vencimiento programado (ISO 8601)',
    example: '2026-11-30T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'dueDate debe tener formato de fecha ISO 8601' })
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'UUID de la reserva vinculada a la tarea',
    example: 'c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d',
  })
  @IsOptional()
  @IsUUID('4', { message: 'bookingId debe ser un UUID v4 valido' })
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'UUID del colaborador asignado como responsable unico de la tarjeta',
    example: 'u1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b',
  })
  @IsOptional()
  @IsUUID('4', { message: 'assignedToId debe ser un UUID v4 valido' })
  assignedToId?: string;
}
