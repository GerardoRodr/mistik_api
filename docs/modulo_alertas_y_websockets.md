# Modulo de Alertas Operativas, WebSockets y Tareas Programadas

Este documento describe la arquitectura, gateway WebSockets, eventos en tiempo real, tareas programadas (Cron Jobs) y contratos JSON del modulo `AlertsModule` del backend de Mistik Tours & Travel S.A.C., correspondiente a los paquetes de trabajo WBS `9.1.1.1`, `9.1.1.2` y `9.1.2.1` de la Semana 10.

---

## 1. Descripcion del Modulo

El modulo de alertas automatiza la deteccion y difusion reactiva de eventos criticos de negocio para la operacion de vuelos, tramites consulares y coordinacion del tablero Kanban:

- **Ruta de codigo:** `src/alerts/`
- **Gateway WebSockets:** `AlertsGateway` (`src/alerts/alerts.gateway.ts`)
- **Servicio de logica de alertas:** `AlertsService` (`src/alerts/alerts.service.ts`)
- **Planificador de Cron Jobs:** `AlertsCronService` (`src/alerts/alerts.cron.ts`)
- **Modulo principal:** `AlertsModule` (`src/alerts/alerts.module.ts`)
- **Dependencias tecnologicas:** `@nestjs/schedule`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`.
- **Entidades vinculadas:** Modelos `Booking`, `ServiceTask`, `Passenger`, `Appointment`, `VisaProcess` en `prisma/schema.prisma`.

---

## 2. Gateway WebSockets (`/alerts`)

El gateway opera sobre el namespace `/alerts` utilizando Socket.io y configuracion CORS permisiva para integrarse con clientes SPA en Angular u otros clientes autorizados.

- **Namespace:** `/alerts`
- **Puerto:** Mismo puerto HTTP del servidor (por defecto `3000`).
- **Formato de datos:** Objetos JSON serializados.

### Eventos Emitidos por el Servidor

| Evento Socket.io | Desencadenador / Origen | Frecuencia / Timing | Descripcion |
| :--- | :--- | :--- | :--- |
| `alert:checkin-due` | Cron Job de Check-ins (`AlertsService`) | Cada 30 minutos | Detecta vuelos confirmados con tareas en ventana de 24 a 48 horas |
| `alert:visa-appointment` | Cron Job Consular (`AlertsService`) | Diario a las 08:00 AM | Alerta citas consulares pendientes a 30, 15 y 7 dias |
| `task:status-changed` | Transicion Kanban (`TasksService`) | Reactivo (en tiempo real) | Notifica movimientos de tarjetas entre columnas del tablero |

---

## 3. Especificacion de Cargas Utiles (Payloads JSON)

### 3.1. Evento `alert:checkin-due`

Emitido cuando una reserva de vuelo confirmada entra en la ventana critica de 24 a 48 horas previas a la salida.

```json
{
  "type": "FLIGHT_CHECKIN_DUE",
  "taskId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "taskTitle": "Realizar check-in y asignacion de asientos",
  "dueDate": "2026-11-15T18:00:00.000Z",
  "bookingId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "bookingCode": "RES-2026-001",
  "pnr": "LIM789",
  "passengerName": "JUAN CARLOS PEREZ GOMEZ",
  "customerEmail": "juan.perez@gmail.com",
  "customerPhone": "987654321",
  "message": "Recordatorio de Check-in: Vuelo con PNR LIM789 para JUAN CARLOS PEREZ GOMEZ programado dentro de las proximas 24-48 horas.",
  "emittedAt": "2026-11-14T10:00:00.000Z"
}
```

### 3.2. Evento `alert:visa-appointment`

Emitido de manera escalonada cuando un postulante tiene una cita consular programada a 30, 15 o 7 dias calendario de la fecha actual.

```json
{
  "type": "VISA_APPOINTMENT_REMINDER",
  "appointmentId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Entrevista Consular - Embajada",
  "appointmentDate": "2026-12-01T14:30:00.000Z",
  "location": "Embajada de Estados Unidos en Lima",
  "daysRemaining": 15,
  "applicantName": "MARIA ELENA RODRIGUEZ SILVA",
  "confirmationCode": "AA00B1C2D3",
  "bookingCode": "BK-VISA-2026-04",
  "message": "Recordatorio Consular: Cita programada en 15 dias para MARIA ELENA RODRIGUEZ SILVA en Embajada de Estados Unidos en Lima.",
  "emittedAt": "2026-11-16T13:00:00.000Z"
}
```

### 3.3. Evento `task:status-changed`

Emitido cada vez que un colaborador o supervisor actualiza el estado o columna de una tarjeta en el tablero Kanban.

```json
{
  "taskId": "123e4567-e89b-12d3-a456-426614174000",
  "taskTitle": "Validar documentacion DS-160",
  "previousColumn": "BACKLOG",
  "targetColumn": "IN_PROGRESS",
  "previousStatus": "PENDING",
  "targetStatus": "IN_PROGRESS",
  "movedAt": "2026-10-23T20:15:00.000Z",
  "assignedTo": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "name": "Carlos Asesor",
    "email": "carlos@mistik.com",
    "role": "AGENT"
  },
  "bookingCode": "RES-2026-001"
}
```

---

## 4. Tareas Programadas (Cron Jobs)

Las tareas en segundo plano estan gestionadas por `@nestjs/schedule` y se configuran en `src/alerts/alerts.cron.ts`:

### 4.1. Cron Job de Check-ins de Vuelo
- **Anotacion:** `@Cron('0 */30 * * * *')`
- **Frecuencia:** Cada 30 minutos continuos.
- **Logica de consulta:**
  - Filtra tareas `ServiceTask` cuyo estado no sea `DONE` ni `CANCELLED`.
  - Ventana temporal: `dueDate` entre `ahora + 24 horas` y `ahora + 48 horas`.
  - Reserva vinculada de tipo `FLIGHT` con estado `CONFIRMED`.
  - Emite `alert:checkin-due` por cada registro detectado.

### 4.2. Cron Job de Citas Consulares Escalonadas
- **Anotacion:** `@Cron('0 0 8 * * *')`
- **Frecuencia:** Diariamente a las 08:00 AM (hora del servidor).
- **Logica de consulta:**
  - Filtra citas `Appointment` donde `reminderSent = false`, `status = 'SCHEDULED'` y fecha futura.
  - Calcula la diferencia exacta en dias (`diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))`).
  - Si `diffDays` coincide con los hitos canónicos (30, 15 o 7 dias), emite `alert:visa-appointment`.
  - Actualiza atomica y permanentemente la bandera `reminderSent: true` en la base de datos para evitar envios duplicados.
