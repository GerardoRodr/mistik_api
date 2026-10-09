# Modulo de Reservas Aereas y Maquina de Estados

Este documento detalla la arquitectura, especificaciones tecnicas, reglas de transicion de estados y endpoints del modulo `BookingsModule` del backend de Mistik Tours & Travel S.A.C., correspondiente al paquete de trabajo WBS `6.1.2.1` de la Semana 7.

---

## 1. Descripcion del Modulo

El modulo de reservas aereas administra el ciclo de vida operativo y transaccional de los expedientes de viaje y vuelos:

- **Ruta de codigo:** `src/bookings/`
- **Controlador principal:** `BookingsController` (`src/bookings/bookings.controller.ts`)
- **Servicio principal:** `BookingsService` (`src/bookings/bookings.service.ts`)
- **Motor de estados:** `FlightStateMachineService` (`src/bookings/state-machine/flight-state-machine.service.ts`)
- **Entidades de datos:** Modelos `Booking`, `Passenger` y `Wholesaler` en `prisma/schema.prisma`
- **Caracteristicas tecnicas:**
  - Control determinista del flujo de vida mediante maquina de transicion de estados fuertemente tipada.
  - Validacion estricta del localizador PNR de exactamente 6 caracteres alfanumericos para servicios aereos.
  - Asociacion opcional con consolidadoras mayoristas y aerolineas emisoras (`wholesalers`) evitando texto plano.
  - Registro automatico e inmutable en `AuditLog` para cada mutacion de estado (Ley N. 29733).
  - Consultas indexadas en PostgreSQL por cliente y estado para garantizar latencias inferiores a 5 segundos (RNF `2.2.1.2`).
  - Proteccion transversal mediante `JwtAuthGuard` y `RolesGuard` (`ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`).

---

## 2. Maquina de Transicion de Estados del Servicio Aereo

El ciclo de vida de una reserva aerea se rige por el enum `BookingStatus`:

| Estado | Significado Operativo | Estados Siguientes Permitidos |
| :--- | :--- | :--- |
| `PENDING` | Reserva creada preliminarmente o en cotizacion borrador | `CONFIRMED`, `CANCELLED` |
| `CONFIRMED` | Reserva confirmada con la aerolinea/consolidadora con PNR activo | `IN_PROCESS`, `CANCELLED` |
| `IN_PROCESS` | Boletos emitidos, proceso de check-in activo o pasajero en transito | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | Vuelo concluido exitosamente y conciliado operativamente | Estado terminal (sin transiciones) |
| `CANCELLED` | Reserva anulada por desistimiento, vencimiento o cancelacion | Estado terminal inmutable |

### 2.1. Reglas e Invariantes de Negocio por Transicion

1. **Hacia `CONFIRMED`:**
   - La reserva debe contar con al menos un pasajero registrado.
   - Todos los pasajeros asociados deben registrar documento, nombre y apellido.
   - En servicios de tipo `FLIGHT`, el codigo PNR es obligatorio y debe cumplir con la expresion regular `/^[A-Za-z0-9]{6}$/`.
2. **Hacia `IN_PROCESS`:**
   - En servicios de tipo `FLIGHT`, debe existir constancia de numero de boleto emitido (`ticketNumber`).
3. **Hacia `COMPLETED`:**
   - No deben existir tareas operativas pendientes (`TaskStatus.PENDING`) vinculadas a la reserva.
4. **Hacia `CANCELLED`:**
   - Se exige obligatoriamente un motivo de cancelacion (`cancellationReason`) de al menos 5 caracteres.
   - No se permite cancelar una reserva que ya se encuentre en estado final `COMPLETED`.

---

## 3. Endpoints del Modulo

### 3.1. Registrar Nueva Reserva

- **Ruta:** `/api/v1/bookings`
- **Metodo HTTP:** `POST`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Crea una reserva en estado inicial `PENDING` con codigo unico autogenerado y permite adjuntar pasajeros iniciales.

#### Ejemplo de Cuerpo de Peticion (Request Body)
```json
{
  "customerId": "7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
  "wholesalerId": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
  "serviceType": "FLIGHT",
  "totalAmount": 650.00,
  "currency": "USD",
  "pnr": "LIM456",
  "notes": "Vuelo Trujillo - Lima ida y vuelta",
  "passengers": [
    {
      "documentType": "DNI",
      "documentNumber": "74859612",
      "firstName": "Lucia",
      "lastName": "Mendez"
    }
  ]
}
```

#### Respuestas
- **201 Created:** Retorna la reserva creada junto con las transiciones permitidas.
- **400 Bad Request:** Datos de entrada invalidos o formato de PNR incorrecto.
- **404 Not Found:** Cliente titular no encontrado.

---

### 3.2. Listar y Filtrar Reservas

- **Ruta:** `/api/v1/bookings`
- **Metodo HTTP:** `GET`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Parametros de Consulta:**
  - `page` (opcional, entero, defecto `1`)
  - `limit` (opcional, entero, defecto `10`)
  - `status` (opcional, enum `BookingStatus`)
  - `serviceType` (opcional, enum `ServiceType`)
  - `customerId` (opcional, UUID)
  - `search` (opcional, texto en codigo de reserva o cliente)

---

### 3.3. Obtener Detalle de Expediente de Reserva

- **Ruta:** `/api/v1/bookings/:id`
- **Metodo HTTP:** `GET`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Devuelve el expediente consolidado con cliente, pasajeros, cobros, tareas operativas y transiciones posibles.

---

### 3.4. Consultar Transiciones Permitidas

- **Ruta:** `/api/v1/bookings/:id/transitions`
- **Metodo HTTP:** `GET`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Respuesta 200 OK:**
```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174000",
  "currentStatus": "PENDING",
  "allowedTransitions": ["CONFIRMED", "CANCELLED"]
}
```

---

### 3.5. Ejecutar Transicion de Estado

- **Ruta:** `/api/v1/bookings/:id/transition`
- **Metodo HTTP:** `POST`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`

#### Ejemplo de Cuerpo de Peticion hacia CONFIRMED
```json
{
  "targetStatus": "CONFIRMED",
  "pnr": "LIM456",
  "notes": "Confirmado con mayorista Euroamerican"
}
```

#### Ejemplo de Cuerpo de Peticion hacia CANCELLED
```json
{
  "targetStatus": "CANCELLED",
  "cancellationReason": "Pasajero desistio por motivos familiares"
}
```

#### Respuesta 200 OK
```json
{
  "transition": {
    "success": true,
    "previousStatus": "PENDING",
    "newStatus": "CONFIRMED",
    "allowedNextStates": ["IN_PROCESS", "CANCELLED"],
    "message": "Transicion de estado ejecutada exitosamente a CONFIRMED"
  },
  "booking": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "bookingCode": "RES-8A2F9B",
    "status": "CONFIRMED"
  }
}
```

#### Respuestas de Error
- **400 Bad Request:** Motivo de cancelacion faltante o PNR con formato no valido.
- **404 Not Found:** Reserva no encontrada.
- **409 Conflict:** Transicion no contemplada en la matriz de estados o cancelacion sobre reserva completada.
