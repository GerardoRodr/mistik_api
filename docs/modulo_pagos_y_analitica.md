# Modulo de Pagos, Comprobantes Cloud y Business Intelligence

Este documento describe la arquitectura, endpoints REST, validaciones de seguridad, calculador reactivo de saldos e indicadores de Business Intelligence (BI) de los modulos `PaymentsModule` y `AnalyticsModule` del backend de Mistik Tours & Travel S.A.C., correspondientes a los paquetes de trabajo WBS `11.1.1.2`, `11.1.1.3`, `11.1.2.1`, `11.1.2.2` y `11.1.2.3` de la Semana 10.

---

## 1. Descripcion de los Modulos

### 1.1. Modulo de Pagos y Comprobantes (`src/payments/`)
Gestiona el registro de abonos y transferencias asociados a expedientes de reserva, aplicando la politica corporativa de almacenamiento en la nube sin costo mediante enlaces a Google Drive y recalculando de forma reactiva el balance financiero:

- **Controlador:** `PaymentsController` (`src/payments/payments.controller.ts`) sobre ruta `/api/v1/bookings`
- **Servicio:** `PaymentsService` (`src/payments/payments.service.ts`)
- **Entidades:** `Booking`, `PaymentRecord`, `Customer` en `prisma/schema.prisma`

### 1.2. Modulo de Analitica y BI (`src/analytics/`)
Provee metricas consolidadas en tiempo real para la toma de decisiones gerenciales y operativas:

- **Controlador:** `AnalyticsController` (`src/analytics/analytics.controller.ts`) sobre ruta `/api/v1/analytics`
- **Servicio:** `AnalyticsService` (`src/analytics/analytics.service.ts`)

---

## 2. Endpoints de Finanzas y Pagos

### 2.1. Registrar Abono con Comprobante en Google Drive

- **Ruta:** `/api/v1/bookings/:id/payments`
- **Metodo HTTP:** `POST`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR` (`JwtAuthGuard`, `RolesGuard`)
- **Descripcion:** Registra un nuevo abono financiero validando estrictamente que el enlace del comprobante pertenezca a Google Drive (`https://drive.google.com/...`) y recalcula el saldo restante del expediente.

#### Carga Util de Entrada (Request Body)
```json
{
  "amount": 600.00,
  "currency": "USD",
  "paymentMethod": "TRANSFERENCIA",
  "operationNumber": "OP-987452",
  "bankName": "BCP",
  "driveReceiptUrl": "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view"
}
```

#### Respuesta 201 Created
```json
{
  "payment": {
    "id": "c1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d",
    "bookingId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "amount": 600.00,
    "currency": "USD",
    "paymentMethod": "TRANSFERENCIA",
    "operationNumber": "OP-987452",
    "bankName": "BCP",
    "driveReceiptUrl": "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view",
    "paymentDate": "2026-10-23T21:40:00.000Z",
    "isVerified": true
  },
  "balance": {
    "bookingId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "bookingCode": "RES-2026-001",
    "totalAmount": 1500.00,
    "totalPaid": 1100.00,
    "balanceDue": 400.00,
    "currency": "USD",
    "paymentStatus": "PARTIAL",
    "paymentsCount": 2
  }
}
```

---

### 2.2. Consultar Balance y Saldo Deudor de la Reserva

- **Ruta:** `/api/v1/bookings/:id/balance`
- **Metodo HTTP:** `GET`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR` (`JwtAuthGuard`, `RolesGuard`)
- **Descripcion:** Retorna el estado consolidado de cuentas del expediente, el total facturado, el total abonado, el saldo pendiente de cancelacion y el estado formal de liquidacion:
  - `PAID`: Cuando `balanceDue === 0` y `totalPaid > 0`.
  - `PARTIAL`: Cuando `totalPaid > 0` y `balanceDue > 0`.
  - `UNPAID`: Cuando `totalPaid === 0`.

---

## 3. Endpoints de Business Intelligence y Analitica

### 3.1. Resumen Financiero y Devengado

- **Ruta:** `/api/v1/analytics/financial-summary`
- **Metodo HTTP:** `GET`
- **Descripcion:** Consolida el monto total devengado en reservas activas no canceladas, el monto total cobrado en caja/bancos, el saldo por recaudar y el desglose de ingresos por linea de servicio (`FLIGHT`, `VISA`, `PACKAGE`, `OTHER`).

#### Respuesta 200 OK
```json
{
  "financialSummary": {
    "totalAccrued": 28450.00,
    "totalCollected": 19200.00,
    "totalPending": 9250.00,
    "collectionRate": 67.5,
    "currency": "USD",
    "activeBookingsCount": 18,
    "totalPaymentsCount": 24
  },
  "breakdownByService": [
    {
      "serviceType": "FLIGHT",
      "count": 12,
      "totalAmount": 21500.00,
      "percentage": 75.6
    },
    {
      "serviceType": "VISA",
      "count": 5,
      "totalAmount": 5450.00,
      "percentage": 19.2
    },
    {
      "serviceType": "PACKAGE",
      "count": 1,
      "totalAmount": 1500.00,
      "percentage": 5.2
    },
    {
      "serviceType": "OTHER",
      "count": 0,
      "totalAmount": 0.00,
      "percentage": 0.0
    }
  ]
}
```

---

### 3.2. Embudo de Conversion Consular DS-160

- **Ruta:** `/api/v1/analytics/visa-conversion`
- **Metodo HTTP:** `GET`
- **Descripcion:** Analiza la progresion de los expedientes consulares a traves del embudo formal de atencion de 4 fases y contabiliza citas agendadas ante CAS o Embajada.

#### Respuesta 200 OK
```json
{
  "totalExpedientes": 25,
  "totalAppointments": 32,
  "stepDistribution": {
    "REGISTRO_DS160": 5,
    "PAGO_ARANCEL": 7,
    "CITA_CONSOLIDADA": 9,
    "CONCLUIDO": 4
  },
  "funnel": [
    {
      "step": "REGISTRO_DS160",
      "name": "Registro DS-160 Inicial",
      "count": 25,
      "percentage": 100
    },
    {
      "step": "PAGO_ARANCEL",
      "name": "Arancel MRV Cancelado",
      "count": 20,
      "percentage": 80.0
    },
    {
      "step": "CITA_CONSOLIDADA",
      "name": "Citas CAS / Embajada Asignadas",
      "count": 13,
      "percentage": 52.0
    },
    {
      "step": "CONCLUIDO",
      "name": "Tramites Consulares Concluidos",
      "count": 4,
      "percentage": 16.0
    }
  ],
  "completionRate": 16.0
}
```

---

### 3.3. Diagnostico de Cuellos de Botella en Tablero Kanban

- **Ruta:** `/api/v1/analytics/kanban-bottlenecks`
- **Metodo HTTP:** `GET`
- **Descripcion:** Evalua la carga operativa frente a las politicas de limites WIP (Work In Progress) del tablero Kanban, alerta columnas saturadas, detecta tareas atrasadas respecto a su fecha limite (`dueDate`) y calcula el tiempo de ciclo promedio (`averageLeadTimeHours`).

#### Limites WIP de Referencia
- `IN_PROGRESS`: Limite maximo de 3 tareas concurrentes.
- `UNDER_REVIEW`: Limite maximo de 2 tareas concurrentes.

#### Respuesta 200 OK
```json
{
  "columnsAnalysis": [
    {
      "column": "BACKLOG",
      "taskCount": 8,
      "wipLimit": null,
      "isBottleneck": false,
      "utilizationPercentage": null,
      "status": "NORMAL"
    },
    {
      "column": "IN_PROGRESS",
      "taskCount": 4,
      "wipLimit": 3,
      "isBottleneck": true,
      "utilizationPercentage": 133.3,
      "status": "SATURADA"
    },
    {
      "column": "UNDER_REVIEW",
      "taskCount": 1,
      "wipLimit": 2,
      "isBottleneck": false,
      "utilizationPercentage": 50.0,
      "status": "NORMAL"
    },
    {
      "column": "DONE",
      "taskCount": 15,
      "wipLimit": null,
      "isBottleneck": false,
      "utilizationPercentage": null,
      "status": "NORMAL"
    }
  ],
  "bottlenecksDetected": [
    {
      "column": "IN_PROGRESS",
      "taskCount": 4,
      "wipLimit": 3,
      "isBottleneck": true
    }
  ],
  "hasBottlenecks": true,
  "metrics": {
    "totalTasks": 28,
    "completedTasks": 15,
    "overdueTasksCount": 2,
    "averageLeadTimeHours": 38.4
  },
  "overdueTasks": [
    {
      "id": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
      "title": "Verificar confirmacion MRV y cita CAS",
      "status": "IN_PROGRESS",
      "dueDate": "2026-10-21T18:00:00.000Z",
      "assignedTo": "Carlos Asesor"
    }
  ]
}
```
