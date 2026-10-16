# Modulo de Tablero Operativo Kanban y Control de Tareas

Este documento describe la arquitectura, endpoints, reglas de transicion entre columnas y contratos JSON del modulo `TasksModule` del backend de Mistik Tours & Travel S.A.C., correspondiente al paquete de trabajo WBS `8.1.2.1` de la Semana 9.

---

## 1. Descripcion del Modulo

El modulo de control de tareas y tablero Kanban gestiona el ciclo de vida de actividades operativas asignadas a colaboradores para la atencion de reservas y tramites consulares:

- **Ruta de codigo:** `src/tasks/`
- **Controlador principal:** `TasksController` (`src/tasks/tasks.controller.ts`)
- **Servicio principal:** `TasksService` (`src/tasks/tasks.service.ts`)
- **Motor de estados:** `TaskStateService` (`src/tasks/task-state.service.ts`)
- **Entidades de datos:** Modelos `ServiceTask`, `User`, `Booking`, `AuditLog` en `prisma/schema.prisma`
- **Caracteristicas tecnicas:**
  - Maquina determinista de transiciones de estados entre columnas visuales del tablero Kanban.
  - Registro automatico de marcas de tiempo de ciclo de vida (`movedAt` y `completedAt`).
  - Adaptador bidireccional entre la vista Kanban (`BACKLOG`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`) y la enumeracion relacional en base de datos (`PENDING`, `IN_PROGRESS`, `UNDER_REVIEW`, `DONE`).
  - Registro inmutable de cada transicion en `AuditLog` a traves del interceptor global `AuditLogInterceptor`.
  - Proteccion transversal mediante `JwtAuthGuard` y `RolesGuard` (`ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`).

---

## 2. Maquina de Transiciones Kanban

El movimiento de tarjetas entre columnas sigue las siguientes reglas:

| Columna Origen | Columnas Permitidas | Accion Operativa al Transicionar |
| :--- | :--- | :--- |
| `BACKLOG` (`PENDING`) | `IN_PROGRESS`, `CANCELLED` | Colaborador asume la tarea y comienza ejecucion |
| `IN_PROGRESS` | `IN_REVIEW`, `BACKLOG`, `CANCELLED` | Tarea completada para revision o regresada |
| `IN_REVIEW` (`UNDER_REVIEW`) | `DONE`, `IN_PROGRESS`, `CANCELLED` | Supervisor aprueba entrega o solicita ajustes |
| `DONE` | `IN_PROGRESS`, `CANCELLED` | Tarea finalizada; registra `completedAt`. Si se reabre, se resetea `completedAt` |
| `CANCELLED` | `BACKLOG` | Tarea descartada; permite reincorporacion |

---

## 3. Endpoints del Modulo

### 3.1. Transicionar Estado de Tarjeta Kanban con Registro de Fechas

- **Ruta:** `/api/v1/tasks/:id/status`
- **Metodo HTTP:** `PATCH`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Mueve una tarjeta de columna, valida que la transicion sea legal y registra de forma inmutable la marca de tiempo `movedAt` y `completedAt` (cuando pasa a `DONE`).

#### Ejemplo de Peticion (Request Body)
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
    "movedAt": "2026-10-16T17:20:00.000Z",
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

### 3.2. Listar Tareas y Vista Agrupada del Tablero Kanban

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

### 3.3. Consultar Detalle de Tarea Operativa

- **Ruta:** `/api/v1/tasks/:id`
- **Metodo HTTP:** `GET`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Retorna la tarea con su colaborador asignado, reserva vinculada, citas asociadas y columnas permitidas para el siguiente movimiento.

---

### 3.4. Crear Nueva Tarea Operativa

- **Ruta:** `/api/v1/tasks`
- **Metodo HTTP:** `POST`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR`
- **Descripcion:** Crea una tarea en estado inicial `PENDING` (`BACKLOG`).
