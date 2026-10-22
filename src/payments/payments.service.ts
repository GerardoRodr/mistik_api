import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Currency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

// Servicio de gestion financiera y calculador reactivo de saldos deudores (WBS 11.1.1.2, 11.1.1.3)
@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Registra un nuevo abono con comprobante externo en Google Drive (WBS 11.1.1.2)
  async createPayment(bookingId: string, dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (!dto.driveReceiptUrl.startsWith('https://drive.google.com/')) {
      throw new BadRequestException(
        'El enlace del comprobante debe pertenecer al dominio https://drive.google.com/',
      );
    }

    const payment = await this.prisma.paymentRecord.create({
      data: {
        bookingId,
        amount: dto.amount,
        currency: dto.currency || booking.currency || Currency.USD,
        paymentMethod: dto.paymentMethod,
        operationNumber: dto.operationNumber || null,
        bankName: dto.bankName || null,
        driveReceiptUrl: dto.driveReceiptUrl,
        paymentDate: new Date(),
        isVerified: true,
      },
    });

    const balance = await this.getBookingBalance(bookingId);

    return {
      payment,
      balance,
    };
  }

  // Calculador reactivo de saldo deudor y estado de liquidacion (WBS 11.1.1.3)
  async getBookingBalance(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentNumber: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    const totalAmount = Number(booking.totalAmount);
    const totalPaid = booking.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const rawBalanceDue = totalAmount - totalPaid;
    const balanceDue = Math.max(0, parseFloat(rawBalanceDue.toFixed(2)));

    let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
    if (balanceDue === 0 && totalPaid > 0) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0 && balanceDue > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'UNPAID';
    }

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      customer: booking.customer,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      balanceDue,
      currency: booking.currency,
      paymentStatus,
      paymentsCount: booking.payments.length,
      payments: booking.payments,
    };
  }
}
