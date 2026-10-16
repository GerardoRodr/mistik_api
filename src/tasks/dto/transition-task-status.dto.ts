import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// DTO para la transicion de estado de una tarea Kanban (WBS 8.1.2.1)
export class TransitionTaskStatusDto {
  @ApiProperty({
    description:
      'Columna destino en el tablero Kanban (BACKLOG, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED)',
    example: 'IN_PROGRESS',
  })
  @IsString({ message: 'targetStatus debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'targetStatus no debe estar vacio' })
  targetStatus: string;

  @ApiPropertyOptional({
    description: 'Comentario o justificacion del cambio de columna',
    example: 'Iniciando revision de documentacion de visa',
  })
  @IsOptional()
  @IsString({ message: 'notes debe ser una cadena de texto' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Motivo en caso de descarte o cancelacion',
    example: 'Solicitud duplicada por el cliente',
  })
  @IsOptional()
  @IsString({ message: 'reason debe ser una cadena de texto' })
  reason?: string;
}
