import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class TransitionBookingDto {
  @ApiProperty({
    description: 'Estado destino para la transicion',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus, { message: 'targetStatus debe ser un estado valido' })
  @IsNotEmpty({ message: 'targetStatus no debe estar vacio' })
  targetStatus: BookingStatus;

  @ApiPropertyOptional({
    description: 'Codigo PNR de 6 caracteres (requerido para confirmar vuelos)',
    example: 'LIM456',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]{6}$/, {
    message: 'pnr debe contener exactamente 6 caracteres alfanumericos',
  })
  pnr?: string;

  @ApiPropertyOptional({
    description: 'Numero de boleto emitido (requerido para procesar vuelos)',
    example: '045-9876543210',
  })
  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @ApiPropertyOptional({
    description: 'Motivo obligatorio en caso de cancelacion',
    example: 'Cliente solicito anulacion por motivos de salud',
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @ApiPropertyOptional({
    description: 'Notas o comentarios adicionales de la transicion',
    example: 'Confirmacion recibida de consolidadora mayorista',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
