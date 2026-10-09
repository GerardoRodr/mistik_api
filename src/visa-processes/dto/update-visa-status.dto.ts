import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { VisaProcessStep } from '../state-machine/visa-state-machine.types';

export class UpdateVisaStatusDto {
  @ApiProperty({
    description: 'Fase consular destino',
    enum: VisaProcessStep,
    example: VisaProcessStep.PAGO_ARANCEL,
  })
  @IsEnum(VisaProcessStep, {
    message:
      'targetStep debe ser REGISTRO_DS160, PAGO_ARANCEL, CITA_CONSOLIDADA o CONCLUIDO',
  })
  @IsNotEmpty({ message: 'targetStep no debe estar vacio' })
  targetStep: VisaProcessStep;

  @ApiPropertyOptional({
    description:
      'Codigo de confirmacion DS-160 requerido para pasar a pago de arancel',
    example: 'AA00998877',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]{8,15}$/, {
    message: 'confirmationCode debe ser alfanumerico de 8 a 15 caracteres',
  })
  confirmationCode?: string;

  @ApiPropertyOptional({
    description:
      'Confirmacion de pago de arancel consular ($185 USD) requerido para citas',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'consularFeePaid debe ser un booleano' })
  consularFeePaid?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha asignada para cita CAS',
    example: '2026-11-15T09:30:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'casDate debe ser una fecha ISO 8601' })
  casDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha asignada para entrevista en la Embajada',
    example: '2026-11-20T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'embassyDate debe ser una fecha ISO 8601' })
  embassyDate?: string;

  @ApiPropertyOptional({
    description: 'Notas o comentarios sobre la transicion de fase',
    example: 'Arancel abonado en agencia Scotiabank, cita CAS programada',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
