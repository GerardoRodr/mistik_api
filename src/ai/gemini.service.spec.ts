import { Test, TestingModule } from '@nestjs/testing';
import { GeminiService } from './gemini.service';

describe('GeminiService (WBS 10.1.1.2, 10.1.2.2)', () => {
  let service: GeminiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeminiService],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  describe('parseItinerary', () => {
    it('debe estructurar correctamente un correo de vuelo en JSON estricto', async () => {
      const emailText =
        'Confirmacion de compra LATAM Airlines. Localizador: LIM999. Vuelo Lima a Madrid. Pasajero: JUAN CARLOS PEREZ GOMEZ DNI 74859632. Monto total: USD 1450.00';

      const result = await service.parseItinerary(emailText);

      expect(result).toBeDefined();
      expect(result.pnr).toBe('LIM999');
      expect(result.ticketCost).toBe(1450.0);
      expect(result.currency).toBe('USD');
      expect(result.passengers).toBeInstanceOf(Array);
      expect(result.passengers[0].fullName).toBe('JUAN CARLOS PEREZ GOMEZ');
      expect(result.passengers[0].documentNumber).toBe('74859632');
    });
  });

  describe('extractPassportData', () => {
    it('debe extraer datos de pasaporte a partir de base64', async () => {
      const fakeBase64 = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

      const result = await service.extractPassportData(fakeBase64);

      expect(result).toBeDefined();
      expect(result.passportNumber).toBeDefined();
      expect(result.expirationDate).toBeDefined();
      expect(result.nationality).toBeDefined();
    });
  });
});
