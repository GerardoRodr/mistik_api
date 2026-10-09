import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Entidad representativa de consolidadora o aerolinea mayorista
export class WholesalerEntity {
  @ApiProperty({
    description: 'Identificador unico UUID de la consolidadora',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Codigo comercial o IATA unico',
    example: 'COSTAMAR',
  })
  code: string;

  @ApiProperty({
    description: 'Nombre comercial o razon social',
    example: 'Costamar Travel',
  })
  name: string;

  @ApiProperty({
    description: 'Tipo de entidad emisora (WHOLESALER o AIRLINE)',
    example: 'WHOLESALER',
    default: 'WHOLESALER',
  })
  type: string;

  @ApiPropertyOptional({
    description: 'Numero de RUC (11 digitos)',
    example: '20123456789',
  })
  ruc?: string | null;

  @ApiPropertyOptional({
    description: 'Correo electronico de contacto operacional',
    example: 'operaciones@costamar.com',
  })
  contactEmail?: string | null;

  @ApiPropertyOptional({
    description: 'Telefono de soporte o reservas',
    example: '+5116169000',
  })
  contactPhone?: string | null;

  @ApiProperty({
    description: 'Estado activo o inactivo',
    example: true,
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha y hora de registro',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha y hora de ultima actualizacion',
  })
  updatedAt: Date;
}
