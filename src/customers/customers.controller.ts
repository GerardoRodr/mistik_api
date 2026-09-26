import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

// Controlador REST del modulo CRM de clientes
@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // Busqueda paginada y filtrada de expedientes
  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Listar clientes con paginacion y filtros de busqueda',
    description:
      'Retorna clientes paginados con soporte de busqueda por documento, nombre o apellido (< 5s de respuesta)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de clientes obtenido exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token ausente o invalido',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Rol insuficiente',
  })
  async findAll(@Query() query: QueryCustomerDto) {
    return this.customersService.findAll(query);
  }

  // Detalle del expediente 360 grados del cliente
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Consultar expediente 360 grados del cliente',
    description:
      'Retorna la informacion integral del cliente incluyendo historial de reservas, pasajeros y tramites',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador unico UUID del cliente',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Expediente 360 del cliente obtenido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  async findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  // Registro de nuevo cliente con validacion DTO
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Registrar nuevo cliente en el CRM',
    description:
      'Crea un nuevo cliente verificando la unicidad del documento de identidad',
  })
  @ApiResponse({
    status: 201,
    description: 'Cliente registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada invalidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - El documento ya se encuentra registrado',
  })
  async create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  // Actualizacion parcial de datos del expediente
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Actualizar expediente de cliente',
    description:
      'Actualiza campos especificos del cliente verificando que el documento no pertenezca a otro registro',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador unico UUID del cliente',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - El documento ingresado pertenece a otro cliente',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }
}
