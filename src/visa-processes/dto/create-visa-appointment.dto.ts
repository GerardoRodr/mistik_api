import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

// DTO para la programacion de citas consulares multianuales (WBS 7.1.2.2)
export class CreateVisaAppointmentDto {
  @ApiProperty({
    description: 'Fecha y hora programada de la cita consular (formato ISO 8601)',
    example: '2026-11-20T10:00:00.000Z',
  })
  @IsDateString({}, { message: 'appointmentDate debe tener formato de fecha ISO 8601' })
  @IsNotEmpty({ message: 'appointmentDate no debe estar vacio' })
  appointmentDate: string;

  @ApiPropertyOptional({
    description: 'Sede consular donde se realizara la cita',
    default: 'Embajada de Estados Unidos en Lima',
    example: 'Embajada de Estados Unidos en Lima',
  })
  @IsOptional()
  @IsString({ message: 'location debe ser una cadena de texto' })
  location?: string = 'Embajada de Estados Unidos en Lima';

  @ApiPropertyOptional({
    description: 'Titulo o concepto de la cita consular',
    default: 'Entrevista Consular - Embajada',
    example: 'Entrevista Consular - Embajada',
  })
  @IsOptional()
  @IsString({ message: 'title debe ser una cadena de texto' })
  title?: string = 'Entrevista Consular - Embajada';

  @ApiPropertyOptional({
    description: 'Codigo o numero de comprobante de pago de arancel consular MRV (185 USD)',
    example: 'MRV2026118899',
  })
  @IsOptional()
  @IsString({ message: 'mrvPaymentCode debe ser una cadena alfanumerica' })
  @Matches(/^[A-Za-z0-9]{8,18}$/, {
    message: 'mrvPaymentCode debe ser alfanumerico de 8 a 18 caracteres',
  })
  mrvPaymentCode?: string;

  @ApiPropertyOptional({
    description: 'Monto oficial del arancel consular MRV en USD',
    default: 185.0,
    example: 185.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'consularFeeAmount debe ser un numero' })
  @IsPositive({ message: 'consularFeeAmount debe ser positivo' })
  consularFeeAmount?: number = 185.0;

  @ApiPropertyOptional({
    description: 'Observaciones o notas adicionales de la cita consular',
    example: 'Cita programada confirmada con comprobante Scotiabank',
  })
  @IsOptional()
  @IsString({ message: 'notes debe ser una cadena de texto' })
  notes?: string;
}
