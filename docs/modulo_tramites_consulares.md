# Modulo de Tramites Consulares y Visas DS-160

Este documento describe la arquitectura, endpoints, reglas de avance por fases y contratos JSON del modulo `VisaProcessesModule` del backend de Mistik Tours & Travel S.A.C., correspondiente al paquete de trabajo WBS `7.1.2.1` de la Semana 8.

---

## 1. Descripcion del Modulo

El modulo de tramites consulares gestiona el ciclo de vida completo de solicitudes de visado turistico B1/B2 (DS-160) y expedientes consulares:

- **Ruta de codigo:** `src/visa-processes/`
- **Controlador principal:** `VisaProcessesController` (`src/visa-processes/visa-processes.controller.ts`)
- **Servicio principal:** `VisaProcessesService` (`src/visa-processes/visa-processes.service.ts`)
- **Motor de fases:** `VisaStateMachineService` (`src/visa-processes/state-machine/visa-state-machine.service.ts`)
- **Entidades de datos:** Modelos `VisaProcess`, `Booking`, `Passenger`, `Appointment` en `prisma/schema.prisma`
- **Caracteristicas tecnicas:**
  - Maquina determinista de fases con validacion de invariantes consulares.
  - Registro y validacion estricta del codigo de confirmacion DS-160 (8 a 15 caracteres alfanumericos).
  - Control de cancelacion del arancel consular MRV obligatorio ($185 USD).
  - Trazabilidad de citas consulares duales: CAS (biometria) y Embajada (entrevista).
  - Registro inmutable de mutaciones en `AuditLog` bajo el marco de la Ley N. 29733.
  - Proteccion transversal mediante `JwtAuthGuard` y `RolesGuard` (`ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`).

---

## 2. Maquina de Fases Consulares

El avance del expediente sigue una secuencia obligatoria:

| Fase | Descripcion Operativa | Siguiente Fase Permitida | Requisitos de Transicion |
| :--- | :--- | :--- | :--- |
| `REGISTRO_DS160` | Creacion del expediente y llenado del formulario consular | `PAGO_ARANCEL` | Codigo de confirmacion DS-160 registrado y valido |
| `PAGO_ARANCEL` | Cancelacion de tasa MRV de visado ($185 USD) | `CITA_CONSOLIDADA` | Verificacion de `consularFeePaid = true` |
| `CITA_CONSOLIDADA` | Asignacion de fechas para citas en CAS y Embajada | `CONCLUIDO` | Al menos una fecha de cita valida registrada |
| `CONCLUIDO` | Resolucion final de visa y cierre de atencion | Estado final | Expediente concluido |

---

## 3. Endpoints del Modulo

### 3.1. Registrar Nuevo Tramite Consular

- **Ruta:** `/api/v1/visa-processes`
- **Metodo HTTP:** `POST`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Inicia un expediente consular asociado a una reserva y a un pasajero titular.

#### Ejemplo de Cuerpo de Peticion (Request Body)
```json
{
  "bookingId": "c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d",
  "passengerId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "confirmationCode": "AA00998877",
  "consularFeeAmount": 185.00,
  "currency": "USD"
}
```

#### Respuesta 201 Created
```json
{
  "id": "e2d3c4b5-a6b7-8c9d-0e1f-2a3b4c5d6e7f",
  "bookingId": "c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d",
  "passengerId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "confirmationCode": "AA00998877",
  "consularFeePaid": false,
  "consularFeeAmount": "185.00",
  "currency": "USD",
  "currentStep": "REGISTRO_DS160",
  "allowedTransitions": ["PAGO_ARANCEL"],
  "timeline": [
    { "step": "REGISTRO_DS160", "order": 1, "isCompleted": true, "isCurrent": true },
    { "step": "PAGO_ARANCEL", "order": 2, "isCompleted": false, "isCurrent": false },
    { "step": "CITA_CONSOLIDADA", "order": 3, "isCompleted": false, "isCurrent": false },
    { "step": "CONCLUIDO", "order": 4, "isCompleted": false, "isCurrent": false }
  ]
}
```

---

### 3.2. Listar Tramites Consulares

- **Ruta:** `/api/v1/visa-processes`
- **Metodo HTTP:** `GET`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Parametros de Consulta:** `page`, `limit`, `currentStep`, `bookingId`, `search`.

---

### 3.3. Consultar Detalle y Linea de Tiempo de Tramite

- **Ruta:** `/api/v1/visa-processes/:id`
- **Metodo HTTP:** `GET`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Retorna expediente completo con pasajero, cliente, citas consulares asociadas y linea de tiempo.

---

### 3.4. Avanzar Fase Consular en la Maquina de Estados

- **Ruta:** `/api/v1/visa-processes/:id/status`
- **Metodo HTTP:** `PATCH`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`

#### Ejemplo de Transicion a PAGO_ARANCEL
```json
{
  "targetStep": "PAGO_ARANCEL",
  "confirmationCode": "AA00123456"
}
```

#### Ejemplo de Transicion a CITA_CONSOLIDADA
```json
{
  "targetStep": "CITA_CONSOLIDADA",
  "consularFeePaid": true,
  "casDate": "2026-11-15T09:30:00.000Z",
  "embassyDate": "2026-11-20T10:00:00.000Z",
  "notes": "Pago registrado en Scotiabank, citas agendadas"
}
```

#### Respuesta 200 OK
```json
{
  "transition": {
    "success": true,
    "previousStep": "PAGO_ARANCEL",
    "newStep": "CITA_CONSOLIDADA",
    "allowedNextSteps": ["CONCLUIDO"],
    "message": "Fase consular actualizada exitosamente a CITA_CONSOLIDADA"
  },
  "visaProcess": {
    "id": "e2d3c4b5-a6b7-8c9d-0e1f-2a3b4c5d6e7f",
    "currentStep": "CITA_CONSOLIDADA",
    "consularFeePaid": true,
    "casDate": "2026-11-15T09:30:00.000Z",
    "embassyDate": "2026-11-20T10:00:00.000Z"
  }
}
```

#### Respuestas de Error
- **400 Bad Request:** Omision de arancel pagado, codigo DS-160 ausente o invalido.
- **404 Not Found:** Tramite consular no encontrado.
- **409 Conflict:** Transicion no permitida en la secuencia (ej. salto a `CONCLUIDO` sin pasar por etapas previas).
