import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

// DTO para registro de comprobantes de pago con validacion de enlace Google Drive (WBS 11.1.1.2)
export class CreatePaymentDto {
  @ApiProperty({ description: 'Monto abonado', example: 500.0 })
  @IsNumber({}, { message: 'El monto debe ser un valor numerico' })
  @Min(0.01, { message: 'El monto debe ser mayor a cero' })
  amount: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.USD })
  @IsOptional()
  @IsEnum(Currency, { message: 'Moneda invalida (USD o PEN)' })
  currency?: Currency;

  @ApiProperty({ description: 'Metodo de pago utilizado', example: 'TRANSFERENCIA' })
  @IsString()
  @IsNotEmpty({ message: 'El metodo de pago es obligatorio' })
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Numero de operacion bancaria', example: 'OP-894125' })
  @IsOptional()
  @IsString()
  operationNumber?: string;

  @ApiPropertyOptional({ description: 'Entidad financiera', example: 'BCP' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({
    description: 'Enlace al comprobante almacenado en Google Drive',
    example: 'https://drive.google.com/file/d/1A2B3C4D5E6F/view',
  })
  @IsString()
  @IsNotEmpty({ message: 'El enlace del comprobante es obligatorio' })
  @Matches(/^https:\/\/drive\.google\.com\/.+/i, {
    message:
      'El comprobante debe ser un enlace valido de Google Drive (https://drive.google.com/...)',
  })
  driveReceiptUrl: string;
}
