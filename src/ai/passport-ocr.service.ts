import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { PassportValidatorService } from './passport-validator.service';
import { OcrPassportDto } from './dto/ocr-passport.dto';

// Servicio orquestador de lectura OCR y validacion de vigencia consular (WBS 10.1.2.2, 10.1.2.3)
@Injectable()
export class PassportOcrService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly passportValidator: PassportValidatorService,
  ) {}

  // Procesa imagen de pasaporte y ejecuta el algoritmo preventivo de vigencia
  async processPassport(dto: OcrPassportDto) {
    const extractedData = await this.geminiService.extractPassportData(dto.imageBase64);
    const validity = this.passportValidator.validateValidity(
      extractedData.expirationDate,
      dto.travelDate,
    );

    return {
      passport: extractedData,
      validity,
    };
  }
}
