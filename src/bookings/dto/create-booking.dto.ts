import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency, ServiceType } from '@prisma/client';

export class CreatePassengerDto {
  @ApiProperty({ description: 'Tipo de documento', example: 'DNI' })
  @IsString()
  @IsNotEmpty({ message: 'documentType no debe estar vacio' })
  documentType: string;

  @ApiProperty({ description: 'Numero de documento', example: '74859612' })
  @IsString()
  @IsNotEmpty({ message: 'documentNumber no debe estar vacio' })
  documentNumber: string;

  @ApiProperty({ description: 'Nombres del pasajero', example: 'Carlos' })
  @IsString()
  @IsNotEmpty({ message: 'firstName no debe estar vacio' })
  firstName: string;

  @ApiProperty({ description: 'Apellidos del pasajero', example: 'Mendoza' })
  @IsString()
  @IsNotEmpty({ message: 'lastName no debe estar vacio' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Codigo PNR individual (6 caracteres alfanumericos)',
    example: 'LAT987',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]{6}$/, {
    message: 'pnr debe ser de 6 caracteres alfanumericos',
  })
  pnr?: string;

  @ApiPropertyOptional({
    description: 'Numero de boleto emitido',
    example: '045-1234567890',
  })
  @IsOptional()
  @IsString()
  ticketNumber?: string;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID UUID del cliente titular de la reserva',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID('4', { message: 'customerId debe ser un UUID v4 valido' })
  @IsNotEmpty({ message: 'customerId no debe estar vacio' })
  customerId: string;

  @ApiProperty({
    description: 'Tipo de servicio turistico',
    enum: ServiceType,
    example: ServiceType.FLIGHT,
  })
  @IsEnum(ServiceType, { message: 'serviceType no es valido' })
  @IsNotEmpty({ message: 'serviceType no debe estar vacio' })
  serviceType: ServiceType;

  @ApiProperty({
    description: 'Monto total de la reserva',
    example: 650.0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'totalAmount debe ser un numero' })
  @IsPositive({ message: 'totalAmount debe ser mayor a cero' })
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Moneda de la transaccion',
    enum: Currency,
    default: Currency.USD,
    example: Currency.USD,
  })
  @IsOptional()
  @IsEnum(Currency, { message: 'currency debe ser USD o PEN' })
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'Codigo PNR global para el expediente',
    example: 'LIM456',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]{6}$/, {
    message: 'pnr debe ser de 6 caracteres alfanumericos',
  })
  pnr?: string;

  @ApiPropertyOptional({
    description: 'Observaciones o notas de la reserva',
    example: 'Vuelo directo Trujillo - Lima con equipaje de bodega',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Listado de pasajeros asociados',
    type: [CreatePassengerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePassengerDto)
  passengers?: CreatePassengerDto[];
}
