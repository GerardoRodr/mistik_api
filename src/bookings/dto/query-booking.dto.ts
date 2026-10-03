import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BookingStatus, ServiceType } from '@prisma/client';

export class QueryBookingDto {
  @ApiPropertyOptional({ description: 'Numero de pagina', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por pagina',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de la reserva',
    enum: BookingStatus,
  })
  @IsOptional()
  @IsEnum(BookingStatus, { message: 'status no es valido' })
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de servicio',
    enum: ServiceType,
  })
  @IsOptional()
  @IsEnum(ServiceType, { message: 'serviceType no es valido' })
  serviceType?: ServiceType;

  @ApiPropertyOptional({
    description: 'Filtrar por cliente titular',
  })
  @IsOptional()
  @IsUUID('4', { message: 'customerId debe ser UUID v4' })
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Termino de busqueda (codigo de reserva, notas)',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
