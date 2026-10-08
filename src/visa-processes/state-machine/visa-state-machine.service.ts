import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  VisaProcessStep,
  VisaTransitionContext,
  VisaTransitionResult,
} from './visa-state-machine.types';

// Motor desacoplado de maquina de estados para fases consulares DS-160
@Injectable()
export class VisaStateMachineService {
  // Matriz secuencial de transiciones consulares
  private readonly transitions: Record<VisaProcessStep, VisaProcessStep[]> = {
    [VisaProcessStep.REGISTRO_DS160]: [VisaProcessStep.PAGO_ARANCEL],
    [VisaProcessStep.PAGO_ARANCEL]: [VisaProcessStep.CITA_CONSOLIDADA],
    [VisaProcessStep.CITA_CONSOLIDADA]: [VisaProcessStep.CONCLUIDO],
    [VisaProcessStep.CONCLUIDO]: [],
  };

  // Normaliza cadenas de fase previas (como FORM_FILLING) al enum oficial
  normalizeStep(step: string): VisaProcessStep {
    if (step === 'FORM_FILLING' || step === VisaProcessStep.REGISTRO_DS160) {
      return VisaProcessStep.REGISTRO_DS160;
    }
    if (Object.values(VisaProcessStep).includes(step as VisaProcessStep)) {
      return step as VisaProcessStep;
    }
    return VisaProcessStep.REGISTRO_DS160;
  }

  // Verifica si una transicion es admisible
  canTransition(from: string, to: VisaProcessStep): boolean {
    const normalizedFrom = this.normalizeStep(from);
    const allowed = this.transitions[normalizedFrom] || [];
    return allowed.includes(to);
  }

  // Obtiene los siguientes estados destino permitidos
  getAllowedTransitions(currentStep: string): VisaProcessStep[] {
    const normalized = this.normalizeStep(currentStep);
    return this.transitions[normalized] || [];
  }

  // Valida todas las invariantes y reglas de negocio para la fase consular
  validateTransition(
    visaProcess: {
      currentStep: string;
      confirmationCode?: string | null;
      consularFeePaid?: boolean;
      casDate?: Date | string | null;
      embassyDate?: Date | string | null;
    },
    targetStep: VisaProcessStep,
    context?: VisaTransitionContext,
  ): void {
    const current = this.normalizeStep(visaProcess.currentStep);

    // Regla 1: No transicionar al mismo estado
    if (current === targetStep) {
      throw new BadRequestException(
        `El expediente consular ya se encuentra en la fase ${targetStep}`,
      );
    }

    // Regla 2: Grafo secuencial
    if (!this.canTransition(current, targetStep)) {
      throw new ConflictException(
        `Transicion no permitida desde ${current} hacia ${targetStep}`,
      );
    }

    // Regla 3: Validacion hacia PAGO_ARANCEL (requiere codigo DS-160)
    if (targetStep === VisaProcessStep.PAGO_ARANCEL) {
      const code =
        context?.confirmationCode?.trim() ||
        visaProcess.confirmationCode?.trim();

      if (!code) {
        throw new BadRequestException(
          'Se requiere un codigo de confirmacion DS-160 para pasar a pago de arancel',
        );
      }

      // Validar formato de codigo de confirmacion (8 a 15 caracteres alfanumericos)
      const codeRegex = /^[A-Za-z0-9]{8,15}$/;
      if (!codeRegex.test(code)) {
        throw new BadRequestException(
          'El codigo de confirmacion DS-160 debe ser alfanumerico de 8 a 15 caracteres',
        );
      }
    }

    // Regla 4: Validacion hacia CITA_CONSOLIDADA (requiere arancel pagado)
    if (targetStep === VisaProcessStep.CITA_CONSOLIDADA) {
      const feePaid =
        context?.consularFeePaid !== undefined
          ? context.consularFeePaid
          : visaProcess.consularFeePaid;

      if (!feePaid) {
        throw new BadRequestException(
          'Se requiere validar el pago del arancel consular ($185 USD) antes de agendar citas',
        );
      }
    }

    // Regla 5: Validacion hacia CONCLUIDO (requiere citas registradas)
    if (targetStep === VisaProcessStep.CONCLUIDO) {
      const hasCas = Boolean(context?.casDate || visaProcess.casDate);
      const hasEmbassy = Boolean(
        context?.embassyDate || visaProcess.embassyDate,
      );

      if (!hasCas && !hasEmbassy) {
        throw new BadRequestException(
          'Se requiere registrar al menos una fecha de cita consular (CAS o Embajada) para concluir el expediente',
        );
      }
    }
  }

  // Estructura el resultado formal de la transicion ejecutada
  buildTransitionResult(
    previousStep: string,
    newStep: VisaProcessStep,
  ): VisaTransitionResult {
    return {
      success: true,
      previousStep: this.normalizeStep(previousStep),
      newStep,
      allowedNextSteps: this.getAllowedTransitions(newStep),
      message: `Fase consular actualizada exitosamente a ${newStep}`,
    };
  }
}
