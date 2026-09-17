import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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
}
