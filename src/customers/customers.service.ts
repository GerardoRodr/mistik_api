import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

// Servicio para la gestion transaccional de expedientes de clientes
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  // Busqueda paginada y filtrada por documento o nombre (< 5s)
  async findAll(query: QueryCustomerDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { documentNumber: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

  // Detalle del expediente 360 grados del cliente y su historial completo
  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            passengers: true,
            payments: true,
            visaProcesses: true,
            tasks: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        passengers: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return customer;
  }

  // Registro de nuevo cliente con validacion de documento unico
  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { documentNumber: dto.documentNumber },
    });

    if (existing) {
      throw new ConflictException(
        `El documento ${dto.documentNumber} ya se encuentra registrado`,
      );
    }

    return this.prisma.customer.create({
      data: {
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        address: dto.address,
      },
    });
  }

  // Actualizacion parcial de expediente de cliente
  async update(id: string, dto: UpdateCustomerDto) {
    await this.findById(id);

    if (dto.documentNumber) {
      const duplicate = await this.prisma.customer.findUnique({
        where: { documentNumber: dto.documentNumber },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `El documento ${dto.documentNumber} ya esta en uso por otro cliente`,
        );
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }
}
