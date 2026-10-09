import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

// DTO para la creacion de una nueva consolidadora o aerolinea mayorista
export class CreateWholesalerDto {
  @ApiProperty({
    description: 'Codigo comercial o de emision unico (hasta 20 caracteres)',
    example: 'COSTAMAR',
  })
  @IsString({ message: 'code debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'code no debe estar vacio' })
  @MaxLength(20, { message: 'code no debe exceder 20 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code: string;

  @ApiProperty({
    description: 'Nombre comercial o razon social (hasta 100 caracteres)',
    example: 'Costamar Travel',
  })
  @IsString({ message: 'name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'name no debe estar vacio' })
  @MaxLength(100, { message: 'name no debe exceder 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Tipo de entidad (WHOLESALER o AIRLINE)',
    enum: ['WHOLESALER', 'AIRLINE'],
    default: 'WHOLESALER',
    example: 'WHOLESALER',
  })
  @IsOptional()
  @IsString({ message: 'type debe ser una cadena de texto' })
  @IsIn(['WHOLESALER', 'AIRLINE'], {
    message: 'type debe ser WHOLESALER o AIRLINE',
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'RUC de 11 digitos de la empresa',
    example: '20123456789',
  })
  @IsOptional()
  @IsString({ message: 'ruc debe ser una cadena de texto' })
  @Length(11, 11, { message: 'ruc debe tener exactamente 11 digitos' })
  ruc?: string;

  @ApiPropertyOptional({
    description: 'Correo electronico de contacto operacional',
    example: 'operaciones@costamar.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'contactEmail debe ser un correo electronico valido' })
  @MaxLength(100, { message: 'contactEmail no debe exceder 100 caracteres' })
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Telefono de contacto operacional',
    example: '+5116169000',
  })
  @IsOptional()
  @IsString({ message: 'contactPhone debe ser una cadena de texto' })
  @MaxLength(20, { message: 'contactPhone no debe exceder 20 caracteres' })
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Indica si la consolidadora se encuentra activa para emisiones',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  isActive?: boolean;
}
