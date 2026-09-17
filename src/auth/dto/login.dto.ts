import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Objeto de transferencia de datos para autenticacion de usuario
export class LoginDto {
  @ApiProperty({
    example: 'admin@mistiktours.com',
    description: 'Correo institucional del usuario',
  })
  @IsEmail({}, { message: 'El correo institucional debe ser un formato valido' })
  @IsNotEmpty({ message: 'El correo institucional es obligatorio' })
  email: string;

  @ApiProperty({
    example: 'Admin2026!',
    description: 'Contrasena de acceso al sistema (minimo 6 caracteres)',
  })
  @IsString({ message: 'La contrasena debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contrasena es obligatoria' })
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  password: string;
}
