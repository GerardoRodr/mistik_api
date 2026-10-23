import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

// Controlador REST para Business Intelligence y Analitica Operativa (WBS 11.1.2)
@ApiTags('Business Intelligence y Analitica')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Metricas financieras de ingresos devengados vs cobrados (WBS 11.1.2.1)
  @Get('financial-summary')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Consultar resumen financiero de ingresos devengados vs cobrados',
    description:
      'Retorna metricas acumuladas de ventas, cobranza, saldos por cobrar y distribucion por tipo de servicio',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen financiero obtenido exitosamente',
  })
  async getFinancialSummary() {
    return this.analyticsService.getFinancialSummary();
  }

  // Embudo de conversion de expedientes consulares (WBS 11.1.2.2)
  @Get('visa-conversion')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Consultar embudo de conversion de tramites consulares DS-160',
    description:
      'Retorna conteo y porcentajes de avance a traves de las 4 etapas del tramite consular',
  })
  @ApiResponse({
    status: 200,
    description: 'Embudo de conversion consular obtenido exitosamente',
  })
  async getVisaConversion() {
    return this.analyticsService.getVisaConversion();
  }

  // Cuellos de botella y limites WIP en tablero Kanban (WBS 11.1.2.3)
  @Get('kanban-bottlenecks')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Consultar diagnostico de cuellos de botella y limites WIP en Kanban',
    description:
      'Evalua la saturacion de las columnas con limites WIP (IN_PROGRESS: 3, UNDER_REVIEW: 2), tareas estancadas y tiempo de ciclo promedio',
  })
  @ApiResponse({
    status: 200,
    description: 'Diagnostico de flujo Kanban obtenido exitosamente',
  })
  async getKanbanBottlenecks() {
    return this.analyticsService.getKanbanBottlenecks();
  }
}
