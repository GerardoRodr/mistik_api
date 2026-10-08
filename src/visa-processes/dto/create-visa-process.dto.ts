import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { Currency } from '@prisma/client';

export class CreateVisaProcessDto {
  @ApiProperty({
    description: 'UUID de la reserva transaccional asociada',
    example: 'c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d',
  })
  @IsUUID('4', { message: 'bookingId debe ser un UUID v4 valido' })
  @IsNotEmpty({ message: 'bookingId no debe estar vacio' })
  bookingId: string;

  @ApiPropertyOptional({
    description: 'UUID del pasajero individual asignado al tramite',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsUUID('4', { message: 'passengerId debe ser un UUID v4 valido' })
  passengerId?: string;

  @ApiPropertyOptional({
    description: 'Codigo de confirmacion DS-160 (8-15 caracteres alfanumericos)',
    example: 'AA00998877',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]{8,15}$/, {
    message: 'confirmationCode debe ser alfanumerico de 8 a 15 caracteres',
  })
  confirmationCode?: string;

  @ApiPropertyOptional({
    description: 'Monto oficial del arancel consular',
    default: 185.0,
    example: 185.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'consularFeeAmount debe ser un numero' })
  @IsPositive({ message: 'consularFeeAmount debe ser positivo' })
  consularFeeAmount?: number;

  @ApiPropertyOptional({
    description: 'Moneda transaccional',
    enum: Currency,
    default: Currency.USD,
    example: Currency.USD,
  })
  @IsOptional()
  @IsEnum(Currency, { message: 'currency debe ser USD o PEN' })
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'Fecha programada para la cita en el CAS (biometria)',
    example: '2026-11-15T09:30:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'casDate debe ser formato fecha ISO 8601' })
  casDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha programada para la entrevista consular en la Embajada',
    example: '2026-11-20T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'embassyDate debe ser formato fecha ISO 8601' })
  embassyDate?: string;
}
