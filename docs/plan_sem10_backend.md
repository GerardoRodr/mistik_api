# Guia Tecnica de Implementacion Backend: Semana 10 (mistik_api)

**Proyecto:** Single Page Application (SPA) - MISTIK TOURS & TRAVEL S.A.C.  
**Corte Academico:** Semana 10 (Hito de Desarrollo - 100% Funcionalidad del Software)  
**Stack Tecnologico:** NestJS v11, TypeScript, Prisma ORM v6, PostgreSQL (Supabase), Socket.io, Google Gemini 2.5 Flash SDK (`@google/genai`), Jest.

---

## 1. Vision General del Alcance Backend en Semana 10

En la Semana 10 se implementan y exponen la totalidad de los servicios, controladores, tareas programadas (Cron Jobs), gateways WebSockets e integraciones con Inteligencia Artificial requeridos para completar los Componentes 8, 9, 10 y 11 de la EDT:

| Codigo WBS | Entregable / Paquete de Trabajo | Modulo Backend Responsable | Archivos Clave a Crear o Modificar |
| :---: | :--- | :--- | :--- |
| **8.1.2.2** | Control de Asignacion Exclusiva por Colaborador | `TasksModule` | `tasks.service.ts`, `tasks.controller.ts`, `dto/assign-task.dto.ts` |
| **9.1.1.1** | Cron Job de Check-ins Proximos de 24 a 48 Horas | `AlertsModule` (Nuevo) | `src/alerts/alerts.service.ts`, `alerts.cron.ts`, `alerts.module.ts` |
| **9.1.1.2** | Cron Job de Alertas Escalonadas de Citas Consulares | `AlertsModule` (Nuevo) | `src/alerts/alerts.cron.ts`, `alerts.service.ts` |
| **9.1.2.1** | Gateway WebSockets en NestJS con Socket.io | `AlertsModule` (Nuevo) | `src/alerts/alerts.gateway.ts` |
| **10.1.1.2** | Servicio de Integracion con API Gemini 2.5 Flash | `AiModule` (Nuevo) | `src/ai/gemini.service.ts`, `ai.module.ts` |
| **10.1.1.3** | Parser Backend con Validacion de Esquema JSON Estricto | `AiModule` (Nuevo) | `src/ai/ai.controller.ts`, `dto/parse-itinerary.dto.ts` |
| **10.1.2.2** | Servicio de Lectura OCR con Vision Computacional | `AiModule` (Nuevo) | `src/ai/passport-ocr.service.ts`, `dto/ocr-passport.dto.ts` |
| **10.1.2.3** | Algoritmo Preventivo de Vigencia Menor a 6 Meses | `AiModule` (Nuevo) | `src/ai/passport-validator.service.ts` |
| **11.1.1.2** | Vinculador de Enlaces Externos a Google Drive | `PaymentsModule` (Nuevo) | `src/payments/payments.service.ts`, `dto/create-payment.dto.ts` |
| **11.1.1.3** | Calculador Reactivo de Saldos Deudores por Servicio | `PaymentsModule` (Nuevo) | `src/payments/payments.service.ts`, `payments.controller.ts` |
| **11.1.2.3** | Indicadores de Cuellos de Botella del Tablero Kanban | `AnalyticsModule` (Nuevo) | `src/analytics/analytics.service.ts`, `analytics.controller.ts` |

---

## 2. Componente 8: Tablero Operativo Kanban (WBS 8.1.2.2)

### 2.1 Paquete `8.1.2.2`: Control de Asignacion Exclusiva por Colaborador
- **Objetivo:** Garantizar que cada tarjeta operativa (`ServiceTask`) cuente con un unico usuario responsable asignado (`assignedToId`), impidiendo la creacion o actualizacion de tareas con multiples responsables o responsables nulos cuando la tarjeta pasa a desarrollo.
- **Ubicacion:** `src/tasks/`
- **DTO requerido:** `src/tasks/dto/assign-task.dto.ts`
  ```typescript
  import { ApiProperty } from '@nestjs/swagger';
  import { IsNotEmpty, IsUUID } from 'class-validator';

  export class AssignTaskDto {
    @ApiProperty({ description: 'UUID del colaborador responsable de la tarea' })
    @IsUUID('4', { message: 'El identificador del colaborador debe ser un UUID valido' })
    @IsNotEmpty({ message: 'El colaborador asignado es obligatorio' })
    assignedToId: string;
  }
  ```
- **Metodo en `TasksService`:**
  ```typescript
  async assignTask(id: string, dto: AssignTaskDto, userContext?: any): Promise<ServiceTask> {
    const task = await this.prisma.serviceTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarea operativa no encontrada');

    const assignee = await this.prisma.user.findUnique({ where: { id: dto.assignedToId } });
    if (!assignee) throw new NotFoundException('Colaborador asignado no encontrado');
    if (!assignee.isActive) throw new BadRequestException('No se puede asignar una tarea a un colaborador inactivo');

    const updated = await this.prisma.serviceTask.update({
      where: { id },
      data: { assignedToId: dto.assignedToId },
      include: { assignedTo: { select: { id: true, name: true, email: true, role: true } } },
    });

    return updated;
  }
  ```
- **Endpoint en `TasksController`:**
  - `PATCH /api/v1/tasks/:id/assign` (Protegido con `JwtAuthGuard`, `RolesGuard`).

---

## 3. Componente 9: Automatizacion de Alertas del Sistema (WBS 9.1.1.1, 9.1.1.2, 9.1.2.1)

### 3.1 Estructura del Modulo `AlertsModule`
- **Ubicacion:** `src/alerts/`
- **Dependencias requeridas:** `@nestjs/schedule`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`.

### 3.2 Paquete `9.1.2.1`: Gateway WebSockets en NestJS con Socket.io
- **Archivo:** `src/alerts/alerts.gateway.ts`
  ```typescript
  import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Logger } from '@nestjs/common';

  @WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/alerts',
  })
  export class AlertsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AlertsGateway.name);

    afterInit() {
      this.logger.log('Alerts WebSockets Gateway inicializado');
    }

    handleConnection(client: Socket) {
      this.logger.log(`Cliente conectado: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
      this.logger.log(`Cliente desconectado: ${client.id}`);
    }

    emitCheckinAlert(alertData: any) {
      this.server.emit('alert:checkin-due', alertData);
    }

    emitVisaAlert(alertData: any) {
      this.server.emit('alert:visa-appointment', alertData);
    }

    emitTaskMoved(taskData: any) {
      this.server.emit('task:status-changed', taskData);
    }
  }
  ```

### 3.3 Paquete `9.1.1.1`: Cron Job de Check-ins Proximos (24 a 48 Horas)
- **Archivo:** `src/alerts/alerts.cron.ts`
- **Logica:**
  - Se ejecuta cada 30 minutos: `@Cron('0 */30 * * * *')`.
  - Busca reservas con vuelos cuya salida este entre 24 y 48 horas en el futuro (`status = 'CONFIRMED'`).
  - Emite notificacion WebSocket `alert:checkin-due` con el localizador PNR, pasajero y fecha limite de emision.

### 3.4 Paquete `9.1.1.2`: Cron Job de Alertas Escalonadas de Citas Consulares
- **Logica:**
  - Se ejecuta diariamente a las 08:00 AM: `@Cron('0 0 8 * * *')`.
  - Busca en la tabla `Appointment` citas consulares cuya fecha este a 30 dias, 15 dias o 7 dias del dia actual, filtrando aquellas donde `reminderSent = false`.
  - Emite notificacion `alert:visa-appointment` y actualiza la bandera `reminderSent: true`.

---

## 4. Componente 10: Servicios de Inteligencia Artificial (WBS 10.1.1.2, 10.1.1.3, 10.1.2.2, 10.1.2.3)

### 4.1 Paquetes `10.1.1.2` y `10.1.1.3`: Integracion con Gemini 2.5 Flash y Parser JSON Estricto
- **Ubicacion:** `src/ai/`
- **Servicio:** `src/ai/gemini.service.ts`
  - Utiliza la API de Google Gemini (v1beta) o el SDK oficial `@google/genai`.
  - Modelo: `gemini-2.5-flash`.
  - Temperature: `0.1` (para respuestas deterministicas y formateadas).
- **Contrato DTO de Entrada:** `src/ai/dto/parse-itinerary.dto.ts`
  ```typescript
  import { ApiProperty } from '@nestjs/swagger';
  import { IsNotEmpty, IsString, MinLength } from 'class-validator';

  export class ParseItineraryDto {
    @ApiProperty({ description: 'Texto plano sin formato del correo de confirmacion de reserva' })
    @IsString()
    @IsNotEmpty()
    @MinLength(20, { message: 'El texto debe contener al menos 20 caracteres' })
    rawEmailText: string;
  }
  ```
- **Esquema de Salida JSON Estricto:**
  ```json
  {
    "pnr": "AB12CD",
    "airline": "LATAM Airlines",
    "departureCity": "Trujillo",
    "arrivalCity": "Madrid",
    "departureDate": "2026-11-15T08:30:00Z",
    "returnDate": "2026-12-05T14:00:00Z",
    "passengers": [
      { "fullName": "JUAN CARLOS PEREZ GOMEZ", "documentNumber": "74859632" }
    ],
    "ticketCost": 1250.00,
    "currency": "USD"
  }
  ```
- **Endpoint:** `POST /api/v1/ai/parse-itinerary`.

### 4.2 Paquetes `10.1.2.2` y `10.1.2.3`: Lectura OCR de Pasaportes y Algoritmo Preventivo de Vigencia
- **Servicio:** `src/ai/passport-ocr.service.ts`
- **Contrato DTO:** `src/ai/dto/ocr-passport.dto.ts`
  ```typescript
  import { ApiProperty } from '@nestjs/swagger';
  import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

  export class OcrPassportDto {
    @ApiProperty({ description: 'Imagen del pasaporte codificada en base64' })
    @IsString()
    @IsNotEmpty()
    imageBase64: string;

    @ApiProperty({ description: 'Fecha planeada de viaje o cita consular (ISO 8601)', required: false })
    @IsOptional()
    @IsString()
    travelDate?: string;
  }
  ```
- **Algoritmo Preventivo de Vigencia Menor a 6 Meses (`10.1.2.3`):**
  ```typescript
  export class PassportValidatorService {
    validateValidity(expirationDateStr: string, referenceDateStr?: string) {
      const expiration = new Date(expirationDateStr);
      const reference = referenceDateStr ? new Date(referenceDateStr) : new Date();
      
      const diffMs = expiration.getTime() - reference.getTime();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375);
      
      const isExpiringSoon = diffMonths < 6;
      const isExpired = diffMs <= 0;

      return {
        expirationDate: expiration.toISOString().split('T')[0],
        monthsRemaining: parseFloat(diffMonths.toFixed(1)),
        isExpiringSoon,
        isExpired,
        status: isExpired ? 'VENCIDO' : isExpiringSoon ? 'CRITICO_VIGENCIA_MENOR_6_MESES' : 'VALIDO',
        alertMessage: isExpiringSoon
          ? 'Alerta preventiva: El pasaporte cuenta con vigencia menor a 6 meses para la fecha del viaje/tramite'
          : 'Pasaporte con vigencia conforme'
      };
    }
  }
  ```
- **Endpoint:** `POST /api/v1/ai/ocr-passport`.

---

## 5. Componente 11: Business Intelligence y Finanzas (WBS 11.1.1.2, 11.1.1.3, 11.1.2.3)

### 5.1 Paquetes `11.1.1.2` y `11.1.1.3`: Enlaces Drive y Calculador de Saldos Deudores
- **Modulo:** `PaymentsModule` (`src/payments/`)
- **Persistencia en Prisma:** Utiliza la tabla `PaymentRecord` vinculada a `Booking`.
- **Registro de Comprobante:**
  - `POST /api/v1/bookings/:id/payments`:
    - Campos: `amount`, `currency`, `paymentMethod`, `operationNumber`, `bankName`, `driveReceiptUrl`.
    - Valida que `driveReceiptUrl` sea una URL valida (`https://drive.google.com/...`).
- **Calculador de Saldos Deudores (`11.1.1.3`):**
  - `GET /api/v1/bookings/:id/balance`:
    - Retorna:
      ```json
      {
        "bookingId": "uuid",
        "bookingCode": "BK-2026-001",
        "totalAmount": 1500.00,
        "totalPaid": 800.00,
        "balanceDue": 700.00,
        "currency": "USD",
        "paymentStatus": "PARTIAL",
        "paymentsCount": 2
      }
      ```

### 5.2 Paquetes `11.1.2.1`, `11.1.2.2` y `11.1.2.3`: Endpoints de Analitica y Cuellos de Botella
- **Modulo:** `AnalyticsModule` (`src/analytics/`)
- **Controlador:** `AnalyticsController` (`src/analytics/analytics.controller.ts`)
- **Endpoints Expuestos:**
  1. `GET /api/v1/analytics/financial-summary`:
     - Ingresos totales devengados, total recaudado, saldo por cobrar, distribucion por servicio (`FLIGHT` vs `VISA`).
  2. `GET /api/v1/analytics/visa-conversion`:
     - Conteo de expedientes por fase consular: Registro inicial, Formulario DS-160, Cita CAS, Entrevista Embajada, Aprobadas y Denegadas.
  3. `GET /api/v1/analytics/kanban-bottlenecks`:
     - Conteo de tareas por columna frente a su limite WIP (`BACKLOG: -`, `IN_PROGRESS: 3`, `UNDER_REVIEW: 2`, `DONE: -`).
     - Tareas excedidas o en riesgo de estancamiento.
     - Indicador de Lead Time y Cycle Time promedio.

---

## 6. Bateria de Pruebas Automatizadas Backend (Jest)

Cada servicio y controlador debe contar con su correspondiente archivo de pruebas `.spec.ts`:
1. `src/tasks/tasks.service.spec.ts`: Pruebas de asignacion exclusiva por colaborador.
2. `src/alerts/alerts.service.spec.ts`: Pruebas de activacion de Cron Jobs de vuelos y visas.
3. `src/alerts/alerts.gateway.spec.ts`: Pruebas de emision de eventos WebSockets.
4. `src/ai/gemini.service.spec.ts`: Pruebas de parsing con mocks de respuestas de IA.
5. `src/ai/passport-validator.service.spec.ts`: Pruebas del algoritmo de vigencia menor a 6 meses con fechas limite.
6. `src/payments/payments.service.spec.ts`: Pruebas del calculador de saldos deudores y validacion Drive.
7. `src/analytics/analytics.service.spec.ts`: Pruebas de metricas de cuellos de botella y conversion.
