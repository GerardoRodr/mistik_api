import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

// DTO para asignacion exclusiva de colaborador responsable a una tarea Kanban (WBS 8.1.2.2)
export class AssignTaskDto {
  @ApiProperty({
    description: 'UUID del colaborador responsable de la tarea operativa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El identificador del colaborador debe ser un UUID valido' })
  @IsNotEmpty({ message: 'El colaborador asignado es obligatorio' })
  assignedToId: string;
}
