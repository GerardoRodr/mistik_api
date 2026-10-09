import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VisaStateMachineService } from './state-machine/visa-state-machine.service';
import { VisaProcessStep } from './state-machine/visa-state-machine.types';
import { CreateVisaProcessDto } from './dto/create-visa-process.dto';
import { UpdateVisaStatusDto } from './dto/update-visa-status.dto';
import { QueryVisaProcessDto } from './dto/query-visa-process.dto';

// Servicio transaccional para la gestion de tramites consulares DS-160
@Injectable()
export class VisaProcessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: VisaStateMachineService,
  ) {}

  // Construir linea de tiempo de avance para el expediente consular
  private buildTimeline(process: {
    currentStep: string;
    confirmationCode?: string | null;
    consularFeePaid: boolean;
    casDate?: Date | null;
    embassyDate?: Date | null;
  }) {
    const current = this.stateMachine.normalizeStep(process.currentStep);
    const steps = [
      VisaProcessStep.REGISTRO_DS160,
      VisaProcessStep.PAGO_ARANCEL,
      VisaProcessStep.CITA_CONSOLIDADA,
      VisaProcessStep.CONCLUIDO,
    ];
    const currentIndex = steps.indexOf(current);

    return steps.map((step, index) => {
      let isCompleted = index < currentIndex || current === VisaProcessStep.CONCLUIDO;
      let isCurrent = step === current;

      if (step === VisaProcessStep.REGISTRO_DS160 && process.confirmationCode) {
        isCompleted = true;
      }
      if (step === VisaProcessStep.PAGO_ARANCEL && process.consularFeePaid) {
        isCompleted = true;
      }
      if (
        step === VisaProcessStep.CITA_CONSOLIDADA &&
        (process.casDate || process.embassyDate)
      ) {
        isCompleted = true;
      }

      return {
        step,
        order: index + 1,
        isCompleted,
        isCurrent,
      };
    });
  }

  // Registrar nuevo expediente de tramite consular
  async create(dto: CreateVisaProcessDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Reserva vinculada no encontrada');
    }

    if (dto.passengerId) {
      const passenger = await this.prisma.passenger.findFirst({
        where: { id: dto.passengerId, bookingId: dto.bookingId },
      });

      if (!passenger) {
        throw new NotFoundException(
          'Pasajero no encontrado dentro de la reserva especificada',
        );
      }
    }

    const created = await this.prisma.visaProcess.create({
      data: {
        bookingId: dto.bookingId,
        passengerId: dto.passengerId || null,
        confirmationCode: dto.confirmationCode || null,
        consularFeeAmount: dto.consularFeeAmount || 185.0,
        currency: dto.currency || 'USD',
        currentStep: VisaProcessStep.REGISTRO_DS160,
        casDate: dto.casDate ? new Date(dto.casDate) : null,
        embassyDate: dto.embassyDate ? new Date(dto.embassyDate) : null,
      },
      include: {
        booking: {
          include: {
            customer: true,
          },
        },
        passenger: true,
      },
    });

    return {
      ...created,
      allowedTransitions: this.stateMachine.getAllowedTransitions(
        created.currentStep,
      ),
      timeline: this.buildTimeline(created),
    };
  }

  // Listado paginado de tramites consulares con filtros
  async findAll(query: QueryVisaProcessDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.VisaProcessWhereInput = {
      ...(query.bookingId ? { bookingId: query.bookingId } : {}),
      ...(query.currentStep ? { currentStep: query.currentStep } : {}),
      ...(search
        ? {
            OR: [
              { confirmationCode: { contains: search, mode: 'insensitive' } },
              {
                passenger: {
                  OR: [
                    { documentNumber: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
              {
                booking: {
                  bookingCode: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.visaProcess.count({ where }),
      this.prisma.visaProcess.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              bookingCode: true,
              status: true,
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  documentNumber: true,
                },
              },
            },
          },
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              documentNumber: true,
              nationality: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Consulta detallada de expediente consular con citas y linea de tiempo
  async findById(id: string) {
    const process = await this.prisma.visaProcess.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
          },
        },
        passenger: true,
        appointments: {
          orderBy: { appointmentDate: 'asc' },
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Tramite consular no encontrado');
    }

    return {
      ...process,
      allowedTransitions: this.stateMachine.getAllowedTransitions(
        process.currentStep,
      ),
      timeline: this.buildTimeline(process),
    };
  }

  // Transicion de fase consular mediante la maquina de estados
  async transitionStatus(
    id: string,
    dto: UpdateVisaStatusDto,
    user?: { id?: string; email?: string; role?: string },
  ) {
    const process = await this.prisma.visaProcess.findUnique({
      where: { id },
    });

    if (!process) {
      throw new NotFoundException('Tramite consular no encontrado');
    }

    // Validar invariantes en el motor desacoplado de estados
    this.stateMachine.validateTransition(process, dto.targetStep, {
      userId: user?.id,
      userRole: user?.role,
      confirmationCode: dto.confirmationCode,
      consularFeePaid: dto.consularFeePaid,
      casDate: dto.casDate,
      embassyDate: dto.embassyDate,
      notes: dto.notes,
    });

    const previousStep = process.currentStep;
    const targetStep = dto.targetStep;

    const updated = await this.prisma.visaProcess.update({
      where: { id },
      data: {
        currentStep: targetStep,
        ...(dto.confirmationCode
          ? { confirmationCode: dto.confirmationCode }
          : {}),
        ...(dto.consularFeePaid !== undefined
          ? { consularFeePaid: dto.consularFeePaid }
          : {}),
        ...(dto.casDate ? { casDate: new Date(dto.casDate) } : {}),
        ...(dto.embassyDate ? { embassyDate: new Date(dto.embassyDate) } : {}),
      },
      include: {
        booking: true,
        passenger: true,
        appointments: true,
      },
    });

    const transitionResult = this.stateMachine.buildTransitionResult(
      previousStep,
      targetStep,
    );

    return {
      transition: transitionResult,
      visaProcess: {
        ...updated,
        timeline: this.buildTimeline(updated),
      },
    };
  }
}
