import { BadRequestException, ConflictException } from '@nestjs/common';
import { VisaProcessStep } from './visa-state-machine.types';
import { VisaStateMachineService } from './visa-state-machine.service';

describe('VisaStateMachineService (WBS 7.1.2.1)', () => {
  let service: VisaStateMachineService;

  beforeEach(() => {
    service = new VisaStateMachineService();
  });

  describe('Normalizacion y Matriz de Transiciones', () => {
    it('debe normalizar FORM_FILLING a REGISTRO_DS160', () => {
      expect(service.normalizeStep('FORM_FILLING')).toBe(
        VisaProcessStep.REGISTRO_DS160,
      );
      expect(service.normalizeStep(VisaProcessStep.REGISTRO_DS160)).toBe(
        VisaProcessStep.REGISTRO_DS160,
      );
    });

    it('debe permitir transiciones secuenciales validas', () => {
      expect(
        service.canTransition(
          VisaProcessStep.REGISTRO_DS160,
          VisaProcessStep.PAGO_ARANCEL,
        ),
      ).toBe(true);
      expect(
        service.canTransition(
          VisaProcessStep.PAGO_ARANCEL,
          VisaProcessStep.CITA_CONSOLIDADA,
        ),
      ).toBe(true);
      expect(
        service.canTransition(
          VisaProcessStep.CITA_CONSOLIDADA,
          VisaProcessStep.CONCLUIDO,
        ),
      ).toBe(true);
    });

    it('debe retornar lista de siguientes fases permitidas', () => {
      expect(
        service.getAllowedTransitions(VisaProcessStep.REGISTRO_DS160),
      ).toEqual([VisaProcessStep.PAGO_ARANCEL]);
      expect(service.getAllowedTransitions(VisaProcessStep.CONCLUIDO)).toEqual(
        [],
      );
    });
  });

  describe('Validacion de Reglas de Negocio', () => {
    it('debe rechazar transicion a la misma fase', () => {
      const process = { currentStep: VisaProcessStep.REGISTRO_DS160 };

      expect(() =>
        service.validateTransition(process, VisaProcessStep.REGISTRO_DS160),
      ).toThrow(BadRequestException);
    });

    it('debe rechazar salto directo en el grafo (REGISTRO_DS160 -> CONCLUIDO)', () => {
      const process = { currentStep: VisaProcessStep.REGISTRO_DS160 };

      expect(() =>
        service.validateTransition(process, VisaProcessStep.CONCLUIDO),
      ).toThrow(ConflictException);
    });

    it('debe rechazar avance a PAGO_ARANCEL sin codigo DS-160', () => {
      const process = {
        currentStep: VisaProcessStep.REGISTRO_DS160,
        confirmationCode: null,
      };

      expect(() =>
        service.validateTransition(process, VisaProcessStep.PAGO_ARANCEL),
      ).toThrow(BadRequestException);
    });

    it('debe rechazar avance a PAGO_ARANCEL con codigo DS-160 de formato invalido', () => {
      const process = {
        currentStep: VisaProcessStep.REGISTRO_DS160,
        confirmationCode: '123', // menos de 8 caracteres
      };

      expect(() =>
        service.validateTransition(process, VisaProcessStep.PAGO_ARANCEL),
      ).toThrow(BadRequestException);
    });

    it('debe validar exitosamente avance a PAGO_ARANCEL con codigo DS-160 valido', () => {
      const process = {
        currentStep: VisaProcessStep.REGISTRO_DS160,
        confirmationCode: 'AA00123456',
      };

      expect(() =>
        service.validateTransition(process, VisaProcessStep.PAGO_ARANCEL),
      ).not.toThrow();
    });

    it('debe rechazar avance a CITA_CONSOLIDADA si no se ha pagado arancel', () => {
      const process = {
        currentStep: VisaProcessStep.PAGO_ARANCEL,
        consularFeePaid: false,
      };

      expect(() =>
        service.validateTransition(process, VisaProcessStep.CITA_CONSOLIDADA),
      ).toThrow(BadRequestException);
    });

    it('debe validar exitosamente avance a CITA_CONSOLIDADA con arancel pagado', () => {
      const process = {
        currentStep: VisaProcessStep.PAGO_ARANCEL,
        consularFeePaid: true,
      };

      expect(() =>
        service.validateTransition(process, VisaProcessStep.CITA_CONSOLIDADA),
      ).not.toThrow();
    });

    it('debe rechazar avance a CONCLUIDO sin fechas de cita registradas', () => {
      const process = {
        currentStep: VisaProcessStep.CITA_CONSOLIDADA,
        casDate: null,
        embassyDate: null,
      };

      expect(() =>
        service.validateTransition(process, VisaProcessStep.CONCLUIDO),
      ).toThrow(BadRequestException);
    });

    it('debe validar exitosamente avance a CONCLUIDO con al menos una cita registrada', () => {
      const process = {
        currentStep: VisaProcessStep.CITA_CONSOLIDADA,
        casDate: new Date('2026-11-15'),
        embassyDate: new Date('2026-11-20'),
      };

      expect(() =>
        service.validateTransition(process, VisaProcessStep.CONCLUIDO),
      ).not.toThrow();
    });
  });

  describe('buildTransitionResult', () => {
    it('debe generar resultado estructurado', () => {
      const result = service.buildTransitionResult(
        'FORM_FILLING',
        VisaProcessStep.PAGO_ARANCEL,
      );

      expect(result.success).toBe(true);
      expect(result.previousStep).toBe(VisaProcessStep.REGISTRO_DS160);
      expect(result.newStep).toBe(VisaProcessStep.PAGO_ARANCEL);
      expect(result.allowedNextSteps).toEqual([
        VisaProcessStep.CITA_CONSOLIDADA,
      ]);
    });
  });
});
