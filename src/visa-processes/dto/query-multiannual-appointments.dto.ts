import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

// DTO para la consulta indexada multianual de citas consulares a largo plazo (WBS 7.1.2.2)
export class QueryMultiannualAppointmentsDto {
  @ApiPropertyOptional({
    description: 'Fecha minima de busqueda en formato ISO 8601',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate debe ser una fecha ISO 8601 valida' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha maxima de busqueda en formato ISO 8601',
    example: '2027-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate debe ser una fecha ISO 8601 valida' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Anio especifico de consulta multianual (ej. 2026 o 2027)',
    example: 2027,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'year debe ser un numero entero' })
  @Min(2025, { message: 'year debe ser mayor o igual a 2025' })
  @Max(2035, { message: 'year debe ser menor o igual a 2035' })
  year?: number;

  @ApiPropertyOptional({
    description: 'UUID del cliente para filtrar sus citas consulares',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsUUID('4', { message: 'customerId debe ser un UUID v4 valido' })
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Texto de busqueda por nombre o documento del cliente titular',
    example: 'Perez',
  })
  @IsOptional()
  @IsString({ message: 'customerSearch debe ser una cadena de texto' })
  customerSearch?: string;

  @ApiPropertyOptional({
    description: 'Estado de la cita consular programada',
    example: 'SCHEDULED',
  })
  @IsOptional()
  @IsString({ message: 'status debe ser una cadena de texto' })
  status?: string;

  @ApiPropertyOptional({
    description: 'Sede consular para filtro geografico',
    example: 'Embajada de Estados Unidos en Lima',
  })
  @IsOptional()
  @IsString({ message: 'location debe ser una cadena de texto' })
  location?: string;

  @ApiPropertyOptional({
    description: 'Numero de pagina para paginacion',
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
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
