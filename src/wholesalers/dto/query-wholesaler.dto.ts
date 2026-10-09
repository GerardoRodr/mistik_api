import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

// DTO para filtrado y consulta de consolidadoras mayoristas
export class QueryWholesalerDto {
  @ApiPropertyOptional({
    description: 'Filtrar unicamente consolidadoras activas (true) o incluir todas (false)',
    default: true,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'active debe ser un valor booleano (true o false)' })
  active?: boolean;
}
