# Indice de Documentacion Tecnica del Backend

Bienvenido a la documentacion tecnica de la API backend de Mistik Tours & Travel S.A.C. Este directorio contiene las especificaciones modulares para desarrolladores backend, desarrolladores frontend o integradores externos que requieran interactuar con el sistema, comprender su arquitectura o consumir sus endpoints y eventos WebSockets.

---

## 1. Arquitectura General del Backend

El backend esta construido sobre una arquitectura modular basada en el framework NestJS:

- **Lenguaje:** TypeScript v5.7 / v6.0
- **Framework:** NestJS v11 / v12 (CommonJS / Node.js LTS)
- **Capa de Persistencia:** Prisma ORM v6 con PostgreSQL (Supabase)
- **Seguridad:** Autenticacion JWT con Passport, hashing de contrasenas con Bcrypt (costo 10) y control de acceso basado en roles (RBAC)
- **Validacion:** Pipes globales con `class-validator` y `class-transformer` (`whitelist: true`, `forbidNonWhitelisted: true`)
- **Trazabilidad:** Interceptor inmutable de auditoria en base de datos bajo la Ley N. 29733
- **Comunicacion en Tiempo Real:** WebSockets mediante Socket.io (`@nestjs/websockets`, `@nestjs/platform-socket.io`) sobre namespace `/alerts`
- **Tareas Programadas:** Cron Jobs en segundo plano con `@nestjs/schedule`
- **Inteligencia Artificial:** SDK oficial `@google/genai` con modelo `gemini-2.5-flash` para NLP y vision multimodal OCR
- **Documentacion Interactiva:** Swagger / OpenAPI disponible en `/api/docs`

---

## 2. Convenciones Globales de la API

### 2.1. Entorno y Direccion Base
- Servidor de Desarrollo Local: `http://localhost:3000`
- Prefijo de endpoints de dominio: `/api/v1/`
- Prefijo de endpoints de autenticacion: `/auth/`
- Namespace WebSockets: `http://localhost:3000/alerts`
- Interfaz interactiva Swagger: `http://localhost:3000/api/docs`

### 2.2. Cabeceras Obligatorias (Headers)
Para interactuar con la API REST se utilizan las siguientes cabeceras estandar:
- `Content-Type: application/json` (requerido en peticiones con cuerpo: POST, PUT, PATCH).
- `Authorization: Bearer <token_jwt>` (requerido en endpoints protegidos).

### 2.3. Formato Unificado de Respuesta de Error
Todas las excepciones HTTP del sistema son capturadas por el filtro global `HttpExceptionFilter` y transformadas a una estructura uniforme:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "documentNumber no debe estar vacio",
    "email debe ser un correo electronico valido"
  ],
  "timestamp": "2026-10-23T05:00:00.000Z",
  "path": "/api/v1/customers"
}
```

---

## 3. Matriz General de Endpoints por Modulo

| Metodo | Ruta | Modulo Responsable | Descripcion de la Operacion | Acceso / Roles | Documento Detallado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | `AuthModule` | Inicia sesion y devuelve el token JWT con datos de usuario | Publico | [modulo_autenticacion.md](modulo_autenticacion.md) |
| `GET` | `/auth/profile` | `AuthModule` | Retorna la informacion del usuario autenticado actual | Bearer JWT (Cualquier rol) | [modulo_autenticacion.md](modulo_autenticacion.md) |
| `GET` | `/api/v1/customers` | `CustomersModule` | Consulta paginada y busqueda rapida de clientes (< 5s) | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_crm_clientes.md](modulo_crm_clientes.md) |
| `GET` | `/api/v1/customers/:id` | `CustomersModule` | Obtiene el expediente 360 grados de un cliente y su historial | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_crm_clientes.md](modulo_crm_clientes.md) |
| `POST` | `/api/v1/customers` | `CustomersModule` | Registra un nuevo cliente validando documento unico | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_crm_clientes.md](modulo_crm_clientes.md) |
| `PATCH` | `/api/v1/customers/:id` | `CustomersModule` | Actualiza de forma parcial los datos de un cliente | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_crm_clientes.md](modulo_crm_clientes.md) |
| `GET` | `/api/v1/bookings` | `BookingsModule` | Consulta y filtro de reservas y vuelos con indices | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_reservas_aereas.md](modulo_reservas_aereas.md) |
| `GET` | `/api/v1/bookings/:id` | `BookingsModule` | Detalle consolidado de expediente de reserva | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_reservas_aereas.md](modulo_reservas_aereas.md) |
| `POST` | `/api/v1/bookings` | `BookingsModule` | Registra nueva reserva con pasajeros asociados | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_reservas_aereas.md](modulo_reservas_aereas.md) |
| `GET` | `/api/v1/bookings/:id/transitions` | `BookingsModule` | Consulta transiciones validas en maquina de estados | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_reservas_aereas.md](modulo_reservas_aereas.md) |
| `POST` | `/api/v1/bookings/:id/transition` | `BookingsModule` | Ejecuta cambio de estado validado en maquina de estados | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_reservas_aereas.md](modulo_reservas_aereas.md) |
| `GET` | `/api/v1/bookings/:idOrPnr/passengers` | `BookingsModule` | Consulta pasajeros por ID de reserva o PNR con estado de emision | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_reservas_aereas.md](modulo_reservas_aereas.md) |
| `POST` | `/api/v1/bookings/:id/payments` | `PaymentsModule` | Registra comprobante de pago con URL valida a Google Drive | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_pagos_y_analitica.md](modulo_pagos_y_analitica.md) |
| `GET` | `/api/v1/bookings/:id/balance` | `PaymentsModule` | Retorna calculo reactivo de saldos (PAID, PARTIAL, UNPAID) | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_pagos_y_analitica.md](modulo_pagos_y_analitica.md) |
| `POST` | `/api/v1/visa-processes` | `VisaProcessesModule` | Registra nuevo expediente consular DS-160 | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tramites_consulares.md](modulo_tramites_consulares.md) |
| `GET` | `/api/v1/visa-processes` | `VisaProcessesModule` | Listado paginado de tramites consulares con filtros | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tramites_consulares.md](modulo_tramites_consulares.md) |
| `GET` | `/api/v1/visa-processes/:id` | `VisaProcessesModule` | Consulta expediente consular con citas y linea de tiempo | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tramites_consulares.md](modulo_tramites_consulares.md) |
| `PATCH` | `/api/v1/visa-processes/:id/status` | `VisaProcessesModule` | Avanza fase consular en la maquina de estados | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tramites_consulares.md](modulo_tramites_consulares.md) |
| `POST` | `/api/v1/visa-processes/:id/appointments` | `VisaProcessesModule` | Registra cita consular y arancel MRV ($185 USD) | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tramites_consulares.md](modulo_tramites_consulares.md) |
| `GET` | `/api/v1/visa-processes/appointments/multiannual` | `VisaProcessesModule` | Consulta indexada de citas futuras 2026-2027 | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tramites_consulares.md](modulo_tramites_consulares.md) |
| `GET` | `/api/v1/wholesalers` | `WholesalersModule` | Catalogo de consolidadoras mayoristas y aerolineas emisoras | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_persistencia_prisma.md](modulo_persistencia_prisma.md) |
| `GET` | `/api/v1/wholesalers/:id` | `WholesalersModule` | Detalle individual de consolidadora por ID unico | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_persistencia_prisma.md](modulo_persistencia_prisma.md) |
| `PATCH` | `/api/v1/tasks/:id/assign` | `TasksModule` | Asigna colaborador responsable exclusivo a una tarea | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tablero_kanban.md](modulo_tablero_kanban.md) |
| `PATCH` | `/api/v1/tasks/:id/status` | `TasksModule` | Transiciona estado de tarjeta Kanban con movedAt, completedAt y emision WS | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tablero_kanban.md](modulo_tablero_kanban.md) |
| `GET` | `/api/v1/tasks` | `TasksModule` | Listado de tareas con filtros y agrupacion por columnas Kanban | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tablero_kanban.md](modulo_tablero_kanban.md) |
| `GET` | `/api/v1/tasks/:id` | `TasksModule` | Detalle completo de tarea y siguientes columnas permitidas | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tablero_kanban.md](modulo_tablero_kanban.md) |
| `POST` | `/api/v1/tasks` | `TasksModule` | Registra nueva tarea operativa en estado BACKLOG | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_tablero_kanban.md](modulo_tablero_kanban.md) |
| `POST` | `/api/v1/ai/parse-itinerary` | `AiModule` | Extrae PNR, aerolinea, vuelos y pasajeros mediante Gemini 2.5 Flash | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_inteligencia_artificial.md](modulo_inteligencia_artificial.md) |
| `POST` | `/api/v1/ai/ocr-passport` | `AiModule` | OCR multimodal de pasaporte y algoritmo preventivo de vigencia < 6 meses | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_inteligencia_artificial.md](modulo_inteligencia_artificial.md) |
| `GET` | `/api/v1/analytics/financial-summary` | `AnalyticsModule` | Metricas de ingresos devengados vs cobrados y distribucion por servicio | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_pagos_y_analitica.md](modulo_pagos_y_analitica.md) |
| `GET` | `/api/v1/analytics/visa-conversion` | `AnalyticsModule` | Embudo de conversion de expedientes consulares en 4 fases | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_pagos_y_analitica.md](modulo_pagos_y_analitica.md) |
| `GET` | `/api/v1/analytics/kanban-bottlenecks` | `AnalyticsModule` | Cuellos de botella frente a limites WIP (Progreso: 3, Revision: 2) | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_pagos_y_analitica.md](modulo_pagos_y_analitica.md) |

---

## 4. Matriz de Eventos WebSockets (Namespace `/alerts`)

| Evento | Direccion | Emisor / Origen | Descripcion | Documento Detallado |
| :--- | :---: | :--- | :--- | :--- |
| `alert:checkin-due` | Servidor -> Cliente | `AlertsCronService` (cada 30m) | Notificacion de vuelos proximos de 24 a 48 horas | [modulo_alertas_y_websockets.md](modulo_alertas_y_websockets.md) |
| `alert:visa-appointment` | Servidor -> Cliente | `AlertsCronService` (diario 08:00 AM) | Alerta escalonada de citas consulares a 30, 15 y 7 dias | [modulo_alertas_y_websockets.md](modulo_alertas_y_websockets.md) |
| `task:status-changed` | Servidor -> Cliente | `TasksService` (reactivo) | Actualizacion en tiempo real de transicion de tarjeta Kanban | [modulo_alertas_y_websockets.md](modulo_alertas_y_websockets.md) |

---

## 5. Indice de Documentos Modulares

Para consultar la especificacion completa de cada componente del backend, accede a los siguientes archivos:

1. [Modulo de Autenticacion y Usuarios](modulo_autenticacion.md): Gestion de credenciales, login, perfil, DTOs y tokens JWT.
2. [Modulo CRM de Clientes](modulo_crm_clientes.md): Gestion de expedientes 360, busqueda rapida, DTOs de creacion y actualizacion.
3. [Modulo de Reservas Aereas y Maquina de Estados](modulo_reservas_aereas.md): Flujo transaccional de vuelos, PNR, invariantes y transiciones.
4. [Modulo de Tramites Consulares y Visas DS-160](modulo_tramites_consulares.md): Fases consulares, arancel ($185 USD) y agenda multianual.
5. [Modulo de Auditoria y Seguridad](modulo_auditoria_y_seguridad.md): Interceptor inmutable (Ley 29733), guardias RBAC y filtro de errores.
6. [Modulo de Persistencia y Prisma](modulo_persistencia_prisma.md): Modelo de datos relacional 3FN, enums, migraciones y seed.
7. [Modulo de Tablero Operativo Kanban](modulo_tablero_kanban.md): Transiciones entre columnas, control de asignacion exclusiva e invariantes.
8. [Modulo de Alertas Operativas y WebSockets](modulo_alertas_y_websockets.md): Gateway Socket.io, Cron Jobs de check-ins y citas consulares.
9. [Modulo de Inteligencia Artificial](modulo_inteligencia_artificial.md): Extraccion NLP de itinerarios, OCR multimodal y algoritmo de vigencia < 6 meses.
10. [Modulo de Pagos, Comprobantes Cloud y Business Intelligence](modulo_pagos_y_analitica.md): Abonos con enlaces Google Drive, calculo reactivo de saldos y metricas BI.
