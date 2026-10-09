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
import { VisaProcessStep } from '../state-machine/visa-state-machine.types';

export class QueryVisaProcessDto {
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
    description: 'Filtrar por fase actual del proceso',
    enum: VisaProcessStep,
  })
  @IsOptional()
  @IsEnum(VisaProcessStep, { message: 'currentStep no es una fase valida' })
  currentStep?: VisaProcessStep;

  @ApiPropertyOptional({
    description: 'Filtrar por reserva asociada',
  })
  @IsOptional()
  @IsUUID('4', { message: 'bookingId debe ser UUID v4' })
  bookingId?: string;

  @ApiPropertyOptional({
    description:
      'Termino de busqueda (codigo de confirmacion, documento de pasajero)',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
