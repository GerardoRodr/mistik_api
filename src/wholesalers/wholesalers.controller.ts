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
import { WholesalersService } from './wholesalers.service';
import { QueryWholesalerDto } from './dto/query-wholesaler.dto';
import { CreateWholesalerDto } from './dto/create-wholesaler.dto';
import { UpdateWholesalerDto } from './dto/update-wholesaler.dto';
import { WholesalerEntity } from './entities/wholesaler.entity';

// Controlador REST para gestion de consolidadoras mayoristas y aerolineas emisoras
@ApiTags('Wholesalers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/wholesalers')
export class WholesalersController {
  constructor(private readonly wholesalersService: WholesalersService) {}

  // Listar catalogo de consolidadoras y aerolineas
  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT)
  @ApiOperation({
    summary: 'Listar consolidadoras mayoristas y aerolineas emisoras',
    description:
      'Retorna las consolidadoras ordenadas alfabeticamente por nombre. Soporta filtrado por estado activo (?active=true o ?active=false).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Catalogo de consolidadoras obtenido exitosamente',
    type: [WholesalerEntity],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado - Token ausente o invalido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado - Rol no autorizado',
  })
  async findAll(@Query() query: QueryWholesalerDto) {
    const onlyActive = query.active !== undefined ? query.active : true;
    return this.wholesalersService.findAll(onlyActive);
  }

  // Obtener detalle individual de una consolidadora por ID
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT)
  @ApiOperation({
    summary: 'Obtener detalle de una consolidadora por ID',
    description: 'Retorna los datos completos de una consolidadora o aerolinea registrada',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador unico UUID de la consolidadora',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Consolidadora encontrada exitosamente',
    type: WholesalerEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Consolidadora no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado - Token ausente o invalido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado - Rol no autorizado',
  })
  async findById(@Param('id') id: string) {
    return this.wholesalersService.findById(id);
  }

  // Registrar una nueva consolidadora (administrativo)
  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una nueva consolidadora o aerolinea',
    description: 'Permite registrar un nuevo aliado comercial emisor en el sistema',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Consolidadora registrada exitosamente',
    type: WholesalerEntity,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe una consolidadora con el codigo comercial ingresado',
  })
  async create(@Body() dto: CreateWholesalerDto) {
    return this.wholesalersService.create(dto);
  }

  // Actualizar una consolidadora existente (administrativo)
  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar una consolidadora o aerolinea por ID',
    description: 'Permite modificar los datos comerciales o estado de una consolidadora',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador unico UUID de la consolidadora',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Consolidadora actualizada exitosamente',
    type: WholesalerEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Consolidadora no encontrada',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateWholesalerDto) {
    return this.wholesalersService.update(id, dto);
  }
}
