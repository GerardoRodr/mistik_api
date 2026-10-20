import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// DTO para recepcion de imagen de pasaporte y fecha de referencia (WBS 10.1.2.2)
export class OcrPassportDto {
  @ApiProperty({
    description: 'Imagen del pasaporte codificada en base64 (formato data:image/... o base64 puro)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @IsNotEmpty({ message: 'La imagen en base64 es obligatoria' })
  imageBase64: string;

  @ApiProperty({
    description: 'Fecha planeada de viaje o cita consular para verificar vigencia (ISO 8601 YYYY-MM-DD)',
    required: false,
    example: '2026-11-20',
  })
  @IsOptional()
  @IsString()
  travelDate?: string;
}
