import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// DTO para creacion de clientes en el modulo CRM
export class CreateCustomerDto {
  @ApiProperty({
    example: 'DNI',
    description: 'Tipo de documento de identidad (DNI, PASSPORT, CE, RUC)',
  })
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  documentType: string;

  @ApiProperty({
    example: '72345678',
    description: 'Numero unico de documento de identidad',
  })
  @IsString({ message: 'El numero de documento debe ser texto' })
  @IsNotEmpty({ message: 'El numero de documento es obligatorio' })
  @MaxLength(20, {
    message: 'El numero de documento no debe exceder 20 caracteres',
  })
  documentNumber: string;

  @ApiProperty({ example: 'Juan Carlos', description: 'Nombres del cliente' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName: string;

  @ApiProperty({ example: 'Perez Gomez', description: 'Apellidos del cliente' })
  @IsString({ message: 'Los apellidos deben ser texto' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  lastName: string;

  @ApiPropertyOptional({
    example: 'juan.perez@gmail.com',
    description: 'Correo electronico personal',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo debe tener un formato valido' })
  email?: string;

  @ApiPropertyOptional({
    example: '+51987654321',
    description: 'Numero telefonico de contacto',
  })
  @IsOptional()
  @IsString({ message: 'El telefono debe ser texto' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'Av. Larco 456, Trujillo',
    description: 'Direccion residencial del cliente',
  })
  @IsOptional()
  @IsString({ message: 'La direccion debe ser texto' })
  address?: string;
}
