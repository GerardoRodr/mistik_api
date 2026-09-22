import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

// DTO para busqueda paginada y filtrado de expedientes de clientes
export class QueryCustomerDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Numero de pagina',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La pagina debe ser un entero' })
  @Min(1, { message: 'La pagina minima es 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Cantidad de registros por pagina',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El limite debe ser un entero' })
  @Min(1, { message: 'El limite minimo es 1' })
  @Max(100, { message: 'El limite maximo es 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    example: '72345678',
    description:
      'Termino de busqueda para filtrar por documento, nombre o apellido',
  })
  @IsOptional()
  @IsString({ message: 'El termino de busqueda debe ser texto' })
  search?: string;
}
