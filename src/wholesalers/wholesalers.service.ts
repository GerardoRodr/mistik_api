import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWholesalerDto } from './dto/create-wholesaler.dto';
import { UpdateWholesalerDto } from './dto/update-wholesaler.dto';

// Servicio para administracion de consolidadoras mayoristas y aerolineas
@Injectable()
export class WholesalersService {
  constructor(private readonly prisma: PrismaService) {}

  // Listar consolidadoras ordenadas por nombre con filtro opcional de activas
  async findAll(onlyActive: boolean = true) {
    return this.prisma.wholesaler.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: { name: 'asc' },
    });
  }

  // Buscar una consolidadora individual por su ID unico
  async findById(id: string) {
    const wholesaler = await this.prisma.wholesaler.findUnique({
      where: { id },
    });

    if (!wholesaler) {
      throw new NotFoundException('Consolidadora no encontrada');
    }

    return wholesaler;
  }

  // Registrar una nueva consolidadora o aerolinea
  async create(dto: CreateWholesalerDto) {
    const existing = await this.prisma.wholesaler.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe una consolidadora registrada con el codigo ${dto.code}`,
      );
    }

    return this.prisma.wholesaler.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type || 'WHOLESALER',
        ruc: dto.ruc || null,
        contactEmail: dto.contactEmail || null,
        contactPhone: dto.contactPhone || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  // Actualizar una consolidadora existente
  async update(id: string, dto: UpdateWholesalerDto) {
    await this.findById(id);

    if (dto.code) {
      const existing = await this.prisma.wholesaler.findUnique({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe otra consolidadora con el codigo ${dto.code}`,
        );
      }
    }

    return this.prisma.wholesaler.update({
      where: { id },
      data: dto,
    });
  }
}
