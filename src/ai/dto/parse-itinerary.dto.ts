import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// DTO de entrada para parsing de itinerarios de vuelos mediante IA (WBS 10.1.1.2)
export class ParseItineraryDto {
  @ApiProperty({
    description: 'Texto plano sin formato del correo de confirmacion de reserva',
    example:
      'Estimado cliente, su reserva con LATAM Airlines ha sido confirmada. Localizador: AB12CD. Vuelo Trujillo a Madrid el 2026-11-15. Pasajero: JUAN CARLOS PEREZ GOMEZ DNI 74859632. Total: USD 1250.00',
  })
  @IsString()
  @IsNotEmpty({ message: 'El texto del correo no puede estar vacio' })
  @MinLength(20, { message: 'El texto debe contener al menos 20 caracteres' })
  rawEmailText: string;
}
