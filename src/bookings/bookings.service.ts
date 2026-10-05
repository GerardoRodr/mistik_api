import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FlightStateMachineService } from './state-machine/flight-state-machine.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { TransitionBookingDto } from './dto/transition-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

// Servicio principal para gestion transaccional de reservas y maquina de estados
@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: FlightStateMachineService,
  ) {}

  // Genera un codigo de reserva unico con prefijo oficial
  private generateBookingCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RES-${timestamp}${random}`;
  }

  // Registrar una nueva reserva con pasajeros asociados
  async create(dto: CreateBookingDto, userId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente titular no encontrado');
    }

    const bookingCode = this.generateBookingCode();

    const createdBooking = await this.prisma.$transaction(async (tx) => {
      return tx.booking.create({
        data: {
          bookingCode,
          customerId: dto.customerId,
          serviceType: dto.serviceType,
          totalAmount: dto.totalAmount,
          currency: dto.currency || 'USD',
          status: BookingStatus.PENDING,
          notes: dto.notes || null,
          createdById: userId || null,
          passengers: dto.passengers && dto.passengers.length > 0
            ? {
                create: dto.passengers.map((p) => ({
                  documentType: p.documentType,
                  documentNumber: p.documentNumber,
                  firstName: p.firstName,
                  lastName: p.lastName,
                  pnr: p.pnr || dto.pnr || null,
                  ticketNumber: p.ticketNumber || null,
                })),
              }
            : undefined,
        },
        include: {
          customer: true,
          passengers: true,
        },
      });
    });

    return {
      ...createdBooking,
      allowedTransitions: this.stateMachine.getAllowedTransitions(
        createdBooking.status,
      ),
    };
  }

  // Consulta paginada de reservas con filtros indexados (< 5s)
  async findAll(query: QueryBookingDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.BookingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.serviceType ? { serviceType: query.serviceType } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(search
        ? {
            OR: [
              { bookingCode: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
              {
                customer: {
                  OR: [
                    { documentNumber: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              documentType: true,
              documentNumber: true,
              firstName: true,
              lastName: true,
            },
          },
          passengers: true,
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

  // Detalle individual de reserva con expediente e historial
  async findById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        passengers: true,
        tasks: true,
        payments: true,
        visaProcesses: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return {
      ...booking,
      allowedTransitions: this.stateMachine.getAllowedTransitions(booking.status),
    };
  }

  // Consultar unicamente las transiciones validas para una reserva
  async getAllowedTransitions(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true, serviceType: true },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return {
      bookingId: booking.id,
      currentStatus: booking.status,
      allowedTransitions: this.stateMachine.getAllowedTransitions(booking.status),
    };
  }

  // Ejecutar transicion de estado a traves de la maquina de estados
  async transition(
    id: string,
    dto: TransitionBookingDto,
    user?: { id?: string; email?: string; role?: string },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        passengers: true,
        tasks: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Validar reglas mediante la maquina de estados desacoplada
    this.stateMachine.validateTransition(booking, dto.targetStatus, {
      userId: user?.id,
      userRole: user?.role,
      pnr: dto.pnr,
      ticketNumber: dto.ticketNumber,
      cancellationReason: dto.cancellationReason,
      notes: dto.notes,
    });

    const previousStatus = booking.status;
    const targetStatus = dto.targetStatus;

    // Actualizar datos de reserva y pasajeros en transaccion relacional
    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      // Si se suministro PNR, actualizar pasajeros sin PNR
      if (dto.pnr) {
        await tx.passenger.updateMany({
          where: { bookingId: id, pnr: null },
          data: { pnr: dto.pnr },
        });
      }

      // Si se suministro numero de boleto, actualizar pasajeros sin ticket
      if (dto.ticketNumber) {
        await tx.passenger.updateMany({
          where: { bookingId: id, ticketNumber: null },
          data: { ticketNumber: dto.ticketNumber },
        });
      }

      // Actualizar observaciones si se enviaron notas o motivo de cancelacion
      let updatedNotes = booking.notes || '';
      if (dto.cancellationReason) {
        updatedNotes += ` [Cancelacion: ${dto.cancellationReason.trim()}]`;
      }
      if (dto.notes) {
        updatedNotes += ` [Nota: ${dto.notes.trim()}]`;
      }

      return tx.booking.update({
        where: { id },
        data: {
          status: targetStatus,
          notes: updatedNotes.trim() || null,
        },
        include: {
          customer: true,
          passengers: true,
        },
      });
    });

    const result = this.stateMachine.buildTransitionResult(
      previousStatus,
      targetStatus,
    );

    return {
      transition: result,
      booking: updatedBooking,
    };
  }

  // Consultar pasajeros de una reserva por ID UUID o codigo PNR (WBS 6.1.2.2)
  async findPassengersByBooking(idOrPnr: string) {
    const term = idOrPnr?.trim();
    if (!term) {
      throw new NotFoundException('Identificador o codigo PNR no proporcionado');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(term);

    const booking = await this.prisma.booking.findFirst({
      where: isUuid
        ? { id: term }
        : {
            OR: [
              { bookingCode: { equals: term, mode: 'insensitive' } },
              {
                passengers: {
                  some: { pnr: { equals: term, mode: 'insensitive' } },
                },
              },
            ],
          },
      include: {
        customer: {
          select: {
            id: true,
            documentType: true,
            documentNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        passengers: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Reserva con identificador o PNR '${term}' no encontrada`,
      );
    }

    const enrichedPassengers = booking.passengers.map((p) => ({
      ...p,
      issueStatus: p.ticketNumber ? 'EMITIDO' : 'PENDIENTE_EMISION',
    }));

    return {
      booking: {
        id: booking.id,
        bookingCode: booking.bookingCode,
        serviceType: booking.serviceType,
        status: booking.status,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        createdAt: booking.createdAt,
        customer: booking.customer,
      },
      passengers: enrichedPassengers,
      totalPassengers: enrichedPassengers.length,
    };
  }
}
