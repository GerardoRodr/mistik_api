import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KanbanColumn, TaskStateService } from './task-state.service';
import { TransitionTaskStatusDto } from './dto/transition-task-status.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { AlertsGateway } from '../alerts/alerts.gateway';

// Servicio de negocio para la gestion y transicion de tareas operativas (WBS 8.1.2.1, 8.1.2.2)
@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateService: TaskStateService,
    private readonly alertsGateway: AlertsGateway,
  ) {}

  // Asignacion exclusiva de colaborador responsable (WBS 8.1.2.2)
  async assignTask(
    id: string,
    dto: AssignTaskDto,
    _user?: { id?: string; email?: string; role?: string },
  ) {
    const task = await this.prisma.serviceTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Tarea operativa no encontrada');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: dto.assignedToId },
    });

    if (!assignee) {
      throw new NotFoundException('Colaborador asignado no encontrado');
    }

    if (!assignee.isActive) {
      throw new BadRequestException(
        'No se puede asignar una tarea a un colaborador inactivo',
      );
    }

    const updated = await this.prisma.serviceTask.update({
      where: { id },
      data: { assignedToId: dto.assignedToId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
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
              },
            },
          },
        },
        appointments: true,
      },
    });

    return {
      ...updated,
      kanbanColumn: this.stateService.toKanbanColumn(updated.status),
      allowedNextColumns: this.stateService.getAllowedNextColumns(updated.status),
    };
  }

  // Transicion de columna/estado con registro de fechas y emision en tiempo real (WBS 8.1.2.1)
  async transitionStatus(
    id: string,
    dto: TransitionTaskStatusDto,
    _user?: { id?: string; email?: string; role?: string },
  ) {
    const task = await this.prisma.serviceTask.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
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
      },
    });

    if (!task) {
      throw new NotFoundException('Tarea operativa no encontrada');
    }

    const previousStatus = task.status;
    const targetStatus = this.stateService.normalizeStatus(dto.targetStatus);

    // Validar regla de asignacion exclusiva: no se permite mover a IN_PROGRESS sin responsable asignado
    if (targetStatus === TaskStatus.IN_PROGRESS && !task.assignedToId) {
      throw new BadRequestException(
        'No se puede mover una tarea a En Progreso sin un colaborador responsable asignado',
      );
    }

    // Validar invariantes de transicion
    this.stateService.validateTransition(previousStatus, targetStatus);

    // Calcular marcas de tiempo del ciclo de vida
    const timestamps = this.stateService.computeLifecycleTimestamps(
      previousStatus,
      targetStatus,
    );

    // Actualizar en base de datos
    const updated = await this.prisma.serviceTask.update({
      where: { id },
      data: {
        status: targetStatus,
        completedAt: timestamps.completedAt,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
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
        appointments: true,
      },
    });

    const previousColumn = this.stateService.toKanbanColumn(previousStatus);
    const targetColumn = this.stateService.toKanbanColumn(targetStatus);

    // Emitir notificacion en tiempo real via WebSockets
    this.alertsGateway.emitTaskMoved({
      taskId: updated.id,
      taskTitle: updated.title,
      previousColumn,
      targetColumn,
      previousStatus,
      targetStatus,
      movedAt: timestamps.movedAt,
      assignedTo: updated.assignedTo,
      bookingCode: updated.booking?.bookingCode || null,
    });

    return {
      transition: {
        success: true,
        previousColumn,
        targetColumn,
        previousStatus,
        targetStatus,
        movedAt: timestamps.movedAt,
        completedAt: timestamps.completedAt,
        allowedNextColumns: this.stateService.getAllowedNextColumns(targetStatus),
        notes: dto.notes || null,
        reason: dto.reason || null,
      },
      task: {
        ...updated,
        kanbanColumn: targetColumn,
      },
    };
  }

  // Listar tareas operativas con filtros y soporte de vista agrupada Kanban
  async findAll(query: QueryTaskDto) {
    const search = query.search?.trim();
    let statusFilter: TaskStatus | undefined;

    if (query.status) {
      statusFilter = this.stateService.normalizeStatus(query.status);
    }

    const where: Prisma.ServiceTaskWhereInput = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
      ...(query.bookingId ? { bookingId: query.bookingId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // Si se solicita agrupar para tablero Kanban
    if (query.groupByStatus) {
      const allTasks = await this.prisma.serviceTask.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          booking: {
            select: {
              id: true,
              bookingCode: true,
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      const board: Record<KanbanColumn, any[]> = {
        BACKLOG: [],
        IN_PROGRESS: [],
        IN_REVIEW: [],
        DONE: [],
        CANCELLED: [],
      };

      for (const t of allTasks) {
        const col = this.stateService.toKanbanColumn(t.status);
        board[col].push({
          ...t,
          kanbanColumn: col,
          allowedNextColumns: this.stateService.getAllowedNextColumns(t.status),
        });
      }

      return {
        columns: board,
        total: allTasks.length,
      };
    }

    // Consulta paginada regular
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const [total, tasks] = await Promise.all([
      this.prisma.serviceTask.count({ where }),
      this.prisma.serviceTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
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
                },
              },
            },
          },
        },
      }),
    ]);

    const formattedTasks = tasks.map((t) => ({
      ...t,
      kanbanColumn: this.stateService.toKanbanColumn(t.status),
      allowedNextColumns: this.stateService.getAllowedNextColumns(t.status),
    }));

    return {
      data: formattedTasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Consultar detalle completo de una tarea individual
  async findById(id: string) {
    const task = await this.prisma.serviceTask.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        booking: {
          include: {
            customer: true,
          },
        },
        appointments: {
          orderBy: { appointmentDate: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tarea operativa no encontrada');
    }

    return {
      ...task,
      kanbanColumn: this.stateService.toKanbanColumn(task.status),
      allowedNextColumns: this.stateService.getAllowedNextColumns(task.status),
    };
  }

  // Registrar nueva tarea operativa
  async create(dto: CreateTaskDto) {
    if (dto.bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
      });
      if (!booking) {
        throw new NotFoundException('Reserva vinculada no encontrada');
      }
    }

    if (dto.assignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
      });
      if (!user) {
        throw new NotFoundException('Colaborador asignado no encontrado');
      }
    }

    const created = await this.prisma.serviceTask.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        priority: dto.priority || 'MEDIUM',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        bookingId: dto.bookingId || null,
        assignedToId: dto.assignedToId || null,
        status: TaskStatus.PENDING,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingCode: true,
          },
        },
      },
    });

    return {
      ...created,
      kanbanColumn: this.stateService.toKanbanColumn(created.status),
      allowedNextColumns: this.stateService.getAllowedNextColumns(created.status),
    };
  }
}
