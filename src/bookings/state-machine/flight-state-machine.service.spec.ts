import { BadRequestException, ConflictException } from '@nestjs/common';
import { BookingStatus, ServiceType, TaskStatus } from '@prisma/client';
import { FlightStateMachineService } from './flight-state-machine.service';

describe('FlightStateMachineService (Paquete 6.1.2.1)', () => {
  let service: FlightStateMachineService;

  beforeEach(() => {
    service = new FlightStateMachineService();
  });

  describe('Consultas de Matriz de Transicion', () => {
    it('debe permitir transiciones validas desde PENDING', () => {
      expect(service.canTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED)).toBe(true);
      expect(service.canTransition(BookingStatus.PENDING, BookingStatus.CANCELLED)).toBe(true);
      expect(service.canTransition(BookingStatus.PENDING, BookingStatus.COMPLETED)).toBe(false);
      expect(service.canTransition(BookingStatus.PENDING, BookingStatus.IN_PROCESS)).toBe(false);
    });

    it('debe retornar lista de estados siguientes permitidos', () => {
      expect(service.getAllowedTransitions(BookingStatus.PENDING)).toEqual([
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ]);
      expect(service.getAllowedTransitions(BookingStatus.CONFIRMED)).toEqual([
        BookingStatus.IN_PROCESS,
        BookingStatus.CANCELLED,
      ]);
      expect(service.getAllowedTransitions(BookingStatus.COMPLETED)).toEqual([]);
      expect(service.getAllowedTransitions(BookingStatus.CANCELLED)).toEqual([]);
    });
  });

  describe('Validacion de Reglas de Negocio', () => {
    it('debe rechazar transicion al mismo estado', () => {
      const booking = {
        status: BookingStatus.PENDING,
        serviceType: ServiceType.FLIGHT,
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.PENDING),
      ).toThrow(BadRequestException);
    });

    it('debe rechazar salto directo no permitido en el grafo (PENDING -> COMPLETED)', () => {
      const booking = {
        status: BookingStatus.PENDING,
        serviceType: ServiceType.FLIGHT,
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.COMPLETED),
      ).toThrow(ConflictException);
    });

    it('debe rechazar transicion a CONFIRMED si no tiene pasajeros', () => {
      const booking = {
        status: BookingStatus.PENDING,
        serviceType: ServiceType.FLIGHT,
        passengers: [],
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.CONFIRMED, {
          pnr: 'ABC123',
        }),
      ).toThrow(BadRequestException);
    });

    it('debe rechazar transicion a CONFIRMED con PNR de formato invalido', () => {
      const booking = {
        status: BookingStatus.PENDING,
        serviceType: ServiceType.FLIGHT,
        passengers: [
          {
            documentNumber: '74859612',
            firstName: 'Carlos',
            lastName: 'Mendoza',
          },
        ],
      };

      // PNR con 5 caracteres (debe ser 6)
      expect(() =>
        service.validateTransition(booking, BookingStatus.CONFIRMED, {
          pnr: 'AB123',
        }),
      ).toThrow(BadRequestException);

      // PNR con caracteres especiales
      expect(() =>
        service.validateTransition(booking, BookingStatus.CONFIRMED, {
          pnr: 'AB@123',
        }),
      ).toThrow(BadRequestException);
    });

    it('debe validar transicion exitosa a CONFIRMED con pasajeros y PNR de 6 caracteres', () => {
      const booking = {
        status: BookingStatus.PENDING,
        serviceType: ServiceType.FLIGHT,
        passengers: [
          {
            documentNumber: '74859612',
            firstName: 'Carlos',
            lastName: 'Mendoza',
            pnr: 'LAT987',
          },
        ],
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.CONFIRMED),
      ).not.toThrow();
    });

    it('debe rechazar transicion a IN_PROCESS sin boleto registrado para vuelo', () => {
      const booking = {
        status: BookingStatus.CONFIRMED,
        serviceType: ServiceType.FLIGHT,
        passengers: [
          {
            documentNumber: '74859612',
            firstName: 'Carlos',
            lastName: 'Mendoza',
            pnr: 'LAT987',
            ticketNumber: null,
          },
        ],
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.IN_PROCESS),
      ).toThrow(BadRequestException);
    });

    it('debe validar transicion exitosa a IN_PROCESS con boleto emitido', () => {
      const booking = {
        status: BookingStatus.CONFIRMED,
        serviceType: ServiceType.FLIGHT,
        passengers: [
          {
            documentNumber: '74859612',
            firstName: 'Carlos',
            lastName: 'Mendoza',
            pnr: 'LAT987',
            ticketNumber: '045-1234567890',
          },
        ],
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.IN_PROCESS),
      ).not.toThrow();
    });

    it('debe rechazar transicion a COMPLETED si existen tareas operativas pendientes', () => {
      const booking = {
        status: BookingStatus.IN_PROCESS,
        serviceType: ServiceType.FLIGHT,
        tasks: [{ status: TaskStatus.PENDING }],
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.COMPLETED),
      ).toThrow(BadRequestException);
    });

    it('debe permitir transicion a COMPLETED sin tareas pendientes', () => {
      const booking = {
        status: BookingStatus.IN_PROCESS,
        serviceType: ServiceType.FLIGHT,
        tasks: [{ status: TaskStatus.DONE }],
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.COMPLETED),
      ).not.toThrow();
    });

    it('debe exigir motivo de cancelacion de al menos 5 caracteres', () => {
      const booking = {
        status: BookingStatus.PENDING,
        serviceType: ServiceType.FLIGHT,
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.CANCELLED),
      ).toThrow(BadRequestException);

      expect(() =>
        service.validateTransition(booking, BookingStatus.CANCELLED, {
          cancellationReason: 'no',
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        service.validateTransition(booking, BookingStatus.CANCELLED, {
          cancellationReason: 'Cliente desistio por motivos laborales',
        }),
      ).not.toThrow();
    });

    it('debe rechazar cancelacion sobre estado COMPLETED', () => {
      const booking = {
        status: BookingStatus.COMPLETED,
        serviceType: ServiceType.FLIGHT,
      };

      expect(() =>
        service.validateTransition(booking, BookingStatus.CANCELLED, {
          cancellationReason: 'Intento de cancelacion extemporanea',
        }),
      ).toThrow(ConflictException);
    });
  });

  describe('Generacion de Resultado Estructurado', () => {
    it('debe construir respuesta con transiciones permitidas futuras', () => {
      const result = service.buildTransitionResult(
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
      );

      expect(result.success).toBe(true);
      expect(result.previousStatus).toBe(BookingStatus.PENDING);
      expect(result.newStatus).toBe(BookingStatus.CONFIRMED);
      expect(result.allowedNextStates).toEqual([
        BookingStatus.IN_PROCESS,
        BookingStatus.CANCELLED,
      ]);
    });
  });
});
