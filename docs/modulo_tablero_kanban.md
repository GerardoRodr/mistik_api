# Modulo de Tablero Operativo Kanban y Control de Tareas

Este documento describe la arquitectura, endpoints, reglas de transicion entre columnas, control de asignacion exclusiva y contratos JSON del modulo `TasksModule` del backend de Mistik Tours & Travel S.A.C., correspondiente a los paquetes de trabajo WBS `8.1.2.1` y `8.1.2.2` de las Semanas 9 y 10.

---

## 1. Descripcion del Modulo

El modulo de control de tareas y tablero Kanban gestiona el ciclo de vida de actividades operativas asignadas a colaboradores para la atencion de reservas y tramites consulares:

- **Ruta de codigo:** `src/tasks/`
- **Controlador principal:** `TasksController` (`src/tasks/tasks.controller.ts`)
- **Servicio principal:** `TasksService` (`src/tasks/tasks.service.ts`)
- **Motor de estados:** `TaskStateService` (`src/tasks/task-state.service.ts`)
- **Gateway de notificaciones:** Integrado con `AlertsGateway` (`src/alerts/alerts.gateway.ts`) para emision en tiempo real (`task:status-changed`).
- **Entidades de datos:** Modelos `ServiceTask`, `User`, `Booking`, `AuditLog` en `prisma/schema.prisma`.
- **Caracteristicas tecnicas:**
  - Maquina determinista de transiciones de estados entre columnas visuales del tablero Kanban (`BACKLOG`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED`).
  - Control de asignacion exclusiva por colaborador (WBS `8.1.2.2`): cada tarea tiene un unico responsable asignado (`assignedToId`).
  - Invariante de seguridad operativa: se bloquea cualquier transicion hacia la columna `IN_PROGRESS` si la tarea no cuenta con un colaborador responsable previamente asignado.
  - Registro automatico de marcas de tiempo de ciclo de vida (`movedAt` y `completedAt`).
  - Emision reactiva de eventos WebSockets al namespace `/alerts` tras cada cambio de estado.
  - Registro inmutable de cada transicion en `AuditLog` a traves del interceptor global `AuditLogInterceptor`.
  - Proteccion transversal mediante `JwtAuthGuard` y `RolesGuard` (`ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`).

---

## 2. Maquina de Transiciones Kanban e Invariantes

El movimiento de tarjetas entre columnas sigue las siguientes reglas:

| Columna Origen | Columnas Permitidas | Accion Operativa al Transicionar | Invariante Requerida |
| :--- | :--- | :--- | :--- |
| `BACKLOG` (`PENDING`) | `IN_PROGRESS`, `CANCELLED` | Colaborador asume la tarea y comienza ejecucion | **Requiere `assignedToId` no nulo** |
| `IN_PROGRESS` | `IN_REVIEW`, `BACKLOG`, `CANCELLED` | Tarea completada para revision o regresada | Mantener trazabilidad del responsable |
| `IN_REVIEW` (`UNDER_REVIEW`) | `DONE`, `IN_PROGRESS`, `CANCELLED` | Supervisor aprueba entrega o solicita ajustes | Revision por supervisor o agente |
| `DONE` | `IN_PROGRESS`, `CANCELLED` | Tarea finalizada; registra `completedAt`. Si se reabre, se resetea `completedAt` | Registro inmutable de finalizacion |
| `CANCELLED` | `BACKLOG` | Tarea descartada; permite reincorporacion | Reseteo a estado inicial |

---

## 3. Endpoints del Modulo

### 3.1. Asignar Colaborador Responsable Unico a la Tarea (WBS 8.1.2.2)

- **Ruta:** `/api/v1/tasks/:id/assign`
- **Metodo HTTP:** `PATCH`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Vincula de forma exclusiva un colaborador activo a la tarjeta operativa, requisito obligatorio previo al paso a desarrollo (`IN_PROGRESS`).

#### Carga Util de Entrada (Request Body)
```json
{
  "assignedToId": "123e4567-e89b-12d3-a456-426614174002"
}
```

#### Respuesta 200 OK
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Validar documentacion DS-160",
  "description": "Revisar codigo de 10 caracteres",
  "status": "PENDING",
  "priority": "HIGH",
  "dueDate": "2026-11-30T18:00:00.000Z",
  "bookingId": "123e4567-e89b-12d3-a456-426614174001",
  "assignedToId": "123e4567-e89b-12d3-a456-426614174002",
  "assignedTo": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "name": "Carlos Asesor",
    "email": "carlos@mistik.com",
    "role": "AGENT"
  },
  "kanbanColumn": "BACKLOG",
  "allowedNextColumns": ["IN_PROGRESS", "CANCELLED"]
}
```

---

### 3.2. Transicionar Estado de Tarjeta Kanban con Registro de Fechas (WBS 8.1.2.1)

- **Ruta:** `/api/v1/tasks/:id/status`
- **Metodo HTTP:** `PATCH`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Mueve una tarjeta de columna, valida que la transicion sea legal, verifica que tenga responsable si transiciona a `IN_PROGRESS`, registra `movedAt` y `completedAt`, y emite el evento WebSocket `task:status-changed`.

#### Carga Util de Entrada (Request Body)
```json
{
  "targetStatus": "IN_PROGRESS",
  "notes": "Iniciando revision de formulario DS-160 y coordinacion de cita"
}
```

#### Respuesta 200 OK
```json
{
  "transition": {
    "success": true,
    "previousColumn": "BACKLOG",
    "targetColumn": "IN_PROGRESS",
    "previousStatus": "PENDING",
    "targetStatus": "IN_PROGRESS",
    "movedAt": "2026-10-23T17:20:00.000Z",
    "completedAt": null,
    "allowedNextColumns": ["IN_REVIEW", "BACKLOG", "CANCELLED"],
    "notes": "Iniciando revision de formulario DS-160 y coordinacion de cita",
    "reason": null
  },
  "task": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Validar confirmacion DS-160",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "dueDate": "2026-11-30T18:00:00.000Z",
    "kanbanColumn": "IN_PROGRESS"
  }
}
```

---

### 3.3. Listar Tareas y Vista Agrupada del Tablero Kanban

- **Ruta:** `/api/v1/tasks`
- **Metodo HTTP:** `GET`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Parametros de Consulta:**
  - `groupByStatus=true`: Devuelve las tarjetas ordenadas por columnas del tablero Kanban.
  - `priority`: Filtrar por prioridad (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `assignedToId`: Filtrar por colaborador responsable.
  - `bookingId`: Filtrar por expediente de reserva.
  - `search`: Busqueda en titulo o descripcion.
  - `page`, `limit`: Paginacion para modo lista regular.

---

### 3.4. Consultar Detalle de Tarea Operativa

- **Ruta:** `/api/v1/tasks/:id`
- **Metodo HTTP:** `GET`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Retorna la tarea con su colaborador asignado, reserva vinculada, citas asociadas y columnas permitidas para el siguiente movimiento.

---

### 3.5. Crear Nueva Tarea Operativa

- **Ruta:** `/api/v1/tasks`
- **Metodo HTTP:** `POST`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Crea una tarea en estado inicial `PENDING` (`BACKLOG`).
