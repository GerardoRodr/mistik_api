import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

// Controlador para endpoints de autenticacion
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Endpoint para inicio de sesion corporativo
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesion y emitir token JWT',
    description:
      'Valida las credenciales con bcrypt y retorna el token de acceso JWT con el perfil del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticacion exitosa y emision de token JWT',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada invalidos (falla de validacion en DTO)',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales invalidas o usuario inactivo',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Endpoint protegido para consultar el perfil del usuario autenticado
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  @ApiOperation({
    summary: 'Consultar perfil del usuario autenticado',
    description:
      'Retorna la informacion del usuario en sesion validando el token Bearer JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario recuperado exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token Bearer ausente o invalido',
  })
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
