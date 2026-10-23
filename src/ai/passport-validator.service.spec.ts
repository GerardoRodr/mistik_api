import { BadRequestException } from '@nestjs/common';
import { PassportValidatorService } from './passport-validator.service';

describe('PassportValidatorService (WBS 10.1.2.3)', () => {
  let service: PassportValidatorService;

  beforeEach(() => {
    service = new PassportValidatorService();
  });

  it('debe catalogar como VALIDO si la vigencia es mayor a 6 meses', () => {
    const referenceDate = '2026-06-01';
    const expirationDate = '2027-06-01'; // 12 meses

    const result = service.validateValidity(expirationDate, referenceDate);

    expect(result.status).toBe('VALIDO');
    expect(result.isExpiringSoon).toBe(false);
    expect(result.isExpired).toBe(false);
    expect(result.monthsRemaining).toBeGreaterThan(6);
  });

  it('debe catalogar como CRITICO_VIGENCIA_MENOR_6_MESES si la vigencia es menor a 6 meses', () => {
    const referenceDate = '2026-06-01';
    const expirationDate = '2026-09-01'; // ~3 meses

    const result = service.validateValidity(expirationDate, referenceDate);

    expect(result.status).toBe('CRITICO_VIGENCIA_MENOR_6_MESES');
    expect(result.isExpiringSoon).toBe(true);
    expect(result.isExpired).toBe(false);
    expect(result.monthsRemaining).toBeLessThan(6);
    expect(result.alertMessage).toContain('vigencia menor a 6 meses');
  });

  it('debe catalogar como VENCIDO si la fecha de expiracion es anterior o igual a la referencia', () => {
    const referenceDate = '2026-06-01';
    const expirationDate = '2026-05-01'; // Vencido

    const result = service.validateValidity(expirationDate, referenceDate);

    expect(result.status).toBe('VENCIDO');
    expect(result.isExpired).toBe(true);
    expect(result.isExpiringSoon).toBe(false);
    expect(result.alertMessage).toContain('vencido');
  });

  it('debe lanzar BadRequestException si la fecha de vencimiento es invalida', () => {
    expect(() => service.validateValidity('fecha-invalida')).toThrow(
      BadRequestException,
    );
  });
});
