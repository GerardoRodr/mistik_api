import { BadRequestException, Injectable } from '@nestjs/common';

// Resultado del analisis preventivo de vigencia de pasaporte (WBS 10.1.2.3)
export interface PassportValidationResult {
  expirationDate: string;
  referenceDate: string;
  monthsRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  status: 'VALIDO' | 'CRITICO_VIGENCIA_MENOR_6_MESES' | 'VENCIDO';
  alertMessage: string;
}

// Servicio para validacion preventiva de vigencia consular menor a 6 meses (WBS 10.1.2.3)
@Injectable()
export class PassportValidatorService {
  // Valida si el pasaporte tiene al menos 6 meses de vigencia respecto a la fecha de viaje
  validateValidity(
    expirationDateStr: string,
    referenceDateStr?: string,
  ): PassportValidationResult {
    if (!expirationDateStr) {
      throw new BadRequestException('La fecha de vencimiento del pasaporte es requerida');
    }

    const expiration = new Date(expirationDateStr);
    if (isNaN(expiration.getTime())) {
      throw new BadRequestException('La fecha de vencimiento no es valida (formato YYYY-MM-DD)');
    }

    const reference = referenceDateStr ? new Date(referenceDateStr) : new Date();
    if (isNaN(reference.getTime())) {
      throw new BadRequestException('La fecha de referencia de viaje no es valida (formato YYYY-MM-DD)');
    }

    const diffMs = expiration.getTime() - reference.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375);

    const isExpired = diffMs <= 0;
    const isExpiringSoon = diffMonths < 6 && !isExpired;

    let status: 'VALIDO' | 'CRITICO_VIGENCIA_MENOR_6_MESES' | 'VENCIDO';
    let alertMessage: string;

    if (isExpired) {
      status = 'VENCIDO';
      alertMessage =
        'Alerta critica: El pasaporte se encuentra vencido para la fecha del viaje o tramite consular';
    } else if (isExpiringSoon) {
      status = 'CRITICO_VIGENCIA_MENOR_6_MESES';
      alertMessage =
        'Alerta preventiva: El pasaporte cuenta con vigencia menor a 6 meses para la fecha del viaje o tramite';
    } else {
      status = 'VALIDO';
      alertMessage = 'Pasaporte con vigencia conforme';
    }

    return {
      expirationDate: expiration.toISOString().split('T')[0],
      referenceDate: reference.toISOString().split('T')[0],
      monthsRemaining: parseFloat(diffMonths.toFixed(1)),
      isExpiringSoon,
      isExpired,
      status,
      alertMessage,
    };
  }
}
