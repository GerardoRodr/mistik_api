import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { PassportValidatorService } from './passport-validator.service';
import { PassportOcrService } from './passport-ocr.service';
import { AuthModule } from '../auth/auth.module';

// Modulo para servicios de Inteligencia Artificial (WBS 10.1)
@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [GeminiService, PassportValidatorService, PassportOcrService],
  exports: [GeminiService, PassportValidatorService, PassportOcrService],
})
export class AiModule {}
