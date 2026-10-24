import {
  Body,
  Controller,
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
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GeminiService } from './gemini.service';
import { PassportOcrService } from './passport-ocr.service';
import { ParseItineraryDto } from './dto/parse-itinerary.dto';
import { OcrPassportDto } from './dto/ocr-passport.dto';

// Controlador REST para integraciones de Inteligencia Artificial (WBS 10.1)
@ApiTags('Inteligencia Artificial')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/ai')
export class AiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly passportOcrService: PassportOcrService,
  ) {}

  // Parser NLP de correos de confirmacion de vuelos (WBS 10.1.1.2, 10.1.1.3)
  @Post('parse-itinerary')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Procesar texto de correo de reserva mediante Gemini 2.5 Flash',
    description:
      'Extrae de forma estructurada PNR, aerolinea, fechas, pasajeros y monto en un esquema JSON estricto',
  })
  @ApiResponse({
    status: 200,
    description: 'Itinerario estructurado correctamente en formato JSON',
  })
  @ApiResponse({
    status: 400,
    description: 'Texto de entrada vacio o invalido',
  })
  async parseItinerary(@Body() dto: ParseItineraryDto) {
    return this.geminiService.parseItinerary(dto.rawEmailText);
  }

  // Vision computacional OCR y validacion de vigencia de pasaportes (WBS 10.1.2.2, 10.1.2.3)
  @Post('ocr-passport')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.AGENT, 'ASESOR')
  @ApiOperation({
    summary: 'Lectura OCR multimodal de pasaporte y validacion de vigencia consular',
    description:
      'Extrae datos biograficos de la imagen base64 y aplica el algoritmo preventivo de vigencia menor a 6 meses',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del pasaporte y resultado de vigencia obtenidos exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Imagen no proporcionada o fechas invalidas',
  })
  async ocrPassport(@Body() dto: OcrPassportDto) {
    return this.passportOcrService.processPassport(dto);
  }
}
